import { TextAreaInput, TextInput } from "@/components/input/text";
import { TimeInput } from "@/components/input/time";
import { VehicleData } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export function VehicleForm({ value, onChange }: { value: VehicleData; onChange: (value: VehicleData) => void }) {
  return (
    <div className="space-y-3">
      {value.vehicles.map((row, idx) => (
        <div key={idx} className="space-y-2 rounded border border-slate-200 p-2 dark:border-slate-700">
          <TextInput placeholder="Type" value={row.type} onChange={(e) => {
            const next = [...value.vehicles];
            next[idx] = { ...row, type: e.target.value };
            onChange({ vehicles: next });
          }} />
          <TextInput placeholder="Plate" value={row.plate} onChange={(e) => {
            const next = [...value.vehicles];
            next[idx] = { ...row, plate: e.target.value };
            onChange({ vehicles: next });
          }} />
          <TextInput placeholder="Pickup address" value={row.pickup_address} onChange={(e) => {
            const next = [...value.vehicles];
            next[idx] = { ...row, pickup_address: e.target.value };
            onChange({ vehicles: next });
          }} />
          <TimeInput placeholder="Pickup time" value={row.pickup_time} onChange={(e) => {
            const next = [...value.vehicles];
            next[idx] = { ...row, pickup_time: e.target.value };
            onChange({ vehicles: next });
          }} />
          <TextInput placeholder="Return address" value={row.return_address} onChange={(e) => {
            const next = [...value.vehicles];
            next[idx] = { ...row, return_address: e.target.value };
            onChange({ vehicles: next });
          }} />
          <TextAreaInput rows={2} placeholder="Notes" value={row.notes} onChange={(e) => {
            const next = [...value.vehicles];
            next[idx] = { ...row, notes: e.target.value };
            onChange({ vehicles: next });
          }} />
        </div>
      ))}
      <Button variant="secondary" onClick={() => onChange({ vehicles: [...value.vehicles, { type: "", plate: "", pickup_address: "", pickup_time: "", return_address: "", notes: "" }] })}>Add vehicle</Button>
    </div>
  );
}
