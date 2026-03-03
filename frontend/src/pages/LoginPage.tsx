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
    <div className="flex min-h-full items-center justify-center p-6">
      <Card className="w-full max-w-md">
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
