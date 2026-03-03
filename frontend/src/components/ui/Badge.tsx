import { HTMLAttributes } from "react";

export function Badge({ className = "", ...props }: HTMLAttributes<HTMLSpanElement>) {
  return <span className={`rounded-full bg-slate-200 px-2 py-1 text-xs dark:bg-slate-700 ${className}`} {...props} />;
}
