import { HTMLAttributes } from "react";

export function Card({ className = "", ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`rounded-panel border border-[#eeeeee] bg-white p-5 shadow-panel dark:border-white/10 dark:bg-[#121212] ${className}`}
      {...props}
    />
  );
}
