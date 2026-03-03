import { useQuery } from "@tanstack/react-query";
import { useParams } from "react-router-dom";

import { getBriefing, getBriefingModules, toApiMessage } from "@/lib/api";
import { BriefingEditor } from "@/components/briefing/BriefingEditor";

export default function BriefingDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id ?? "";

  const briefingQuery = useQuery({ queryKey: ["briefing", id], queryFn: () => getBriefing(id), enabled: Boolean(id) });
  const modulesQuery = useQuery({ queryKey: ["modules", id], queryFn: () => getBriefingModules(id), enabled: Boolean(id) });

  if (briefingQuery.isLoading || modulesQuery.isLoading) return <p>Loading...</p>;
  if (briefingQuery.error) return <p>{toApiMessage(briefingQuery.error)}</p>;
  if (modulesQuery.error) return <p>{toApiMessage(modulesQuery.error)}</p>;
  if (!briefingQuery.data || !modulesQuery.data) return <p>Not found</p>;

  return <BriefingEditor briefing={briefingQuery.data} modules={modulesQuery.data} />;
}
