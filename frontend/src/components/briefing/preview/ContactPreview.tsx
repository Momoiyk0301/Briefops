import { ContactData } from "@/lib/types";

export function ContactPreview({ value }: { value: ContactData }) {
  return (
    <section className="mb-4">
      <h3 className="font-semibold">Contact</h3>
      <ul className="mt-1 space-y-1 text-sm">
        {value.people.length === 0 ? <li>—</li> : value.people.map((person, idx) => (
          <li key={idx}>{person.name || "—"} · {person.role || "—"} · {person.phone || "—"} · {person.email || "—"}</li>
        ))}
      </ul>
    </section>
  );
}
