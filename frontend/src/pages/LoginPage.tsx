import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { getMe } from "@/lib/api";
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
      } else {
        await signUpWithPassword(values.email, values.password);
      }
      const me = await getMe();
      navigate(me.org ? "/briefings" : "/onboarding");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Auth error";
      toast.error(message);
    }
  });

  return (
    <div className="grid min-h-full grid-cols-1 items-center gap-6 bg-gradient-to-b from-[#f7f7f4] to-[#eef6ff] p-6 lg:grid-cols-[1.2fr_420px] dark:from-slate-950 dark:to-slate-900">
      <section className="rounded-2xl border border-slate-200 bg-white p-8 shadow-panel dark:border-slate-800 dark:bg-slate-900">
        <p className="text-sm font-medium uppercase tracking-wide text-blue-700 dark:text-blue-300">Event Ops SaaS</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">BriefOPS</h1>
        <p className="mt-3 max-w-xl text-slate-600 dark:text-slate-300">
          Crée des briefings opérationnels en quelques minutes, partage une version claire avec ton staff, et garde le contrôle terrain.
        </p>
        <ul className="mt-6 grid gap-2 text-sm text-slate-700 dark:text-slate-200">
          <li>• Briefings modulaires prêts à exporter en PDF</li>
          <li>• Workflow simple pour équipes prod, road et staffing</li>
          <li>• Vue A4 en temps réel pour éviter les erreurs sur site</li>
        </ul>
      </section>

      <Card className="w-full max-w-md justify-self-center">
        <Tabs
          tabs={[
            { key: "login", label: t("auth.login") },
            { key: "register", label: t("auth.register") }
          ]}
          active={mode}
          onChange={(key) => setMode(key as "login" | "register")}
        >
          <form className="space-y-3" onSubmit={onSubmit}>
            <Input placeholder={t("auth.email")} type="email" {...form.register("email")} />
            <Input placeholder={t("auth.password")} type="password" {...form.register("password")} />
            <Button type="submit" className="w-full">
              {mode === "login" ? t("auth.submitLogin") : t("auth.submitRegister")}
            </Button>
          </form>
        </Tabs>
      </Card>
    </div>
  );
}
