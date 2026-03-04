import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { getBriefingsWithFallback, toApiMessage } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

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
  const briefingsQuery = useQuery({ queryKey: ["briefings"], queryFn: getBriefingsWithFallback });

  const notifications = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return (briefingsQuery.data?.data ?? [])
      .map((briefing) => {
        const date = toDateValue(briefing.event_date);
        if (!date) return null;
        const diffDays = Math.ceil((date.getTime() - today.getTime()) / 86400000);
        const level = diffDays <= 2 ? "high" : diffDays <= 7 ? "medium" : "low";
        return {
          id: briefing.id,
          title: briefing.title,
          location: briefing.location_text ?? "Lieu non défini",
          when: toLabel(date),
          diffDays,
          level
        };
      })
      .filter((item): item is NonNullable<typeof item> => Boolean(item))
      .sort((a, b) => a.diffDays - b.diffDays);
  }, [briefingsQuery.data]);

  if (briefingsQuery.isLoading) {
    return <Card>Chargement des notifications...</Card>;
  }
  if (briefingsQuery.error) {
    return <Card>{toApiMessage(briefingsQuery.error)}</Card>;
  }

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Notifications</h1>
        <p className="mt-1 text-sm text-[#6f748a] dark:text-[#a8afc6]">
          Récap détaillé des briefings à venir.
        </p>
      </div>
      <div className="space-y-3">
        {notifications.length === 0 ? (
          <Card>
            <p className="font-medium">Aucune notification pour le moment.</p>
          </Card>
        ) : null}
        {notifications.map((item) => (
          <Card key={item.id} className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{item.title}</p>
                <p className="text-sm text-[#6f748a] dark:text-[#a8afc6]">
                  {item.when} · {item.location}
                </p>
              </div>
              <Badge
                className={
                  item.level === "high"
                    ? "border-red-200 bg-red-50 text-red-700 dark:border-red-500/20 dark:bg-red-900/20 dark:text-red-200"
                    : item.level === "medium"
                      ? "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/20 dark:bg-orange-900/20 dark:text-orange-200"
                      : ""
                }
              >
                {item.diffDays <= 0 ? "Aujourd'hui / passé" : `Dans ${item.diffDays} jour(s)`}
              </Badge>
            </div>
          </Card>
        ))}
      </div>
    </section>
  );
}
