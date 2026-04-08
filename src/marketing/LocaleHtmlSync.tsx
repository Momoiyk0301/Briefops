"use client";

import { useEffect } from "react";

import type { MarketingLocale } from "@/i18n/marketing";

export function LocaleHtmlSync({ locale }: { locale: MarketingLocale }) {
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  return null;
}

