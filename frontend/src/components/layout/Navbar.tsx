import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Bell, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import { UserPlan } from "@/lib/types";
import { getBriefingsWithFallback, getMe } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

type Props = {
  plan: UserPlan | null;
  demoData?: boolean;
};

export function Navbar({ plan: _plan, demoData = false }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([]);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const briefingsQuery = useQuery({ queryKey: queryKeys.briefingsFallback, queryFn: getBriefingsWithFallback });
  const meQuery = useQuery({ queryKey: queryKeys.me, queryFn: getMe });

  const pageTitle = (() => {
    if (pathname.startsWith("/briefings/")) return "Détail briefing";
    if (pathname.startsWith("/briefings")) return t("nav.briefings");
    if (pathname.startsWith("/staff")) return "Staff";
    if (pathname.startsWith("/account")) return "Compte";
    if (pathname.startsWith("/abonnement")) return "Abonnement";
    if (pathname.startsWith("/notifications")) return "Notifications";
    if (pathname.startsWith("/settings/billing")) return "Facturation";
    if (pathname.startsWith("/settings")) return t("nav.settings");
    if (pathname.startsWith("/onboarding")) return t("nav.onboarding");
    return t("app.name");
  })();
  const showBackButton = !pathname.startsWith("/briefings") && !pathname.startsWith("/onboarding");

  const previewNotifications = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return (briefingsQuery.data?.data ?? [])
      .filter((item) => Boolean(item.event_date))
      .map((item) => {
        const eventDate = new Date(`${item.event_date}T00:00:00`);
        const diffDays = Math.ceil((eventDate.getTime() - now.getTime()) / 86400000);
        return {
          id: item.id,
          title: item.title,
          location: item.location_text ?? "Lieu non défini",
          diffDays
        };
      })
      .filter((item) => !dismissedNotificationIds.includes(item.id))
      .sort((a, b) => a.diffDays - b.diffDays)
      .slice(0, 4);
  }, [briefingsQuery.data, dismissedNotificationIds]);

  useEffect(() => {
    const raw = localStorage.getItem("briefops:notifications:dismissed");
    if (!raw) return;
    try {
      const ids = JSON.parse(raw) as unknown;
      if (Array.isArray(ids)) {
        setDismissedNotificationIds(ids.filter((value): value is string => typeof value === "string"));
      }
    } catch {
      localStorage.removeItem("briefops:notifications:dismissed");
    }
  }, []);

  function dismissNotification(id: string) {
    setDismissedNotificationIds((current) => {
      if (current.includes(id)) return current;
      const next = [...current, id];
      localStorage.setItem("briefops:notifications:dismissed", JSON.stringify(next));
      return next;
    });
  }

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    }

    if (notificationsOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [notificationsOpen]);

  return (
    <header className="sticky top-0 z-20 border-b border-[#ececf2] bg-white/80 backdrop-blur dark:border-white/10 dark:bg-[#101010]/90">
      <div className="flex h-16 items-center justify-between pl-3 pr-4 lg:pl-5 lg:pr-6">
        <div className="min-w-0 flex items-center gap-2">
          {showBackButton ? (
            <Button variant="ghost" aria-label="Retour" onClick={() => navigate(-1)}>
              <ArrowLeft size={16} />
            </Button>
          ) : null}
          <h1 className="truncate text-lg font-bold text-[#111] dark:text-white">{pageTitle}</h1>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative" ref={notificationsRef}>
            <Button
              variant="ghost"
              aria-label="Notifications"
              onClick={() => setNotificationsOpen((value) => !value)}
            >
              <Bell size={16} />
            </Button>
            {notificationsOpen ? (
              <div className="absolute right-0 top-[calc(100%+10px)] w-[340px] rounded-2xl border border-[#ececf2] bg-white p-4 shadow-panel dark:border-white/10 dark:bg-[#151515]">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold">Aperçu</p>
                  <button
                    type="button"
                    className="text-xs text-brand-500"
                    onClick={() => {
                      setNotificationsOpen(false);
                      navigate("/notifications");
                    }}
                  >
                    Voir tout
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  {previewNotifications.length === 0 ? (
                    <p className="text-sm text-[#6f748a] dark:text-[#a8afc6]">Aucune alerte.</p>
                  ) : (
                    previewNotifications.map((item) => (
                      <div key={item.id} className="rounded-xl border border-[#ededf4] p-3 dark:border-white/10">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium">{item.title}</p>
                            <p className="text-xs text-[#6f748a] dark:text-[#a8afc6]">
                              {item.location} · {item.diffDays <= 0 ? "Aujourd'hui / passé" : `Dans ${item.diffDays} jour(s)`}
                            </p>
                          </div>
                          <button
                            type="button"
                            aria-label="Supprimer la notification"
                            className="rounded-full p-1 text-[#8a90a5] transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                            onClick={() => dismissNotification(item.id)}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ) : null}
          </div>
          <div className="hidden rounded-full bg-[#f0f1f8] p-1 md:inline-flex dark:bg-[#1f1f1f]">
            <button
              type="button"
              onClick={() => navigate("/briefings")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${pathname.startsWith("/briefings") ? "bg-brand-500 text-white" : "text-[#666] hover:text-[#111] dark:text-[#bbb] dark:hover:text-white"}`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => navigate("/account")}
              className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${pathname.startsWith("/account") ? "bg-brand-500 text-white" : "text-[#666] hover:text-[#111] dark:text-[#bbb] dark:hover:text-white"}`}
            >
              Compte
            </button>
          </div>
          <button
            type="button"
            onClick={() => navigate("/account")}
            className="hidden max-w-[280px] items-center gap-2 rounded-full border border-[#e6e8f1] bg-white px-3 py-1.5 text-left transition hover:border-brand-500/40 md:flex dark:border-white/10 dark:bg-[#171717]"
          >
            <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-500/15 text-xs font-semibold text-brand-600 dark:text-brand-400">
              {(meQuery.data?.user?.email?.slice(0, 1) ?? "U").toUpperCase()}
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold text-[#21263a] dark:text-[#dbe3ff]">
                {meQuery.data?.user?.email ?? "Utilisateur"}
              </span>
              <span className="block truncate text-[11px] text-[#767c91] dark:text-[#9da5bf]">
                Plan {meQuery.data?.plan ?? "free"}
              </span>
            </span>
          </button>
          {demoData && <Badge className="border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-900/20 dark:text-orange-200">Demo data</Badge>}
        </div>
      </div>
    </header>
  );
}
