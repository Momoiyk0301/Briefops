import { ReactNode } from "react";

import { Button } from "@/components/ui/Button";

type Props = {
  icon: ReactNode;
  title: string;
  description: string;
  ctaLabel: string;
  onCta?: () => void;
};

export function EmptyState({ icon, title, description, ctaLabel, onCta }: Props) {
  return (
    <div className="empty-state">
      <div>
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[20px] bg-brand-500/12 text-brand-600 dark:text-brand-300">
          {icon}
        </div>
        <p className="text-lg font-semibold">{title}</p>
        <p className="mt-2 max-w-md text-sm text-[#6f748a] dark:text-[#a8afc6]">{description}</p>
        <div className="mt-5">
          <Button onClick={onCta}>{ctaLabel}</Button>
        </div>
      </div>
    </div>
  );
}
