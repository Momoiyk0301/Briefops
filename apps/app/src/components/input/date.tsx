import { InputHTMLAttributes } from "react";
import { CalendarDays } from "lucide-react";

import { Input } from "@/components/ui/Input";

export function DateInput({ label, className = "", ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block space-y-1.5">
      {label ? <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span> : null}
      <div className="relative">
        <CalendarDays size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#6f748a] dark:text-[#a8afc6]" />
        <Input type="date" lang="fr-BE" className={`rounded-xl pl-10 ${className}`} {...props} />
      </div>
    </label>
  );
}
