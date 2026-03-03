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
    } catch {
      toast.error(t("onboarding.fallback"));
    }
  });

  return (
    <Card className="mx-auto max-w-xl">
      <h1 className="mb-4 text-xl font-semibold">{t("onboarding.title")}</h1>
      <form className="space-y-3" onSubmit={submit}>
        <Input placeholder={t("onboarding.orgName")} {...form.register("org_name")} />
        <Button type="submit" disabled={mutation.isPending}>{t("onboarding.submit")}</Button>
      </form>
    </Card>
  );
}
