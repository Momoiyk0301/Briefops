import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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

  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const briefingsQuery = useQuery({ queryKey: ["briefings"], queryFn: getBriefingsWithFallback });

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

  const briefings = briefingsQuery.data?.data ?? [];
  const isDemo = Boolean(briefingsQuery.data?.demo);

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
        <Button onClick={() => createMutation.mutate()} withArrow>{t("briefings.new")}</Button>
      </div>

      <div className="space-y-3">
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
