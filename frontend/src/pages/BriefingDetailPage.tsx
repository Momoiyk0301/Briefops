import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";

import { getBriefing, getBriefingModules, toApiMessage } from "@/lib/api";
import { BriefingEditor } from "@/components/briefing/BriefingEditor";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { moduleRegistry } from "@/lib/moduleRegistry";
import { BriefingModuleRow } from "@/lib/types";

export default function BriefingDetailPage() {
  const params = useParams<{ id: string }>();
  const location = useLocation();
  const id = params.id ?? "";
  const locationState = location.state as { initializingNewBriefing?: boolean } | null;
  const isInitializingNewBriefing = Boolean(locationState?.initializingNewBriefing);

  const briefingQuery = useQuery({ queryKey: ["briefing", id], queryFn: () => getBriefing(id), enabled: Boolean(id) });
  const modulesQuery = useQuery({ queryKey: ["modules", id], queryFn: () => getBriefingModules(id), enabled: Boolean(id) });
  const seededModules = useMemo<BriefingModuleRow[]>(() => {
    if (!briefingQuery.data) return [];
    const now = new Date().toISOString();
    return [
      { id: `seed-metadata-${briefingQuery.data.id}`, briefing_id: briefingQuery.data.id, module_key: "metadata", enabled: true, data_json: moduleRegistry.metadata.defaultData, created_at: now, updated_at: now },
      { id: `seed-access-${briefingQuery.data.id}`, briefing_id: briefingQuery.data.id, module_key: "access", enabled: true, data_json: moduleRegistry.access.defaultData, created_at: now, updated_at: now },
      { id: `seed-delivery-${briefingQuery.data.id}`, briefing_id: briefingQuery.data.id, module_key: "delivery", enabled: false, data_json: moduleRegistry.delivery.defaultData, created_at: now, updated_at: now },
      { id: `seed-vehicle-${briefingQuery.data.id}`, briefing_id: briefingQuery.data.id, module_key: "vehicle", enabled: false, data_json: moduleRegistry.vehicle.defaultData, created_at: now, updated_at: now },
      { id: `seed-equipment-${briefingQuery.data.id}`, briefing_id: briefingQuery.data.id, module_key: "equipment", enabled: false, data_json: moduleRegistry.equipment.defaultData, created_at: now, updated_at: now },
      { id: `seed-staff-${briefingQuery.data.id}`, briefing_id: briefingQuery.data.id, module_key: "staff", enabled: false, data_json: moduleRegistry.staff.defaultData, created_at: now, updated_at: now },
      { id: `seed-notes-${briefingQuery.data.id}`, briefing_id: briefingQuery.data.id, module_key: "notes", enabled: true, data_json: moduleRegistry.notes.defaultData, created_at: now, updated_at: now },
      { id: `seed-contact-${briefingQuery.data.id}`, briefing_id: briefingQuery.data.id, module_key: "contact", enabled: false, data_json: moduleRegistry.contact.defaultData, created_at: now, updated_at: now }
    ];
  }, [briefingQuery.data]);

  if (briefingQuery.isLoading || (modulesQuery.isLoading && !isInitializingNewBriefing)) {
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
  if (!briefingQuery.data) return <Card>Not found</Card>;

  const modules = modulesQuery.data ?? (isInitializingNewBriefing ? seededModules : null);
  if (!modules) return <Card>Not found</Card>;
  const showInitOverlay = isInitializingNewBriefing && (modulesQuery.isLoading || modulesQuery.isFetching);

  return (
    <div className="relative">
      <BriefingEditor
        key={modulesQuery.data?.length ? `real-${briefingQuery.data.id}` : `seed-${briefingQuery.data.id}`}
        briefing={briefingQuery.data}
        modules={modules}
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
