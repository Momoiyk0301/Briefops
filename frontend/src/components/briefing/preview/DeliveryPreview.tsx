import { DeliveryData } from "@/lib/types";

export function DeliveryPreview({ value }: { value: DeliveryData }) {
  return (
    <section className="mb-4">
      <h3 className="font-semibold">Delivery</h3>
      <div className="mt-1 space-y-2 text-sm">
        {value.deliveries.length === 0 ? <p>—</p> : value.deliveries.map((item, idx) => (
          <div key={idx} className="rounded border border-slate-200 p-2 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <p>{item.time || "—"} · {item.place || "—"}</p>
              {item.tag_mode ? (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">
                  {item.tag_mode === "custom" ? item.custom_tag || "Custom" : item.tag_mode}
                </span>
              ) : null}
            </div>
            <p>{item.contact || "—"}</p>
            <p>{item.notes || "—"}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
