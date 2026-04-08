import { ReactNode } from "react";

import { Card } from "@/components/ui/Card";

type Props = {
  step: "workspace" | "products" | "demo";
  demoIndex?: number;
  children: ReactNode;
};

function getStepLabel(step: Props["step"], demoIndex: number) {
  if (step === "workspace") return "Step 1/5";
  if (step === "products") return "Step 2/5";
  return `Step ${Math.min(5, 3 + demoIndex)}/5`;
}

export function OnboardingModal({ step, demoIndex = 0, children }: Props) {
  return (
    <div className="mx-auto w-full max-w-6xl px-[var(--space-page-x)] py-[var(--space-page-y)]">
      <Card className="card-pad w-full">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">{getStepLabel(step, demoIndex)}</p>
        {children}
      </Card>
    </div>
  );
}
