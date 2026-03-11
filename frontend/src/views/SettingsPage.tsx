import { Bell, Globe, Lock, Monitor, Settings2 } from "lucide-react";
import { useTranslation } from "react-i18next";

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

  const changeLanguage = async (lang: "fr" | "en") => {
    await i18n.changeLanguage(lang);
    localStorage.setItem("briefops:lang", lang);
  };

  const sections = [
    {
      title: "Workspace",
      icon: <Settings2 size={16} />,
      content: (
        <div className="grid gap-3 md:grid-cols-2">
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Langue</p>
            <div className="flex gap-2">
              <Button variant={i18n.language === "fr" ? "primary" : "secondary"} onClick={() => void changeLanguage("fr")}>FR</Button>
              <Button variant={i18n.language === "en" ? "primary" : "secondary"} onClick={() => void changeLanguage("en")}>EN</Button>
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Timezone</p>
            <select className="w-full rounded-2xl border border-[#e6e8f2] bg-white px-4 py-2.5 text-sm dark:border-white/10 dark:bg-[#151515]" defaultValue={timezone} onChange={(event) => setPref("briefops:timezone", event.target.value)}>
              <option value="Europe/Brussels">Europe/Brussels</option>
              <option value="Europe/Paris">Europe/Paris</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
        </div>
      )
    },
    {
      title: "Interface",
      icon: <Monitor size={16} />,
      content: (
        <div className="grid gap-3 md:grid-cols-3">
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">{t("settings.appearanceTitle")}</p>
            <div className="flex gap-2">
              <Button variant={currentTheme === "light" ? "primary" : "secondary"} onClick={() => setTheme("light")}>Clair</Button>
              <Button variant={currentTheme === "dark" ? "primary" : "secondary"} onClick={() => setTheme("dark")}>Sombre</Button>
            </div>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Format heure</p>
            <select className="w-full rounded-2xl border border-[#e6e8f2] bg-white px-4 py-2.5 text-sm dark:border-white/10 dark:bg-[#151515]" defaultValue={hourFormat} onChange={(event) => setPref("briefops:hour_format", event.target.value)}>
              <option value="24h">24h</option>
              <option value="12h">12h</option>
            </select>
          </div>
          <div>
            <p className="mb-1 text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Format date</p>
            <select className="w-full rounded-2xl border border-[#e6e8f2] bg-white px-4 py-2.5 text-sm dark:border-white/10 dark:bg-[#151515]" defaultValue={dateFormat} onChange={(event) => setPref("briefops:date_format", event.target.value)}>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>
      )
    },
    {
      title: "Notifications",
      icon: <Bell size={16} />,
      content: (
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex items-center justify-between rounded-2xl border border-[#e6e8f2] px-4 py-3 dark:border-white/10">
            <span className="text-sm font-medium">Emails opérationnels</span>
            <input type="checkbox" defaultChecked={emailNotifications === "true"} onChange={(event) => setPref("briefops:email_notifications", String(event.target.checked))} />
          </label>
          <label className="flex items-center justify-between rounded-2xl border border-[#e6e8f2] px-4 py-3 dark:border-white/10">
            <span className="text-sm font-medium">Digest hebdo</span>
            <input type="checkbox" defaultChecked={digestEnabled === "true"} onChange={(event) => setPref("briefops:weekly_digest", String(event.target.checked))} />
          </label>
        </div>
      )
    },
    {
      title: "Security",
      icon: <Lock size={16} />,
      content: (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-2xl border border-[#e6e8f2] px-4 py-3 dark:border-white/10">
            <p className="text-sm font-semibold">Session</p>
            <p className="mt-1 text-sm text-[#6f748a] dark:text-[#a8afc6]">Garde un contrôle simple des appareils connectés et de la connexion actuelle.</p>
          </div>
          <div className="rounded-2xl border border-[#e6e8f2] px-4 py-3 dark:border-white/10">
            <p className="text-sm font-semibold">Mot de passe</p>
            <p className="mt-1 text-sm text-[#6f748a] dark:text-[#a8afc6]">La mise à jour du mot de passe se fait depuis la page Compte.</p>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="stack-page">
      <Card className="page-hero card-pad">
        <p className="section-kicker">Préférences</p>
        <h1 className="section-title mt-2">{t("settings.title")}</h1>
        <p className="section-copy mt-2">Réglages essentiels du workspace, de l’interface et des notifications.</p>
      </Card>

      {sections.map((section) => (
        <Card key={section.title} className="card-pad">
          <div className="flex items-center gap-2">
            <span className="text-[#6f748a] dark:text-[#a8afc6]">{section.icon}</span>
            <h2 className="text-lg font-semibold">{section.title}</h2>
          </div>
          <div className="mt-4">{section.content}</div>
        </Card>
      ))}
    </div>
  );
}
