import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { moduleEntries } from "@/lib/moduleRegistry";
import { EditorState, ModuleKey } from "@/lib/types";
import { Input } from "@/components/ui/Input";
import { Toggle } from "@/components/ui/Toggle";

type Props = {
  state: EditorState;
  onToggle: (key: ModuleKey, enabled: boolean) => void;
};

export function ModuleList({ state, onToggle }: Props) {
  const { i18n } = useTranslation();
  const [search, setSearch] = useState("");

  const filteredModules = useMemo(() => {
    const q = search.trim().toLowerCase();
    return moduleEntries.filter((entry) => {
      if (entry.key === "metadata") return false;
      if (!q) return true;
      const label = entry.labels[i18n.language === "fr" ? "fr" : "en"].toLowerCase();
      const description = entry.description[i18n.language === "fr" ? "fr" : "en"].toLowerCase();
      return label.includes(q) || description.includes(q);
    });
  }, [i18n.language, search]);

  return (
    <div className="space-y-2">
      <Input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={i18n.language === "fr" ? "Rechercher un module..." : "Search module..."}
      />
      {filteredModules.map((entry) => {
        return (
          <div
            key={entry.key}
            className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition ${
              state.modules[entry.key].enabled
                ? "border-brand-500 bg-brand-500/5 dark:bg-brand-500/10"
                : "border-[#e8eaf3] dark:border-white/10"
            }`}
          >
            <div>
              <p className="text-sm font-medium">{entry.labels[i18n.language === "fr" ? "fr" : "en"]}</p>
              <p className="text-xs text-slate-500">{entry.description[i18n.language === "fr" ? "fr" : "en"]}</p>
            </div>
            <Toggle checked={state.modules[entry.key].enabled} onChange={(v) => onToggle(entry.key, v)} disabled={entry.isMandatory} />
          </div>
        );
      })}
    </div>
  );
}
