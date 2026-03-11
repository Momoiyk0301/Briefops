import type { MeResponse, UserPlan } from "@/lib/types";

function hasPaidPlan(plan: UserPlan | null) {
  return plan === "starter" || plan === "plus" || plan === "pro";
}

export function getPostAuthRedirect(me: MeResponse): string {
  const workspace = me.workspace ?? me.org ?? null;
  const hasMembership = Boolean(me.has_membership ?? workspace?.id ?? me.role);

  if (!hasMembership) {
    return "/onboarding";
  }

  if (me.onboarding_step === "done") {
    return "/briefings";
  }

  if (me.onboarding_step === "demo") {
    return "/onboarding?step=demo";
  }

  if (workspace?.id && (!hasPaidPlan(me.plan) || me.onboarding_step === "products")) {
    return "/onboarding?step=products";
  }

  return "/onboarding";
}
