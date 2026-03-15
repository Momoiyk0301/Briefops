import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export type ActionDropdownOption = {
  label: string;
  onSelect: () => void;
  description?: string;
  disabled?: boolean;
  icon?: ReactNode;
};

type Props = {
  label: string;
  onClick: () => void;
  options?: ActionDropdownOption[];
  disabled?: boolean;
  icon?: ReactNode;
  className?: string;
  menuAlign?: "left" | "right";
};

export function ActionDropdownButton({
  label,
  onClick,
  options = [],
  disabled = false,
  icon,
  className = "",
  menuAlign = "right"
}: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const hasMenu = options.length > 0;

  useEffect(() => {
    if (!open) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  const menuClassName = useMemo(
    () =>
      menuAlign === "left"
        ? "left-0 origin-top-left"
        : "right-0 origin-top-right",
    [menuAlign]
  );

  return (
    <div ref={rootRef} className={`relative inline-flex items-stretch ${className}`}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        className="inline-flex h-11 items-center justify-center gap-2 rounded-l-full border border-[#dde3f2] bg-white px-4 text-sm font-semibold text-[#172033] shadow-[0_10px_28px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:bg-[#f6f8fd] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-[#171717] dark:text-white dark:hover:bg-[#1f1f1f]"
      >
        {icon}
        <span>{label}</span>
      </button>
      {hasMenu ? (
        <>
          <button
            type="button"
            aria-label={`${label} options`}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            disabled={disabled}
            className="inline-flex h-11 w-11 items-center justify-center rounded-r-full border border-l-0 border-[#dde3f2] bg-white text-[#66708a] shadow-[0_10px_28px_rgba(15,23,42,0.08)] transition hover:-translate-y-0.5 hover:bg-[#f6f8fd] hover:text-[#172033] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-[#171717] dark:text-[#d2d7e5] dark:hover:bg-[#1f1f1f]"
          >
            <ChevronDown size={16} className={`transition ${open ? "rotate-180" : ""}`} />
          </button>
          {open ? (
            <div className={`absolute top-[calc(100%+10px)] z-30 min-w-[220px] rounded-[22px] border border-[#e1e7f2] bg-white p-2 shadow-[0_24px_60px_rgba(15,23,42,0.16)] dark:border-white/10 dark:bg-[#131313] ${menuClassName}`}>
              <div className="grid gap-1">
                {options.map((option) => (
                  <button
                    key={option.label}
                    type="button"
                    disabled={option.disabled}
                    onClick={() => {
                      setOpen(false);
                      option.onSelect();
                    }}
                    className="flex w-full items-start gap-3 rounded-[18px] px-3 py-2.5 text-left transition hover:bg-[#f4f7fc] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/40 disabled:cursor-not-allowed disabled:opacity-55 dark:hover:bg-white/5"
                  >
                    <span className="mt-0.5 text-[#6f7892] dark:text-[#b9c1d3]">{option.icon}</span>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-[#172033] dark:text-white">{option.label}</span>
                      {option.description ? (
                        <span className="mt-0.5 block text-xs text-[#6f7892] dark:text-[#9ba5bd]">{option.description}</span>
                      ) : null}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
