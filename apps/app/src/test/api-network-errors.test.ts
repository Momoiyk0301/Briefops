import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/auth", () => ({
  getSession: vi.fn(async () => ({
    access_token: "token"
  }))
}));

describe("api network errors", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("keeps AbortError untouched for regular JSON requests", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new DOMException("The operation was aborted.", "AbortError");
    }));

    const { getRegistryModules } = await import("@/lib/api");

    await expect(getRegistryModules()).rejects.toMatchObject({
      name: "AbortError"
    });
  });

  it("maps network failures to NETWORK_ERROR for JSON requests", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new TypeError("Failed to fetch");
    }));

    const { ApiClientError, getRegistryModules } = await import("@/lib/api");

    await expect(getRegistryModules()).rejects.toBeInstanceOf(ApiClientError);
    await expect(getRegistryModules()).rejects.toMatchObject({
      status: 0,
      message: "NETWORK_ERROR",
      errorCode: "NETWORK_ERROR",
      safeDetails: expect.objectContaining({
        origin: "client",
        step: "fetch",
        original_message: "Failed to fetch"
      })
    });
  });

  it("keeps AbortError untouched for PDF downloads", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new DOMException("The operation was aborted.", "AbortError");
    }));

    const { downloadPdf } = await import("@/lib/api");

    await expect(downloadPdf("briefing-1")).rejects.toMatchObject({
      name: "AbortError"
    });
  });

  it("maps network failures to NETWORK_ERROR for PDF downloads", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => {
      throw new TypeError("Load failed");
    }));

    const { ApiClientError, downloadPdf } = await import("@/lib/api");

    await expect(downloadPdf("briefing-1")).rejects.toBeInstanceOf(ApiClientError);
    await expect(downloadPdf("briefing-1")).rejects.toMatchObject({
      status: 0,
      message: "NETWORK_ERROR",
      errorCode: "NETWORK_ERROR",
      safeDetails: expect.objectContaining({
        origin: "client",
        step: "download",
        original_message: "Load failed"
      })
    });
  });
});
