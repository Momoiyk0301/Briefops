import { NotesData } from "@/lib/types";
import { useTranslation } from "react-i18next";

export function NotesModulePreview({ value }: { value: NotesData }) {
  const { t } = useTranslation();

  return (
    <section className="mb-4">
      <h3 className="font-semibold">{t("editor.modules.notes.title")}</h3>
      <div className="mt-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm shadow-sm dark:border-slate-700 dark:bg-[#101010]">
        <p className="whitespace-pre-wrap text-[#172033] dark:text-white">{value.text || "—"}</p>
      </div>
    </section>
  );
}

