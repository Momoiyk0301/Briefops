import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Boxes } from "lucide-react";
import toast from "react-hot-toast";

import { getRegistryModules, toApiMessage, updateRegistryModuleEnabled } from "@/lib/api";
import { queryKeys } from "@/lib/queryKeys";
import { Card } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";

export default function ModulesPage() {
  const queryClient = useQueryClient();
  const modulesQuery = useQuery({ queryKey: queryKeys.modulesRegistry, queryFn: getRegistryModules });

  const toggleMutation = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: boolean }) => updateRegistryModuleEnabled(id, enabled),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.modulesRegistry });
    },
    onError: (error) => toast.error(toApiMessage(error))
  });

  if (modulesQuery.isLoading) return <Card>Loading modules...</Card>;
  if (modulesQuery.error) return <Card>{toApiMessage(modulesQuery.error)}</Card>;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Modules</h1>
        <p className="text-sm text-[#6f748a] dark:text-[#a8afc6]">
          Registry global des modules (base marketplace).
        </p>
      </div>

      <Card className="space-y-2">
        {modulesQuery.data?.map((module) => (
          <div
            key={module.id}
            className="flex items-center justify-between rounded-lg border border-[#e8eaf3] px-3 py-2 dark:border-white/10"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-brand-500/10 text-brand-600 dark:text-brand-300">
                <Boxes size={16} />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{module.name}</p>
                <p className="truncate text-xs text-[#6f748a] dark:text-[#a8afc6]">
                  {module.category} · {module.type} · v{module.version}
                </p>
              </div>
            </div>

            <Toggle
              checked={module.enabled}
              onChange={(enabled) => toggleMutation.mutate({ id: module.id, enabled })}
              disabled={toggleMutation.isPending}
            />
          </div>
        ))}
      </Card>
    </div>
  );
}
