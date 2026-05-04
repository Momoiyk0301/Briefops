export function checkAnalyticsEnabled() {
  if (typeof document === "undefined") {
    return true;
  }

  const ignoreByCookie = document.cookie.split(";").some((cookie) => cookie.trim() === "ignore_analytics=true");
  if (ignoreByCookie) {
    return false;
  }

  const referrer = document.referrer.toLowerCase();
  const comesFromVercel = referrer.includes("vercel.app") || referrer.includes("vercel.com");
  if (comesFromVercel) {
    return false;
  }

  return true;
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
