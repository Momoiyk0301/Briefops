import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { POST } from "../../app/api/access/route";

const originalAccessPassword = process.env.ACCESS_PASSWORD;

describe("POST /api/access", () => {
  beforeEach(() => {
    process.env.ACCESS_PASSWORD = "test-password";
  });

  afterEach(() => {
    process.env.ACCESS_PASSWORD = originalAccessPassword;
  });

  it("rejects invalid passwords", async () => {
    const response = await POST(
      new Request("http://localhost/api/access", {
        method: "POST",
        body: JSON.stringify({ password: "wrong" })
      })
    );

    expect(response.status).toBe(401);
    expect(response.headers.get("set-cookie")).toBeNull();
  });

  it("sets the access cookie when the backend password matches", async () => {
    const response = await POST(
      new Request("http://localhost/api/access", {
        method: "POST",
        body: JSON.stringify({ password: "test-password" })
      })
    );

    expect(response.status).toBe(200);
    expect(response.headers.get("set-cookie")).toContain("site_access=granted");
    expect(response.headers.get("set-cookie")).toContain("HttpOnly");
  });
});
