import { describe, expect, it } from "vitest";

import { getErrorMessage } from "@/lib/errorMessages";
import { sanitizeLogContext } from "@/lib/logger";

describe("error messages and sanitization", () => {
  it("maps standard error codes to localized user messages", () => {
    expect(getErrorMessage("PDF_EXPORT_FAILED")).toContain("PDF");
    expect(getErrorMessage("NOT_A_CODE")).toBe(getErrorMessage("UNKNOWN_ERROR"));
  });

  it("redacts sensitive monitoring context", () => {
    expect(
      sanitizeLogContext({
        access_token: "secret-token",
        stripeSecret: "sk_live_secret",
        nested: { password: "pass" },
        workspaceId: "workspace-1"
      })
    ).toEqual({
      access_token: "[redacted]",
      stripeSecret: "[redacted]",
      nested: { password: "[redacted]" },
      workspaceId: "workspace-1"
    });
  });
});
