import { useId, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { useSearchParams } from "react-router-dom";

import { PasswordPageShell } from "@/components/auth/PasswordPageShell";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { resetPasswordForEmail } from "@/lib/auth";
import { toApiMessage } from "@/lib/api";

const schema = z.object({
  email: z.string().trim().email("Renseigne une adresse email valide.")
});

type Values = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const emailId = useId();
  const [searchParams] = useSearchParams();
  const [submittedEmail, setSubmittedEmail] = useState<string | null>(null);
  const defaultEmail = useMemo(() => searchParams.get("email") ?? "", [searchParams]);
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: defaultEmail }
  });

  const submit = form.handleSubmit(async (values) => {
    try {
      await resetPasswordForEmail(values.email);
      setSubmittedEmail(values.email);
      toast.success("Email de réinitialisation envoyé.");
    } catch (error) {
      toast.error(toApiMessage(error));
    }
  });

  const emailError = form.formState.errors.email?.message;

  return (
    <PasswordPageShell
      eyebrow="Accès"
      title="Mot de passe oublié"
      description="Entre l’adresse email de ton compte. Nous t’enverrons un lien sécurisé pour définir un nouveau mot de passe."
    >
      {submittedEmail ? (
        <div className="rounded-[24px] border border-[#d8e8dd] bg-[#f4fbf6] p-4 text-sm leading-6 text-[#256146] dark:border-[#28543d] dark:bg-[#102419] dark:text-[#92d3a9]">
          Un email de réinitialisation a été envoyé à <span className="font-semibold">{submittedEmail}</span>. Ouvre le message puis clique sur le lien pour choisir un nouveau mot de passe.
        </div>
      ) : null}

      <form className="mt-5 space-y-4" onSubmit={submit}>
        <div className="space-y-2">
          <label className="text-sm font-medium text-[#172033] dark:text-white" htmlFor={emailId}>
            Adresse email
          </label>
          <Input
            {...form.register("email")}
            aria-describedby={emailError ? `${emailId}-error` : undefined}
            aria-invalid={Boolean(emailError)}
            autoComplete="email"
            id={emailId}
            placeholder="vous@entreprise.com"
            type="email"
          />
          {emailError ? (
            <p className="text-sm text-[#c03c59] dark:text-[#ff8aa0]" id={`${emailId}-error`}>
              {emailError}
            </p>
          ) : null}
        </div>

        <Button className="w-full" disabled={form.formState.isSubmitting} type="submit" withArrow>
          {form.formState.isSubmitting ? "Envoi en cours..." : "Envoyer le lien de réinitialisation"}
        </Button>
      </form>
    </PasswordPageShell>
  );
}
