import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";

import { createStripeCheckoutSession, createStripePortalSession, getMe, toApiMessage } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

export default function AccountPage() {
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const [searchParams] = useSearchParams();
  const [phone, setPhone] = useState("");
  const [submittingPlan, setSubmittingPlan] = useState<"starter" | "plus" | "pro" | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);

  useEffect(() => {
    setPhone(localStorage.getItem("briefops:account:phone") ?? "");
  }, []);

  useEffect(() => {
    localStorage.setItem("briefops:account:phone", phone);
  }, [phone]);

  if (meQuery.isLoading) {
    return <Card>Chargement du compte...</Card>;
  }
  if (meQuery.error) {
    return <Card>{toApiMessage(meQuery.error)}</Card>;
  }

  const user = meQuery.data?.user;
  const workspace = meQuery.data?.org;
  const role = meQuery.data?.role ?? "member";
  const plan = meQuery.data?.plan ?? "free";
  const usage = meQuery.data?.usage;
  const subscriptionStatus = meQuery.data?.subscription_status ?? null;
  const currentPeriodEnd = meQuery.data?.current_period_end ?? null;

  const usageLabel = useMemo(() => {
    if (!usage) return "—";
    if (usage.pdf_exports_limit === null) {
      return `${usage.pdf_exports_used} export(s) PDF ce mois (illimité)`;
    }
    return `${usage.pdf_exports_used}/${usage.pdf_exports_limit} export(s) PDF ce mois`;
  }, [usage]);

  const openCheckout = async (targetPlan: "starter" | "plus" | "pro") => {
    try {
      setSubmittingPlan(targetPlan);
      const session = await createStripeCheckoutSession(targetPlan, workspace?.name);
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

  return (
    <section className="stack-page">
      <div>
        <h1 className="text-2xl font-bold">Compte</h1>
        <p className="mt-1 text-sm text-[#6f748a] dark:text-[#a8afc6]">
          Informations de profil, workspace et facturation.
        </p>
        {searchParams.get("fromSignup") === "1" ? (
          <p className="mt-2 text-sm text-[#5f6680] dark:text-[#a8afc6]">
            Choisis ton offre ici pour finaliser l’activation du compte.
          </p>
        ) : null}
      </div>

      <Card className="card-pad">
        <div className="cards-grid-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Email</p>
            <p className="mt-1 font-semibold">{user?.email ?? "Non disponible"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">ID utilisateur</p>
            <p className="mt-1 font-semibold">{user?.id ?? "Non disponible"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Workspace</p>
            <p className="mt-1 font-semibold">{workspace?.name ?? "Aucun"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Rôle</p>
            <div className="mt-1"><Badge>{role}</Badge></div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Plan</p>
            <div className="mt-1"><Badge>{plan}</Badge></div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Statut abonnement</p>
            <p className="mt-1 font-semibold">{subscriptionStatus ?? "Non actif"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Restant PDF</p>
            <p className="mt-1 font-semibold">
              {usage?.pdf_exports_remaining === null
                ? "Illimité"
                : `${usage?.pdf_exports_remaining ?? 0} restant(s)`}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Téléphone</p>
            <div className="mt-1">
              <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+33 ..." />
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Période en cours</p>
            <p className="mt-1 font-semibold">{currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString("fr-BE") : "—"}</p>
          </div>
        </div>
      </Card>

      <Card className="card-pad">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Facturation</h2>
            <p className="text-sm text-[#6f748a] dark:text-[#a8afc6]">
              Gère ton plan et l’utilisation PDF depuis le compte.
            </p>
          </div>
          <Badge className="w-fit">Utilisation: {usageLabel}</Badge>
        </div>

        <div className="mt-6 cards-grid-3">
          <div className="surface-pad rounded-2xl border border-[#e6e8f2] dark:border-white/10">
            <p className="text-sm font-semibold">Starter</p>
            <p className="mt-1 text-sm text-[#6f748a] dark:text-[#a8afc6]">100 exports PDF/mois</p>
            <Button
              className="mt-4"
              disabled={submittingPlan !== null || plan === "starter" || plan === "plus" || plan === "pro"}
              onClick={() => void openCheckout("starter")}
            >
              {submittingPlan === "starter"
                ? "Redirection..."
                : plan === "starter" || plan === "plus" || plan === "pro"
                  ? "Plan actuel ou supérieur"
                  : "Passer Starter"}
            </Button>
          </div>

          <div className="surface-pad rounded-2xl border border-[#e6e8f2] dark:border-white/10">
            <p className="text-sm font-semibold">Plus</p>
            <p className="mt-1 text-sm text-[#6f748a] dark:text-[#a8afc6]">300 exports PDF/mois</p>
            <Button
              className="mt-4"
              disabled={submittingPlan !== null || plan === "plus" || plan === "pro"}
              onClick={() => void openCheckout("plus")}
            >
              {submittingPlan === "plus"
                ? "Redirection..."
                : plan === "plus" || plan === "pro"
                  ? "Plan actuel ou supérieur"
                  : "Passer Plus"}
            </Button>
          </div>

          <div className="surface-pad rounded-2xl border border-brand-500/40 bg-brand-500/5 dark:border-brand-400/30 dark:bg-brand-400/10">
            <p className="text-sm font-semibold">Pro</p>
            <p className="mt-1 text-sm text-[#6f748a] dark:text-[#a8afc6]">Exports PDF illimités</p>
            <Button
              className="mt-4"
              disabled={submittingPlan !== null || plan === "pro"}
              onClick={() => void openCheckout("pro")}
            >
              {submittingPlan === "pro" ? "Redirection..." : plan === "pro" ? "Plan actuel" : "Passer Pro"}
            </Button>
          </div>
        </div>

        <div className="mt-5">
          <Button variant="secondary" disabled={openingPortal} onClick={() => void openPortal()}>
            {openingPortal ? "Ouverture..." : "Gérer la facturation"}
          </Button>
        </div>
      </Card>
    </section>
  );
}
