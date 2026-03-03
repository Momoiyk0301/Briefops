import { StaffData } from "@/lib/types";

export function StaffPreview({ value }: { value: StaffData }) {
  return (
    <section className="mb-4">
      <h3 className="font-semibold">Staff</h3>
      <ul className="mt-1 space-y-1 text-sm">
        {value.roles.length === 0 ? <li>—</li> : value.roles.map((item, idx) => (
          <li key={idx}>{item.role || "—"}: {item.count || 0} ({item.notes || "—"})</li>
        ))}
      </ul>
    </section>
  );
}
