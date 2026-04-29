import { MailInput } from "@/components/input/mail";
import { TelephoneInput } from "@/components/input/telephone";
import { TextInput } from "@/components/input/text";
import { ContactData } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "react-i18next";

export function ContactForm({ value, onChange }: { value: ContactData; onChange: (value: ContactData) => void }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {value.people.map((row, idx) => (
        <div key={idx} className="space-y-2 rounded border border-slate-200 p-2 dark:border-slate-700">
          <TextInput placeholder={t("editor.modules.contact.fields.name")} value={row.name} onChange={(e) => {
            const next = [...value.people];
            next[idx] = { ...row, name: e.target.value };
            onChange({ people: next });
          }} />
          <TextInput placeholder={t("editor.modules.contact.fields.role")} value={row.role} onChange={(e) => {
            const next = [...value.people];
            next[idx] = { ...row, role: e.target.value };
            onChange({ people: next });
          }} />
          <TelephoneInput placeholder={t("editor.modules.contact.fields.phone")} value={row.phone} onChange={(e) => {
            const next = [...value.people];
            next[idx] = { ...row, phone: e.target.value };
            onChange({ people: next });
          }} />
          <MailInput placeholder={t("editor.modules.contact.fields.email")} value={row.email} onChange={(e) => {
            const next = [...value.people];
            next[idx] = { ...row, email: e.target.value };
            onChange({ people: next });
          }} />
        </div>
      ))}
      <Button variant="secondary" onClick={() => onChange({ people: [...value.people, { name: "", role: "", phone: "", email: "" }] })}>{t("editor.modules.contact.addPerson")}</Button>
    </div>
  );
}
