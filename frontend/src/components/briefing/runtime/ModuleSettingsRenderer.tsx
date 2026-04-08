import { ModuleSettingDefinition } from "@/lib/types";
import { translateModuleSetting } from "@/lib/moduleRuntimeI18n";
import { useTranslation } from "react-i18next";

type Props = {
  settings: Record<string, unknown>;
  settingsSchema: ModuleSettingDefinition[];
  onChange: (nextSettings: Record<string, unknown>) => void;
};

export function ModuleSettingsRenderer({ settings, settingsSchema, onChange }: Props) {
  const { t } = useTranslation();

  if (!settingsSchema.length) return null;

  return (
    <div className="space-y-2 rounded-xl border border-[#e6e8f2] p-3 dark:border-white/10">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{t("editor.delivery.settings.title")}</p>
      <div className="space-y-2">
        {settingsSchema.map((setting) => {
          const translatedSetting = translateModuleSetting(setting, t);

          return (
          <label
            key={translatedSetting.key}
            className="flex items-start gap-3 rounded-2xl border border-slate-200/80 bg-white/80 px-3 py-2 text-sm dark:border-white/10 dark:bg-[#101010]"
          >
            <input
              type="checkbox"
              checked={Boolean(settings[translatedSetting.key])}
              onChange={(event) =>
                onChange({
                  ...settings,
                  [translatedSetting.key]: event.target.checked
                })
              }
            />
            <span>
              <span className="block font-medium text-[#172033] dark:text-white">{translatedSetting.label}</span>
              {translatedSetting.description ? (
                <span className="block text-xs text-[#6f748a] dark:text-[#a8afc6]">{translatedSetting.description}</span>
              ) : null}
            </span>
          </label>
        )})}
      </div>
    </div>
  );
}
