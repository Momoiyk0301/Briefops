export const queryKeys = {
  me: ["me"] as const,
  staff: ["staff"] as const,
  briefingsFallback: ["briefings", "fallback"] as const,
  briefing: (id: string) => ["briefing", id] as const,
  modules: (id: string) => ["modules", id] as const,
  modulesRegistry: ["modules", "registry"] as const
};
