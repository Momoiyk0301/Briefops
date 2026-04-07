import * as Sentry from "@sentry/nextjs";
import { getSession } from "@/lib/auth";
import {
  Briefing,
  BriefingModuleRow,
  MeResponse,
  ModuleDataMap,
  ModuleKey,
  PublicLink,
  PublicLinkWithBriefing,
  Product,
  RegistryModule,
  StaffMember,
  UserPlan
} from "@/lib/types";

const API_URL = String(process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/$/, "");
const isDev = process.env.NODE_ENV === "development";

export class ApiClientError extends Error {
  status: number;
  method: string;
  path: string;
  requestId: string | null;
  safeDetails: Record<string, unknown> | null;

  constructor(input: {
    status: number;
    message: string;
    method: string;
    path: string;
    requestId?: string | null;
    safeDetails?: Record<string, unknown> | null;
  }) {
    super(input.message);
    this.name = "ApiClientError";
    this.status = input.status;
    this.method = input.method;
    this.path = input.path;
    this.requestId = input.requestId ?? null;
    this.safeDetails = input.safeDetails ?? null;
  }
}

type ApiResponseErrorPayload = {
  error?: string;
  request_id?: string;
  details?: unknown;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
  auth?: boolean;
};

function logApiStart(method: string, path: string) {
  if (!isDev) return Date.now();
  const startedAt = Date.now();
  console.info(`[API] -> ${method} ${path}`);
  return startedAt;
}

function logApiSuccess(method: string, path: string, status: number, startedAt: number) {
  if (!isDev) return;
  const durationMs = Date.now() - startedAt;
  console.info(`[API] <- ${method} ${path} ${status} (${durationMs}ms)`);
}

function logApiError(method: string, path: string, status: number | string, message: string, startedAt: number) {
  if (!isDev) return;
  const durationMs = Date.now() - startedAt;
  console.error(`[API] xx ${method} ${path} ${status} (${durationMs}ms) ${message}`);
}

function captureClientApiError(error: ApiClientError) {
  if (error.status > 0 && error.status < 500) return;

  Sentry.withScope((scope) => {
    scope.setTag("origin", "client");
    scope.setTag("api_method", error.method);
    scope.setTag("api_path", error.path);
    scope.setTag("api_status", String(error.status));
    if (error.requestId) {
      scope.setTag("request_id", error.requestId);
    }
    scope.setContext("api", {
      method: error.method,
      path: error.path,
      status: error.status,
      request_id: error.requestId,
      ...error.safeDetails
    });
    Sentry.captureException(error);
  });
}

function toApiClientError(input: {
  status: number;
  message: string;
  method: string;
  path: string;
  requestId?: string | null;
  safeDetails?: Record<string, unknown> | null;
}) {
  const error = new ApiClientError(input);
  captureClientApiError(error);
  return error;
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const session = await getSession();
  const token = session?.access_token;
  if (!token) {
    throw toApiClientError({
      status: 401,
      message: "Unauthorized",
      method: "AUTH",
      path: "session"
    });
  }
  return { Authorization: `Bearer ${token}` };
}

async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? "GET";
  const startedAt = logApiStart(method, path);
  let response: Response;
  try {
    const authHeaders = options.auth === false ? {} : await getAuthHeader();
    const headers = {
      "Content-Type": "application/json",
      ...authHeaders,
      ...(options.headers ?? {})
    };

    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined
    });
  } catch (error) {
    if (error instanceof ApiClientError) throw error;
    const message = error instanceof Error ? error.message : "Network failure";
    logApiError(method, path, "NETWORK", message, startedAt);
    throw toApiClientError({
      status: 0,
      message: `Failed to fetch backend (${message})`,
      method,
      path,
      safeDetails: {
        origin: "client",
        step: "fetch"
      }
    });
  }

  let payload: unknown = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text) as unknown;
    } catch {
      payload = { error: text };
    }
  }

  if (!response.ok) {
    let message =
      typeof payload === "object" && payload !== null && "error" in payload
        ? String((payload as { error: string }).error)
        : `HTTP ${response.status}`;

    if (/<!doctype html>|<html/i.test(message)) {
      message = "Backend error: HTML response received (check backend env and server logs)";
    }
    logApiError(method, path, response.status, message, startedAt);
    const responsePayload = typeof payload === "object" && payload !== null ? (payload as ApiResponseErrorPayload) : {};
    throw toApiClientError({
      status: response.status,
      message,
      method,
      path,
      requestId: responsePayload.request_id ?? null,
      safeDetails: {
        origin: "client",
        step: "response",
        response_status: response.status
      }
    });
  }

  logApiSuccess(method, path, response.status, startedAt);
  return payload as T;
}

export function toApiMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "message" in error) {
    return String((error as { message: string }).message);
  }
  return "Unexpected error";
}

function getApiErrorStatus(error: unknown) {
  return typeof error === "object" && error !== null && "status" in error
    ? Number((error as { status?: unknown }).status ?? 0)
    : 0;
}

function shouldUseMeFallback(error: unknown) {
  const status = getApiErrorStatus(error);
  return status === 0 || status >= 500;
}

export async function getMe(): Promise<MeResponse> {
  try {
    const response = await requestJson<{
      user: { id: string; email: string };
      plan: UserPlan;
      subscription_name: string | null;
      subscription_status: string | null;
      stripe_price_id: string | null;
      current_period_end: string | null;
      usage?: {
        pdf_exports_used: number;
        pdf_exports_limit: number | null;
        pdf_exports_remaining: number | null;
      };
      org: { id: string; name: string } | null;
      workspace?: { id: string; name: string } | null;
      has_membership?: boolean;
      onboarding_step?: "workspace" | "products" | "demo" | "done" | null;
      role: "owner" | "admin" | "member" | null;
      is_admin: boolean;
    }>(
      "/api/me"
    );
    return { ...response, degraded: false };
  } catch (error) {
    if (!shouldUseMeFallback(error)) throw error;

    const reason = toApiMessage(error);
    if (isDev) console.warn(`[MOCK DATA] me fallback used because ${reason}`);
    const session = await getSession();
    return {
      user: session?.user ? { id: session.user.id, email: session.user.email ?? "" } : null,
      plan: null,
      org: null,
      role: null,
      is_admin: false,
      degraded: true,
      degraded_reason: reason
    };
  }
}

export async function getLoginHint(email: string): Promise<{ exists: boolean; email_confirmed: boolean }> {
  return requestJson<{ exists: boolean; email_confirmed: boolean }>("/api/auth/login-hint", {
    method: "POST",
    body: { email },
    auth: false
  });
}

export async function postOnboarding(input: {
  workspace_name?: string;
  country?: string;
  team_size?: number | null;
  vat_number?: string | null;
}) {
  return requestJson<{ ok: boolean; workspace?: { id: string; name: string } }>("/api/onboarding", {
    method: "POST",
    body: input
  });
}

export async function updateOnboardingStep(step: "workspace" | "products" | "demo" | "done") {
  return requestJson<{ ok: boolean; onboarding_step: string }>("/api/onboarding", {
    method: "POST",
    body: { onboarding_step: step }
  });
}

export async function getProducts(): Promise<Product[]> {
  const response = await requestJson<{ data: Product[] }>("/api/products");
  return response.data;
}

export async function getBriefings() {
  const response = await requestJson<{ data: Briefing[] }>("/api/briefings");
  return response.data;
}

export async function getBriefingsWithFallback(): Promise<{ data: Briefing[]; demo: boolean; reason?: string }> {
  try {
    const data = await getBriefings();
    return { data, demo: false };
  } catch (error) {
    const reason = toApiMessage(error);
    const now = new Date().toISOString();
    if (isDev) {
      console.warn(`[MOCK DATA] briefings list fallback used because ${reason}`);
    }

    const demoData: Briefing[] = [
      {
        id: "demo-briefing-1",
        org_id: "demo-org",
        title: "Demo - Festival Main Stage",
        event_date: now.slice(0, 10),
        location_text: "Brussels Expo",
        created_by: "demo-user",
        created_at: now,
        updated_at: now
      },
      {
        id: "demo-briefing-2",
        org_id: "demo-org",
        title: "Demo - Corporate Summit",
        event_date: now.slice(0, 10),
        location_text: "Antwerp Convention Center",
        created_by: "demo-user",
        created_at: now,
        updated_at: now
      }
    ];

    return { data: demoData, demo: true, reason };
  }
}

export async function createBriefing(input: { org_id: string; title: string; event_date?: string; location_text?: string }) {
  const response = await requestJson<{ data: Briefing }>("/api/briefings", {
    method: "POST",
    body: input
  });
  return response.data;
}

export async function getBriefing(id: string) {
  const response = await requestJson<{ data: Briefing }>(`/api/briefings/${id}`);
  return response.data;
}

export async function patchBriefing(
  id: string,
  patch: { title?: string; event_date?: string | null; location_text?: string | null }
) {
  const response = await requestJson<{ data: Briefing }>(`/api/briefings/${id}`, {
    method: "PATCH",
    body: patch
  });
  return response.data;
}

export async function deleteBriefing(id: string) {
  await requestJson<{ ok?: boolean }>(`/api/briefings/${id}`, {
    method: "DELETE"
  });
}

export async function getBriefingModules(id: string) {
  const response = await requestJson<{ data: BriefingModuleRow[] }>(`/api/briefings/${id}/modules`);
  return response.data;
}

export async function upsertBriefingModules(
  id: string,
  modules: Array<{ module_id?: string | null; module_key: ModuleKey; enabled: boolean; data_json: ModuleDataMap[ModuleKey] | Record<string, unknown> }>
) {
  const responses = await Promise.all(
    modules.map((mod) =>
      requestJson<{ data: BriefingModuleRow }>(`/api/briefings/${id}/modules`, {
        method: "PUT",
        body: mod
      })
    )
  );
  return responses.map((item) => item.data);
}

export async function getRegistryModules() {
  const response = await requestJson<{ data: RegistryModule[] }>(`/api/modules`);
  return response.data;
}

export async function updateRegistryModuleEnabled(id: string, enabled: boolean) {
  const response = await requestJson<{ data: RegistryModule }>(`/api/modules`, {
    method: "PUT",
    body: { id, enabled }
  });
  return response.data;
}

export async function downloadPdf(id: string): Promise<Blob> {
  const path = `/api/pdf/${id}`;
  const startedAt = logApiStart("GET", path);
  let response: Response;

  try {
    const headers = await getAuthHeader();
    response = await fetch(`${API_URL}${path}`, {
      method: "GET",
      headers
    });
  } catch (error) {
    if (error instanceof ApiClientError) throw error;
    const message = error instanceof Error ? error.message : "Network failure";
    logApiError("GET", path, "NETWORK", message, startedAt);
    throw toApiClientError({
      status: 0,
      message: `Failed to fetch backend (${message})`,
      method: "GET",
      path,
      safeDetails: {
        origin: "client",
        step: "download"
      }
    });
  }

  if (!response.ok) {
    const text = await response.text();
    let message = `HTTP ${response.status}`;
    let requestId: string | null = null;
    if (text) {
      try {
        const parsed = JSON.parse(text) as ApiResponseErrorPayload;
        if (parsed.error) message = parsed.error;
        requestId = parsed.request_id ?? null;
      } catch {
        message = text;
      }
    }
    logApiError("GET", path, response.status, message, startedAt);
    throw toApiClientError({
      status: response.status,
      message,
      method: "GET",
      path,
      requestId,
      safeDetails: {
        origin: "client",
        step: "download-response",
        response_status: response.status
      }
    });
  }

  logApiSuccess("GET", path, response.status, startedAt);
  return response.blob();
}

export async function generateBriefingPdf(
  id: string,
  team?: string | null
): Promise<{ pdf_path: string; pdf_url: string; generated_at: string; team?: string | null; filename: string }> {
  const query = team ? `?format=json&team=${encodeURIComponent(team)}` : "?format=json";
  return requestJson<{ ok: boolean; pdf_path: string; pdf_url: string; generated_at: string; filename: string }>(
    `/api/pdf/${id}${query}`
  );
}

export async function getStorageSignedUrl(bucket: "logos" | "assets" | "exports", path: string, expiresIn = 3600) {
  const response = await requestJson<{ url: string }>(
    `/api/storage/signed-url?bucket=${encodeURIComponent(bucket)}&path=${encodeURIComponent(path)}&expires_in=${expiresIn}`
  );
  return response.url;
}

export async function listBriefingShareLinks(briefingId: string): Promise<PublicLink[]> {
  const response = await requestJson<{ data: PublicLink[] }>(`/api/briefings/${briefingId}/share`);
  return response.data;
}

export async function createBriefingShareLink(
  briefingId: string,
  duration: "24h" | "3d" | "1w" | "30d" | "never",
  team?: string | null
): Promise<PublicLink> {
  const response = await requestJson<{ data: PublicLink }>(`/api/briefings/${briefingId}/share`, {
    method: "POST",
    body: { duration, team: team ?? null }
  });
  return response.data;
}

export async function revokeBriefingShareLink(briefingId: string, linkId: string): Promise<void> {
  await requestJson<{ ok: boolean }>(`/api/briefings/${briefingId}/share`, {
    method: "DELETE",
    body: { link_id: linkId }
  });
}

export async function listPublicLinks(): Promise<PublicLinkWithBriefing[]> {
  const response = await requestJson<{ data: PublicLinkWithBriefing[] }>("/api/public-links");
  return response.data;
}

export async function createStripeCheckoutSession(
  plan: "starter" | "plus" | "pro",
  workspace_name?: string
): Promise<{ url: string }> {
  return requestJson<{ url: string }>("/api/stripe/checkout", {
    method: "POST",
    body: { plan, workspace_name }
  });
}

export async function createOnboardingCheckoutSession(input: {
  stripe_price_id: string;
  workspace_id: string;
  workspace_name?: string;
}): Promise<{ url: string }> {
  return requestJson<{ url: string }>("/api/stripe/checkout", {
    method: "POST",
    body: {
      stripe_price_id: input.stripe_price_id,
      workspace_id: input.workspace_id,
      workspace_name: input.workspace_name ?? "",
      source: "onboarding"
    }
  });
}

export async function activateOnboardingPlan(plan: "starter"): Promise<{ ok: boolean; plan: "starter"; onboarding_step: string }> {
  return requestJson<{ ok: boolean; plan: "starter"; onboarding_step: string }>("/api/onboarding/activate-plan", {
    method: "POST",
    body: { plan }
  });
}

export async function createStripePortalSession(): Promise<{ url: string }> {
  return requestJson<{ url: string }>("/api/stripe/portal", {
    method: "POST"
  });
}

export async function getStaff(): Promise<StaffMember[]> {
  const response = await requestJson<{ data: StaffMember[] }>("/api/staff");
  return response.data;
}

export async function createStaffMember(input: {
  briefing_id: string;
  full_name: string;
  role: string;
  phone?: string;
  email?: string;
  notes?: string;
}): Promise<StaffMember> {
  const response = await requestJson<{ data: StaffMember }>("/api/staff", {
    method: "POST",
    body: input
  });
  return response.data;
}
