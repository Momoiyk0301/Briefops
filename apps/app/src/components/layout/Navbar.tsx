import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, ChevronRight, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate } from "react-router-dom";

import { AvatarBadge } from "@/components/ui/AvatarBadge";
import { GlobalSearch } from "@/components/ui/GlobalSearch";
import { UserPlan } from "@/lib/types";
import { getBriefingsWithFallback, getMe, getStorageSignedUrl } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { Badge } from "@/components/ui/Badge";
import { getInitials } from "@/lib/branding";

type Props = {
  plan: UserPlan | null;
  demoData?: boolean;
};

function IconBtn({ children, onClick, label, dot = false }: { children: React.ReactNode; onClick?: () => void; label: string; dot?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="relative flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--border)] bg-transparent text-[var(--ink-3)] transition-colors hover:border-[var(--border-2)] hover:bg-[var(--bg)] hover:text-[var(--ink)]"
    >
      {children}
      {dot && (
        <span
          className="absolute right-[5px] top-[5px] h-[7px] w-[7px] rounded-full border-[1.5px] border-[var(--bg-2)] bg-[oklch(49%_0.22_258)]"
        />
      )}
    </button>
  );
}

export function Navbar({ plan: _plan, demoData = false }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const pathname = location.pathname;
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [dismissedNotificationIds, setDismissedNotificationIds] = useState<string[]>([]);
  const [workspaceLogoUrl, setWorkspaceLogoUrl] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const notificationsRef = useRef<HTMLDivElement | null>(null);
  const briefingsQuery = useQuery({ queryKey: queryKeys.briefingsFallback, queryFn: getBriefingsWithFallback });
  const meQuery = useQuery({ queryKey: queryKeys.me, queryFn: getMe });

  const pageTitle = (() => {
    if (pathname.startsWith("/briefings/")) return t("navbar.pageTitles.briefingDetail");
    if (pathname.startsWith("/briefings")) return t("nav.briefings");
    if (pathname.startsWith("/modules")) return t("nav.modules");
    if (pathname.startsWith("/staff")) return t("nav.staff");
    if (pathname.startsWith("/account")) return t("nav.account");
    if (pathname.startsWith("/notifications")) return t("nav.notifications");
    if (pathname.startsWith("/settings/billing")) return t("nav.account");
    if (pathname.startsWith("/settings")) return t("nav.settings");
    if (pathname.startsWith("/onboarding")) return t("nav.onboarding");
    return t("app.name");
  })();

  const workspaceName = meQuery.data?.workspace?.name ?? meQuery.data?.org?.name ?? t("app.name");

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
          location: item.location_text ?? t("notificationsPage.locationFallback"),
          diffDays
        };
      })
      .filter((item) => !dismissedNotificationIds.includes(item.id))
      .sort((a, b) => a.diffDays - b.diffDays)
      .slice(0, 4);
  }, [briefingsQuery.data, dismissedNotificationIds, t]);

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
    let cancelled = false;

    async function resolveBranding() {
      try {
        if (meQuery.data?.workspace?.logo_path) {
          const url = await getStorageSignedUrl("logos", meQuery.data.workspace.logo_path);
          if (!cancelled) setWorkspaceLogoUrl(url);
        } else if (!cancelled) {
          setWorkspaceLogoUrl(null);
        }

        if (meQuery.data?.user?.avatar_path) {
          const url = await getStorageSignedUrl("avatars", meQuery.data.user.avatar_path);
          if (!cancelled) setAvatarUrl(url);
        } else if (!cancelled) {
          setAvatarUrl(null);
        }
      } catch {
        if (!cancelled) {
          setWorkspaceLogoUrl(null);
          setAvatarUrl(null);
        }
      }
    }

    void resolveBranding();
    return () => {
      cancelled = true;
    };
  }, [meQuery.data?.workspace?.logo_path, meQuery.data?.user?.avatar_path]);

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
    <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--bg-2)]">
      <div className="flex h-[52px] items-center gap-3 px-5">
        {/* Breadcrumb */}
        <div className="flex min-w-0 flex-1 items-center gap-1.5 text-[13px] text-[var(--ink-3)]">
          <span className="hidden truncate max-w-[140px] md:block">{workspaceName}</span>
          <ChevronRight size={12} className="hidden shrink-0 text-[var(--border-2)] md:block" />
          <span className="font-semibold text-[var(--ink)] truncate">{pageTitle}</span>
        </div>

        {/* Right zone */}
        <div className="flex shrink-0 items-center gap-1.5">
          <GlobalSearch />

          <div className="h-5 w-px bg-[var(--border)]" />

          {/* Notifications */}
          <div className="relative" ref={notificationsRef}>
            <IconBtn
              label={t("nav.notifications")}
              onClick={() => setNotificationsOpen((v) => !v)}
              dot={previewNotifications.length > 0}
            >
              <Bell size={15} />
            </IconBtn>

            {notificationsOpen && (
              <div className="absolute right-0 top-[calc(100%+8px)] w-[min(340px,calc(100vw-1.5rem))] rounded-2xl border border-[var(--border)] bg-[var(--bg-2)] p-4 shadow-[0_16px_48px_rgba(11,21,37,0.14)]">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-[var(--ink)]">{t("navbar.notificationsPreview")}</p>
                  <button
                    type="button"
                    className="text-xs text-[oklch(49%_0.22_258)] hover:underline"
                    onClick={() => {
                      setNotificationsOpen(false);
                      navigate("/notifications");
                    }}
                  >
                    {t("navbar.viewAll")}
                  </button>
                </div>
                <div className="mt-3 space-y-2">
                  {previewNotifications.length === 0 ? (
                    <p className="text-sm text-[var(--ink-3)]">{t("navbar.emptyNotifications")}</p>
                  ) : (
                    previewNotifications.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-3 py-2.5"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <p className="text-sm font-medium text-[var(--ink)]">{item.title}</p>
                            <p className="text-xs text-[var(--ink-3)]">
                              {item.location} ·{" "}
                              {item.diffDays <= 0
                                ? t("notificationsPage.todayOrPast")
                                : t("notificationsPage.inDays", { count: item.diffDays })}
                            </p>
                          </div>
                          <button
                            type="button"
                            aria-label={t("navbar.dismissNotification")}
                            className="shrink-0 rounded-md p-1 text-[var(--ink-4)] transition hover:bg-red-50 hover:text-red-600"
                            onClick={() => dismissNotification(item.id)}
                          >
                            <X size={11} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Avatar */}
          <button
            type="button"
            onClick={() => navigate("/account")}
            className="hidden items-center gap-2 rounded-lg border border-[var(--border)] bg-[var(--bg-2)] px-2.5 py-1.5 transition hover:border-[var(--border-2)] hover:bg-[var(--bg)] md:flex"
          >
            <AvatarBadge
              label={t("shell.userLabel")}
              imageUrl={avatarUrl}
              initials={meQuery.data?.user?.initials || getInitials(meQuery.data?.user?.full_name || meQuery.data?.user?.email, "US")}
              className="h-6 w-6 shrink-0 rounded-md"
            />
            <div className="min-w-0">
              <p className="block truncate max-w-[140px] text-[11.5px] font-semibold text-[var(--ink)] leading-tight">
                {meQuery.data?.user?.email ?? t("shell.userFallback")}
              </p>
              <p className="block text-[10px] text-[var(--ink-3)] leading-tight">
                {t("shell.planLabel", { plan: meQuery.data?.plan ?? "starter" })}
              </p>
            </div>
          </button>

          {demoData && (
            <Badge className="border-orange-200 bg-orange-50 text-orange-700">
              {t("shell.demoData")}
            </Badge>
          )}
        </div>
      </div>
    </header>
  );
}
