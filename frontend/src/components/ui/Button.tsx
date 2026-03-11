import { ButtonHTMLAttributes } from "react";
import { ArrowRight } from "lucide-react";

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  withArrow?: boolean;
};

export function Button({ className = "", variant = "primary", withArrow = false, children, ...props }: Props) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold tracking-[0.01em] transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40";
  const styles = {
    primary:
      "bg-[linear-gradient(135deg,#1954c9_0%,#2870ff_55%,#55a4ff_100%)] text-white shadow-[0_18px_40px_rgba(32,78,185,0.28)] hover:-translate-y-0.5 hover:shadow-[0_24px_48px_rgba(32,78,185,0.34)]",
    secondary:
      "border border-[#dde3f2] bg-white text-[#172033] shadow-[0_8px_24px_rgba(15,23,42,0.06)] hover:-translate-y-0.5 hover:bg-[#f6f8fd] dark:border-white/10 dark:bg-[#171717] dark:text-white dark:hover:bg-[#1f1f1f]",
    ghost:
      "bg-transparent text-[#66708a] hover:bg-white/80 hover:text-[#111827] dark:text-[#cfcfcf] dark:hover:bg-white/10"
  };

  return (
    <button className={`${base} ${styles[variant]} ${className}`} {...props}>
      {children}
      {withArrow ? <ArrowRight size={16} /> : null}
    </button>
  );
}
