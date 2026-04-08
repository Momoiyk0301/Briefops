const DEFAULT_APP_URL = "http://localhost:3000";
const DEFAULT_MARKETING_SITE_URL = "http://localhost:3000";

export const MARKETING_HOSTS = ["events-ops.be", "www.events-ops.be"] as const;
export const APP_HOSTS = ["briefing.events-ops.be"] as const;

function normalizeBaseUrl(value: string | undefined, fallback: string) {
  const rawValue = String(value ?? "").trim();
  if (!rawValue) return fallback;

  try {
    return new URL(rawValue).toString().replace(/\/$/, "");
  } catch {
    return fallback;
  }
}

function normalizePath(path: string) {
  return path.startsWith("/") ? path : `/${path}`;
}

export function getAppUrl() {
  return normalizeBaseUrl(process.env.APP_URL, DEFAULT_APP_URL);
}

export function getMarketingSiteUrl() {
  return normalizeBaseUrl(process.env.MARKETING_SITE_URL, DEFAULT_MARKETING_SITE_URL);
}

export function buildAppUrl(path = "/") {
  return `${getAppUrl()}${normalizePath(path)}`;
}

export function buildMarketingUrl(path = "/") {
  return `${getMarketingSiteUrl()}${normalizePath(path)}`;
}

export function normalizeHost(hostHeader: string | null | undefined) {
  return String(hostHeader ?? "")
    .trim()
    .toLowerCase()
    .replace(/:\d+$/, "");
}

export function isMarketingHost(host: string | null | undefined) {
  const normalizedHost = normalizeHost(host);
  return MARKETING_HOSTS.includes(normalizedHost as (typeof MARKETING_HOSTS)[number]);
}

export function isAppHost(host: string | null | undefined) {
  const normalizedHost = normalizeHost(host);
  return APP_HOSTS.includes(normalizedHost as (typeof APP_HOSTS)[number]);
}

export function isLocalHost(host: string | null | undefined) {
  const normalizedHost = normalizeHost(host);
  return normalizedHost === "localhost" || normalizedHost === "127.0.0.1";
}

export function isPreviewHost(host: string | null | undefined) {
  const normalizedHost = normalizeHost(host);
  return normalizedHost.endsWith(".vercel.app");
}

