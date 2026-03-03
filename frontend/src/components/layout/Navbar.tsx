import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

import { signOut } from "@/lib/auth";
import { UserPlan } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type Props = {
  plan: UserPlan | null;
};

export function Navbar({ plan }: Props) {
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
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-6">
        <div className="flex items-center gap-4">
          <Link to="/briefings" className="text-lg font-semibold">{t("app.name")}</Link>
          <Link to="/briefings" className="text-sm text-slate-600 dark:text-slate-300">{t("nav.briefings")}</Link>
          <Link to="/settings/billing" className="text-sm text-slate-600 dark:text-slate-300">{t("nav.billing")}</Link>
        </div>
        <div className="flex items-center gap-2">
          <Badge>{t("nav.plan")}: {plan ?? "unknown"}</Badge>
          <Button variant="ghost" onClick={switchLanguage}>{i18n.language.toUpperCase()}</Button>
          <Button variant="ghost" onClick={() => setTheme("light")}><Sun size={16} /></Button>
          <Button variant="ghost" onClick={() => setTheme("dark")}><Moon size={16} /></Button>
          <Button variant="secondary" onClick={() => void signOut()}>{t("auth.logout")}</Button>
        </div>
      </div>
    </header>
  );
}
