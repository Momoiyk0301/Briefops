import { useQuery } from "@tanstack/react-query";
import { FileDown, PencilLine, Share2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { A4Preview } from "@/components/briefing/A4Preview";
import { BriefingEditor, buildInitialState } from "@/components/briefing/BriefingEditor";
import { SharePanel } from "@/components/briefing/SharePanel";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { getBriefing, getBriefingModules, getRegistryModules, toApiMessage } from "@/lib/api";
import { BriefingModuleRow } from "@/lib/types";

function getStatusTone(status: "draft" | "ready" | "archived") {
  if (status === "ready") return "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-900/20 dark:text-emerald-200";
  if (status === "archived") return "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-500/20 dark:bg-amber-900/20 dark:text-amber-200";
  return "border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-500/20 dark:bg-slate-800/60 dark:text-slate-200";
}

export default function BriefingDetailPage() {
  const params = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const id = params.id ?? "";
  const locationState = location.state as { initializingNewBriefing?: boolean } | null;
  const isInitializingNewBriefing = Boolean(locationState?.initializingNewBriefing);
  const [editing, setEditing] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [saveNonce, setSaveNonce] = useState(0);

  const briefingQuery = useQuery({ queryKey: ["briefing", id], queryFn: () => getBriefing(id), enabled: Boolean(id) });
  const modulesQuery = useQuery({ queryKey: ["modules", id], queryFn: () => getBriefingModules(id), enabled: Boolean(id) });
  const registryQuery = useQuery({ queryKey: ["modules", "registry"], queryFn: getRegistryModules });

  const seededModules = useMemo<BriefingModuleRow[]>(() => {
    if (!briefingQuery.data || !registryQuery.data) return [];
    const now = new Date().toISOString();

    return registryQuery.data.map((mod) => ({
      id: `seed-${mod.type}-${briefingQuery.data!.id}`,
      briefing_id: briefingQuery.data.id,
      module_id: mod.id,
      module_key: mod.type,
      enabled: mod.enabled,
      data_json: {
        id: `${mod.type}_${mod.version}`,
        metadata: {
          type: mod.type,
          label: mod.name,
          version: mod.version,
          enabled: mod.enabled,
          order: 0,
          description: mod.name,
          icon: mod.icon,
          category: mod.category,
          created_at: now,
          updated_at: now
        },
        audience: { mode: "all", teams: [], visibility: "visible" },
        layout: mod.default_layout,
        data: mod.default_data
      },
      created_at: now,
      updated_at: now
    }));
  }, [briefingQuery.data, registryQuery.data]);

  useEffect(() => {
    setEditing(false);
  }, [id]);

  if (briefingQuery.isLoading || registryQuery.isLoading || (modulesQuery.isLoading && !isInitializingNewBriefing)) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-20 w-full" />
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-[560px] w-full" />
          <Skeleton className="h-[560px] w-full" />
        </div>
      </div>
    );
  }
  if (briefingQuery.error) return <Card>{toApiMessage(briefingQuery.error)}</Card>;
  if (modulesQuery.error) return <Card>{toApiMessage(modulesQuery.error)}</Card>;
  if (registryQuery.error) return <Card>{toApiMessage(registryQuery.error)}</Card>;
  if (!briefingQuery.data) return <Card>Not found</Card>;

  const modules = modulesQuery.data ?? (isInitializingNewBriefing ? seededModules : null);
  if (!modules || !registryQuery.data) return <Card>Not found</Card>;
  const showInitOverlay = isInitializingNewBriefing && (modulesQuery.isLoading || modulesQuery.isFetching);
  const previewState = buildInitialState(briefingQuery.data, modules, registryQuery.data);
  const lastUpdatedLabel = new Date(briefingQuery.data.updated_at).toLocaleString();

  return (
    <div className="relative stack-section">
      <Card className={`sticky top-[88px] z-10 border border-[#dde4f1] backdrop-blur-xl dark:border-white/10 dark:bg-[#121212]/92 ${editing ? "bg-white/94 p-3" : "bg-white/88 p-4"}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="ghost" onClick={() => navigate(-1)}>Retour</Button>
              <Badge className={getStatusTone(briefingQuery.data.status)}>
                {briefingQuery.data.status === "ready" ? "Ready" : briefingQuery.data.status === "archived" ? "Archived" : "Draft"}
              </Badge>
              {briefingQuery.data.shared ? (
                <Badge className="border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-500/20 dark:bg-sky-900/20 dark:text-sky-200">Shared</Badge>
              ) : null}
            </div>
            <h1 className="mt-3 truncate text-2xl font-bold text-[#111827] dark:text-white">{briefingQuery.data.title}</h1>
            <p className="mt-1 text-sm text-[#6f748a] dark:text-[#a8afc6]">
              {briefingQuery.data.event_date ?? "Date non définie"} · {briefingQuery.data.location_text ?? "Lieu non défini"}
            </p>
            <p className="mt-1 text-xs text-[#8b92a6] dark:text-[#a8afc6]">Dernière modification le {lastUpdatedLabel}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="primary"
              onClick={() => {
                if (!editing) {
                  setEditing(true);
                  return;
                }
                setSaveNonce((value) => value + 1);
              }}
            >
              <PencilLine size={16} />
              {editing ? "Enregistrer" : "Modifier"}
            </Button>
            <Button variant="secondary" onClick={() => setShareOpen(true)}>
              <Share2 size={16} />
              Partager
            </Button>
            <Button variant="secondary" onClick={() => navigate(`/briefings/${id}/export`)}>
              <FileDown size={16} />
              Générer PDF
            </Button>
          </div>
        </div>
      </Card>

      {editing ? (
        <BriefingEditor
          key={modulesQuery.data?.length ? `real-${briefingQuery.data.id}` : `seed-${briefingQuery.data.id}`}
          briefing={briefingQuery.data}
          modules={modules}
          registryModules={registryQuery.data}
          saveNonce={saveNonce}
        />
      ) : (
        <Card className="flex justify-center p-4">
          <A4Preview state={previewState} />
        </Card>
      )}

      <SharePanel
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        briefingId={briefingQuery.data.id}
        teams={Array.isArray((previewState.modules.metadata.data.teams ?? [])) ? previewState.modules.metadata.data.teams : []}
        onExportPdf={() => navigate(`/briefings/${id}/export`)}
      />

      {showInitOverlay ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-panel bg-white/65 backdrop-blur-sm dark:bg-[#090909]/60">
          <Card className="border-brand-500/30 px-5 py-3">
            <p className="text-sm font-semibold">Initialisation du briefing...</p>
            <p className="text-xs text-[#6f748a] dark:text-[#a8afc6]">L'interface est prête, les modules se chargent.</p>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
