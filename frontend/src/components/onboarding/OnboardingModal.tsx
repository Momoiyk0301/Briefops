import { ReactNode } from "react";

import { Card } from "@/components/ui/Card";

type Props = {
  step: "workspace" | "products" | "demo";
  children: ReactNode;
};

const STEP_LABELS: Record<Props["step"], string> = {
  workspace: "Step 1/3",
  products: "Step 2/3",
  demo: "Step 3/3"
};

export function OnboardingModal({ step, children }: Props) {
  return (
    <div className="mx-auto w-full max-w-6xl px-[var(--space-page-x)] py-[var(--space-page-y)]">
      <Card className="card-pad w-full">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">{STEP_LABELS[step]}</p>
        {children}
      </Card>
    </div>
  );
}
