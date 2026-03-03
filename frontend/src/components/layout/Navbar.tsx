import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import { UserPlan } from "@/lib/types";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type Props = {
  plan: UserPlan | null;
  demoData?: boolean;
};

export function Navbar({ plan, demoData = false }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const setTheme = (theme: "dark" | "light") => {
    localStorage.setItem("briefops:theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-[#ececf2] bg-white/80 backdrop-blur dark:border-white/10 dark:bg-[#101010]/90">
      <div className="mx-auto flex h-16 max-w-[1500px] items-center justify-between px-6 lg:px-8">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold text-[#111] dark:text-white">{t("app.name")}</p>
          <p className="truncate text-xs text-[#777]">
            Active les modules nécessaires, exporte un PDF clair pour ton staff.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden rounded-full bg-[#f0f1f8] p-1 md:inline-flex dark:bg-[#1f1f1f]">
            <button
              type="button"
              onClick={() => navigate("/briefings")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${location.pathname.startsWith("/briefings") ? "bg-brand-500 text-white" : "text-[#666] hover:text-[#111] dark:text-[#bbb] dark:hover:text-white"}`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => navigate("/settings/billing")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${location.pathname.startsWith("/settings") ? "bg-brand-500 text-white" : "text-[#666] hover:text-[#111] dark:text-[#bbb] dark:hover:text-white"}`}
            >
              Payments
            </button>
            <button
              type="button"
              onClick={() => navigate("/status")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${location.pathname.startsWith("/status") ? "bg-brand-500 text-white" : "text-[#666] hover:text-[#111] dark:text-[#bbb] dark:hover:text-white"}`}
            >
              Reports
            </button>
          </div>
          <Badge>{t("nav.plan")}: {plan ?? "unknown"}</Badge>
          {demoData && <Badge className="border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-900/20 dark:text-orange-200">Demo data</Badge>}
          <Button variant="ghost" onClick={() => setTheme("light")} aria-label="Light mode"><Sun size={16} /></Button>
          <Button variant="ghost" onClick={() => setTheme("dark")} aria-label="Dark mode"><Moon size={16} /></Button>
        </div>
      </div>
    </header>
  );
}
