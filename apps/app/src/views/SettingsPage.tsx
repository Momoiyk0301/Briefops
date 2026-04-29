import { Bell, Globe, Monitor, Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";

import type { AppLocale } from "@/i18n/config";
import { appLocales } from "@/i18n/config";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();

  const savedTheme = localStorage.getItem("briefops:theme");
  const currentTheme: "light" | "dark" = savedTheme === "dark" ? "dark" : "light";
  const hourFormat = localStorage.getItem("briefops:hour_format") ?? "24h";
  const timezone = localStorage.getItem("briefops:timezone") ?? "Europe/Brussels";
  const dateFormat = localStorage.getItem("briefops:date_format") ?? "DD/MM/YYYY";
  const digestEnabled = localStorage.getItem("briefops:weekly_digest") ?? "true";
  const emailNotifications = localStorage.getItem("briefops:email_notifications") ?? "true";

  const setPref = (key: string, value: string) => {
    localStorage.setItem(key, value);
  };

  const setTheme = (theme: "light" | "dark") => {
    localStorage.setItem("briefops:theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  };

  const changeLanguage = async (lang: AppLocale) => {
    await i18n.changeLanguage(lang);
    localStorage.setItem("briefops:lang", lang);
  };

  return (
    <div className="stack-page">
      <Card className="page-hero card-pad">
        <p className="section-kicker">{t("settings.kicker")}</p>
        <h1 className="section-title mt-2">{t("settings.title")}</h1>
        <p className="section-copy mt-2">{t("settings.subtitle")}</p>
      </Card>

      <Card className="card-pad">
        <div className="flex items-center gap-2">
          <span className="text-[#6f748a] dark:text-[#a8afc6]"><Settings2 size={16} /></span>
          <h2 className="text-lg font-semibold">{t("settings.workspace")}</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">
              <span className="inline-flex items-center gap-2"><Globe size={14} /> {t("settings.languageTitle")}</span>
            </p>
            <div className="flex gap-2">
              {appLocales.map((locale) => (
                <Button
                  key={locale}
                  variant={i18n.language === locale ? "primary" : "secondary"}
                  onClick={() => void changeLanguage(locale)}
                >
                  {locale.toUpperCase()}
                </Button>
              ))}
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">{t("settings.timezone")}</p>
            <select className="w-full rounded-2xl border border-[#e6e8f2] bg-white px-4 py-2.5 text-sm dark:border-white/10 dark:bg-[#151515]" defaultValue={timezone} onChange={(event) => setPref("briefops:timezone", event.target.value)}>
              <option value="Europe/Brussels">Europe/Brussels</option>
              <option value="Europe/Paris">Europe/Paris</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="card-pad">
        <div className="flex items-center gap-2">
          <span className="text-[#6f748a] dark:text-[#a8afc6]"><Monitor size={16} /></span>
          <h2 className="text-lg font-semibold">{t("settings.interface")}</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">{t("settings.appearanceTitle")}</p>
            <div className="flex gap-2">
              <Button variant={currentTheme === "light" ? "primary" : "secondary"} onClick={() => setTheme("light")}>{t("settings.themeLight")}</Button>
              <Button variant={currentTheme === "dark" ? "primary" : "secondary"} onClick={() => setTheme("dark")}>{t("settings.themeDark")}</Button>
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">{t("settings.hourFormat")}</p>
            <select className="w-full rounded-2xl border border-[#e6e8f2] bg-white px-4 py-2.5 text-sm dark:border-white/10 dark:bg-[#151515]" defaultValue={hourFormat} onChange={(event) => setPref("briefops:hour_format", event.target.value)}>
              <option value="24h">24h</option>
              <option value="12h">12h</option>
            </select>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">{t("settings.dateFormat")}</p>
            <select className="w-full rounded-2xl border border-[#e6e8f2] bg-white px-4 py-2.5 text-sm dark:border-white/10 dark:bg-[#151515]" defaultValue={dateFormat} onChange={(event) => setPref("briefops:date_format", event.target.value)}>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="card-pad">
        <div className="flex items-center gap-2">
          <span className="text-[#6f748a] dark:text-[#a8afc6]"><Bell size={16} /></span>
          <h2 className="text-lg font-semibold">{t("settings.notifications")}</h2>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          <label className="flex items-center justify-between rounded-2xl border border-[#e6e8f2] px-4 py-3 dark:border-white/10">
            <span className="text-sm font-medium">{t("settings.operationalEmails")}</span>
            <input type="checkbox" defaultChecked={emailNotifications === "true"} onChange={(event) => setPref("briefops:email_notifications", String(event.target.checked))} />
          </label>
          <label className="flex items-center justify-between rounded-2xl border border-[#e6e8f2] px-4 py-3 dark:border-white/10">
            <span className="text-sm font-medium">{t("settings.weeklyDigest")}</span>
            <input type="checkbox" defaultChecked={digestEnabled === "true"} onChange={(event) => setPref("briefops:weekly_digest", String(event.target.checked))} />
          </label>
        </div>
      </Card>
    </div>
  );
}
