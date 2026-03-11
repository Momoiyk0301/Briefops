import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

import { PasswordPageShell } from "@/components/auth/PasswordPageShell";
import { PasswordUpdateForm } from "@/components/auth/PasswordUpdateForm";
import { Card } from "@/components/ui/Card";
import { completeAuthRedirectSession, getAuthRedirectErrorMessage, hasAuthCallbackParams, updatePassword, useAuth } from "@/lib/auth";
import { toApiMessage } from "@/lib/api";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const { session, loading } = useAuth();
  const [status, setStatus] = useState<"checking" | "ready" | "invalid" | "error" | "success">("checking");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const authErrorMessage = useMemo(() => getAuthRedirectErrorMessage(), []);

  useEffect(() => {
    let active = true;

    if (loading) return;

    if (session) {
      setStatus("ready");
      return;
    }

    if (authErrorMessage) {
      setStatus("error");
      setErrorMessage("Le lien de réinitialisation est invalide ou expiré. Demande un nouvel email puis réessaie.");
      return;
    }

    if (!hasAuthCallbackParams()) {
      setStatus("invalid");
      return;
    }

    void (async () => {
      try {
        const recoveredSession = await completeAuthRedirectSession();
        if (!active) return;

        if (!recoveredSession) {
          setStatus("invalid");
          return;
        }

        setStatus("ready");
      } catch (error) {
        if (!active) return;
        setStatus("error");
        setErrorMessage(toApiMessage(error));
      }
    })();

    return () => {
      active = false;
    };
  }, [authErrorMessage, loading, session]);

  const handleSubmit = async (password: string) => {
    try {
      await updatePassword(password);
      setStatus("success");
      toast.success("Mot de passe mis à jour.");
      window.setTimeout(() => {
        navigate("/login", { replace: true });
      }, 900);
    } catch (error) {
      toast.error(toApiMessage(error));
      throw error;
    }
  };

  return (
    <PasswordPageShell
      backTo={status === "success" ? "/login" : "/auth/forgot-password"}
      backLabel={status === "success" ? "Retour à la connexion" : "Demander un nouveau lien"}
      description="Utilise ce lien une seule fois pour enregistrer un mot de passe neuf et reprendre l’accès à ton espace."
      eyebrow="Sécurité"
      title="Définir un nouveau mot de passe"
    >
      {status === "checking" ? (
        <p className="text-sm text-[#6f748a] dark:text-[#a8afc6]">Vérification du lien de récupération en cours...</p>
      ) : null}

      {status === "invalid" ? (
        <Card className="rounded-[24px] border-[#f0d5da] bg-[#fff8f9] p-4 text-sm leading-6 text-[#8f3148] dark:border-[#4f2530] dark:bg-[#211419] dark:text-[#ff9cb0]">
          Aucun lien de récupération actif n’a été détecté sur cette page. Retourne sur l’email reçu puis clique à nouveau sur le lien complet.
        </Card>
      ) : null}

      {status === "error" ? (
        <Card className="rounded-[24px] border-[#f0d5da] bg-[#fff8f9] p-4 text-sm leading-6 text-[#8f3148] dark:border-[#4f2530] dark:bg-[#211419] dark:text-[#ff9cb0]">
          {errorMessage ?? "Impossible d’activer la session de récupération pour le moment."}
        </Card>
      ) : null}

      {status === "success" ? (
        <Card className="rounded-[24px] border-[#d8e8dd] bg-[#f4fbf6] p-4 text-sm leading-6 text-[#256146] dark:border-[#28543d] dark:bg-[#102419] dark:text-[#92d3a9]">
          Ton nouveau mot de passe est enregistré. Redirection vers la page de connexion...
        </Card>
      ) : null}

      {status === "ready" ? (
        <PasswordUpdateForm
          helperText="Choisis un mot de passe d’au moins 8 caractères. Tu pourras ensuite te reconnecter immédiatement."
          onSubmit={handleSubmit}
          pendingLabel="Enregistrement..."
          submitLabel="Enregistrer le nouveau mot de passe"
        />
      ) : null}
    </PasswordPageShell>
  );
}
