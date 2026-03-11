import { useId } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";

import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const passwordSchema = z.object({
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  confirmPassword: z.string().min(8, "La confirmation doit contenir au moins 8 caractères.")
}).refine((value) => value.password === value.confirmPassword, {
  path: ["confirmPassword"],
  message: "Les mots de passe ne correspondent pas."
});

type Values = z.infer<typeof passwordSchema>;

type Props = {
  submitLabel: string;
  helperText?: string;
  pendingLabel?: string;
  onSubmit: (password: string) => Promise<void>;
};

export function PasswordUpdateForm({ submitLabel, helperText, pendingLabel = "Enregistrement...", onSubmit }: Props) {
  const passwordId = useId();
  const confirmPasswordId = useId();
  const form = useForm<Values>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { password: "", confirmPassword: "" }
  });

  const submit = form.handleSubmit(async (values) => {
    await onSubmit(values.password);
    form.reset();
  });

  const passwordError = form.formState.errors.password?.message;
  const confirmPasswordError = form.formState.errors.confirmPassword?.message;

  return (
    <form className="space-y-4" onSubmit={submit}>
      <div className="space-y-2">
        <label className="text-sm font-medium text-[#172033] dark:text-white" htmlFor={passwordId}>
          Nouveau mot de passe
        </label>
        <Input
          {...form.register("password")}
          aria-describedby={passwordError ? `${passwordId}-error` : undefined}
          aria-invalid={Boolean(passwordError)}
          autoComplete="new-password"
          id={passwordId}
          type="password"
        />
        {passwordError ? (
          <p className="text-sm text-[#c03c59] dark:text-[#ff8aa0]" id={`${passwordId}-error`}>
            {passwordError}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-[#172033] dark:text-white" htmlFor={confirmPasswordId}>
          Confirmer le mot de passe
        </label>
        <Input
          {...form.register("confirmPassword")}
          aria-describedby={confirmPasswordError ? `${confirmPasswordId}-error` : undefined}
          aria-invalid={Boolean(confirmPasswordError)}
          autoComplete="new-password"
          id={confirmPasswordId}
          type="password"
        />
        {confirmPasswordError ? (
          <p className="text-sm text-[#c03c59] dark:text-[#ff8aa0]" id={`${confirmPasswordId}-error`}>
            {confirmPasswordError}
          </p>
        ) : null}
      </div>

      {helperText ? <p className="text-sm text-[#6f748a] dark:text-[#a8afc6]">{helperText}</p> : null}

      <Button className="w-full" disabled={form.formState.isSubmitting} type="submit" withArrow>
        {form.formState.isSubmitting ? pendingLabel : submitLabel}
      </Button>
    </form>
  );
}
