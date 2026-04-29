import { useEffect, useMemo, useState } from "react";
import { BellRing, Clock3, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { getBriefingsWithFallback, toApiMessage } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";

function toDateValue(value: string | null) {
  if (!value) return null;
  const date = new Date(`${value}T00:00:00`);
  return Number.isNaN(date.getTime()) ? null : date;
}

function toLabel(date: Date) {
  return new Intl.DateTimeFormat("fr-BE", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(date);
}

export default function NotificationsPage() {
  const { t } = useTranslation();
  const briefingsQuery = useQuery({ queryKey: queryKeys.briefingsFallback, queryFn: getBriefingsWithFallback });
  const [dismissedIds, setDismissedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const raw = localStorage.getItem("briefops:notifications:dismissed");
    if (!raw) return;
    try {
      const ids = JSON.parse(raw) as unknown;
      if (Array.isArray(ids)) {
        setDismissedIds(ids.filter((value): value is string => typeof value === "string"));
      }
    } catch {
      localStorage.removeItem("briefops:notifications:dismissed");
    }
  }, []);

  const notifications = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const normalizedSearch = search.trim().toLowerCase();

    return (briefingsQuery.data?.data ?? [])
      .map((briefing) => {
        const date = toDateValue(briefing.event_date);
        if (!date) return null;
        const diffDays = Math.ceil((date.getTime() - today.getTime()) / 86400000);
        const level = diffDays <= 2 ? "high" : diffDays <= 7 ? "medium" : "low";
        return {
          id: briefing.id,
          title: briefing.title,
          location: briefing.location_text ?? t("notificationsPage.locationFallback"),
          when: toLabel(date),
          diffDays,
          level
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .filter((item) => !dismissedIds.includes(item.id))
      .filter((item) =>
        !normalizedSearch
          ? true
          : [item.title, item.location, item.when].join(" ").toLowerCase().includes(normalizedSearch)
      )
      .sort((a, b) => a.diffDays - b.diffDays);
  }, [briefingsQuery.data, dismissedIds, search, t]);

  const dismissNotification = (id: string) => {
    setDismissedIds((current) => {
      if (current.includes(id)) return current;
      const next = [...current, id];
      localStorage.setItem("briefops:notifications:dismissed", JSON.stringify(next));
      return next;
    });
  };

  if (briefingsQuery.isLoading) {
    return <Card>{t("notificationsPage.loading")}</Card>;
  }
  if (briefingsQuery.error) {
    return <Card>{toApiMessage(briefingsQuery.error)}</Card>;
  }

  return (
    <section className="stack-page">
      <Card className="page-hero card-pad">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="section-kicker">{t("notificationsPage.kicker")}</p>
            <h1 className="section-title mt-3">{t("notificationsPage.title")}</h1>
            <p className="section-copy mt-3">{t("notificationsPage.subtitle")}</p>
          </div>
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder={t("notificationsPage.searchPlaceholder")}
            className="w-full sm:w-[320px]"
          />
        </div>
      </Card>
      <div className="stack-section">
        {notifications.length === 0 ? (
          <Card>
            <EmptyState
              icon={<BellRing size={22} />}
              title={t("notificationsPage.empty")}
              description="Les prochaines échéances des briefings apparaîtront ici dès qu’un événement aura une date."
              ctaLabel="Voir les briefings"
              onCta={() => (window.location.href = "/briefings")}
            />
          </Card>
        ) : null}
        {notifications.map((item) => (
          <Card key={item.id} className="card-pad">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="max-w-xl">
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-[#6f748a] dark:text-[#a8afc6]">
                  {item.when} · {item.location}
                </p>
                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-[#e7ecf5] bg-white/80 px-3 py-1.5 text-xs font-medium text-[#6b7390] dark:border-white/10 dark:bg-[#1b1f2a] dark:text-[#a8afc6]">
                  <Clock3 size={13} />
                  {t("notificationsPage.priority", {
                    level:
                      item.level === "high"
                        ? t("notificationsPage.priorityHigh")
                        : item.level === "medium"
                          ? t("notificationsPage.priorityMedium")
                          : t("notificationsPage.priorityLow")
                  })}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  className={
                    item.level === "high"
                      ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-900/20 dark:text-red-200"
                      : item.level === "medium"
                        ? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/20 dark:bg-orange-900/20 dark:text-orange-200"
                        : ""
                  }
                >
                  {item.diffDays <= 0 ? t("notificationsPage.todayOrPast") : t("notificationsPage.inDays", { count: item.diffDays })}
                </Badge>
                <button
                  type="button"
                  aria-label="Supprimer la notification"
                  className="rounded-full p-1 text-[#8a90a5] transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                  onClick={() => dismissNotification(item.id)}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
