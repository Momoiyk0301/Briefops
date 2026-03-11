import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Boxes, Store } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { getRegistryModules, toApiMessage, updateRegistryModuleEnabled } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/SearchInput";
import { Toggle } from "@/components/ui/Toggle";

export default function ModulesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const modulesQuery = useQuery({ queryKey: queryKeys.modulesRegistry, queryFn: getRegistryModules });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => updateRegistryModuleEnabled(id, enabled),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.modulesRegistry });
    },
    onError: (error) => toast.error(toApiMessage(error))
  });

  const filteredModules = useMemo(() => {
    const modules = modulesQuery.data ?? [];
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return modules;
    return modules.filter((module) =>
      [module.name, module.category, module.type].join(" ").toLowerCase().includes(normalizedSearch)
    );
  }, [modulesQuery.data, search]);

  if (modulesQuery.isLoading) return <Card>{t("app.loading")}</Card>;
  if (modulesQuery.error) return <Card>{toApiMessage(modulesQuery.error)}</Card>;

  return (
    <div className="stack-page">
      <Card className="page-hero card-pad">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="section-kicker">{t("modulesPage.kicker")}</p>
            <h1 className="section-title mt-3">{t("modulesPage.title")}</h1>
            <p className="section-copy mt-3">{t("modulesPage.subtitle")}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder={t("modulesPage.searchPlaceholder")}
              className="w-full sm:w-[300px]"
            />
            <Button variant="secondary" onClick={() => toast(t("modulesPage.marketplaceSoon"))}>
              <Store size={16} />
              {t("modulesPage.marketplace")}
            </Button>
          </div>
        </div>
      </Card>

      <div className="cards-grid-3">
        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b849d]">{t("modulesPage.active")}</p>
          <p className="mt-2 text-3xl font-bold">{filteredModules.filter((item) => item.enabled).length}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b849d]">{t("modulesPage.available")}</p>
          <p className="mt-2 text-3xl font-bold">{filteredModules.length}</p>
        </Card>
        <Card>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#7b849d]">{t("modulesPage.marketplace")}</p>
          <p className="mt-2 text-3xl font-bold">{t("modulesPage.soon")}</p>
          <p className="mt-2 text-sm text-[#6f748a] dark:text-[#a8afc6]">{t("modulesPage.soonHint")}</p>
        </Card>
      </div>

      <Card className="list-surface space-y-3">
        {filteredModules.length === 0 ? (
          <EmptyState
            icon={<Boxes size={22} />}
            title={t("modulesPage.emptyTitle")}
            description={t("modulesPage.emptyHint")}
            ctaLabel={t("modulesPage.marketplace")}
            onCta={() => toast(t("modulesPage.marketplaceSoon"))}
          />
        ) : null}
        {filteredModules.map((module) => (
          <div
            key={module.id}
            className="flex items-center justify-between rounded-[24px] border border-[#e8eaf3] bg-white/90 px-4 py-4 dark:border-white/10"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-[16px] bg-brand-500/10 text-brand-600 dark:text-brand-300">
                <Boxes size={16} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{module.name}</p>
                <p className="truncate text-xs text-[#6f748a] dark:text-[#a8afc6]">
                  {module.category} · {module.type} · v{module.version}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-xs font-semibold ${module.enabled ? "text-emerald-600 dark:text-emerald-300" : "text-[#7b849d] dark:text-[#a8afc6]"}`}>
                {module.enabled ? t("modulesPage.enabled") : t("modulesPage.disabled")}
              </span>
              <Toggle
                checked={module.enabled}
                onChange={(enabled) => toggleMutation.mutate({ id: module.id, enabled })}
                disabled={toggleMutation.isPending}
              />
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}
