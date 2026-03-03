import { ReactNode } from "react";

type Tab = {
  key: string;
  label: string;
};

type Props = {
  tabs: Tab[];
  active: string;
  onChange: (key: string) => void;
  children: ReactNode;
};

export function Tabs({ tabs, active, onChange, children }: Props) {
  return (
    <div>
      <div className="mb-4 flex gap-2">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`rounded-lg px-3 py-2 text-sm ${active === tab.key ? "bg-brand-500 text-white" : "bg-slate-200 dark:bg-slate-800"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}
