import { NotesData } from "@/lib/types";

export function NotesPreview({ value }: { value: NotesData }) {
  return (
    <section className="mb-4">
      <h3 className="font-semibold">Notes</h3>
      <p className="mt-1 whitespace-pre-wrap text-sm">{value.text || "—"}</p>
    </section>
  );
}
