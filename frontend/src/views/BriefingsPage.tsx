import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, ExternalLink, Eye, FileText, Plus, Share2, Trash2, Users } from "lucide-react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { SharePanel } from "@/components/briefing/SharePanel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { DraggableConfirmModal } from "@/components/ui/DraggableConfirmModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  createBriefing,
  deleteBriefing,
  getBriefingsWithFallback,
  getMe,
  getStaff,
  listPublicLinks,
  toApiMessage
} from "@/lib/api";
import { Briefing, PublicLinkWithBriefing } from "@/lib/types";
import { queryKeys } from "@/lib/queryKeys";

function getStatusTone(status: Briefing["status"]) {
  if (status === "ready") return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-900/20 dark:text-emerald-200";
  if (status === "archived") return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-900/20 dark:text-amber-200";
  return "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-500/20 dark:bg-slate-800/60 dark:text-slate-200";
}

function formatStatus(status: Briefing["status"]) {
  if (status === "ready") return "Ready";
  if (status === "archived") return "Archived";
  return "Draft";
}

function formatDate(date: string | null) {
  if (!date) return "Date non définie";
  return new Date(`${date}T00:00:00`).toLocaleDateString("fr-BE", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function extractTeams(links: PublicLinkWithBriefing[], briefingId: string) {
  return Array.from(
    new Set(
      links
        .filter((link) => link.briefing_id === briefingId)
        .map((link) => link.team ?? link.audience_tag ?? "")
        .filter(Boolean)
    )
  );
}

function buildExportPath(briefingId: string, team: string | null) {
  return team ? `/briefings/${briefingId}/export?team=${encodeURIComponent(team)}` : `/briefings/${briefingId}/export`;
}

export default function BriefingsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [briefingToDelete, setBriefingToDelete] = useState<{ id: string; title: string } | null>(null);
  const [shareBriefing, setShareBriefing] = useState<{ id: string; teams: string[]; selectedTeam: string | null } | null>(null);

  const meQuery = useQuery({ queryKey: queryKeys.me, queryFn: getMe });
  const briefingsQuery = useQuery({ queryKey: queryKeys.briefingsFallback, queryFn: getBriefingsWithFallback });
  const staffQuery = useQuery({ queryKey: queryKeys.staff, queryFn: getStaff });
  const publicLinksQuery = useQuery({ queryKey: ["documents", "links"], queryFn: listPublicLinks });

  const createMutation = useMutation({
    mutationFn: async () => {
      const orgId = meQuery.data?.org?.id;
      if (!orgId) throw new Error("Organization missing");
      return createBriefing({ workspace_id: orgId, title: "Untitled briefing" });
    },
    onSuccess: async (briefing) => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.briefingsFallback });
      navigate(`/briefings/${briefing.id}`, { state: { initializingNewBriefing: true } });
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
  const publicLinks = publicLinksQuery.data ?? [];
  const normalizedSearch = search.trim().toLowerCase();
  const filteredBriefings = useMemo(() => {
    if (!normalizedSearch) return briefings;
    return briefings.filter((briefing) =>
      [briefing.title, briefing.location_text ?? "", briefing.status, briefing.event_date ?? ""].join(" ").toLowerCase().includes(normalizedSearch)
    );
  }, [briefings, normalizedSearch]);

  const metrics = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    let createdThisMonth = 0;
    let upcomingEvents = 0;
    let pastEvents = 0;

    briefings.forEach((briefing) => {
      const createdAt = new Date(briefing.created_at);
      if (createdAt.getFullYear() === currentYear && createdAt.getMonth() === currentMonth) createdThisMonth += 1;
      if (!briefing.event_date) return;
      const eventDate = new Date(`${briefing.event_date}T00:00:00`);
      if (Number.isNaN(eventDate.getTime())) return;
      if (eventDate.getTime() >= today.getTime()) upcomingEvents += 1;
      if (eventDate.getTime() < today.getTime()) pastEvents += 1;
    });

    const activeStaffThisMonth = new Set(
      (staffQuery.data ?? [])
        .filter((member) => {
          const createdAt = new Date(member.created_at);
          return createdAt.getFullYear() === currentYear && createdAt.getMonth() === currentMonth;
        })
        .map((member) => member.email?.toLowerCase() || `${member.full_name.toLowerCase()}|${member.phone ?? ""}`)
    ).size;

    const activePublicLinks = publicLinks.filter((link) => link.status === "active").length;
    return { createdThisMonth, upcomingEvents, pastEvents, activeStaffThisMonth, activePublicLinks };
  }, [briefings, publicLinks, staffQuery.data]);

  const isDemo = Boolean(briefingsQuery.data?.demo);
  const workspaceId = meQuery.data?.workspace?.id ?? meQuery.data?.org?.id ?? null;

  const handleCreateBriefing = () => {
    if (!workspaceId) {
      toast.error("Workspace missing. Complete onboarding first.");
      navigate("/onboarding");
      return;
    }
    createMutation.mutate();
  };

  if (briefingsQuery.isLoading) {
    return (
      <div className="stack-section">
        <Skeleton className="h-28 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-72 w-full" />
      </div>
    );
  }

  if (briefingsQuery.error) return <p>{toApiMessage(briefingsQuery.error)}</p>;

  return (
    <div className="stack-page">
      <Card className="page-hero card-pad">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <p className="section-kicker">Event Operations</p>
            <h1 className="section-title mt-2">Briefings</h1>
            <p className="section-copy mt-2">Les événements utiles, leur état de préparation et les partages actifs, sans détour.</p>
          </div>
          <Button className="h-12 px-5 text-base" onClick={handleCreateBriefing} disabled={meQuery.isLoading || createMutation.isPending}>
            <Plus size={18} />
            Nouveau briefing
          </Button>
        </div>
      </Card>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {[
          { label: "Créés ce mois", value: metrics.createdThisMonth, icon: <FileText size={16} /> },
          { label: "Événements à venir", value: metrics.upcomingEvents, icon: <CalendarDays size={16} /> },
          { label: "Événements passés", value: metrics.pastEvents, icon: <CalendarDays size={16} /> },
          { label: "Staff actifs ce mois", value: metrics.activeStaffThisMonth, icon: <Users size={16} /> },
          { label: "Liens publics actifs", value: metrics.activePublicLinks, icon: <Share2 size={16} /> }
        ].map((item) => (
          <Card key={item.label} className="surface-pad">
            <div className="flex items-center justify-between text-[#6f748a] dark:text-[#a8afc6]">
              <p className="text-xs font-semibold uppercase tracking-[0.16em]">{item.label}</p>
              {item.icon}
            </div>
            <p className="mt-3 text-3xl font-bold text-[#111827] dark:text-white">{item.value}</p>
          </Card>
        ))}
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Rechercher un briefing, un lieu ou un statut"
          className="w-full sm:w-[380px]"
        />
        <div className="flex items-center gap-2">
          {isDemo ? <Badge className="border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-500/30 dark:bg-orange-900/20 dark:text-orange-200">Demo data</Badge> : null}
          <p className="text-sm text-[#6f748a] dark:text-[#a8afc6]">{filteredBriefings.length} briefing(s)</p>
        </div>
      </div>

      {filteredBriefings.length === 0 ? (
        <Card className="list-surface">
          <EmptyState
            icon={<FileText size={22} />}
            title={search ? "Aucun briefing trouvé" : "Vous n’avez encore créé aucun briefing"}
            description={search ? "Essaie un autre mot-clé pour retrouver un événement, un lieu ou un statut." : "Crée un premier briefing pour centraliser les infos terrain, le staff et le partage PDF."}
            ctaLabel="Créer un briefing"
            onCta={handleCreateBriefing}
          />
        </Card>
      ) : (
        <div className="grid gap-3">
          {filteredBriefings.map((briefing) => {
            const teams = extractTeams(publicLinks, briefing.id);
            const defaultTeam = teams[0] ?? null;

            return (
              <Card key={briefing.id} className="overflow-hidden p-0">
                <div
                  role="link"
                  tabIndex={0}
                  className="flex cursor-pointer flex-col gap-4 px-5 py-4 text-left transition hover:bg-[#f8faff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 dark:hover:bg-white/[0.02] md:flex-row md:items-center md:justify-between"
                  onClick={() => navigate(`/briefings/${briefing.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate(`/briefings/${briefing.id}`);
                    }
                  }}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate text-base font-semibold text-[#111827] dark:text-white">{briefing.title}</p>
                      <Badge className={getStatusTone(briefing.status)}>{formatStatus(briefing.status)}</Badge>
                      <Badge className={briefing.shared ? "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-900/20 dark:text-sky-200" : ""}>
                        {briefing.shared ? "Shared" : "Private"}
                      </Badge>
                    </div>
                    <p className="mt-2 text-sm text-[#6f748a] dark:text-[#a8afc6]">{formatDate(briefing.event_date)} · {briefing.location_text ?? "Lieu non défini"}</p>
                    <p className="mt-1 text-xs text-[#7a839d] dark:text-[#97a0ba]">Mis à jour {formatDate(briefing.updated_at.slice(0, 10))}</p>
                  </div>

                  <div className="flex flex-wrap items-center justify-end gap-2" onClick={(event) => event.stopPropagation()}>
                    {teams.length > 0 ? <Badge className="border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-500/20 dark:bg-brand-900/20 dark:text-brand-300">{teams.length} team{teams.length > 1 ? "s" : ""}</Badge> : null}
                    <Button variant="ghost" onClick={() => navigate(`/briefings/${briefing.id}`)} aria-label="Aperçu du briefing">
                      <Eye size={15} />
                      Aperçu
                    </Button>
                    <Button
                      variant="secondary"
                      aria-label="Partager le briefing"
                      onClick={() => setShareBriefing({ id: briefing.id, teams, selectedTeam: defaultTeam })}
                    >
                      <Share2 size={14} />
                      Partager
                    </Button>
                    <Button variant="secondary" aria-label="Exporter le PDF" onClick={() => navigate(buildExportPath(briefing.id, defaultTeam))}>
                      <FileText size={14} />
                      PDF
                    </Button>
                    <Button variant="ghost" aria-label="Supprimer le briefing" onClick={() => setBriefingToDelete({ id: briefing.id, title: briefing.title })}>
                      <Trash2 size={14} />
                      Supprimer
                    </Button>
                    <Button variant="ghost" aria-label="Ouvrir le briefing" onClick={() => navigate(`/briefings/${briefing.id}`)}>
                      <ExternalLink size={14} />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <DraggableConfirmModal
        open={Boolean(briefingToDelete)}
        title="Confirmer la suppression"
        description={briefingToDelete ? `Voulez-vous supprimer le briefing "${briefingToDelete.title}" ?` : undefined}
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
        teams={shareBriefing?.teams ?? []}
        selectedTeam={shareBriefing?.selectedTeam ?? null}
        onExportPdf={(team) => {
          if (!shareBriefing) return;
          navigate(buildExportPath(shareBriefing.id, team));
        }}
      />
    </div>
  );
}
