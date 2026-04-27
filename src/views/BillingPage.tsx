import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";

import { createStripeCheckoutSession, createStripePortalSession, getMe, toApiMessage } from "@/lib/api";
import { getPlanLimits } from "@/lib/quotas";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function BillingPage() {
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const [searchParams] = useSearchParams();
  const [submittingPlan, setSubmittingPlan] = useState<"starter" | "pro" | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);

  const usage = meQuery.data?.usage;
  const currentPlan = meQuery.data?.plan ?? "free";

  const usageLabel = useMemo(() => {
    if (!usage) return "—";
    if (usage.pdf_exports_limit === null) {
      return `${usage.pdf_exports_used} export(s) PDF ce mois (illimité)`;
    }
    return `${usage.pdf_exports_used}/${usage.pdf_exports_limit} export(s) PDF ce mois`;
  }, [usage]);

  const remainingLabel =
    usage?.pdf_exports_remaining === null
      ? "Illimité"
      : `${usage?.pdf_exports_remaining ?? 0} restant(s)`;

  const openCheckout = async (plan: "starter" | "pro") => {
    try {
      setSubmittingPlan(plan);
      const session = await createStripeCheckoutSession(plan);
      window.location.href = session.url;
    } catch (error) {
      toast.error(toApiMessage(error));
      setSubmittingPlan(null);
    }
  };

  const openPortal = async () => {
    try {
      setOpeningPortal(true);
      const session = await createStripePortalSession();
      window.location.href = session.url;
    } catch (error) {
      toast.error(toApiMessage(error));
      setOpeningPortal(false);
    }
  };

  if (meQuery.isLoading) return <Card>Chargement de la facturation...</Card>;
  if (meQuery.error) return <Card>{toApiMessage(meQuery.error)}</Card>;

  return (
    <section className="stack-page">
      <div>
        <h1 className="text-2xl font-bold">Facturation</h1>
        <p className="mt-1 text-sm text-[#6f748a] dark:text-[#a8afc6]">
          Donnees d'utilisation et choix de plan.
        </p>
        {searchParams.get("fromSignup") === "1" ? (
          <p className="mt-2 text-sm text-[#5f6680] dark:text-[#a8afc6]">
            Choisis ton offre (Starter ou Pro), puis finalise ton checkout Stripe.
          </p>
        ) : null}
        {searchParams.get("checkout") === "success" ? (
          <p className="mt-2 text-sm text-[#5f6680] dark:text-[#a8afc6]">
            Paiement confirmé. Stripe garde les reçus et factures, tandis que BriefOPS peut envoyer les emails applicatifs de confirmation de compte.
          </p>
        ) : null}
      </div>

      <div className="cards-grid-3">
        <Card>
          <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Plan actuel</p>
          <p className="mt-2 text-2xl font-semibold">{currentPlan}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Utilisation PDF</p>
          <p className="mt-2 text-sm font-medium">{usageLabel}</p>
        </Card>
        <Card>
          <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Restant PDF</p>
          <p className="mt-2 text-2xl font-semibold">{remainingLabel}</p>
        </Card>
      </div>

      <Card className="card-pad">
        <h2 className="text-lg font-semibold">Choisir un abonnement</h2>
        <div className="cards-grid-3 mt-4">
          <div className="surface-pad rounded-2xl border border-[#e6e8f2] dark:border-white/10">
            <p className="text-sm font-semibold">Starter</p>
            <p className="mt-1 text-sm text-[#6f748a] dark:text-[#a8afc6]">{getPlanLimits("starter").briefings} briefings · {getPlanLimits("starter").pdf_month} exports PDF/mois</p>
            <Button
              className="mt-4"
              disabled={submittingPlan !== null || currentPlan === "starter" || currentPlan === "plus" || currentPlan === "pro"}
              onClick={() => void openCheckout("starter")}
            >
              {submittingPlan === "starter" ? "Redirection..." : currentPlan === "starter" || currentPlan === "plus" || currentPlan === "pro" ? "Plan actuel ou superieur" : "Passer Starter"}
            </Button>
          </div>

          <div className="surface-pad rounded-2xl border border-brand-500/40 bg-brand-500/5 dark:border-brand-400/30 dark:bg-brand-400/10">
            <p className="text-sm font-semibold">Pro</p>
            <p className="mt-1 text-sm text-[#6f748a] dark:text-[#a8afc6]">Exports PDF illimites</p>
            <Button
              className="mt-4"
              disabled={submittingPlan !== null || currentPlan === "pro"}
              onClick={() => void openCheckout("pro")}
            >
              {submittingPlan === "pro" ? "Redirection..." : currentPlan === "pro" ? "Plan actuel" : "Passer Pro"}
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <Button variant="secondary" disabled={openingPortal} onClick={() => void openPortal()}>
            {openingPortal ? "Ouverture..." : "Gerer la facturation"}
          </Button>
        </div>
      </Card>
    </section>
  );
}
