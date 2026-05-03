import type { MeResponse } from "@/lib/types";

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

  if (workspace?.id && me.onboarding_step === "products") {
    return "/onboarding?step=products";
  }

  if (workspace?.id && me.onboarding_step === "workspace") {
    return "/onboarding?step=products";
  }

  if (workspace?.id) {
    return "/briefings";
  }

  return "/onboarding";
}
