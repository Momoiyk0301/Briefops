import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { createStripeCheckoutSession, getMe, toApiMessage } from "@/lib/api";
import { signInWithPassword, signUpWithPassword } from "@/lib/auth";
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
  const [submittingOffer, setSubmittingOffer] = useState<"free" | "starter" | "plus" | "pro" | null>(null);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  const continueWithOffer = async (plan: "free" | "starter" | "plus" | "pro") => {
    if (!pendingRegistration) return;
    try {
      setSubmittingOffer(plan);
      const signUpResult = await signUpWithPassword(pendingRegistration.email, pendingRegistration.password);

      if (plan === "free") {
        if (signUpResult.session) {
          navigate("/onboarding");
        } else {
          navigate(`/auth/check-email?email=${encodeURIComponent(pendingRegistration.email)}`);
        }
        return;
      }

      if (signUpResult.session) {
        const checkout = await createStripeCheckoutSession(plan);
        window.location.href = checkout.url;
        return;
      }

      toast.success("Compte créé. Confirme ton email puis connecte-toi pour finaliser l'offre.");
      navigate(`/auth/check-email?email=${encodeURIComponent(pendingRegistration.email)}`);
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
        navigate(me.org ? "/briefings" : "/onboarding");
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
    <div className="grid min-h-full grid-cols-1 items-center gap-8 px-[var(--space-page-x)] py-[var(--space-page-y)] lg:grid-cols-[1.2fr_minmax(520px,42vw)] lg:gap-10">
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

      <Card className="card-pad w-full max-w-xl justify-self-center">
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
            setSubmittingOffer(null);
          }}
        >
          {mode === "register" && registerStep === "offer" ? (
            <div className="space-y-3">
              <p className="text-sm font-medium">Choisis ton offre avant la création du compte:</p>
              <Button className="w-full" disabled={submittingOffer !== null} onClick={() => void continueWithOffer("starter")}>
                {submittingOffer === "starter" ? "Redirection..." : "Starter"}
              </Button>
              <Button className="w-full" disabled={submittingOffer !== null} onClick={() => void continueWithOffer("plus")}>
                {submittingOffer === "plus" ? "Redirection..." : "Plus"}
              </Button>
              <Button className="w-full" disabled={submittingOffer !== null} onClick={() => void continueWithOffer("pro")}>
                {submittingOffer === "pro" ? "Redirection..." : "Pro"}
              </Button>
              <Button variant="secondary" className="w-full" disabled={submittingOffer !== null} onClick={() => void continueWithOffer("free")}>
                {submittingOffer === "free" ? "Création..." : "Continuer en Free"}
              </Button>
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
