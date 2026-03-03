import { MetadataExtra } from "@/lib/types";

type Props = {
  title: string;
  eventDate: string | null;
  location: string;
  metadata: MetadataExtra;
};

export function MetadataPreview({ title, eventDate, location, metadata }: Props) {
  return (
    <section className="mb-5 border-b border-slate-200 pb-4 dark:border-slate-700">
      <h1 className="text-2xl font-semibold">{title || "Untitled Briefing"}</h1>
      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{eventDate || "—"} · {location || "—"}</p>
      {(metadata.main_contact_name || metadata.main_contact_phone) && (
        <p className="mt-2 text-sm">Contact: {metadata.main_contact_name} {metadata.main_contact_phone}</p>
      )}
      {metadata.global_notes && <p className="mt-2 whitespace-pre-wrap text-sm">{metadata.global_notes}</p>}
    </section>
  );
}
