export function checkAnalyticsEnabled() {
  if (typeof document === "undefined") {
    return true;
  }

  return !document.cookie.split(";").some((cookie) => cookie.trim() === "ignore_analytics=true");
}

export function installAnalyticsDevTool() {
  if (typeof window === "undefined") {
    return;
  }

  window.disableBriefopsAnalytics = () => {
    const secure = window.location.protocol === "https:" ? "; secure" : "";
    document.cookie = `ignore_analytics=true; path=/; max-age=31536000; SameSite=Lax${secure}`;
  };
}

declare global {
  interface Window {
    disableBriefopsAnalytics?: () => void;
  }
}
