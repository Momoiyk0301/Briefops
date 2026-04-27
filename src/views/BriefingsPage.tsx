import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CalendarDays, FileText, Share2, X } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { createBriefing, deleteBriefing, getBriefingsWithFallback, getMe, toApiMessage } from "@/lib/api";
import { getPlanLimits } from "@/lib/quotas";
import { queryKeys } from "@/lib/queryKeys";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DraggableConfirmModal } from "@/components/ui/DraggableConfirmModal";
import { SearchInput } from "@/components/ui/SearchInput";
import { Skeleton } from "@/components/ui/Skeleton";
import { SharePanel } from "@/components/briefing/SharePanel";

export default function BriefingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [viewMode, setViewMode] = useState<"list" | "calendar">("list");
  const [search, setSearch] = useState("");
  const [briefingToDelete, setBriefingToDelete] = useState<{ id: string; title: string } | null>(null);
  const [shareBriefing, setShareBriefing] = useState<{ id: string; hasPdf: boolean } | null>(null);

  const meQuery = useQuery({ queryKey: queryKeys.me, queryFn: getMe });
  const briefingsQuery = useQuery({ queryKey: queryKeys.briefingsFallback, queryFn: getBriefingsWithFallback });
  const createMutation = useMutation({
    mutationFn: async () => {
      const workspaceId = meQuery.data?.workspace?.id ?? meQuery.data?.org?.id;
      if (!workspaceId) throw new Error("Workspace missing");
      return createBriefing({ workspace_id: workspaceId, title: "Untitled briefing" });
    },
    onSuccess: (briefing) => {
      navigate(`/briefings/${briefing.id}`, { state: { initializingNewBriefing: true } });
      void queryClient.invalidateQueries({ queryKey: queryKeys.briefingsFallback });
    },
    onError: (error) => toast.error(toApiMessage(error))
  });
  const deleteMutation = useMutation({
    mutationFn: (briefingId: string) => deleteBriefing(briefingId),
    onSuccess: async () => {
      toast.success("Briefing supprimé");
      setBriefingToDelete(null);
      await queryClient.invalidateQueries({ queryKey: queryKeys.briefingsFallback });
    },
    onError: (error) => toast.error(toApiMessage(error))
  });

  const briefings = briefingsQuery.data?.data ?? [];
  const normalizedSearch = search.trim().toLowerCase();
  const filteredBriefings = useMemo(() => {
    if (!normalizedSearch) return briefings;
    return briefings.filter((briefing) =>
      [briefing.title, briefing.location_text ?? "", briefing.event_date ?? ""].join(" ").toLowerCase().includes(normalizedSearch)
    );
  }, [briefings, normalizedSearch]);
  const isDemo = Boolean(briefingsQuery.data?.demo);
  const plan = meQuery.data?.plan ?? "free";
  const workspaceId = meQuery.data?.workspace?.id ?? meQuery.data?.org?.id ?? null;
  const isCreateReady = !meQuery.isLoading && !meQuery.isFetching && !meQuery.data?.degraded && Boolean(workspaceId);
  const planBriefingsLimit = getPlanLimits(plan).briefings;
  const briefingLimit = Number.isFinite(planBriefingsLimit) ? planBriefingsLimit : null;
  const remainingBriefings = briefingLimit === null ? null : Math.max(briefingLimit - briefings.length, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth();
  const monthStart = new Date(currentYear, currentMonth, 1);
  const monthEnd = new Date(currentYear, currentMonth + 1, 0);
  const firstWeekday = (monthStart.getDay() + 6) % 7;
  const daysInMonth = monthEnd.getDate();

  const briefingsByDay = useMemo(() => {
    const map = new Map<number, typeof filteredBriefings>();
    filteredBriefings.forEach((briefing) => {
      if (!briefing.event_date) return;
      const date = new Date(`${briefing.event_date}T00:00:00`);
      if (Number.isNaN(date.getTime()) || date.getMonth() !== currentMonth || date.getFullYear() !== currentYear) {
        return;
      }
      const day = date.getDate();
      const existing = map.get(day) ?? [];
      existing.push(briefing);
      map.set(day, existing);
    });
    return map;
  }, [filteredBriefings, currentMonth, currentYear]);

  const statusCounts = useMemo(() => {
    let todayCount = 0;
    let upcomingCount = 0;
    let pastCount = 0;
    let undatedCount = 0;

    filteredBriefings.forEach((briefing) => {
      if (!briefing.event_date) {
        undatedCount += 1;
        return;
      }
      const eventDate = new Date(`${briefing.event_date}T00:00:00`);
      if (Number.isNaN(eventDate.getTime())) {
        undatedCount += 1;
        return;
      }
      if (eventDate.getTime() === today.getTime()) {
        todayCount += 1;
      } else if (eventDate.getTime() > today.getTime()) {
        upcomingCount += 1;
      } else {
        pastCount += 1;
      }
    });

    return { todayCount, upcomingCount, pastCount, undatedCount };
  }, [filteredBriefings, today]);

  const createdThisMonth = useMemo(() => {
    return filteredBriefings.filter((briefing) => {
      const createdAt = new Date(briefing.created_at);
      return createdAt.getFullYear() === currentYear && createdAt.getMonth() === currentMonth;
    }).length;
  }, [filteredBriefings, currentMonth, currentYear]);

  const handleCreateBriefing = () => {
    if (!isCreateReady) {
      toast.error(meQuery.data?.degraded ? "Workspace context is still loading. Retry in a moment." : t("briefings.workspaceMissing"));
      if (!workspaceId) navigate("/onboarding");
      return;
    }
    if (!workspaceId) {
      toast.error("Workspace missing. Complete onboarding first.");
      navigate("/onboarding");
      return;
    }
    createMutation.mutate();
  };

  const calendarCells = Array.from({ length: firstWeekday + daysInMonth }, (_, index) => {
    if (index < firstWeekday) return null;
    return index - firstWeekday + 1;
  });

  if (briefingsQuery.isLoading) {
    return (
      <div className="stack-section">
        <Skeleton className="h-12 w-60" />
        <Skeleton className="h-20 w-full" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }
  if (briefingsQuery.error) return <p>{toApiMessage(briefingsQuery.error)}</p>;

  return (
    <div className="stack-page">
      <Card className="page-hero card-pad">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="section-kicker">Terrain Command Center</p>
            <h1 className="section-title mt-3">{t("briefings.title")}</h1>
            <p className="section-copy mt-3">
              Centralise tes briefings, garde une vue claire sur les événements du mois et ouvre rapidement le bon document pour le terrain.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <div className="inline-flex rounded-full border border-[#e4e9f4] bg-white/80 p-1 shadow-[0_10px_24px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-[#1f1f1f]">
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
            <Button onClick={handleCreateBriefing} withArrow disabled={!isCreateReady || createMutation.isPending}>
              {createMutation.isPending ? t("app.loading") : t("briefings.new")}
            </Button>
          </div>
        </div>
      </Card>

      <div className="cards-grid-3">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b849d]">Briefings par statut</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <Badge className="w-fit border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-500/20 dark:bg-blue-900/20 dark:text-blue-200">Aujourd'hui: {statusCounts.todayCount}</Badge>
            <Badge className="w-fit border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-900/20 dark:text-emerald-200">A venir: {statusCounts.upcomingCount}</Badge>
            <Badge className="w-fit border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/20 dark:bg-orange-900/20 dark:text-orange-200">Passes: {statusCounts.pastCount}</Badge>
            <Badge className="w-fit border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-500/20 dark:bg-slate-800/60 dark:text-slate-200">Sans date: {statusCounts.undatedCount}</Badge>
          </div>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b849d]">Briefings crees</p>
          <p className="mt-2 text-3xl font-bold">{briefings.length}</p>
          <Badge className="mt-3 w-fit">Ce mois: {createdThisMonth}</Badge>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b849d]">Briefings restants</p>
          <p className="mt-2 text-3xl font-bold">{remainingBriefings === null ? "Illimite" : remainingBriefings}</p>
          <Badge className="mt-3 w-fit">Plan: {plan}</Badge>
        </Card>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Rechercher un briefing, une date ou un lieu"
            className="w-full sm:w-[360px]"
          />
          {isDemo && <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200">Demo data</Badge>}
        </div>
        <div className="flex items-center gap-2 text-sm text-[#6f748a] dark:text-[#a8afc6]">
          <FileText size={16} />
          {filteredBriefings.length} résultat(s)
        </div>
      </div>

      {viewMode === "calendar" ? (
        <Card className="card-pad">
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

      <div className={`stack-section ${viewMode === "calendar" ? "hidden" : ""}`}>
        {filteredBriefings.length === 0 ? (
          <Card className="empty-state">
            <div>
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[20px] bg-brand-500/12 text-brand-600 dark:text-brand-300">
                {search ? <CalendarDays size={22} /> : <FileText size={22} />}
              </div>
              <p className="text-lg font-semibold">{search ? "Aucun briefing trouvé" : t("briefings.empty")}</p>
              <p className="mt-2 text-sm text-slate-500">
                {search ? "Essaie un autre mot-clé ou enlève un filtre." : "Crée ton premier briefing en 2 minutes."}
              </p>
            </div>
            {!search ? (
              <Button
                className="mt-4"
                withArrow
                onClick={handleCreateBriefing}
                disabled={meQuery.isLoading || createMutation.isPending}
              >
                {t("briefings.new")}
              </Button>
            ) : null}
          </Card>
        ) : null}
        {filteredBriefings.map((briefing, index) => (
          <Card
            key={briefing.id}
            className="cursor-pointer border-l-4 border-l-brand-500 transition hover:-translate-y-0.5"
            onClick={() => navigate(`/briefings/${briefing.id}`)}
            style={{ transitionDelay: `${index * 40}ms` }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium">{briefing.title}</p>
                  {briefing.status === "ready" ? (
                    <Badge className="border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-900/20 dark:text-emerald-200">Prêt</Badge>
                  ) : briefing.status === "archived" ? (
                    <Badge className="border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-500/20 dark:bg-slate-800/60 dark:text-slate-300">Archivé</Badge>
                  ) : (
                    <Badge className="border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/20 dark:bg-orange-900/20 dark:text-orange-200">Brouillon</Badge>
                  )}
                </div>
                <p className="text-sm text-slate-500">{briefing.event_date ?? "—"} · {briefing.location_text ?? "—"}</p>
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Partager le briefing"
                  className="rounded-full p-1 text-[#8a90a5] transition hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-900/20"
                  onClick={(event) => {
                    event.stopPropagation();
                    setShareBriefing({ id: briefing.id, hasPdf: Boolean(briefing.pdf_path) });
                  }}
                >
                  <Share2 size={14} />
                </button>
                <button
                  type="button"
                  aria-label="Supprimer le briefing"
                  className="rounded-full p-1 text-[#8a90a5] transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                  onClick={(event) => {
                    event.stopPropagation();
                    if (deleteMutation.isPending) return;
                    setBriefingToDelete({ id: briefing.id, title: briefing.title });
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <DraggableConfirmModal
        open={Boolean(briefingToDelete)}
        title="Confirmer la suppression"
        description={
          briefingToDelete
            ? `Voulez-vous supprimer le briefing "${briefingToDelete.title}" ?`
            : undefined
        }
        confirmLabel="Supprimer"
        cancelLabel="Annuler"
        loading={deleteMutation.isPending}
        onCancel={() => setBriefingToDelete(null)}
        onConfirm={() => {
          if (!briefingToDelete) return;
          deleteMutation.mutate(briefingToDelete.id);
        }}
      />
      <SharePanel
        open={Boolean(shareBriefing)}
        onClose={() => setShareBriefing(null)}
        briefingId={shareBriefing?.id ?? ""}
        hasPdf={Boolean(shareBriefing?.hasPdf)}
      />
    </div>
  );
}
