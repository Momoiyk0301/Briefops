import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import { moduleEntries } from "@/lib/moduleRegistry";
import { EditorState, ModuleAudience, ModuleKey, ModuleLayout } from "@/lib/types";
import { Input } from "@/components/ui/Input";
import { Toggle } from "@/components/ui/Toggle";

type Props = {
  state: EditorState;
  onToggle: (key: ModuleKey, enabled: boolean) => void;
  onLayoutChange: (key: ModuleKey, layout: ModuleLayout) => void;
  onAudienceChange: (key: ModuleKey, audience: ModuleAudience) => void;
};

export function ModuleList({ state, onToggle, onLayoutChange, onAudienceChange }: Props) {
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
        const module = state.modules[entry.key];
        const visibility = module.audience.visibility;
        return (
          <div
            key={entry.key}
            className={`space-y-3 rounded-lg border px-3 py-2 transition ${
              module.enabled
                ? "border-brand-500 bg-brand-500/5 dark:bg-brand-500/10"
                : "border-[#e8eaf3] dark:border-white/10"
            }`}
          >
            <div className="flex w-full items-center justify-between text-left">
              <div>
                <p className="text-sm font-medium">{entry.labels[i18n.language === "fr" ? "fr" : "en"]}</p>
                <p className="text-xs text-slate-500">{entry.description[i18n.language === "fr" ? "fr" : "en"]}</p>
              </div>
              <Toggle checked={module.enabled} onChange={(v) => onToggle(entry.key, v)} disabled={entry.isMandatory} />
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <label className="space-y-1">
                <span>X</span>
                <Input
                  value={String(module.layout.desktop.x)}
                  onChange={(event) =>
                    onLayoutChange(entry.key, {
                      ...module.layout,
                      desktop: { ...module.layout.desktop, x: Number(event.target.value || 0) }
                    })
                  }
                />
              </label>
              <label className="space-y-1">
                <span>Y</span>
                <Input
                  value={String(module.layout.desktop.y)}
                  onChange={(event) =>
                    onLayoutChange(entry.key, {
                      ...module.layout,
                      desktop: { ...module.layout.desktop, y: Number(event.target.value || 0) }
                    })
                  }
                />
              </label>
              <label className="space-y-1">
                <span>W</span>
                <Input
                  value={String(module.layout.desktop.w)}
                  onChange={(event) =>
                    onLayoutChange(entry.key, {
                      ...module.layout,
                      desktop: { ...module.layout.desktop, w: Number(event.target.value || 0) }
                    })
                  }
                />
              </label>
              <label className="space-y-1">
                <span>H</span>
                <Input
                  value={String(module.layout.desktop.h)}
                  onChange={(event) =>
                    onLayoutChange(entry.key, {
                      ...module.layout,
                      desktop: { ...module.layout.desktop, h: Number(event.target.value || 0) }
                    })
                  }
                />
              </label>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                className={`rounded-md border px-2 py-1 ${visibility === "visible" ? "border-brand-500" : "border-[#e8eaf3] dark:border-white/10"}`}
                onClick={() => onAudienceChange(entry.key, { ...module.audience, visibility: "visible" })}
              >
                Visible
              </button>
              <button
                type="button"
                className={`rounded-md border px-2 py-1 ${visibility === "hidden" ? "border-brand-500" : "border-[#e8eaf3] dark:border-white/10"}`}
                onClick={() => onAudienceChange(entry.key, { ...module.audience, visibility: "hidden" })}
              >
                Hidden
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
