import { getSession } from "@/lib/auth";
import {
  Briefing,
  BriefingModuleRow,
  MeResponse,
  ModuleDataMap,
  ModuleKey,
  UserPlan
} from "@/lib/types";

const API_URL = import.meta.env.VITE_API_URL;

if (!API_URL) {
  throw new Error("Missing VITE_API_URL");
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

async function getAuthHeader(): Promise<Record<string, string>> {
  const session = await getSession();
  const token = session?.access_token;
  if (!token) {
    throw { status: 401, message: "Unauthorized" } as ApiError;
  }
  return { Authorization: `Bearer ${token}` };
}

async function requestJson<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = {
    "Content-Type": "application/json",
    ...(await getAuthHeader()),
    ...(options.headers ?? {})
  };

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined
  });

  let payload: unknown = null;
  const text = await response.text();
  if (text) {
    payload = JSON.parse(text) as unknown;
  }

  if (!response.ok) {
    const message =
      typeof payload === "object" && payload !== null && "error" in payload
        ? String((payload as { error: string }).error)
        : `HTTP ${response.status}`;
    throw { status: response.status, message } as ApiError;
  }

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
    const response = await requestJson<{ user: { id: string; email: string }; plan: UserPlan; org: { id: string; name: string } | null }>(
      "/api/me"
    );
    return { ...response, degraded: false };
  } catch {
    const session = await getSession();
    return {
      user: session?.user ? { id: session.user.id, email: session.user.email ?? "" } : null,
      plan: null,
      org: null,
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

export async function getBriefingModules(id: string) {
  const response = await requestJson<{ data: BriefingModuleRow[] }>(`/api/briefings/${id}/modules`);
  return response.data;
}

export async function upsertBriefingModules(
  id: string,
  modules: Array<{ module_key: ModuleKey; enabled: boolean; data_json: ModuleDataMap[ModuleKey] }>
) {
  const results: BriefingModuleRow[] = [];
  for (const mod of modules) {
    const response = await requestJson<{ data: BriefingModuleRow }>(`/api/briefings/${id}/modules`, {
      method: "PUT",
      body: mod
    });
    results.push(response.data);
  }
  return results;
}

export async function downloadPdf(id: string): Promise<Blob> {
  const headers = await getAuthHeader();
  const response = await fetch(`${API_URL}/api/pdf/${id}`, {
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
    throw { status: response.status, message } as ApiError;
  }

  return response.blob();
}
