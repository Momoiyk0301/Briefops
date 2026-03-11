import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CreditCard, Gauge, Shield, UserCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";

import { PasswordUpdateForm } from "@/components/auth/PasswordUpdateForm";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { createStripeCheckoutSession, createStripePortalSession, getMe, toApiMessage } from "@/lib/api";
import { updatePassword } from "@/lib/auth";

export default function AccountPage() {
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const [searchParams] = useSearchParams();
  const [phone, setPhone] = useState("");
  const [submittingPlan, setSubmittingPlan] = useState<"starter" | "plus" | "pro" | null>(null);
  const [openingPortal, setOpeningPortal] = useState(false);
  const billingPlansRef = useRef<HTMLDivElement | null>(null);

  const user = meQuery.data?.user;
  const workspace = meQuery.data?.org;
  const role = meQuery.data?.role ?? "member";
  const plan = meQuery.data?.plan ?? "free";
  const usage = meQuery.data?.usage;
  const subscriptionStatus = meQuery.data?.subscription_status ?? null;
  const currentPeriodEnd = meQuery.data?.current_period_end ?? null;
  const billingState = searchParams.get("billing");
  const hasPaymentIssue = ["past_due", "unpaid", "incomplete", "incomplete_expired"].includes(String(subscriptionStatus ?? "").toLowerCase());

  const usageLabel = useMemo(() => {
    if (!usage) return "Aucune donnée";
    if (usage.pdf_exports_limit === null) return `${usage.pdf_exports_used} PDF utilisés, quota illimité`;
    return `${usage.pdf_exports_used}/${usage.pdf_exports_limit} PDF utilisés`;
  }, [usage]);

  if (meQuery.isLoading) return <Card>Chargement...</Card>;
  if (meQuery.error) return <Card>{toApiMessage(meQuery.error)}</Card>;

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
      const message = toApiMessage(error);
      if (/aucune facturation stripe active|start checkout first/i.test(message)) {
        billingPlansRef.current?.scrollIntoView?.({ behavior: "smooth", block: "start" });
        toast.error("Aucune facturation active pour ce compte. Choisis une offre pour activer Stripe.");
      } else {
        toast.error(message);
      }
      setOpeningPortal(false);
    }
  };

  const handlePasswordUpdate = async (password: string) => {
    try {
      await updatePassword(password);
      toast.success("Mot de passe mis à jour.");
    } catch (error) {
      toast.error(toApiMessage(error));
      throw error;
    }
  };

  return (
    <section className="stack-page">
      <Card className="page-hero card-pad">
        <p className="section-kicker">Compte</p>
        <h1 className="section-title mt-2">Mon compte</h1>
        <p className="section-copy mt-2">Lisibilité du plan actuel, de l’usage PDF et des actions de facturation.</p>
      </Card>

      <div className="grid gap-3 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="card-pad">
          <div className="flex items-center gap-2">
            <UserCircle2 size={18} />
            <h2 className="text-lg font-semibold">Profil</h2>
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Email</p>
              <p className="mt-1 font-semibold">{user?.email ?? "Indisponible"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Workspace</p>
              <p className="mt-1 font-semibold">{workspace?.name ?? "Aucun workspace"}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Rôle</p>
              <div className="mt-1"><Badge>{role}</Badge></div>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Téléphone</p>
              <div className="mt-1">
                <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+33 ..." />
              </div>
            </div>
          </div>
        </Card>

        <Card className="card-pad">
          <div className="flex items-center gap-2">
            <CreditCard size={18} />
            <h2 className="text-lg font-semibold">Plan actuel</h2>
          </div>
          <div className="mt-4 rounded-[24px] border border-brand-500/20 bg-brand-500/5 p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm text-[#6f748a] dark:text-[#a8afc6]">Offre active</p>
                <p className="mt-1 text-2xl font-bold capitalize">{plan}</p>
              </div>
              <Badge>{subscriptionStatus ?? "inactive"}</Badge>
            </div>
            <p className="mt-3 text-sm text-[#6f748a] dark:text-[#a8afc6]">
              Échéance: {currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString("fr-BE") : "—"}
            </p>
          </div>
        </Card>
      </div>

      <div className="grid gap-3 xl:grid-cols-[0.8fr_1.2fr]">
        <Card className="card-pad">
          <div className="flex items-center gap-2">
            <Gauge size={18} />
            <h2 className="text-lg font-semibold">Usage</h2>
          </div>
          <div className="mt-4 grid gap-3">
            <div className="rounded-2xl border border-[#e6e8f2] px-4 py-4 dark:border-white/10">
              <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Quota PDF</p>
              <p className="mt-2 text-2xl font-bold">
                {usage?.pdf_exports_remaining === null ? "Illimité" : usage?.pdf_exports_remaining ?? 0}
              </p>
              <p className="mt-1 text-sm text-[#6f748a] dark:text-[#a8afc6]">Restants ce mois</p>
            </div>
            <div className="rounded-2xl border border-[#e6e8f2] px-4 py-4 dark:border-white/10">
              <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Usage</p>
              <p className="mt-2 font-semibold">{usageLabel}</p>
            </div>
          </div>
        </Card>

        <Card className="card-pad">
          <div className="flex items-center gap-2">
            <CreditCard size={18} />
            <h2 className="text-lg font-semibold">Facturation</h2>
          </div>

          {billingState === "returned" ? (
            <div className="mt-5 rounded-[24px] border border-[#d8e8dd] bg-[#f4fbf6] p-4 text-sm leading-6 text-[#256146] dark:border-[#28543d] dark:bg-[#102419] dark:text-[#92d3a9]">
              Retour du portail de facturation enregistré.
            </div>
          ) : null}

          {hasPaymentIssue ? (
            <div className="mt-5 rounded-[24px] border border-[#f0d5da] bg-[#fff8f9] p-4 text-sm leading-6 text-[#8f3148] dark:border-[#4f2530] dark:bg-[#211419] dark:text-[#ff9cb0]">
              Une action est requise sur la facturation.
            </div>
          ) : null}

          <div className="mt-6 grid gap-3 md:grid-cols-3" ref={billingPlansRef}>
            {[
              { name: "Starter", planKey: "starter" as const, description: "100 exports PDF/mois" },
              { name: "Plus", planKey: "plus" as const, description: "300 exports PDF/mois" },
              { name: "Pro", planKey: "pro" as const, description: "Exports PDF illimités", highlight: true }
            ].map((offer) => (
              <div key={offer.name} className={`rounded-2xl border px-4 py-4 ${offer.highlight ? "border-brand-500/40 bg-brand-500/5 dark:border-brand-400/30 dark:bg-brand-400/10" : "border-[#e6e8f2] dark:border-white/10"}`}>
                <p className="text-sm font-semibold">{offer.name}</p>
                <p className="mt-1 text-sm text-[#6f748a] dark:text-[#a8afc6]">{offer.description}</p>
                <Button
                  className="mt-4 w-full"
                  disabled={submittingPlan !== null || plan === offer.planKey || (offer.planKey === "starter" && (plan === "plus" || plan === "pro")) || (offer.planKey === "plus" && plan === "pro")}
                  onClick={() => void openCheckout(offer.planKey)}
                >
                  {submittingPlan === offer.planKey ? "Redirection..." : plan === offer.planKey ? "Plan actuel" : "Choisir"}
                </Button>
              </div>
            ))}
          </div>

          <div className="mt-5">
            <Button variant="secondary" disabled={openingPortal} onClick={() => void openPortal()}>
              {openingPortal ? "Ouverture..." : "Gérer la facturation"}
            </Button>
          </div>
        </Card>
      </div>

      <Card className="card-pad">
        <div className="flex items-center gap-2">
          <Shield size={18} />
          <h2 className="text-lg font-semibold">Sécurité</h2>
        </div>
        <div className="mt-6 max-w-xl">
          <PasswordUpdateForm
            helperText="Le changement est appliqué immédiatement au compte connecté."
            onSubmit={handlePasswordUpdate}
            pendingLabel="Mise à jour..."
            submitLabel="Changer le mot de passe"
          />
        </div>
      </Card>
    </section>
  );
}
