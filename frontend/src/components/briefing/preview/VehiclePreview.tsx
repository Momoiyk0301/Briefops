import { VehicleData } from "@/lib/types";

export function VehiclePreview({ value }: { value: VehicleData }) {
  return (
    <section className="mb-4">
      <h3 className="font-semibold">Vehicle</h3>
      <div className="mt-1 space-y-2 text-sm">
        {value.vehicles.length === 0 ? <p>—</p> : value.vehicles.map((item, idx) => (
          <div key={idx} className="rounded border border-slate-200 p-2 dark:border-slate-700">
            <p>{item.type || "—"} · {item.plate || "—"}</p>
            <p>Pickup: {item.pickup_address || "—"} ({item.pickup_time || "—"})</p>
            <p>Return: {item.return_address || "—"}</p>
            <p>{item.notes || "—"}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
