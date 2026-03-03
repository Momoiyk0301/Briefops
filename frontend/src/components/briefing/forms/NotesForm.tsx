import { NotesData } from "@/lib/types";
import { Textarea } from "@/components/ui/Textarea";

export function NotesForm({ value, onChange }: { value: NotesData; onChange: (value: NotesData) => void }) {
  return <Textarea rows={8} value={value.text} onChange={(e) => onChange({ text: e.target.value })} placeholder="Notes" />;
}
