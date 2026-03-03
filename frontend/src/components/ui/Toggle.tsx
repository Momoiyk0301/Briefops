type Props = {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};

export function Toggle({ checked, onChange, disabled }: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-11 rounded-full transition ${checked ? "bg-brand-500" : "bg-slate-300 dark:bg-slate-700"}`}
    >
      <span
        className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition ${checked ? "translate-x-5" : "translate-x-0"}`}
      />
    </button>
  );
}
