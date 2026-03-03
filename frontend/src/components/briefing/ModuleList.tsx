import { useTranslation } from "react-i18next";

import { moduleEntries } from "@/lib/moduleRegistry";
import { EditorState, ModuleKey } from "@/lib/types";
import { Toggle } from "@/components/ui/Toggle";

type Props = {
  state: EditorState;
  selected: Exclude<ModuleKey, "metadata">;
  onSelect: (key: Exclude<ModuleKey, "metadata">) => void;
  onToggle: (key: ModuleKey, enabled: boolean) => void;
};

export function ModuleList({ state, selected, onSelect, onToggle }: Props) {
  const { i18n } = useTranslation();

  return (
    <div className="space-y-2">
      {moduleEntries.map((entry) => {
        const isSelected = selected === entry.key;
        const isMetadata = entry.key === "metadata";
        const canSelect = !isMetadata;

        return (
          <button
            type="button"
            key={entry.key}
            onClick={() => {
              if (canSelect) onSelect(entry.key as Exclude<ModuleKey, "metadata">);
            }}
            className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left ${isSelected ? "border-brand-500" : "border-slate-200 dark:border-slate-700"}`}
          >
            <div>
              <p className="text-sm font-medium">{entry.labels[i18n.language === "fr" ? "fr" : "en"]}</p>
              <p className="text-xs text-slate-500">{entry.description[i18n.language === "fr" ? "fr" : "en"]}</p>
            </div>
            <Toggle checked={state.modules[entry.key].enabled} onChange={(v) => onToggle(entry.key, v)} disabled={entry.isMandatory} />
          </button>
        );
      })}
    </div>
  );
}
