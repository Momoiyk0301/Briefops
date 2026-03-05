import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { createStripeCheckoutSession, getMe, postOnboarding, toApiMessage } from "@/lib/api";
import { signInWithPassword, signOut, signUpWithPassword } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

type Values = z.infer<typeof schema>;

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [registerStep, setRegisterStep] = useState<"credentials" | "offer">("credentials");
  const [pendingRegistration, setPendingRegistration] = useState<Values | null>(null);
  const [orgName, setOrgName] = useState("");
  const [submittingOffer, setSubmittingOffer] = useState<"starter" | "plus" | "pro" | null>(null);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });
  const isOfferStep = mode === "register" && registerStep === "offer";

  const continueWithOffer = async (plan: "starter" | "plus" | "pro") => {
    if (!pendingRegistration) return;
    const trimmedOrgName = orgName.trim();
    if (trimmedOrgName.length < 2) {
      toast.error("Nom d'organisation requis (min 2 caractères).");
      return;
    }

    try {
      setSubmittingOffer(plan);
      const signUpResult = await signUpWithPassword(pendingRegistration.email, pendingRegistration.password);

      if (!signUpResult.session) {
        navigate(`/auth/check-email?email=${encodeURIComponent(pendingRegistration.email)}`);
        return;
      }

      if (plan === "starter") {
        await postOnboarding({ org_name: trimmedOrgName });
        navigate("/briefings");
        return;
      }

      if (signUpResult.session) {
        const checkout = await createStripeCheckoutSession(plan, trimmedOrgName);
        window.location.href = checkout.url;
        return;
      }
    } catch (error) {
      toast.error(toApiMessage(error));
      setSubmittingOffer(null);
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (mode === "login") {
        await signInWithPassword(values.email, values.password);
        const me = await getMe();
        if (!me.role) {
          await signOut();
          toast.error("Aucun membership lié à ce compte.");
          navigate("/login");
          return;
        }
        navigate("/briefings");
      } else {
        setPendingRegistration(values);
        setRegisterStep("offer");
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Auth error";
      toast.error(message);
    }
  });

  return (
    <div className={`grid min-h-full items-center gap-8 px-[var(--space-page-x)] py-[var(--space-page-y)] ${isOfferStep ? "grid-cols-1" : "grid-cols-1 lg:grid-cols-[1.2fr_minmax(520px,42vw)] lg:gap-10"}`}>
      {!isOfferStep ? (
      <section className="relative min-h-[420px] overflow-hidden rounded-panel border border-white/30 bg-gradient-to-br from-brand-500 via-[#6f72ff] to-[#45a5ff] p-[var(--space-card-pad)] text-white shadow-panel lg:min-h-[540px]">
        <div className="absolute -left-20 -top-16 h-64 w-64 rounded-full bg-white/15 blur-2xl" />
        <div className="absolute -bottom-24 -right-10 h-72 w-72 rounded-full bg-[#ff8b3d]/30 blur-3xl" />
        <p className="relative text-sm font-medium uppercase tracking-wide text-white/85">Event Ops SaaS</p>
        <h1 className="relative mt-3 text-4xl font-semibold tracking-tight">BriefOPS</h1>
        <p className="relative mt-3 max-w-xl text-white/90">
          Crée des briefings opérationnels en quelques minutes, partage une version claire avec ton staff et garde le contrôle terrain.
        </p>
        <ul className="relative mt-6 grid gap-2 text-sm text-white/95">
          <li>• Briefings modulaires prêts à exporter en PDF</li>
          <li>• Workflow simple pour équipes prod, road et staffing</li>
          <li>• Vue A4 en temps réel pour éviter les erreurs sur site</li>
        </ul>
      </section>
      ) : null}

      <Card className={`card-pad w-full justify-self-center ${isOfferStep ? "max-w-4xl border-white/45 bg-white/18 backdrop-blur-xl dark:border-white/20 dark:bg-white/5" : "max-w-xl"}`}>
        <Tabs
          tabs={[
            { key: "login", label: t("auth.login") },
            { key: "register", label: t("auth.register") }
          ]}
          active={mode}
          onChange={(key) => {
            setMode(key as "login" | "register");
            setRegisterStep("credentials");
            setPendingRegistration(null);
            setOrgName("");
            setSubmittingOffer(null);
          }}
        >
          {mode === "register" && registerStep === "offer" ? (
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-[#4f5570] dark:text-[#b4bdd5]">Ton compte est prêt.</p>
                <h2 className="mt-1 text-2xl font-bold">Choisis ton offre pour continuer vers le checkout Stripe</h2>
                <div className="mt-3">
                  <Input
                    placeholder="Nom de l'organisation"
                    value={orgName}
                    onChange={(event) => setOrgName(event.target.value)}
                  />
                </div>
              </div>
              <div className="cards-grid-3">
                <div className="surface-pad rounded-2xl border border-[#e6e8f2] bg-white/75 dark:border-white/10 dark:bg-white/5">
                  <p className="text-lg font-semibold">Starter</p>
                  <p className="mt-1 text-sm text-[#6f748a] dark:text-[#a8afc6]">Version gratuite (sans checkout)</p>
                  <Button className="mt-4 w-full" disabled={submittingOffer !== null} onClick={() => void continueWithOffer("starter")}>
                    {submittingOffer === "starter" ? "Création..." : "Choisir Starter"}
                  </Button>
                </div>
                <div className="surface-pad rounded-2xl border border-[#e6e8f2] bg-white/75 dark:border-white/10 dark:bg-white/5">
                  <p className="text-lg font-semibold">Plus</p>
                  <p className="mt-1 text-sm text-[#6f748a] dark:text-[#a8afc6]">Plus de volume et confort</p>
                  <Button className="mt-4 w-full" disabled={submittingOffer !== null} onClick={() => void continueWithOffer("plus")}>
                    {submittingOffer === "plus" ? "Redirection..." : "Choisir Plus"}
                  </Button>
                </div>
                <div className="surface-pad rounded-2xl border border-brand-500/40 bg-brand-500/10 dark:border-brand-400/30 dark:bg-brand-400/10">
                  <p className="text-lg font-semibold">Pro</p>
                  <p className="mt-1 text-sm text-[#6f748a] dark:text-[#a8afc6]">Le plan le plus complet</p>
                  <Button className="mt-4 w-full" disabled={submittingOffer !== null} onClick={() => void continueWithOffer("pro")}>
                    {submittingOffer === "pro" ? "Redirection..." : "Choisir Pro"}
                  </Button>
                </div>
              </div>
              <Button
                type="button"
                variant="ghost"
                className="w-full"
                disabled={submittingOffer !== null}
                onClick={() => {
                  setRegisterStep("credentials");
                  setPendingRegistration(null);
                }}
              >
                Retour
              </Button>
            </div>
          ) : (
            <form className="space-y-3" onSubmit={onSubmit}>
              <Input placeholder={t("auth.email")} type="email" {...form.register("email")} />
              <Input placeholder={t("auth.password")} type="password" {...form.register("password")} />
              <Button type="submit" className="w-full" withArrow>
                {mode === "login" ? t("auth.submitLogin") : "Continuer"}
              </Button>
            </form>
          )}
        </Tabs>
      </Card>
    </div>
  );
}
