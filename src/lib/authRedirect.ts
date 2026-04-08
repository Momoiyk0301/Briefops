import type { MeResponse, UserPlan } from "@/lib/types";

function hasPaidPlan(plan: UserPlan | null) {
  return plan === "starter" || plan === "pro" || plan === "guest" || plan === "funder" || plan === "enterprise";
}

export function getPostAuthRedirect(me: MeResponse): string {
  const workspace = me.workspace ?? me.org ?? null;
  const hasMembership = Boolean(me.has_membership ?? workspace?.id ?? me.role);

  if (!hasMembership) {
    return "/onboarding";
  }

  if (workspace?.id && !hasPaidPlan(me.plan)) {
    return "/onboarding?step=products";
  }

  if (me.onboarding_step === "done") {
    return "/briefings";
  }

  if (me.onboarding_step === "demo") {
    return "/onboarding?step=demo";
  }

  if (workspace?.id && me.onboarding_step === "products") {
    return "/onboarding?step=products";
  }

  if (workspace?.id) {
    return "/briefings";
  }

  return "/onboarding";
}
