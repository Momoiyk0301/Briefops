import { useForm } from "react-hook-form";
import { useTranslation } from "react-i18next";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

type Props = {
  isLoading: boolean;
  onSubmit: (input: {
    workspace_name: string;
    country: string;
    team_size: number | null;
    vat_number: string | null;
  }) => Promise<void>;
  defaultWorkspaceName?: string;
};

type FormValues = {
  workspace_name: string;
  country: string;
  team_size: string;
  vat_number: string;
};

export function WorkspaceStep({ isLoading, onSubmit, defaultWorkspaceName = "" }: Props) {
  const { t } = useTranslation();
  const form = useForm<FormValues>({
    defaultValues: {
      workspace_name: defaultWorkspaceName,
      country: "Belgium",
      team_size: "",
      vat_number: ""
    }
  });

  const handleSubmit = form.handleSubmit(async (values) => {
    await onSubmit({
      workspace_name: values.workspace_name.trim(),
      country: values.country.trim(),
      team_size: values.team_size.trim() ? Number(values.team_size) : null,
      vat_number: values.vat_number.trim() || null
    });
  });

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <h2 className="text-2xl font-semibold">{t("onboarding.workspace.title")}</h2>
        <p className="mt-1 text-sm text-[#70758d]">{t("onboarding.workspace.subtitle")}</p>
      </div>

      <Input placeholder={t("onboarding.workspace.name")} {...form.register("workspace_name", { required: true, minLength: 2 })} />
      <Input placeholder={t("onboarding.workspace.country")} {...form.register("country", { required: true, minLength: 2 })} />
      <Input placeholder={t("onboarding.workspace.teamSize")} type="number" min={1} {...form.register("team_size")} />
      <Input placeholder={t("onboarding.workspace.vatNumber")} {...form.register("vat_number")} />

      <Button type="submit" withArrow disabled={isLoading}>
        {isLoading ? t("onboarding.workspace.saving") : t("onboarding.workspace.continue")}
      </Button>
    </form>
  );
}
