import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import toast from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";

import { updatePassword, useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";

const schema = z.object({
  password: z.string().min(8, "Minimum 8 caractères"),
  confirmPassword: z.string().min(8, "Minimum 8 caractères")
}).refine((value) => value.password === value.confirmPassword, {
  path: ["confirmPassword"],
  message: "Les mots de passe ne correspondent pas"
});

type Values = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { password: "", confirmPassword: "" }
  });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await updatePassword(values.password);
      toast.success("Mot de passe mis à jour");
      navigate("/login", { replace: true });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Impossible de mettre à jour le mot de passe");
    }
  });

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#e7f0ff,transparent_45%),linear-gradient(180deg,#f8fbff_0%,#eef3fb_100%)] p-6 dark:bg-[#0b1120]">
      <Card className="w-full max-w-lg p-8">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-500 text-lg font-bold text-white shadow-panel">
            B
          </div>
          <h1 className="text-2xl font-semibold">Nouveau mot de passe</h1>
          <p className="mt-2 text-sm text-[#6f748a] dark:text-[#a8afc6]">
            Définis un nouveau mot de passe pour ton compte BriefOPS.
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-[#6f748a] dark:text-[#a8afc6]">Vérification du lien de récupération...</p>
        ) : !session ? (
          <div className="space-y-4">
            <p className="text-sm text-[#6f748a] dark:text-[#a8afc6]">
              Aucun lien de récupération actif n’a été détecté. Rouvre l’email de réinitialisation et clique à nouveau sur le lien.
            </p>
            <Link
              to="/login"
              className="inline-flex items-center justify-center rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-panel transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-600"
            >
              Retour à la connexion
            </Link>
          </div>
        ) : (
          <form className="space-y-3" onSubmit={onSubmit}>
            <Input type="password" placeholder="Nouveau mot de passe" {...form.register("password")} />
            <Input type="password" placeholder="Confirmer le mot de passe" {...form.register("confirmPassword")} />
            <Button type="submit" className="w-full" withArrow>
              Enregistrer le nouveau mot de passe
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
