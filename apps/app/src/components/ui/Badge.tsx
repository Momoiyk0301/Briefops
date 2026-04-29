import { HTMLAttributes } from "react";

export function Badge({ className = "", ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-surface-line bg-surface-muted px-2.5 py-1 text-xs font-semibold text-ink-muted dark:border-white/10 dark:bg-[#202020] dark:text-[#d5d5d5] ${className}`}
      {...props}
    />
  );
}
