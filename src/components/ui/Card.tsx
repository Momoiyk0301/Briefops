import { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-[30px] border border-surface-line bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(246,248,253,0.94)_100%)] p-5 shadow-[0_22px_60px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#121212] ${className}`}
      {...props}
    />
  );
}
