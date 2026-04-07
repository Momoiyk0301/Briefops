import { afterEach, describe, expect, it, vi } from "vitest";

const originalLocation = window.location;

function setLocation(origin: string) {
  Object.defineProperty(window, "location", {
    configurable: true,
    value: new URL(origin)
  });
}

describe("buildApiUrl", () => {
  afterEach(() => {
    Object.defineProperty(window, "location", {
      configurable: true,
      value: originalLocation
    });
    vi.resetModules();
  });

  it("uses same-origin paths when localhost aliases only differ by hostname", async () => {
    setLocation("http://localhost:3000");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "http://127.0.0.1:3000");

    const { buildApiUrl } = await import("@/lib/apiBase");
    expect(buildApiUrl("/api/public-links")).toBe("/api/public-links");
  });

  it("keeps the configured absolute api url when it targets another origin", async () => {
    setLocation("https://app.briefops.com");
    vi.stubEnv("NEXT_PUBLIC_API_URL", "https://api.briefops.com");

    const { buildApiUrl } = await import("@/lib/apiBase");
    expect(buildApiUrl("/api/status")).toBe("https://api.briefops.com/api/status");
  });
});
