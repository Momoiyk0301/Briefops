export const appLocales = ["fr", "nl", "en"] as const;

export type AppLocale = (typeof appLocales)[number];

export function isAppLocale(value: string): value is AppLocale {
  return appLocales.includes(value as AppLocale);
}

function normalizeBrowserLanguage(value: string) {
  return value.trim().toLowerCase().split(";")[0]?.split("-")[0] ?? "";
}

function parseLanguageList(value: readonly string[] | string | null | undefined) {
  if (Array.isArray(value)) {
    return value;
  }

  return String(value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function detectAppLocale(value: readonly string[] | string | null | undefined): AppLocale {
  for (const language of parseLanguageList(value)) {
    const normalized = normalizeBrowserLanguage(language);
    if (isAppLocale(normalized)) {
      return normalized;
    }
  }

  return "en";
}
