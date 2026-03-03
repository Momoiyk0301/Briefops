import { DeliveryData } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function DeliveryForm({ value, onChange }: { value: DeliveryData; onChange: (value: DeliveryData) => void }) {
  return (
    <div className="space-y-3">
      {value.deliveries.map((row, idx) => (
        <div key={idx} className="space-y-2 rounded border border-slate-200 p-2 dark:border-slate-700">
          <Input placeholder="Time" value={row.time} onChange={(e) => {
            const next = [...value.deliveries];
            next[idx] = { ...row, time: e.target.value };
            onChange({ deliveries: next });
          }} />
          <Input placeholder="Place" value={row.place} onChange={(e) => {
            const next = [...value.deliveries];
            next[idx] = { ...row, place: e.target.value };
            onChange({ deliveries: next });
          }} />
          <Input placeholder="Contact" value={row.contact} onChange={(e) => {
            const next = [...value.deliveries];
            next[idx] = { ...row, contact: e.target.value };
            onChange({ deliveries: next });
          }} />
          <Input placeholder="Notes" value={row.notes} onChange={(e) => {
            const next = [...value.deliveries];
            next[idx] = { ...row, notes: e.target.value };
            onChange({ deliveries: next });
          }} />
        </div>
      ))}
      <Button variant="secondary" onClick={() => onChange({ deliveries: [...value.deliveries, { time: "", place: "", contact: "", notes: "" }] })}>Add delivery</Button>
    </div>
  );
}
