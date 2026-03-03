import { ContactData } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function ContactForm({ value, onChange }: { value: ContactData; onChange: (value: ContactData) => void }) {
  return (
    <div className="space-y-3">
      {value.people.map((row, idx) => (
        <div key={idx} className="space-y-2 rounded border border-slate-200 p-2 dark:border-slate-700">
          <Input placeholder="Name" value={row.name} onChange={(e) => {
            const next = [...value.people];
            next[idx] = { ...row, name: e.target.value };
            onChange({ people: next });
          }} />
          <Input placeholder="Role" value={row.role} onChange={(e) => {
            const next = [...value.people];
            next[idx] = { ...row, role: e.target.value };
            onChange({ people: next });
          }} />
          <Input placeholder="Phone" value={row.phone} onChange={(e) => {
            const next = [...value.people];
            next[idx] = { ...row, phone: e.target.value };
            onChange({ people: next });
          }} />
          <Input placeholder="Email" value={row.email} onChange={(e) => {
            const next = [...value.people];
            next[idx] = { ...row, email: e.target.value };
            onChange({ people: next });
          }} />
        </div>
      ))}
      <Button variant="secondary" onClick={() => onChange({ people: [...value.people, { name: "", role: "", phone: "", email: "" }] })}>Add person</Button>
    </div>
  );
}
