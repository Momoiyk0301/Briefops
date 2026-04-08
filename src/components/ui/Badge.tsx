import { HTMLAttributes } from "react";

export function Badge({ className = "", ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-[#e4e8f3] bg-[#f5f7fc] px-2.5 py-1 text-xs font-semibold text-[#5e6985] dark:border-white/10 dark:bg-[#202020] dark:text-[#d5d5d5] ${className}`}
      {...props}
    />
  );
}
