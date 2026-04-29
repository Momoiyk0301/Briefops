import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";

import { OnboardingModal } from "@/components/onboarding/OnboardingModal";
import { OnboardingStepKey, OnboardingSteps } from "@/components/onboarding/OnboardingSteps";
import {
  activateOnboardingPlan,
  createOnboardingCheckoutSession,
  getMe,
  getProducts,
  postOnboarding,
  toApiMessage,
  updateOnboardingStep
} from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { MeResponse, Product } from "@/lib/types";

function normalizeStep(raw?: string | null): OnboardingStepKey {
  if (raw === "products") return "products";
  if (raw === "demo") return "demo";
  return "workspace";
}

export default function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [params] = useSearchParams();
  const { session, loading: authLoading } = useAuth();
  const requestedStep = params.get("step");
  const [submittingProductId, setSubmittingProductId] = useState<string | null>(null);
  const [demoIndex, setDemoIndex] = useState(0);
  const demoStepSyncStarted = useRef(false);
  const meQuery = useQuery({
    queryKey: ["me"],
    queryFn: getMe,
    enabled: !authLoading && Boolean(session)
  });
  const workspace = meQuery.data?.workspace ?? meQuery.data?.org ?? null;
  const hasMembership = Boolean(meQuery.data?.has_membership ?? workspace?.id ?? meQuery.data?.role);

  const productsQuery = useQuery({
    queryKey: ["products"],
    queryFn: getProducts,
    enabled: !authLoading && Boolean(session) && !meQuery.isLoading && !meQuery.data?.degraded && Boolean(workspace?.id)
  });

  const onboardingStep = normalizeStep(
    requestedStep === "demo" ? "demo" : meQuery.data?.onboarding_step
  );

  const products = useMemo(() => (productsQuery.data ?? []).slice(0, 3), [productsQuery.data]);

  const updateCachedOnboardingStep = (step: "workspace" | "products" | "demo" | "done") => {
    queryClient.setQueryData<MeResponse>(["me"], (current) => {
      if (!current) return current;
      return { ...current, onboarding_step: step };
    });
  };

  useEffect(() => {
    if (!authLoading && !session) {
      navigate("/login", { replace: true });
    }
  }, [authLoading, navigate, session]);

  useEffect(() => {
    if (hasMembership && meQuery.data?.onboarding_step === "done" && requestedStep !== "demo") {
      navigate("/briefings", { replace: true });
    }
  }, [hasMembership, meQuery.data?.onboarding_step, navigate, requestedStep]);

  const createWorkspaceMutation = useMutation({
    mutationFn: postOnboarding,
    onSuccess: async () => {
      updateCachedOnboardingStep("products");
      await queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success(t("onboarding.messages.workspaceCreated"));
      navigate("/onboarding?step=products");
    },
    onError: (error) => toast.error(toApiMessage(error))
  });

  const saveStepMutation = useMutation({
    mutationFn: updateOnboardingStep
  });

  useEffect(() => {
    if (requestedStep !== "demo" || meQuery.data?.onboarding_step === "done" || meQuery.data?.onboarding_step === "demo") {
      demoStepSyncStarted.current = false;
      return;
    }

    if (!demoStepSyncStarted.current) {
      demoStepSyncStarted.current = true;
      void (async () => {
        try {
          await saveStepMutation.mutateAsync("demo");
          updateCachedOnboardingStep("demo");
          await queryClient.invalidateQueries({ queryKey: ["me"] });
        } catch (error) {
          toast.error(toApiMessage(error));
        }
      })();
    }
  }, [meQuery.data?.onboarding_step, queryClient, requestedStep, saveStepMutation]);

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
    try {
      await createWorkspaceMutation.mutateAsync(input);
    } catch {
      // Error feedback is handled by the mutation's onError callback.
    }
  };

  const handleProductSelect = async (product: Product) => {
    if (!workspace?.id) {
      toast.error(t("onboarding.messages.workspaceRequired"));
      return;
    }

    setSubmittingProductId(product.id);
    try {
      await saveStepMutation.mutateAsync("products");
      updateCachedOnboardingStep("products");
      if (product.slug === "enterprise") {
        navigate("/help?subject=enterprise");
        return;
      }
      if (product.slug === "starter") {
        await activateOnboardingPlan("starter");
        updateCachedOnboardingStep("demo");
        await queryClient.invalidateQueries({ queryKey: ["me"] });
        navigate("/onboarding?step=demo");
        return;
      }

      if (!product.stripe_price_id) {
        throw new Error("Missing Stripe price for this product");
      }

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
    try {
      await saveStepMutation.mutateAsync("workspace");
      updateCachedOnboardingStep("workspace");
      await queryClient.invalidateQueries({ queryKey: ["me"] });
    } catch (error) {
      toast.error(toApiMessage(error));
    }
  };

  const handleDemoPrev = () => {
    setDemoIndex((prev) => Math.max(prev - 1, 0));
  };

  const handleDemoNext = () => {
    setDemoIndex((prev) => Math.min(prev + 1, 2));
  };

  const handleDemoFinish = async () => {
    try {
      await finishDemoMutation.mutateAsync();
    } catch {
      // Error feedback is handled by the mutation's onError callback.
    }
  };

  return (
    <OnboardingModal step={onboardingStep} demoIndex={demoIndex}>
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
