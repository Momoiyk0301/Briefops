import { TextAreaInput } from "@/components/input/text";
import { NotesData } from "@/lib/types";
import { useTranslation } from "react-i18next";

export function NotesForm({ value, onChange }: { value: NotesData; onChange: (value: NotesData) => void }) {
  const { t } = useTranslation();

  return <TextAreaInput rows={8} value={value.text} onChange={(e) => onChange({ text: e.target.value })} placeholder={t("editor.modules.notes.placeholder")} />;
}
