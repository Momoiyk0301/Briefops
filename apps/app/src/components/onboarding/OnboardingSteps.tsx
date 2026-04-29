import { DemoStep } from "@/components/onboarding/steps/DemoStep";
import { ProductsStep } from "@/components/onboarding/steps/ProductsStep";
import { WorkspaceStep } from "@/components/onboarding/steps/WorkspaceStep";
import type { Product } from "@/lib/types";

export type OnboardingStepKey = "workspace" | "products" | "demo";

type Props = {
  step: OnboardingStepKey;
  workspaceName?: string;
  products: Product[];
  productsLoading: boolean;
  submittingWorkspace: boolean;
  submittingProductId: string | null;
  demoIndex: number;
  finishingDemo: boolean;
  onWorkspaceSubmit: (input: {
    workspace_name: string;
    country: string;
    team_size: number | null;
    vat_number: string | null;
  }) => Promise<void>;
  onBackToWorkspace: () => void;
  onProductSelect: (product: Product) => Promise<void>;
  onDemoPrev: () => void;
  onDemoNext: () => void;
  onDemoFinish: () => Promise<void>;
};

export function OnboardingSteps(props: Props) {
  if (props.step === "workspace") {
    return (
      <WorkspaceStep
        isLoading={props.submittingWorkspace}
        defaultWorkspaceName={props.workspaceName}
        onSubmit={props.onWorkspaceSubmit}
      />
    );
  }

  if (props.step === "products") {
    return (
      <ProductsStep
        products={props.products}
        isLoading={props.productsLoading}
        submittingProductId={props.submittingProductId}
        onBack={props.onBackToWorkspace}
        onSelect={props.onProductSelect}
      />
    );
  }

  return (
    <DemoStep
      index={props.demoIndex}
      onPrev={props.onDemoPrev}
      onNext={props.onDemoNext}
      onFinish={props.onDemoFinish}
      isFinishing={props.finishingDemo}
    />
  );
}
