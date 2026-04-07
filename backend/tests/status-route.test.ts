import { describe, expect, it } from "vitest";

describe("/api/status", () => {
  it("returns service health", async () => {
    const mod = await import("../app/api/status/route");
    const response = await mod.GET();
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.service).toBe("briefops-backend");
    expect(body.status).toBe("ok");
  });
});
