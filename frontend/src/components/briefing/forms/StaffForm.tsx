import { StaffData } from "@/lib/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

export function StaffForm({ value, onChange }: { value: StaffData; onChange: (value: StaffData) => void }) {
  return (
    <div className="space-y-3">
      {value.roles.map((row, idx) => (
        <div key={idx} className="space-y-2 rounded border border-slate-200 p-2 dark:border-slate-700">
          <Input placeholder="Role" value={row.role} onChange={(e) => {
            const next = [...value.roles];
            next[idx] = { ...row, role: e.target.value };
            onChange({ roles: next });
          }} />
          <Input type="number" placeholder="Count" value={String(row.count)} onChange={(e) => {
            const next = [...value.roles];
            next[idx] = { ...row, count: Number(e.target.value || 0) };
            onChange({ roles: next });
          }} />
          <Input placeholder="Notes" value={row.notes} onChange={(e) => {
            const next = [...value.roles];
            next[idx] = { ...row, notes: e.target.value };
            onChange({ roles: next });
          }} />
        </div>
      ))}
      <Button variant="secondary" onClick={() => onChange({ roles: [...value.roles, { role: "", count: 1, notes: "" }] })}>Add role</Button>
    </div>
  );
}
