import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Check } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { createStripeCheckoutSession, createStripePortalSession, getMe, toApiMessage } from "@/lib/api";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Tabs } from "@/components/ui/Tabs";

export default function BillingPage() {
  const { t } = useTranslation();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const [activeTab, setActiveTab] = useState("overview");
  const [redirecting, setRedirecting] = useState(false);
  const currentPlan = String(meQuery.data?.plan ?? "free").toLowerCase();
  const briefingLimitLabel = currentPlan === "free" ? "1 briefing" : currentPlan === "start" ? "20 briefings" : "Briefings illimités";

  const tabs = [
    { key: "overview", label: "Vue d'ensemble" },
    { key: "subscription", label: "Abonnement" },
    { key: "usage", label: "Usage" },
    { key: "invoices", label: "Factures" }
  ];
  const planRank: Record<string, number> = { free: 0, start: 1, pro: 2 };
  const plans = [
    {
      key: "free",
      name: "Free",
      price: "0 EUR / mois",
      description: "Idéal pour démarrer.",
      features: ["1 briefing", "3 exports PDF / mois", "Support communauté"]
    },
    {
      key: "start",
      name: "Start",
      price: "19 EUR / mois",
      description: "Pour une petite équipe.",
      features: ["20 briefings", "Exports PDF illimités", "Support email"]
    },
    {
      key: "pro",
      name: "Pro",
      price: "49 EUR / mois",
      description: "Pour les équipes terrain actives.",
      features: ["Briefings illimités", "Exports PDF illimités", "Support prioritaire"]
    }
  ];

  const getPlanActionLabel = (planKey: string) => {
    if (currentPlan === planKey) return "Plan actuel";
    if ((planRank[planKey] ?? 0) > (planRank[currentPlan] ?? 0)) return "Choisir ce plan";
    return "Basculer vers ce plan";
  };

  const goToCheckout = async (plan: "start" | "pro") => {
    try {
      setRedirecting(true);
      const { url } = await createStripeCheckoutSession(plan);
      window.location.href = url;
    } catch (error) {
      toast.error(toApiMessage(error));
      setRedirecting(false);
    }
  };

  const goToPortal = async () => {
    try {
      setRedirecting(true);
      const { url } = await createStripePortalSession();
      window.location.href = url;
    } catch (error) {
      toast.error(toApiMessage(error));
      setRedirecting(false);
    }
  };

  return (
    <section className="space-y-6">
      <Card className="border-[#e7e8f2] p-6 dark:border-white/10">
        <Tabs tabs={tabs} active={activeTab} onChange={setActiveTab}>
          {activeTab === "overview" ? (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">{t("billing.title")}</h2>
              <p className="text-sm text-[#646b82] dark:text-[#adb4cc]">{t("billing.freeLimit")}</p>
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="border-brand-500/20 bg-brand-500/10 text-brand-600 dark:text-brand-500">
                  {t("nav.plan")}: {meQuery.data?.plan ?? "unknown"}
                </Badge>
                {meQuery.data?.subscription_name ? <Badge>Abonnement: {meQuery.data.subscription_name}</Badge> : null}
                {meQuery.data?.subscription_status ? <Badge>Statut: {meQuery.data.subscription_status}</Badge> : null}
                <Badge>{briefingLimitLabel}</Badge>
              </div>
              <Button onClick={() => void goToCheckout("start")} disabled={redirecting} withArrow>{t("billing.upgrade")}</Button>
            </div>
          ) : null}
          {activeTab === "usage" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <Card className="p-5">
                <p className="text-sm text-[#6f748a] dark:text-[#a8afc6]">PDF générés</p>
                <p className="mt-2 text-3xl font-bold">3</p>
              </Card>
              <Card className="p-5">
                <p className="text-sm text-[#6f748a] dark:text-[#a8afc6]">Missions actives</p>
                <p className="mt-2 text-3xl font-bold">12</p>
              </Card>
            </div>
          ) : null}
          {activeTab === "subscription" ? (
            <div className="space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-[#6f748a] dark:text-[#a8afc6]">Plan actuel</p>
                  <p className="text-2xl font-bold">{meQuery.data?.plan ?? "free"}</p>
                </div>
                <Badge className="border-brand-500/20 bg-brand-500/10 text-brand-600 dark:text-brand-500">
                  Gestion d'abonnement
                </Badge>
              </div>
              <div className="grid gap-4 xl:grid-cols-3">
                {plans.map((plan) => {
                  const isCurrent = currentPlan === plan.key;
                  return (
                    <Card
                      key={plan.key}
                      className={`p-5 ${isCurrent ? "border-brand-500 ring-1 ring-brand-500/30" : ""}`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xl font-bold">{plan.name}</p>
                          <p className="mt-1 text-sm text-[#6f748a] dark:text-[#a8afc6]">{plan.description}</p>
                        </div>
                        {isCurrent ? <Badge>Actif</Badge> : null}
                      </div>
                      <p className="mt-4 text-2xl font-bold">{plan.price}</p>
                      <div className="mt-4 space-y-2">
                        {plan.features.map((feature) => (
                          <p key={feature} className="flex items-center gap-2 text-sm text-[#1f2538] dark:text-[#d7deef]">
                            <Check size={14} className="text-brand-500" />
                            <span>{feature}</span>
                          </p>
                        ))}
                      </div>
                      <Button
                        className="mt-5 w-full"
                        variant={isCurrent ? "secondary" : "primary"}
                        disabled={redirecting}
                        onClick={() => {
                          if (isCurrent) {
                            void goToPortal();
                            return;
                          }
                          if (plan.key === "start" || plan.key === "pro") {
                            void goToCheckout(plan.key);
                          }
                        }}
                      >
                        {isCurrent ? "Gérer l'abonnement" : getPlanActionLabel(plan.key)}
                      </Button>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : null}
          {activeTab === "invoices" ? (
            <Card className="p-5">
              <p className="text-sm text-[#6f748a] dark:text-[#a8afc6]">Aucune facture disponible pour le moment.</p>
            </Card>
          ) : null}
        </Tabs>
      </Card>
    </section>
  );
}
