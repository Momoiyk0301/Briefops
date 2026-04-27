import { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/Card";

type Props = {
  step: "workspace" | "products" | "demo";
  demoIndex?: number;
  children: ReactNode;
};

function getStepLabel(step: Props["step"], demoIndex: number, t: (key: string) => string) {
  if (step === "workspace") return t("onboarding.steps.workspace");
  if (step === "products") return t("onboarding.steps.products");
  return `Step ${Math.min(5, 3 + demoIndex)}/5`;
}

export function OnboardingModal({ step, demoIndex = 0, children }: Props) {
  const { t } = useTranslation();

  return (
    <div className="mx-auto w-full max-w-6xl px-[var(--space-page-x)] py-[var(--space-page-y)]">
      <Card className="card-pad w-full">
        <p className="mb-4 text-xs font-semibold uppercase tracking-[0.14em] text-brand-600">{getStepLabel(step, demoIndex, t)}</p>
        {children}
      </Card>
    </div>
  );
}
