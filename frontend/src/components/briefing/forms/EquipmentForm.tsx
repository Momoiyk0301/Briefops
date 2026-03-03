import { EquipmentData } from "@/lib/types";
import { Textarea } from "@/components/ui/Textarea";

export function EquipmentForm({ value, onChange }: { value: EquipmentData; onChange: (value: EquipmentData) => void }) {
  return <Textarea rows={6} value={value.items_text} onChange={(e) => onChange({ items_text: e.target.value })} placeholder="One item per line" />;
}
