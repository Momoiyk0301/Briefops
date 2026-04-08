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
      <div className="mb-5 inline-flex rounded-full bg-[#f0f1f8] p-1 dark:bg-[#222]">
        {tabs.map((tab) => (
          <button
            type="button"
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`rounded-full px-4 py-2 text-sm transition ${
              active === tab.key
                ? "bg-brand-500 text-white shadow-panel"
                : "text-[#666] hover:text-[#111] dark:text-[#bbb] dark:hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}
