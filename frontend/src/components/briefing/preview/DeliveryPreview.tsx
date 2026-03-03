import { DeliveryData } from "@/lib/types";

export function DeliveryPreview({ value }: { value: DeliveryData }) {
  return (
    <section className="mb-4">
      <h3 className="font-semibold">Delivery</h3>
      <div className="mt-1 space-y-2 text-sm">
        {value.deliveries.length === 0 ? <p>—</p> : value.deliveries.map((item, idx) => (
          <div key={idx} className="rounded border border-slate-200 p-2 dark:border-slate-700">
            <p>{item.time || "—"} · {item.place || "—"}</p>
            <p>{item.contact || "—"}</p>
            <p>{item.notes || "—"}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
