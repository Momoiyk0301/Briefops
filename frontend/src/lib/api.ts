import { getSession } from "@/lib/auth";
import { buildApiUrl } from "@/lib/apiBase";
import { captureClientError } from "@/lib/monitoring";
import {
  Briefing,
  BriefingExportWithBriefing,
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

const isDev = process.env.NODE_ENV === "development";

export class ApiError extends Error {
  status: number;
  method: string;
  path: string;

  constructor(status: number, message: string, method: string, path: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.method = method;
    this.path = path;
  }
}

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
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

async function getAuthHeader(): Promise<Record<string, string>> {
  const session = await getSession();
  const token = session?.access_token;
  if (!token) {
    throw new ApiError(401, "Unauthorized", "AUTH", "session");
  }
  return { Authorization: `Bearer ${token}` };
}

async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const method = options.method ?? "GET";
  const startedAt = logApiStart(method, path);
  let response: Response;
  try {
    const headers = {
      "Content-Type": "application/json",
      ...(await getAuthHeader()),
      ...(options.headers ?? {})
    };

    response = await fetch(buildApiUrl(path), {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network failure";
    logApiError(method, path, "NETWORK", message, startedAt);
    captureClientError(error, { method, path, stage: "network" });
    throw new ApiError(0, `Failed to fetch backend for ${method} ${path} (${message})`, method, path);
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
    captureClientError(new Error(message), { method, path, status: response.status, stage: "response" });
    throw new ApiError(response.status, `${method} ${path}: ${message}`, method, path);
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

export async function getMe(): Promise<MeResponse> {
  try {
    const response = await requestJson<{
      user: { id: string; email: string; full_name?: string | null; avatar_path?: string | null; initials?: string };
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
      org: MeResponse["org"];
      workspace?: MeResponse["workspace"];
      has_membership?: boolean;
      onboarding_step?: "workspace" | "products" | "demo" | "done" | null;
      role: "owner" | "admin" | "member" | null;
      is_admin: boolean;
    }>(
      "/api/me"
    );
    return { ...response, degraded: false };
  } catch (error) {
    if (isDev) {
      console.warn(`[MOCK DATA] me fallback used because ${toApiMessage(error)}`);
    }
    const session = await getSession();
    return {
      user: session?.user ? { id: session.user.id, email: session.user.email ?? "" } : null,
      plan: null,
      org: null,
      role: null,
      is_admin: false,
      degraded: true
    };
  }
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
        workspace_id: "demo-workspace",
        title: "Demo - Festival Main Stage",
        status: "ready",
        shared: true,
        event_date: now.slice(0, 10),
        location_text: "Brussels Expo",
        created_by: "demo-user",
        created_at: now,
        updated_at: now
      },
      {
        id: "demo-briefing-2",
        workspace_id: "demo-workspace",
        title: "Demo - Corporate Summit",
        status: "draft",
        shared: false,
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

export async function createBriefing(input: { workspace_id: string; title: string; event_date?: string; location_text?: string }) {
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
  patch: { title?: string; status?: "draft" | "ready" | "archived"; event_date?: string | null; location_text?: string | null }
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

export async function updateWorkspaceModuleEnabled(id: string, enabled: boolean) {
  const response = await requestJson<{ data: RegistryModule }>(`/api/modules`, {
    method: "PUT",
    body: { id, enabled }
  });
  return response.data;
}

export async function downloadPdf(id: string, team?: string | null): Promise<{ blob: Blob; filename: string | null }> {
  const query = team ? `?team=${encodeURIComponent(team)}` : "";
  const path = `/api/pdf/${id}${query}`;
  const startedAt = logApiStart("GET", path);
  const headers = await getAuthHeader();
  let response: Response;
  try {
    response = await fetch(buildApiUrl(path), {
      method: "GET",
      headers
    });
  } catch (error) {
    captureClientError(error, { method: "GET", path, stage: "network" });
    throw { status: 0, message: toApiMessage(error) } as ApiError;
  }

  if (!response.ok) {
    const text = await response.text();
    let message = `HTTP ${response.status}`;
    if (text) {
      try {
        const parsed = JSON.parse(text) as { error?: string };
        if (parsed.error) message = parsed.error;
      } catch {
        message = text;
      }
    }
    logApiError("GET", path, response.status, message, startedAt);
    captureClientError(new Error(message), { method: "GET", path, status: response.status, stage: "response" });
    throw { status: response.status, message } as ApiError;
  }

  logApiSuccess("GET", path, response.status, startedAt);
  const contentDisposition = response.headers.get("content-disposition");
  const filenameMatch = contentDisposition?.match(/filename="([^"]+)"/i);
  return {
    blob: await response.blob(),
    filename: filenameMatch?.[1] ?? null
  };
}

export async function createBriefingExportJob(
  id: string
): Promise<{ export_id: string; version: number; status: "creating" }> {
  return requestJson<{ export_id: string; version: number; status: "creating" }>(`/api/briefings/${id}/export`, {
    method: "POST"
  });
}

export async function startBriefingExportJob(
  id: string,
  exportId: string
): Promise<{ export_id: string; version: number; status: "generating" | "ready" | "failed"; file_path: string | null }> {
  return requestJson<{ export_id: string; version: number; status: "generating" | "ready" | "failed"; file_path: string | null }>(
    `/api/briefings/${id}/export/${exportId}/generate`,
    { method: "POST" }
  );
}

export async function getBriefingExportJob(
  id: string,
  exportId: string
): Promise<{ export_id: string; version: number; status: "creating" | "generating" | "ready" | "failed"; file_path: string | null; error_message?: string | null }> {
  return requestJson<{
    export_id: string;
    version: number;
    status: "creating" | "generating" | "ready" | "failed";
    file_path: string | null;
    error_message?: string | null;
  }>(`/api/briefings/${id}/export/${exportId}`);
}

export async function listBriefingExports(): Promise<BriefingExportWithBriefing[]> {
  const response = await requestJson<{ data: BriefingExportWithBriefing[] }>("/api/briefing-exports");
  return response.data;
}

export async function downloadBriefingExport(exportId: string): Promise<{ blob: Blob; filename: string | null }> {
  const path = `/api/briefing-exports/${exportId}/download`;
  const startedAt = logApiStart("GET", path);
  const headers = await getAuthHeader();
  let response: Response;
  try {
    response = await fetch(buildApiUrl(path), {
      method: "GET",
      headers
    });
  } catch (error) {
    captureClientError(error, { method: "GET", path, stage: "network" });
    throw { status: 0, message: toApiMessage(error) } as ApiError;
  }

  if (!response.ok) {
    const text = await response.text();
    const message = text || `HTTP ${response.status}`;
    logApiError("GET", path, response.status, message, startedAt);
    captureClientError(new Error(message), { method: "GET", path, status: response.status, stage: "response" });
    throw { status: response.status, message } as ApiError;
  }

  logApiSuccess("GET", path, response.status, startedAt);
  const contentDisposition = response.headers.get("content-disposition");
  const filenameMatch = contentDisposition?.match(/filename="([^"]+)"/i);
  return {
    blob: await response.blob(),
    filename: filenameMatch?.[1] ?? null
  };
}

export async function uploadStorageFile(bucket: "logos" | "avatars" | "assets" | "exports", file: File) {
  const method = "POST";
  const path = "/api/storage/upload";
  const startedAt = logApiStart(method, path);
  const headers = await getAuthHeader();
  const formData = new FormData();
  formData.append("bucket", bucket);
  formData.append("file", file);

  let response: Response;
  try {
    response = await fetch(buildApiUrl(path), {
      method,
      headers,
      body: formData
    });
  } catch (error) {
    captureClientError(error, { method, path, bucket, stage: "network" });
    throw { status: 0, message: toApiMessage(error) } as ApiError;
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      payload && typeof payload === "object" && "error" in payload
        ? String((payload as { error: string }).error)
        : `HTTP ${response.status}`;
    logApiError(method, path, response.status, message, startedAt);
    captureClientError(new Error(message), { method, path, bucket, status: response.status, stage: "response" });
    throw { status: response.status, message } as ApiError;
  }

  logApiSuccess(method, path, response.status, startedAt);
  return payload as { bucket: string; path: string };
}

export async function updateMyAvatar(avatar_path: string | null) {
  return requestJson<{ data: { id: string; avatar_path: string | null } }>("/api/me", {
    method: "PATCH",
    body: { avatar_path }
  });
}

export async function updateWorkspaceLogo(logo_path: string | null) {
  return requestJson<{ data: { id: string; logo_path: string | null } }>("/api/workspace", {
    method: "PATCH",
    body: { logo_path }
  });
}

export async function getStorageSignedUrl(bucket: "logos" | "avatars" | "assets" | "exports", path: string, expiresIn = 3600) {
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
  input: {
    duration: "24h" | "3d" | "1w" | "30d" | "never";
    type: "staff" | "audience";
    tag?: string | null;
  }
): Promise<PublicLink> {
  const response = await requestJson<{ data: PublicLink }>(`/api/briefings/${briefingId}/share`, {
    method: "POST",
    body: { duration: input.duration, type: input.type, tag: input.tag ?? null }
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
  plan: "starter" | "pro" | "guest" | "funder",
  workspace_name?: string
): Promise<{ url: string }> {
  return requestJson<{ url: string }>("/api/stripe/checkout", {
    method: "POST",
    body: { plan, workspace_name }
  });
}

export async function createStripeCheckoutSessionByPrice(input: {
  stripe_price_id: string;
  plan: "starter" | "pro" | "guest" | "funder";
  workspace_name?: string;
}): Promise<{ url: string }> {
  return requestJson<{ url: string }>("/api/stripe/checkout", {
    method: "POST",
    body: {
      stripe_price_id: input.stripe_price_id,
      plan: input.plan,
      workspace_name: input.workspace_name ?? ""
    }
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
