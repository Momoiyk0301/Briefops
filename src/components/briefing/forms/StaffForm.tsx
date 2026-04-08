import { NumberInput } from "@/components/input/number";
import { TextAreaInput, TextInput } from "@/components/input/text";
import { StaffData } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { useTranslation } from "react-i18next";

export function StaffForm({ value, onChange }: { value: StaffData; onChange: (value: StaffData) => void }) {
  const { t } = useTranslation();

  return (
    <div className="space-y-3">
      {value.roles.map((row, idx) => (
        <div key={idx} className="space-y-2 rounded border border-slate-200 p-2 dark:border-slate-700">
          <TextInput placeholder={t("editor.modules.staff.fields.role")} value={row.role} onChange={(e) => {
            const next = [...value.roles];
            next[idx] = { ...row, role: e.target.value };
            onChange({ roles: next });
          }} />
          <NumberInput placeholder={t("editor.modules.staff.fields.count")} value={String(row.count)} onChange={(e) => {
            const next = [...value.roles];
            next[idx] = { ...row, count: Number(e.target.value || 0) };
            onChange({ roles: next });
          }} />
          <TextAreaInput rows={2} placeholder={t("editor.modules.staff.fields.notes")} value={row.notes} onChange={(e) => {
            const next = [...value.roles];
            next[idx] = { ...row, notes: e.target.value };
            onChange({ roles: next });
          }} />
        </div>
      ))}
      <Button variant="secondary" onClick={() => onChange({ roles: [...value.roles, { role: "", count: 1, notes: "" }] })}>{t("editor.modules.staff.addRole")}</Button>
    </div>
  );
}
