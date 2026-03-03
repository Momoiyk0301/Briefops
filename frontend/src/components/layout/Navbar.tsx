import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";

import { signOut } from "@/lib/auth";
import { UserPlan } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type Props = {
  plan: UserPlan | null;
  demoData?: boolean;
};

export function Navbar({ plan, demoData = false }: Props) {
  const { t, i18n } = useTranslation();

  const setTheme = (theme: "dark" | "light") => {
    localStorage.setItem("briefops:theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  };

  const switchLanguage = () => {
    const next = i18n.language === "fr" ? "en" : "fr";
    void i18n.changeLanguage(next);
    localStorage.setItem("briefops:lang", next);
  };

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-6">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold">{t("app.name")}</p>
          <p className="truncate text-xs text-slate-500">
            Active les modules nécessaires, exporte un PDF clair pour ton staff.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">{t("nav.plan")}: {plan ?? "unknown"}</Badge>
          {demoData && <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200">Demo data</Badge>}
          <Button variant="ghost" onClick={switchLanguage}>{i18n.language.toUpperCase()}</Button>
          <Button variant="ghost" onClick={() => setTheme("light")} aria-label="Light mode"><Sun size={16} /></Button>
          <Button variant="ghost" onClick={() => setTheme("dark")} aria-label="Dark mode"><Moon size={16} /></Button>
          <Button variant="secondary" onClick={() => void signOut()}>{t("auth.logout")}</Button>
        </div>
      </div>
    </header>
  );
}
