import { ButtonHTMLAttributes } from "react";
import { ArrowRight } from "lucide-react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  withArrow?: boolean;
};

export function Button({ className = "", variant = "primary", withArrow = false, children, ...props }: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/50";
  const styles = {
    primary: "bg-brand-500 text-white shadow-panel hover:-translate-y-0.5 hover:bg-brand-600",
    secondary:
      "border border-[#e7e8ef] bg-white text-[#111111] hover:bg-[#f3f4fa] dark:border-white/10 dark:bg-[#171717] dark:text-white dark:hover:bg-[#1f1f1f]",
    ghost: "bg-transparent text-[#666] hover:bg-white/80 hover:text-[#111] dark:text-[#cfcfcf] dark:hover:bg-white/10"
  };

  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
      {withArrow ? <ArrowRight size={16} /> : null}
    </button>
  );
}
