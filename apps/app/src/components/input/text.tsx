import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

type BaseProps = {
  label?: string;
};

export function TextInput({ label, className = "", ...props }: BaseProps & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block space-y-1.5">
      {label ? <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span> : null}
      <Input className={`rounded-xl ${className}`} {...props} />
    </label>
  );
}

export function TextAreaInput({ label, className = "", ...props }: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <label className="block space-y-1.5">
      {label ? <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span> : null}
      <Textarea className={`rounded-xl ${className}`} {...props} />
    </label>
  );
}
