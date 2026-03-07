import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { getMe, toApiMessage } from "@/lib/api";
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
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      if (mode === "login") {
        await signInWithPassword(values.email, values.password);
        const me = await getMe();
        if (!me.role) {
          navigate("/onboarding");
          return;
        }
        navigate("/briefings");
      } else {
        const signUpResult = await signUpWithPassword(values.email, values.password);
        if (!signUpResult.session) {
          navigate(`/auth/check-email?email=${encodeURIComponent(values.email)}`);
          return;
        }
        navigate("/onboarding");
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
          }}
        >
          <form className="space-y-3" onSubmit={onSubmit}>
            <Input placeholder={t("auth.email")} type="email" {...form.register("email")} />
            <Input placeholder={t("auth.password")} type="password" {...form.register("password")} />
            <Button type="submit" className="w-full" withArrow>
              {mode === "login" ? t("auth.submitLogin") : "Continuer"}
            </Button>
          </form>
        </Tabs>
      </Card>
    </div>
  );
}
