import { TextareaHTMLAttributes, forwardRef } from "react";

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className = "", ...props }, ref) {
    return (
      <textarea
        ref={ref}
        className={`w-full rounded-2xl border border-[#e6e8f2] bg-white px-4 py-2.5 text-sm text-[#111] outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 dark:border-white/10 dark:bg-[#151515] dark:text-white ${className}`}
        {...props}
      />
    );
  }
);
