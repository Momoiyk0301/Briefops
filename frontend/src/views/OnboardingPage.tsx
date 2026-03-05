import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { postOnboarding, toApiMessage } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const schema = z.object({ org_name: z.string().min(2) });
type Values = z.infer<typeof schema>;

export default function OnboardingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { org_name: "" } });

  const mutation = useMutation({
    mutationFn: postOnboarding,
    onSuccess: () => navigate("/briefings"),
    onError: (error) => toast.error(toApiMessage(error))
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      await mutation.mutateAsync(values);
    } catch (error) {
      const message = toApiMessage(error);
      if (message.includes("already has an organization")) {
        toast.success("Organisation déjà créée, redirection.");
        navigate("/briefings");
        return;
      }

      if (message.toLowerCase().includes("unauthorized")) {
        toast.error("Session expirée. Reconnecte-toi.");
        navigate("/login");
        return;
      }

      toast.error(`${t("onboarding.fallback")} (${message})`);
    }
  });

  return (
    <Card className="card-pad mx-auto max-w-xl">
      <h1 className="mb-1 text-2xl font-semibold">{t("onboarding.title")}</h1>
      <p className="mb-4 text-sm text-[#888]">Configure ton espace en moins d'une minute.</p>
      <form className="space-y-3" onSubmit={submit}>
        <Input placeholder={t("onboarding.orgName")} {...form.register("org_name")} />
        <Button type="submit" disabled={mutation.isPending} withArrow>{t("onboarding.submit")}</Button>
      </form>
    </Card>
  );
}
