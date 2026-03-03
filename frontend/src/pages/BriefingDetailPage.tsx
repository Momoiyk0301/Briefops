import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { getBriefing, getBriefingModules, toApiMessage } from "@/lib/api";
import { BriefingEditor } from "@/components/briefing/BriefingEditor";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";

export default function BriefingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";

  const briefingQuery = useQuery({ queryKey: ["briefing", id], queryFn: () => getBriefing(id), enabled: Boolean(id) });
  const modulesQuery = useQuery({ queryKey: ["modules", id], queryFn: () => getBriefingModules(id), enabled: Boolean(id) });

  if (briefingQuery.isLoading || modulesQuery.isLoading) {
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
  if (!briefingQuery.data || !modulesQuery.data) return <Card>Not found</Card>;

  return <BriefingEditor briefing={briefingQuery.data} modules={modulesQuery.data} />;
}
