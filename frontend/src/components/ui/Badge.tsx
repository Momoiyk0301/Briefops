import { HTMLAttributes } from "react";

export function Badge({ className = "", ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={`inline-flex items-center rounded-full border border-[#ececf5] bg-[#f4f5fb] px-2.5 py-1 text-xs font-medium text-[#555] dark:border-white/10 dark:bg-[#202020] dark:text-[#d5d5d5] ${className}`}
      {...props}
    />
  );
}
