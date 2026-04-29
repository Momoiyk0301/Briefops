import { describe, expect, it } from "vitest";

import { detectAppLocale } from "@/i18n/config";

describe("app i18n config", () => {
  it("detects supported browser languages", () => {
    expect(detectAppLocale(["nl-BE", "fr-BE"])).toBe("nl");
    expect(detectAppLocale("fr-BE,fr;q=0.9,en;q=0.8")).toBe("fr");
  });

  it("falls back to english for unsupported browser languages", () => {
    expect(detectAppLocale(["de-DE", "es-ES"])).toBe("en");
    expect(detectAppLocale(undefined)).toBe("en");
  });
});
