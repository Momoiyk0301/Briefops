import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function SettingsPage() {
  const { t, i18n } = useTranslation();

  const changeLanguage = async (lang: "fr" | "en") => {
    await i18n.changeLanguage(lang);
    localStorage.setItem("briefops:lang", lang);
  };

  const savedTheme = localStorage.getItem("briefops:theme");
  const currentTheme: "light" | "dark" = savedTheme === "dark" ? "dark" : "light";

  const setTheme = (theme: "light" | "dark") => {
    localStorage.setItem("briefops:theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  };

  const hourFormat = localStorage.getItem("briefops:hour_format") ?? "24h";
  const timezone = localStorage.getItem("briefops:timezone") ?? "Europe/Brussels";
  const dateFormat = localStorage.getItem("briefops:date_format") ?? "DD/MM/YYYY";

  const setPref = (key: string, value: string) => {
    localStorage.setItem(key, value);
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">{t("settings.title")}</h1>

      <Card className="max-w-2xl">
        <h2 className="text-lg font-semibold">{t("settings.languageTitle")}</h2>
        <p className="mt-1 text-sm text-slate-500">{t("settings.languageHint")}</p>
        <div className="mt-4 flex items-center gap-2">
          <Button
            variant={i18n.language === "fr" ? "primary" : "secondary"}
            onClick={() => void changeLanguage("fr")}
          >
            FR
          </Button>
          <Button
            variant={i18n.language === "en" ? "primary" : "secondary"}
            onClick={() => void changeLanguage("en")}
          >
            EN
          </Button>
        </div>
      </Card>

      <Card className="max-w-2xl">
        <h2 className="text-lg font-semibold">{t("settings.appearanceTitle")}</h2>
        <p className="mt-1 text-sm text-slate-500">{t("settings.appearanceHint")}</p>
        <div className="mt-4 flex items-center gap-2">
          <Button
            variant={currentTheme === "light" ? "primary" : "secondary"}
            onClick={() => setTheme("light")}
          >
            {t("settings.themeLight")}
          </Button>
          <Button
            variant={currentTheme === "dark" ? "primary" : "secondary"}
            onClick={() => setTheme("dark")}
          >
            {t("settings.themeDark")}
          </Button>
        </div>
      </Card>

      <Card className="max-w-2xl">
        <h2 className="text-lg font-semibold">{t("settings.preferencesTitle")}</h2>
        <p className="mt-1 text-sm text-slate-500">{t("settings.preferencesHint")}</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">{t("settings.hourFormat")}</p>
            <select
              className="w-full rounded-2xl border border-[#e6e8f2] bg-white px-4 py-2.5 text-sm text-[#111] outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-[#151515] dark:text-white"
              defaultValue={hourFormat}
              onChange={(event) => setPref("briefops:hour_format", event.target.value)}
            >
              <option value="24h">24h</option>
              <option value="12h">12h</option>
            </select>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">{t("settings.timezone")}</p>
            <select
              className="w-full rounded-2xl border border-[#e6e8f2] bg-white px-4 py-2.5 text-sm text-[#111] outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-[#151515] dark:text-white"
              defaultValue={timezone}
              onChange={(event) => setPref("briefops:timezone", event.target.value)}
            >
              <option value="Europe/Brussels">Europe/Brussels</option>
              <option value="Europe/Paris">Europe/Paris</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">{t("settings.dateFormat")}</p>
            <select
              className="w-full rounded-2xl border border-[#e6e8f2] bg-white px-4 py-2.5 text-sm text-[#111] outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-[#151515] dark:text-white"
              defaultValue={dateFormat}
              onChange={(event) => setPref("briefops:date_format", event.target.value)}
            >
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>
      </Card>

      <Card className="max-w-2xl">
        <h2 className="text-lg font-semibold">{t("settings.activityTitle")}</h2>
        <div className="mt-4 space-y-2">
          {[
            t("settings.activity.configure"),
            t("settings.activity.hourFormat"),
            t("settings.activity.timezone"),
            t("settings.activity.dateFormat")
          ].map((label) => (
            <div key={label} className="flex items-center justify-between rounded-xl border border-[#e8eaf3] px-3 py-2 text-sm dark:border-white/10">
              <span>{label}</span>
              <span className="text-xs text-[#7f859b] dark:text-[#969eb8]">{t("settings.activity.timeAgo")}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
