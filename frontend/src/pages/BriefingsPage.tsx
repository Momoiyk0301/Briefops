import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { createBriefing, getBriefingsWithFallback, getMe, toApiMessage, upsertBriefingModules } from "@/lib/api";
import { moduleRegistry } from "@/lib/moduleRegistry";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export default function BriefingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");

  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const briefingsQuery = useQuery({ queryKey: ["briefings"], queryFn: getBriefingsWithFallback });
  const initialModules = [
    { module_key: "metadata" as const, enabled: true, data_json: moduleRegistry.metadata.defaultData },
    { module_key: "access" as const, enabled: true, data_json: moduleRegistry.access.defaultData },
    { module_key: "delivery" as const, enabled: false, data_json: moduleRegistry.delivery.defaultData },
    { module_key: "vehicle" as const, enabled: false, data_json: moduleRegistry.vehicle.defaultData },
    { module_key: "equipment" as const, enabled: false, data_json: moduleRegistry.equipment.defaultData },
    { module_key: "staff" as const, enabled: false, data_json: moduleRegistry.staff.defaultData },
    { module_key: "notes" as const, enabled: true, data_json: moduleRegistry.notes.defaultData },
    { module_key: "contact" as const, enabled: false, data_json: moduleRegistry.contact.defaultData }
  ];

  const createMutation = useMutation({
    mutationFn: async () => {
      const orgId = meQuery.data?.org?.id;
      if (!orgId) throw new Error("Organization missing");
      return createBriefing({ org_id: orgId, title: "Untitled briefing" });
    },
    onSuccess: (briefing) => {
      navigate(`/briefings/${briefing.id}`, { state: { initializingNewBriefing: true } });
      void (async () => {
        try {
          await upsertBriefingModules(briefing.id, initialModules);
          await queryClient.invalidateQueries({ queryKey: ["modules", briefing.id] });
          await queryClient.invalidateQueries({ queryKey: ["briefings"] });
        } catch (error) {
          toast.error(toApiMessage(error));
        }
      })();
    },
    onError: (error) => toast.error(toApiMessage(error))
  });

  const briefings = briefingsQuery.data?.data ?? [];
  const isDemo = Boolean(briefingsQuery.data?.demo);
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const monthStart = new Date(currentYear, currentMonth, 1);
  const monthEnd = new Date(currentYear, currentMonth + 1, 0);
  const firstWeekday = (monthStart.getDay() + 6) % 7;
  const daysInMonth = monthEnd.getDate();

  const briefingsByDay = useMemo(() => {
    const map = new Map<number, typeof briefings>();
    briefings.forEach((briefing) => {
      if (!briefing.event_date) return;
      const date = new Date(`${briefing.event_date}T00:00:00`);
      if (
        Number.isNaN(date.getTime()) ||
        date.getMonth() !== currentMonth ||
        date.getFullYear() !== currentYear
      ) {
        return;
      }
      const day = date.getDate();
      const existing = map.get(day) ?? [];
      existing.push(briefing);
      map.set(day, existing);
    });
    return map;
  }, [briefings, currentMonth, currentYear]);

  const calendarCells = Array.from({ length: firstWeekday + daysInMonth }, (_, index) => {
    if (index < firstWeekday) return null;
    return index - firstWeekday + 1;
  });

  if (briefingsQuery.isLoading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-60" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }
  if (briefingsQuery.error) return <p>{toApiMessage(briefingsQuery.error)}</p>;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <p className="text-xs text-[#888]">Total briefings</p>
          <p className="mt-2 text-3xl font-bold">{briefings.length}</p>
          <Badge className="mt-3 w-fit border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-900/20 dark:text-emerald-200">+5%</Badge>
        </Card>
        <Card>
          <p className="text-xs text-[#888]">Upcoming</p>
          <p className="mt-2 text-3xl font-bold">{briefings.filter((x) => Boolean(x.event_date)).length}</p>
          <Badge className="mt-3 w-fit">Live data</Badge>
        </Card>
        <Card>
          <p className="text-xs text-[#888]">Locations</p>
          <p className="mt-2 text-3xl font-bold">{new Set(briefings.map((x) => x.location_text).filter(Boolean)).size}</p>
          <Badge className="mt-3 w-fit">Ops coverage</Badge>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold">{t("briefings.title")}</h1>
          {isDemo && <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200">Demo data</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-full bg-[#eff0f8] p-1 dark:bg-[#1f1f1f]">
            <Button
              variant={viewMode === "list" ? "primary" : "ghost"}
              className="px-3 py-1.5 text-xs"
              onClick={() => setViewMode("list")}
            >
              Liste
            </Button>
            <Button
              variant={viewMode === "calendar" ? "primary" : "ghost"}
              className="px-3 py-1.5 text-xs"
              onClick={() => setViewMode("calendar")}
            >
              Calendrier
            </Button>
          </div>
          <Button onClick={() => createMutation.mutate()} withArrow>{t("briefings.new")}</Button>
        </div>
      </div>

      {viewMode === "calendar" ? (
        <Card className="p-5">
          <div className="mb-4">
            <p className="text-sm text-[#6f748a] dark:text-[#a8afc6]">Vue mensuelle</p>
            <h2 className="text-xl font-bold">
              {new Intl.DateTimeFormat("fr-BE", { month: "long", year: "numeric" }).format(monthStart)}
            </h2>
          </div>
          <div className="grid grid-cols-7 gap-2 text-xs font-semibold uppercase tracking-wide text-[#7e8398] dark:text-[#9ba2bc]">
            {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((dayName) => (
              <p key={dayName} className="px-2 py-1">{dayName}</p>
            ))}
          </div>
          <div className="mt-2 grid grid-cols-7 gap-2">
            {calendarCells.map((day, index) => {
              if (!day) return <div key={`empty-${index}`} className="min-h-[96px] rounded-xl border border-transparent" />;
              const dayBriefings = briefingsByDay.get(day) ?? [];
              return (
                <div key={day} className="min-h-[96px] rounded-xl border border-[#ececf5] bg-white p-2 dark:border-white/10 dark:bg-[#171717]">
                  <p className="text-xs font-semibold text-[#68708a] dark:text-[#abb4cc]">{day}</p>
                  <div className="mt-2 space-y-1">
                    {dayBriefings.slice(0, 2).map((briefing) => (
                      <button
                        type="button"
                        key={briefing.id}
                        className="block w-full truncate rounded-md bg-brand-500/10 px-1.5 py-1 text-left text-[11px] font-medium text-brand-700 dark:text-brand-400"
                        onClick={() => navigate(`/briefings/${briefing.id}`)}
                      >
                        {briefing.title}
                      </button>
                    ))}
                    {dayBriefings.length > 2 ? (
                      <p className="text-[11px] text-[#6f748a] dark:text-[#a8afc6]">+{dayBriefings.length - 2} autres</p>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      ) : null}

      <div className={`space-y-3 ${viewMode === "calendar" ? "hidden" : ""}`}>
        {briefings.length === 0 && (
          <Card className="text-center">
            <p className="text-lg font-medium">{t("briefings.empty")}</p>
            <p className="mt-1 text-sm text-slate-500">Crée ton premier briefing en 2 minutes.</p>
            <Button className="mt-4" withArrow onClick={() => createMutation.mutate()}>
              {t("briefings.new")}
            </Button>
          </Card>
        )}
        {briefings.map((briefing, index) => (
          <Card
            key={briefing.id}
            className="cursor-pointer border-l-4 border-l-brand-500 transition hover:-translate-y-0.5"
            onClick={() => navigate(`/briefings/${briefing.id}`)}
            style={{ transitionDelay: `${index * 40}ms` }}
          >
            <p className="font-medium">{briefing.title}</p>
            <p className="text-sm text-slate-500">{briefing.event_date ?? "—"} · {briefing.location_text ?? "—"}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
