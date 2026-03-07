import { InputHTMLAttributes } from "react";

import { Input } from "@/components/ui/Input";

export function DateInput({ label, className = "", ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block space-y-1.5">
      {label ? <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span> : null}
      <Input type="date" className={`rounded-xl ${className}`} {...props} />
    </label>
  );
}
