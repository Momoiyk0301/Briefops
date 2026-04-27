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
  const [statusFilter, setStatusFilter] = useState<"today" | "upcoming" | "past" | "undated" | null>(null);

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

  const searchFilteredBriefings = useMemo(() => {
    if (!normalizedSearch) return briefings;
    return briefings.filter((briefing) =>
      [briefing.title, briefing.location_text ?? "", briefing.event_date ?? ""].join(" ").toLowerCase().includes(normalizedSearch)
    );
  }, [briefings, normalizedSearch]);

  const filteredBriefings = useMemo(() => {
    if (!statusFilter) return searchFilteredBriefings;
    return searchFilteredBriefings.filter((briefing) => {
      if (!briefing.event_date) return statusFilter === "undated";
      const d = new Date(`${briefing.event_date}T00:00:00`);
      if (Number.isNaN(d.getTime())) return statusFilter === "undated";
      if (statusFilter === "today") return d.getTime() === today.getTime();
      if (statusFilter === "upcoming") return d.getTime() > today.getTime();
      if (statusFilter === "past") return d.getTime() < today.getTime();
      return false;
    });
  }, [searchFilteredBriefings, statusFilter, today]);

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

    searchFilteredBriefings.forEach((briefing) => {
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
  }, [searchFilteredBriefings, today]);

  const createdThisMonth = useMemo(() => {
    return searchFilteredBriefings.filter((briefing) => {
      const createdAt = new Date(briefing.created_at);
      return createdAt.getFullYear() === currentYear && createdAt.getMonth() === currentMonth;
    }).length;
  }, [searchFilteredBriefings, currentMonth, currentYear]);

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
        {/* ── Briefings par statut ── */}
        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b849d]">Briefings par statut</p>
          {statusFilter ? (
            <button
              type="button"
              className="mt-2 text-xs font-medium text-brand-500 hover:underline"
              onClick={() => setStatusFilter(null)}
            >
              × Effacer le filtre
            </button>
          ) : null}
          <div className="mt-3 grid grid-cols-2 gap-2">
            {([
              { key: "today",    label: "Aujourd'hui", count: statusCounts.todayCount,    numCls: "text-blue-600 dark:text-blue-300",    cardCls: "border-blue-200/70 bg-blue-50/80 hover:bg-blue-100/80 dark:border-blue-500/20 dark:bg-blue-900/20 dark:hover:bg-blue-900/30" },
              { key: "upcoming", label: "À venir",     count: statusCounts.upcomingCount, numCls: "text-emerald-600 dark:text-emerald-300", cardCls: "border-emerald-200/70 bg-emerald-50/80 hover:bg-emerald-100/80 dark:border-emerald-500/20 dark:bg-emerald-900/20 dark:hover:bg-emerald-900/30" },
              { key: "past",     label: "Passés",      count: statusCounts.pastCount,     numCls: "text-red-500 dark:text-red-300",      cardCls: "border-red-200/70 bg-red-50/80 hover:bg-red-100/80 dark:border-red-500/20 dark:bg-red-900/20 dark:hover:bg-red-900/30" },
              { key: "undated",  label: "Sans date",   count: statusCounts.undatedCount,  numCls: "text-slate-500 dark:text-slate-300",  cardCls: "border-slate-200/70 bg-slate-50/80 hover:bg-slate-100/80 dark:border-slate-500/20 dark:bg-slate-800/40 dark:hover:bg-slate-800/60" },
            ] as const).map(({ key, label, count, numCls, cardCls }) => (
              <button
                key={key}
                type="button"
                onClick={() => setStatusFilter(statusFilter === key ? null : key)}
                className={`rounded-2xl border px-4 py-3 text-left transition hover:scale-[1.02] hover:shadow-md ${cardCls} ${statusFilter === key ? "ring-2 ring-brand-500/40" : ""}`}
              >
                <p className={`text-3xl font-bold leading-none ${numCls}`}>{count}</p>
                <p className="mt-1.5 text-xs font-medium text-[#6a778f] dark:text-[#9ba4be]">{label}</p>
              </button>
            ))}
          </div>
        </Card>

        {/* ── Briefings créés ── */}
        <Card className="flex flex-col">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b849d]">Briefings créés</p>
          <div className="mt-2 flex items-end gap-3">
            <p className="text-4xl font-bold leading-none text-[#111827] dark:text-white">{briefings.length}</p>
            <p className="mb-0.5 text-sm text-[#7b849d]">total</p>
          </div>
          <p className="mt-2 text-sm text-[#7b849d]">
            Ce mois-ci&nbsp;: <span className="font-semibold text-[#374151] dark:text-[#d1d8f0]">{createdThisMonth}</span>
          </p>
          {briefingLimit !== null ? (
            <div className="mt-3">
              <div className="flex items-center justify-between text-xs text-[#7b849d]">
                <span>{briefings.length} / {briefingLimit} utilisés</span>
                <span>{remainingBriefings} restants</span>
              </div>
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#eef0f8] dark:bg-white/10">
                <div
                  className="h-full rounded-full bg-brand-500 transition-all"
                  style={{ width: `${Math.min((briefings.length / briefingLimit) * 100, 100)}%` }}
                />
              </div>
            </div>
          ) : (
            <p className="mt-2 text-xs text-[#7b849d]">Illimité</p>
          )}
          <Button
            className="mt-auto pt-4"
            withArrow
            onClick={handleCreateBriefing}
            disabled={!isCreateReady || createMutation.isPending}
          >
            {createMutation.isPending ? t("app.loading") : "+ Créer un briefing"}
          </Button>
        </Card>

        {/* ── Plan ── */}
        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b849d]">Plan actuel</p>
          <p className="mt-2 text-4xl font-bold capitalize leading-none text-[#111827] dark:text-white">{plan}</p>
          <p className="mt-2 text-sm text-[#7b849d]">
            {briefingLimit === null
              ? "Briefings illimités"
              : `${briefingLimit} briefing${briefingLimit > 1 ? "s" : ""} max`}
          </p>
          <p className="mt-1 text-sm text-[#7b849d]">
            PDF&nbsp;: {Number.isFinite(getPlanLimits(plan).pdf_month) ? `${getPlanLimits(plan).pdf_month}/mois` : "illimités"}
          </p>
          <div className="mt-4">
            <Badge className="border-brand-200/60 bg-brand-50 text-brand-700 dark:border-brand-500/20 dark:bg-brand-900/20 dark:text-brand-200 capitalize">
              {plan}
            </Badge>
          </div>
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
