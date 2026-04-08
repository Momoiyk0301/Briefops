import { Check } from "lucide-react";

import { Badge } from "@/components/ui/Badge";

type Props = {
  label: string;
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  emptyText?: string;
};

export function MultiSelect({ label, options, value, onChange, disabled = false, emptyText = "No option" }: Props) {
  const toggle = (option: string) => {
    const exists = value.some((item) => item.toLowerCase() === option.toLowerCase());
    onChange(exists ? value.filter((item) => item.toLowerCase() !== option.toLowerCase()) : [...value, option]);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slate-600 dark:text-slate-300">{label}</span>
        {value.length > 0 ? (
          value.map((item) => (
            <Badge key={item} className="border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-500/20 dark:bg-brand-900/20 dark:text-brand-300">
              {item}
            </Badge>
          ))
        ) : (
          <p className="text-sm text-slate-500">{emptyText}</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value.some((item) => item.toLowerCase() === option.toLowerCase());
          return (
            <button
              key={option}
              type="button"
              disabled={disabled}
              onClick={() => toggle(option)}
              className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-60 ${
                selected
                  ? "border-brand-400 bg-brand-50 text-brand-700 dark:border-brand-500/40 dark:bg-brand-900/20 dark:text-brand-300"
                  : "border-[#d9dcea] bg-white text-slate-600 hover:bg-[#f4f7fc] dark:border-white/10 dark:bg-[#101010] dark:text-slate-300 dark:hover:bg-[#1a1a1a]"
              }`}
            >
              <Check size={14} className={selected ? "opacity-100" : "opacity-30"} />
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
