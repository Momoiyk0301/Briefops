import { MailInput } from "@/components/input/mail";
import { TelephoneInput } from "@/components/input/telephone";
import { TextInput } from "@/components/input/text";
import { ContactData } from "@/lib/types";
import { Button } from "@/components/ui/Button";

export function ContactForm({ value, onChange }: { value: ContactData; onChange: (value: ContactData) => void }) {
  return (
    <div className="space-y-3">
      {value.people.map((row, idx) => (
        <div key={idx} className="space-y-2 rounded border border-slate-200 p-2 dark:border-slate-700">
          <TextInput placeholder="Name" value={row.name} onChange={(e) => {
            const next = [...value.people];
            next[idx] = { ...row, name: e.target.value };
            onChange({ people: next });
          }} />
          <TextInput placeholder="Role" value={row.role} onChange={(e) => {
            const next = [...value.people];
            next[idx] = { ...row, role: e.target.value };
            onChange({ people: next });
          }} />
          <TelephoneInput placeholder="Phone" value={row.phone} onChange={(e) => {
            const next = [...value.people];
            next[idx] = { ...row, phone: e.target.value };
            onChange({ people: next });
          }} />
          <MailInput placeholder="Email" value={row.email} onChange={(e) => {
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
