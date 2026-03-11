import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { getMe, toApiMessage } from "@/lib/api";
import { getPostAuthRedirect } from "@/lib/authRedirect";
import { resetPasswordForEmail, signInWithPassword, signUpWithPassword } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Tabs } from "@/components/ui/Tabs";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6)
});

type Values = z.infer<typeof schema>;

function isMissingAccountLoginError(error: unknown) {
  const message = toApiMessage(error);
  return /invalid login credentials|user not found|email not confirmed/i.test(message);
}

export default function LoginPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (mode === "login") {
        await signInWithPassword(values.email, values.password);
        const me = await getMe();
        const nextRoute = getPostAuthRedirect(me);
        if (nextRoute === "/onboarding?step=products") {
          toast(t("auth.offersRedirect"));
        }
        navigate(nextRoute);
      } else {
        const signUpResult = await signUpWithPassword(values.email, values.password);
        if (!signUpResult.session) {
          navigate(`/auth/check-email?email=${encodeURIComponent(values.email)}`);
          return;
        }
        navigate("/onboarding");
      }
    } catch (error) {
      if (mode === "login" && isMissingAccountLoginError(error)) {
        toast.error(t("auth.accountMissing"));
        setMode("register");
        return;
      }
      toast.error(toApiMessage(error));
    }
  });

  const handleForgotPassword = async () => {
    const email = form.getValues("email").trim();
    if (!email) {
      toast.error("Renseigne d'abord ton email");
      return;
    }

    const parsed = z.string().email().safeParse(email);
    if (!parsed.success) {
      toast.error("Email invalide");
      return;
    }

    try {
      await resetPasswordForEmail(parsed.data);
      toast.success("Email de réinitialisation envoyé");
    } catch (error) {
      toast.error(toApiMessage(error));
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 bg-[linear-gradient(180deg,#eef4ff_0%,#f8fbff_45%,#f3efe8_100%)] lg:grid-cols-[minmax(0,1.15fr)_minmax(520px,0.85fr)] dark:bg-[#0b1120]">
      <section className="relative flex min-h-[50vh] items-end overflow-hidden px-6 py-10 lg:min-h-screen lg:px-12 lg:py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(84,119,255,0.28),transparent_30%),radial-gradient(circle_at_80%_15%,rgba(0,186,255,0.16),transparent_24%),linear-gradient(135deg,#0f2747_0%,#1954c9_45%,#56a9ff_100%)]" />
        <div className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.18)_1px,transparent_1px)] [background-size:34px_34px]" />
        <div className="absolute -left-24 top-10 h-72 w-72 rounded-full bg-white/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 translate-x-1/4 translate-y-1/4 rounded-full bg-[#ffb86c]/25 blur-3xl" />

        <div className="relative z-10 max-w-2xl text-white">
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-white/80">Event Ops Workspace</p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight lg:text-6xl">BriefOPS</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/88 lg:text-lg">
            Le cockpit opérationnel pour monter, valider et partager des briefings terrain lisibles en quelques minutes.
          </p>
          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-white/65">A4</p>
              <p className="mt-2 text-sm font-medium">Prévisualisation page par page</p>
            </div>
            <div className="rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-white/65">Modules</p>
              <p className="mt-2 text-sm font-medium">Briefings composables selon l’événement</p>
            </div>
            <div className="rounded-3xl border border-white/20 bg-white/10 p-4 backdrop-blur">
              <p className="text-xs uppercase tracking-[0.18em] text-white/65">Partage</p>
              <p className="mt-2 text-sm font-medium">Exports PDF et liens pour le staff</p>
            </div>
          </div>
        </div>
      </section>

      <section className="flex min-h-[50vh] items-center justify-center px-6 py-10 lg:min-h-screen lg:px-10">
        <Card className="w-full max-w-xl rounded-[32px] border-white/70 p-8 shadow-[0_30px_80px_rgba(20,30,60,0.12)]">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-[20px] bg-brand-500 text-xl font-bold text-white shadow-panel">
              B
            </div>
            <h2 className="text-3xl font-semibold tracking-tight text-[#111827] dark:text-white">Connexion</h2>
            <p className="mt-2 text-sm text-[#6f748a] dark:text-[#a8afc6]">
              Accède à ton espace et reprends tes briefings là où tu les as laissés.
            </p>
          </div>

          <Tabs
            tabs={[
              { key: "login", label: t("auth.login") },
              { key: "register", label: t("auth.register") }
            ]}
            active={mode}
            onChange={(key) => {
              setMode(key as "login" | "register");
            }}
          >
            <form className="space-y-3" onSubmit={onSubmit}>
              <Input placeholder={t("auth.email")} type="email" {...form.register("email")} />
              <Input placeholder={t("auth.password")} type="password" {...form.register("password")} />
              {mode === "login" ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    className="text-sm font-medium text-brand-600 transition hover:text-brand-700 dark:text-brand-400"
                    onClick={() => void handleForgotPassword()}
                  >
                    {t("auth.forgotPassword")}
                  </button>
                </div>
              ) : null}
              <Button type="submit" className="w-full" withArrow>
                {mode === "login" ? t("auth.submitLogin") : t("auth.continueRegister")}
              </Button>
            </form>
          </Tabs>
        </Card>
      </section>
    </div>
  );
}
