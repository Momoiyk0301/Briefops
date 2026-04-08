import { NotesData } from "@/lib/types";
import { useTranslation } from "react-i18next";

export function NotesPreview({ value }: { value: NotesData }) {
  const { t } = useTranslation();

  return (
    <section className="mb-4">
      <h3 className="font-semibold">{t("editor.modules.notes.title")}</h3>
      <p className="mt-1 whitespace-pre-wrap text-sm">{value.text || "—"}</p>
    </section>
  );
}
