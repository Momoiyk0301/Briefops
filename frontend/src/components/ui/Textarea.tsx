import { TextareaHTMLAttributes, forwardRef } from "react";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className = "", ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={`w-full rounded-[22px] border border-[#dce3f1] bg-white/96 px-4 py-3 text-sm text-[#172033] shadow-[0_10px_28px_rgba(15,23,42,0.05)] outline-none transition placeholder:text-[#8c94a9] focus:border-brand-500 focus:ring-4 focus:ring-brand-500/12 dark:border-white/10 dark:bg-[#151515] dark:text-white dark:placeholder:text-[#7f869d] ${className}`}
        {...props}
      />
    );
  }
);
