import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { moduleEntries } from "@/lib/moduleRegistry";
import { EditorState, ModuleKey } from "@/lib/types";
import { Input } from "@/components/ui/Input";
import { Toggle } from "@/components/ui/Toggle";

type Props = {
  state: EditorState;
  selected: Exclude<ModuleKey, "metadata">;
  onSelect: (key: Exclude<ModuleKey, "metadata">) => void;
  onToggle: (key: ModuleKey, enabled: boolean) => void;
};

export function ModuleList({ state, selected, onSelect, onToggle }: Props) {
  const { i18n } = useTranslation();
  const [search, setSearch] = useState("");

  const isSelectableModule = (key: ModuleKey): key is Exclude<ModuleKey, "metadata"> => key !== "metadata";

  const filteredModules = useMemo(() => {
    const q = search.trim().toLowerCase();
    return moduleEntries.filter((entry) => {
      if (!isSelectableModule(entry.key)) return false;
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
        placeholder={i18n.language === "fr" ? "Rechercher un module" : "Search a module"}
      />
      {filteredModules.map((entry) => {
        const module = state.modules[entry.key];
        const isSelected = selected === entry.key;

        return (
          <div
            role="button"
            tabIndex={0}
            key={entry.key}
            onClick={() => onSelect(entry.key as Exclude<ModuleKey, "metadata">)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(entry.key as Exclude<ModuleKey, "metadata">);
              }
            }}
            className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left transition ${
              isSelected
                ? "border-brand-500 bg-brand-500/10"
                : module.enabled
                  ? "border-brand-500/40 bg-brand-500/5"
                  : "border-[#e8eaf3] dark:border-white/10"
            }`}
          >
            <div className="min-w-0">
              <p className="text-sm font-medium">{entry.labels[i18n.language === "fr" ? "fr" : "en"]}</p>
              <p className="truncate text-xs text-slate-500">{entry.description[i18n.language === "fr" ? "fr" : "en"]}</p>
            </div>
            <div onClick={(event) => event.stopPropagation()}>
              <Toggle checked={module.enabled} onChange={(v) => onToggle(entry.key, v)} disabled={entry.isMandatory} />
            </div>
          </div>
        );
      })}
    </div>
  );
}
