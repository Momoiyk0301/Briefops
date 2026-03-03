import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { createBriefing, getBriefings, getMe, toApiMessage, upsertBriefingModules } from "@/lib/api";
import { moduleRegistry } from "@/lib/moduleRegistry";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function BriefingsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const briefingsQuery = useQuery({ queryKey: ["briefings"], queryFn: getBriefings });

  const createMutation = useMutation({
    mutationFn: async () => {
      const orgId = meQuery.data?.org?.id;
      if (!orgId) throw new Error("Organization missing");

      const briefing = await createBriefing({ org_id: orgId, title: "Untitled briefing" });

      await upsertBriefingModules(briefing.id, [
        { module_key: "metadata", enabled: true, data_json: moduleRegistry.metadata.defaultData },
        { module_key: "access", enabled: true, data_json: moduleRegistry.access.defaultData },
        { module_key: "delivery", enabled: false, data_json: moduleRegistry.delivery.defaultData },
        { module_key: "vehicle", enabled: false, data_json: moduleRegistry.vehicle.defaultData },
        { module_key: "equipment", enabled: false, data_json: moduleRegistry.equipment.defaultData },
        { module_key: "staff", enabled: false, data_json: moduleRegistry.staff.defaultData },
        { module_key: "notes", enabled: true, data_json: moduleRegistry.notes.defaultData },
        { module_key: "contact", enabled: false, data_json: moduleRegistry.contact.defaultData }
      ]);

      return briefing;
    },
    onSuccess: async (briefing) => {
      await queryClient.invalidateQueries({ queryKey: ["briefings"] });
      navigate(`/briefings/${briefing.id}`);
    },
    onError: (error) => toast.error(toApiMessage(error))
  });

  if (briefingsQuery.isLoading) return <p>{t("app.loading")}</p>;
  if (briefingsQuery.error) return <p>{toApiMessage(briefingsQuery.error)}</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t("briefings.title")}</h1>
        <Button onClick={() => createMutation.mutate()}>{t("briefings.new")}</Button>
      </div>

      <div className="space-y-3">
        {(briefingsQuery.data ?? []).length === 0 && <p>{t("briefings.empty")}</p>}
        {(briefingsQuery.data ?? []).map((briefing) => (
          <Card key={briefing.id} className="cursor-pointer" onClick={() => navigate(`/briefings/${briefing.id}`)}>
            <p className="font-medium">{briefing.title}</p>
            <p className="text-sm text-slate-500">{briefing.event_date ?? "—"} · {briefing.location_text ?? "—"}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
