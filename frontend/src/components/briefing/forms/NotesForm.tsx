import { TextAreaInput } from "@/components/input/text";
import { NotesData } from "@/lib/types";

export function NotesForm({ value, onChange }: { value: NotesData; onChange: (value: NotesData) => void }) {
  return <TextAreaInput rows={8} value={value.text} onChange={(e) => onChange({ text: e.target.value })} placeholder="Notes" />;
}
