import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useNavigate, useSearchParams } from "react-router-dom";

import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { OnboardingStepKey, OnboardingSteps } from "@/components/onboarding/OnboardingSteps";
import {
  createOnboardingCheckoutSession,
  getMe,
  getProducts,
  postOnboarding,
  toApiMessage,
  updateOnboardingStep
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Product } from "@/lib/types";

function normalizeStep(raw?: string | null): OnboardingStepKey {
  if (raw === "products") return "products";
  if (raw === "demo") return "demo";
  return "workspace";
}

export default function OnboardingPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const { session, loading: authLoading } = useAuth();
  const requestedStep = params.get("step");
  const [submittingProductId, setSubmittingProductId] = useState<string | null>(null);
  const [demoIndex, setDemoIndex] = useState(0);
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    enabled: !authLoading && Boolean(session)
  });
  const workspace = meQuery.data?.workspace ?? meQuery.data?.org ?? null;

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
    enabled: !authLoading && Boolean(session) && !meQuery.isLoading && !meQuery.data?.degraded && Boolean(workspace?.id)
  });

  const onboardingStep = normalizeStep(
    requestedStep === "demo" ? "demo" : meQuery.data?.onboarding_step
  );

  const products = useMemo(() => (productsQuery.data ?? []).slice(0, 3), [productsQuery.data]);

  useEffect(() => {
    if (!authLoading && !session) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, navigate, session]);

  useEffect(() => {
    if (meQuery.data?.role && meQuery.data?.onboarding_step === "done" && requestedStep !== "demo") {
      navigate("/briefings", { replace: true });
    }
  }, [meQuery.data?.onboarding_step, meQuery.data?.role, navigate, requestedStep]);

  const createWorkspaceMutation = useMutation({
    mutationFn: postOnboarding,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Workspace created");
    },
    onError: (error) => toast.error(toApiMessage(error))
  });

  const saveStepMutation = useMutation({
    mutationFn: updateOnboardingStep
  });

  useEffect(() => {
    if (requestedStep === "demo" && meQuery.data?.onboarding_step !== "done" && meQuery.data?.onboarding_step !== "demo") {
      void saveStepMutation.mutateAsync("demo");
    }
  }, [meQuery.data?.onboarding_step, requestedStep, saveStepMutation]);

  const finishDemoMutation = useMutation({
    mutationFn: async () => {
      await saveStepMutation.mutateAsync("done");
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      navigate("/briefings");
    },
    onError: (error) => toast.error(toApiMessage(error))
  });

  const handleWorkspaceSubmit = async (input: {
    workspace_name: string;
    country: string;
    team_size: number | null;
    vat_number: string | null;
  }) => {
    await createWorkspaceMutation.mutateAsync(input);
  };

  const handleProductSelect = async (product: Product) => {
    if (!workspace?.id) {
      toast.error("Create your workspace first");
      return;
    }
    if (!product.stripe_price_id) {
      toast.error("Missing Stripe price for this product");
      return;
    }

    setSubmittingProductId(product.id);
    try {
      await saveStepMutation.mutateAsync("products");
      const session = await createOnboardingCheckoutSession({
        stripe_price_id: product.stripe_price_id,
        workspace_id: workspace.id,
        workspace_name: workspace.name
      });
      window.location.href = session.url;
    } catch (error) {
      toast.error(toApiMessage(error));
      setSubmittingProductId(null);
    }
  };

  const handleBackToWorkspace = async () => {
    await saveStepMutation.mutateAsync("workspace");
    await queryClient.invalidateQueries({ queryKey: ["me"] });
  };

  const handleDemoPrev = () => {
    setDemoIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleDemoNext = () => {
    setDemoIndex((prev) => Math.min(prev + 1, 2));
  };

  const handleDemoFinish = async () => {
    await finishDemoMutation.mutateAsync();
  };

  return (
    <OnboardingModal step={onboardingStep}>
      <OnboardingSteps
        step={onboardingStep}
        workspaceName={workspace?.name ?? ""}
        products={products}
        productsLoading={productsQuery.isLoading}
        submittingWorkspace={createWorkspaceMutation.isPending}
        submittingProductId={submittingProductId}
        demoIndex={demoIndex}
        finishingDemo={finishDemoMutation.isPending}
        onWorkspaceSubmit={handleWorkspaceSubmit}
        onBackToWorkspace={handleBackToWorkspace}
        onProductSelect={handleProductSelect}
        onDemoPrev={handleDemoPrev}
        onDemoNext={handleDemoNext}
        onDemoFinish={handleDemoFinish}
      />
    </OnboardingModal>
  );
}
