import { TextAreaInput } from "@/components/input/text";
import { EquipmentData } from "@/lib/types";

export function EquipmentForm({ value, onChange }: { value: EquipmentData; onChange: (value: EquipmentData) => void }) {
  return <TextAreaInput rows={6} value={value.items_text} onChange={(e) => onChange({ items_text: e.target.value })} placeholder="One item per line" />;
}
