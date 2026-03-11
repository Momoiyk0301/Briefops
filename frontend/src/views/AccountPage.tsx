import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

import { createStripeCheckoutSession, createStripePortalSession, getMe, toApiMessage } from "@/lib/api";
import { PasswordUpdateForm } from "@/components/auth/PasswordUpdateForm";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";
import { updatePassword } from "@/lib/auth";

export default function AccountPage() {
  const { t } = useTranslation();
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
    if (!usage) return "—";
    if (usage.pdf_exports_limit === null) {
      return t("account.usageUnlimited", { used: usage.pdf_exports_used });
    }
    return t("account.usageLimited", { used: usage.pdf_exports_used, limit: usage.pdf_exports_limit });
  }, [t, usage]);

  if (meQuery.isLoading) {
    return <Card>{t("app.loading")}</Card>;
  }
  if (meQuery.error) {
    return <Card>{toApiMessage(meQuery.error)}</Card>;
  }

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
      <div>
        <h1 className="text-2xl font-bold">{t("account.title")}</h1>
        <p className="mt-1 text-sm text-[#6f748a] dark:text-[#a8afc6]">{t("account.subtitle")}</p>
        {searchParams.get("fromSignup") === "1" ? (
          <p className="mt-2 text-sm text-[#5f6680] dark:text-[#a8afc6]">{t("account.fromSignup")}</p>
        ) : null}
      </div>

      <Card className="card-pad">
        <div className="cards-grid-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">{t("account.emailLabel")}</p>
            <p className="mt-1 font-semibold">{user?.email ?? t("account.unavailable")}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">{t("account.identityLabel")}</p>
            <p className="mt-1 font-semibold">{user?.email ? t("account.identityValue") : t("account.unavailable")}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">{t("account.workspaceLabel")}</p>
            <p className="mt-1 font-semibold">{workspace?.name ?? t("account.workspaceNone")}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">{t("account.roleLabel")}</p>
            <div className="mt-1"><Badge>{role}</Badge></div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">{t("account.planLabel")}</p>
            <div className="mt-1"><Badge>{plan}</Badge></div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">{t("account.subscriptionStatusLabel")}</p>
            <p className="mt-1 font-semibold">{subscriptionStatus ?? t("account.subscriptionInactive")}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">{t("account.pdfRemainingLabel")}</p>
            <p className="mt-1 font-semibold">
              {usage?.pdf_exports_remaining === null
                ? t("account.unlimited")
                : t("account.remainingCount", { count: usage?.pdf_exports_remaining ?? 0 })}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">{t("account.phoneLabel")}</p>
            <div className="mt-1">
              <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+33 ..." />
            </div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">{t("account.periodLabel")}</p>
            <p className="mt-1 font-semibold">{currentPeriodEnd ? new Date(currentPeriodEnd).toLocaleDateString("fr-BE") : "—"}</p>
          </div>
        </div>
      </Card>

      <Card className="card-pad">
        <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">Sécurité</h2>
            <p className="text-sm text-[#6f748a] dark:text-[#a8afc6]">
              Change ton mot de passe depuis ton compte connecté. Supabase ne demande pas l’ancien mot de passe pour cette action.
            </p>
          </div>
          <Badge className="w-fit">Mot de passe</Badge>
        </div>

        <div className="mt-6 max-w-xl">
          <PasswordUpdateForm
            helperText="Le changement est appliqué immédiatement à ton compte actuel."
            onSubmit={handlePasswordUpdate}
            pendingLabel="Mise à jour..."
            submitLabel="Changer le mot de passe"
          />
        </div>
      </Card>

      <Card className="card-pad">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-xl font-semibold">{t("account.billingTitle")}</h2>
            <p className="text-sm text-[#6f748a] dark:text-[#a8afc6]">{t("account.billingSubtitle")}</p>
          </div>
          <Badge className="w-fit">{t("account.usageLabel", { value: usageLabel })}</Badge>
        </div>

        {billingState === "returned" ? (
          <div className="mt-5 rounded-[24px] border border-[#d8e8dd] bg-[#f4fbf6] p-4 text-sm leading-6 text-[#256146] dark:border-[#28543d] dark:bg-[#102419] dark:text-[#92d3a9]">
            {t("account.billingReturned")}
          </div>
        ) : null}

        {hasPaymentIssue ? (
          <div className="mt-5 rounded-[24px] border border-[#f0d5da] bg-[#fff8f9] p-4 text-sm leading-6 text-[#8f3148] dark:border-[#4f2530] dark:bg-[#211419] dark:text-[#ff9cb0]">
            {t("account.billingWarning")}
          </div>
        ) : null}

        <div className="mt-6 cards-grid-3" ref={billingPlansRef}>
          <div className="surface-pad rounded-2xl border border-[#e6e8f2] dark:border-white/10">
            <p className="text-sm font-semibold">Starter</p>
            <p className="mt-1 text-sm text-[#6f748a] dark:text-[#a8afc6]">100 exports PDF/mois</p>
            <Button
              className="mt-4"
              disabled={submittingPlan !== null || plan === "starter" || plan === "plus" || plan === "pro"}
              onClick={() => void openCheckout("starter")}
            >
              {submittingPlan === "starter"
                ? t("account.redirecting")
                : plan === "starter" || plan === "plus" || plan === "pro"
                  ? t("account.currentOrHigher")
                  : t("account.starterCta")}
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
                ? t("account.redirecting")
                : plan === "plus" || plan === "pro"
                  ? t("account.currentOrHigher")
                  : t("account.plusCta")}
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
              {submittingPlan === "pro" ? t("account.redirecting") : plan === "pro" ? t("account.currentPlan") : t("account.proCta")}
            </Button>
          </div>
        </div>

        <div className="mt-5">
          <Button variant="secondary" disabled={openingPortal} onClick={() => void openPortal()}>
            {openingPortal ? t("account.opening") : t("account.manageBilling")}
          </Button>
        </div>
      </Card>
    </section>
  );
}
