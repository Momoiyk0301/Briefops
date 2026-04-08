import { TextAreaInput } from "@/components/input/text";
import { EquipmentData } from "@/lib/types";
import { useTranslation } from "react-i18next";

export function EquipmentForm({ value, onChange }: { value: EquipmentData; onChange: (value: EquipmentData) => void }) {
  const { t } = useTranslation();

  return <TextAreaInput rows={6} value={value.items_text} onChange={(e) => onChange({ items_text: e.target.value })} placeholder={t("editor.modules.equipment.placeholder")} />;
}
