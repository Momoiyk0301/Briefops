import { NextRequest } from "next/server";
import { describe, expect, it } from "vitest";

import { middleware } from "../../middleware";

describe("middleware access protection", () => {
  it("redirects users without the access cookie to /access", () => {
    const response = middleware(new NextRequest("http://localhost:3000/briefings"));

    expect(response.headers.get("location")).toBe("http://localhost:3000/access");
  });

  it("allows app routes when the access cookie is valid", () => {
    const response = middleware(
      new NextRequest("http://localhost:3000/briefings", {
        headers: { cookie: "site_access=granted" }
      })
    );

    expect(response.headers.get("location")).toBeNull();
  });

  it("keeps api routes accessible without the access cookie", () => {
    const response = middleware(new NextRequest("http://localhost:3000/api/status"));

    expect(response.headers.get("location")).toBeNull();
  });

  it("redirects localized landing pages to the marketing site", () => {
    const response = middleware(new NextRequest("http://localhost:3000/fr"));

    expect(response.headers.get("location")).toBe("http://localhost:3000/fr");
  });

  it("bypasses the access page before any routing logic, even on the marketing host", () => {
    const response = middleware(new NextRequest("https://events-ops.be/access", { headers: { host: "events-ops.be" } }));

    expect(response.headers.get("location")).toBeNull();
  });
});
