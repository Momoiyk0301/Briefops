import { AccessData } from "@/lib/types";

export function AccessPreview({ value }: { value: AccessData }) {
  return (
    <section className="mb-4">
      <h3 className="font-semibold">Access</h3>
      <ul className="mt-1 space-y-1 text-sm">
        <li>Address: {value.address || "—"}</li>
        <li>Parking: {value.parking || "—"}</li>
        <li>Entrance: {value.entrance || "—"}</li>
        <li>On-site contact: {value.on_site_contact || "—"}</li>
      </ul>
    </section>
  );
}
