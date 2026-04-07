import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";

import { getBriefing, getBriefingModules, getRegistryModules, toApiMessage } from "@/lib/api";
import { BriefingEditor } from "@/components/briefing/BriefingEditor";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { BriefingModuleRow } from "@/lib/types";

export default function BriefingDetailPage() {
  const params = useParams<{ id: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const id = params.id ?? "";
  const locationState = location.state as { initializingNewBriefing?: boolean } | null;
  const isInitializingNewBriefing = Boolean(locationState?.initializingNewBriefing);

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
      settings: mod.default_settings ?? {},
      values: mod.default_data,
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
        settings: mod.default_settings ?? {},
        data: mod.default_data
      },
      created_at: now,
      updated_at: now
    }));
  }, [briefingQuery.data, registryQuery.data]);

  if (briefingQuery.isLoading || registryQuery.isLoading || (modulesQuery.isLoading && !isInitializingNewBriefing)) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-64" />
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

  return (
    <div className="relative">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="secondary" onClick={() => navigate(-1)}>Retour</Button>
        <div className="text-right">
          <p className="text-xs uppercase tracking-[0.18em] text-[#7b849d]">Briefing</p>
          <p className="text-sm font-medium text-[#111827] dark:text-white">
            {briefingQuery.data.title?.trim() || "Untitled briefing"}
          </p>
        </div>
      </div>

      <BriefingEditor
        key={modulesQuery.data?.length ? `real-${briefingQuery.data.id}` : `seed-${briefingQuery.data.id}`}
        briefing={briefingQuery.data}
        modules={modules}
        registryModules={registryQuery.data}
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
