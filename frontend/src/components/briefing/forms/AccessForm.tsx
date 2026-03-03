import { AccessData } from "@/lib/types";
import { Input } from "@/components/ui/Input";

export function AccessForm({ value, onChange }: { value: AccessData; onChange: (value: AccessData) => void }) {
  return (
    <div className="space-y-2">
      <Input placeholder="Address" value={value.address} onChange={(e) => onChange({ ...value, address: e.target.value })} />
      <Input placeholder="Parking" value={value.parking} onChange={(e) => onChange({ ...value, parking: e.target.value })} />
      <Input placeholder="Entrance" value={value.entrance} onChange={(e) => onChange({ ...value, entrance: e.target.value })} />
      <Input
        placeholder="On-site contact"
        value={value.on_site_contact}
        onChange={(e) => onChange({ ...value, on_site_contact: e.target.value })}
      />
    </div>
  );
}
