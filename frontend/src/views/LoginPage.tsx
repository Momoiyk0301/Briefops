import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";
import { CheckCircle2, LogIn, MailCheck, ShieldCheck } from "lucide-react";

import { getMe, toApiMessage } from "@/lib/api";
import { getPostAuthRedirect } from "@/lib/authRedirect";
import {
  getAuthErrorKind,
  getAuthErrorMessage,
  getRememberMePreference,
  resendSignupConfirmation,
  signInWithPassword,
  signUpWithPassword
} from "@/lib/auth";
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
  const [rememberMe, setRememberMe] = useState(() => getRememberMePreference());
  const [lastAuthError, setLastAuthError] = useState<{ kind: ReturnType<typeof getAuthErrorKind>; email: string } | null>(null);
  const [resendingEmail, setResendingEmail] = useState(false);
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });
  const watchedEmail = form.watch("email");

  const handleResendConfirmation = async (email: string) => {
    setResendingEmail(true);
    try {
      await resendSignupConfirmation(email);
      toast.success("Email envoyé");
    } catch (error) {
      toast.error(toApiMessage(error));
    } finally {
      setResendingEmail(false);
    }
  };

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      setLastAuthError(null);
      if (mode === "login") {
        await signInWithPassword(values.email, values.password, rememberMe);
        const me = await getMe();
        const nextRoute = getPostAuthRedirect(me);
        if (nextRoute === "/onboarding?step=products") {
          toast(t("auth.offersRedirect"));
        }
        navigate(nextRoute);
      } else {
        const signUpResult = await signUpWithPassword(values.email, values.password, true);
        if (!signUpResult.session) {
          navigate(`/auth/check-email?email=${encodeURIComponent(values.email)}`);
          return;
        }
        navigate("/onboarding");
      }
    } catch (error) {
      if (mode === "login") {
        const kind = getAuthErrorKind(error);
        setLastAuthError({ kind, email: values.email });
        toast.error(getAuthErrorMessage(error));
        return;
      }

      toast.error(toApiMessage(error));
    }
  });

  return (
    <div className="grid min-h-screen grid-cols-1 bg-[linear-gradient(180deg,#f4f7fc_0%,#f8fbff_45%,#f4f1ea_100%)] lg:grid-cols-[minmax(0,1.15fr)_minmax(520px,0.85fr)] dark:bg-[#0b1120]">
      <section className="relative flex min-h-[50vh] items-end overflow-hidden px-6 py-10 lg:min-h-screen lg:px-12 lg:py-12">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(84,119,255,0.16),transparent_30%),radial-gradient(circle_at_80%_15%,rgba(0,186,255,0.08),transparent_24%),linear-gradient(135deg,#163252_0%,#28559d_45%,#6f95c9_100%)]" />
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
            <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-[26px] border border-brand-200/60 bg-[radial-gradient(circle_at_top,_#66b4ff_0%,_#2d74ff_58%,_#143f9e_100%)] text-white shadow-[0_24px_55px_rgba(29,78,216,0.28)]">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-[18px] border border-white/25 bg-white/10 backdrop-blur">
                <ShieldCheck size={20} />
                <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-brand-600 shadow-sm">
                  <MailCheck size={12} />
                </span>
              </div>
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
                <div className="flex items-center justify-between gap-3">
                  <label className="flex items-center gap-2 text-sm text-[#6f748a] dark:text-[#a8afc6]">
                    <input
                      checked={rememberMe}
                      onChange={(event) => setRememberMe(event.target.checked)}
                      type="checkbox"
                    />
                    Se souvenir de moi
                  </label>
                  <Link
                    className="text-sm font-medium text-brand-600 transition hover:text-brand-700 dark:text-brand-400"
                    to={watchedEmail ? `/auth/forgot-password?email=${encodeURIComponent(watchedEmail.trim())}` : "/auth/forgot-password"}
                  >
                    {t("auth.forgotPassword")}
                  </Link>
                </div>
              ) : null}
              <Button type="submit" className="w-full" withArrow>
                {mode === "login" ? t("auth.submitLogin") : t("auth.continueRegister")}
              </Button>
            </form>
          </Tabs>

          {mode === "login" && lastAuthError ? (
            <div className="mt-4 rounded-[24px] border border-[#dbe4f3] bg-[#f7fafe] p-4 text-sm text-[#284165] dark:border-white/10 dark:bg-[#121826] dark:text-[#d9e7ff]">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-brand-500/10 p-2 text-brand-600 dark:text-brand-300">
                  {lastAuthError.kind === "email_not_confirmed" ? <MailCheck size={16} /> : <LogIn size={16} />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">
                    {lastAuthError.kind === "email_not_confirmed"
                      ? "Ton email n’est pas encore confirmé"
                      : lastAuthError.kind === "user_not_found"
                        ? "Compte introuvable"
                        : lastAuthError.kind === "invalid_credentials"
                          ? "Connexion refusée"
                          : "Connexion impossible"}
                  </p>
                  <p className="mt-1 text-[#52607a] dark:text-[#b7c6e6]">
                    {lastAuthError.kind === "email_not_confirmed"
                      ? "Ouvre l’email de confirmation reçu puis reviens ici. Si besoin, renvoie un nouvel email."
                      : lastAuthError.kind === "user_not_found"
                        ? "Vérifie l’adresse saisie ou passe en création de compte si tu n’as pas encore de compte."
                        : lastAuthError.kind === "invalid_credentials"
                          ? "Vérifie ton mot de passe et réessaie. Si besoin, tu peux aussi demander un nouveau mot de passe."
                          : "Réessaie dans quelques instants ou contacte le support si le problème persiste."}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {lastAuthError.kind === "email_not_confirmed" ? (
                      <Button
                        variant="secondary"
                        className="h-10 px-4"
                        onClick={() => void handleResendConfirmation(lastAuthError.email)}
                        disabled={resendingEmail}
                      >
                        <MailCheck size={14} />
                        {resendingEmail ? "Envoi..." : "Renvoyer l’email"}
                      </Button>
                    ) : null}
                    {lastAuthError.kind === "user_not_found" ? (
                      <Button variant="secondary" className="h-10 px-4" onClick={() => setMode("register")}>
                        <CheckCircle2 size={14} />
                        Créer un compte
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </Card>
      </section>
    </div>
  );
}
