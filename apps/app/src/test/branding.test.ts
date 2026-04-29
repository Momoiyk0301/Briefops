import { describe, expect, it } from "vitest";

import { formatBytes, getInitials } from "@/lib/branding";

describe("branding helpers", () => {
  it("builds initials from workspace and user labels", () => {
    expect(getInitials("Peak Events")).toBe("PE");
    expect(getInitials("A")).toBe("A");
    expect(getInitials("")).toBe("BO");
  });

  it("formats storage values for quota display", () => {
    expect(formatBytes(512)).toBe("512 B");
    expect(formatBytes(1024)).toBe("1.0 KB");
    expect(formatBytes(5 * 1024 * 1024)).toBe("5.0 MB");
  });
});
