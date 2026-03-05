import { getSession } from "@/lib/auth";
import {
  Briefing,
  BriefingModuleRow,
  MeResponse,
  ModuleDataMap,
  ModuleKey,
  StaffMember,
  UserPlan
} from "@/lib/types";

const API_URL = String(process.env.NEXT_PUBLIC_API_URL ?? "").trim().replace(/\/$/, "");

if (!API_URL) {
  throw new Error("Missing NEXT_PUBLIC_API_URL");
}

type ApiError = {
  status: number;
  message: string;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  headers?: Record<string, string>;
};

function logApiStart(method: string, path: string) {
  const startedAt = Date.now();
  console.info(`[API] -> ${method} ${path}`);
  return startedAt;
}

function logApiSuccess(method: string, path: string, status: number, startedAt: number) {
  const durationMs = Date.now() - startedAt;
  console.info(`[API] <- ${method} ${path} ${status} (${durationMs}ms)`);
}

function logApiError(method: string, path: string, status: number | string, message: string, startedAt: number) {
  const durationMs = Date.now() - startedAt;
  console.error(`[API] xx ${method} ${path} ${status} (${durationMs}ms) ${message}`);
}

async function getAuthHeader(): Promise<Record<string, string>> {
  const session = await getSession();
  const token = session?.access_token;
  if (!token) {
    throw { status: 401, message: "Unauthorized" } as ApiError;
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

    response = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Network failure";
    logApiError(method, path, "NETWORK", message, startedAt);
    throw { status: 0, message: `Failed to fetch backend (${message})` } as ApiError;
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
    throw { status: response.status, message } as ApiError;
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
      role: "owner" | "admin" | "member" | null;
      is_admin: boolean;
    }>(
      "/api/me"
    );
    return { ...response, degraded: false };
  } catch (error) {
    console.warn(`[MOCK DATA] me fallback used because ${toApiMessage(error)}`);
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

export async function postOnboarding(input: { org_name: string }) {
  return requestJson<{ ok: boolean }>("/api/onboarding", {
    method: "POST",
    body: input
  });
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
    console.warn(`[MOCK DATA] briefings list fallback used because ${reason}`);

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
  modules: Array<{ module_key: ModuleKey; enabled: boolean; data_json: ModuleDataMap[ModuleKey] }>
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

export async function downloadPdf(id: string): Promise<Blob> {
  const path = `/api/pdf/${id}`;
  const startedAt = logApiStart("GET", path);
  const headers = await getAuthHeader();
  const response = await fetch(`${API_URL}${path}`, {
    method: "GET",
    headers
  });

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
    throw { status: response.status, message } as ApiError;
  }

  logApiSuccess("GET", path, response.status, startedAt);
  return response.blob();
}

export async function createStripeCheckoutSession(plan: "starter" | "plus" | "pro"): Promise<{ url: string }> {
  return requestJson<{ url: string }>("/api/stripe/checkout", {
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
