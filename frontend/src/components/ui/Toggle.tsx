type Props = {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
};

export function Toggle({ checked, onChange, disabled, ariaLabel }: Props) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 rounded-full border transition ${
        checked
          ? "border-brand-500/30 bg-[linear-gradient(135deg,#1954c9_0%,#3b82f6_100%)] shadow-[0_10px_22px_rgba(32,78,185,0.24)]"
          : "border-[#d4dcec] bg-[#dbe2ef] dark:border-slate-700 dark:bg-slate-700"
      } disabled:opacity-60`}
    >
      <span
        className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow-[0_6px_18px_rgba(15,23,42,0.18)] transition ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}
