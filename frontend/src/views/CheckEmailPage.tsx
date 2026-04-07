import { useState } from "react";
import toast from "react-hot-toast";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, MailCheck } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { getMe, toApiMessage } from "@/lib/api";
import { getPostAuthRedirect } from "@/lib/authRedirect";
import { revalidateCurrentSession, resendSignupConfirmation } from "@/lib/auth";

export default function CheckEmailPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleResend = async () => {
    if (!email) {
      toast.error("Adresse email manquante.");
      return;
    }

    setResending(true);
    try {
      await resendSignupConfirmation(email);
      toast.success("Email envoyé");
    } catch (error) {
      toast.error(toApiMessage(error));
    } finally {
      setResending(false);
    }
  };

  const handleConfirmed = async () => {
    setChecking(true);
    setStatusMessage(null);
    try {
      const session = await revalidateCurrentSession();
      if (!session) {
        setStatusMessage("Aucune session confirmée n’a été détectée. Ouvre le lien complet reçu par email puis reviens ici.");
        return;
      }

      const me = await getMe();
      navigate(getPostAuthRedirect(me), { replace: true });
    } catch (error) {
      setStatusMessage(toApiMessage(error));
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <Card className="card-pad w-full max-w-lg">
        <h1 className="text-2xl font-semibold">Email de confirmation envoye</h1>
        <p className="mt-2 text-sm text-[#6f748a] dark:text-[#a8afc6]">
          {email ? `Nous avons envoye un lien a ${email}.` : "Nous avons envoye un lien de confirmation."} Ouvre ton
          mail puis clique sur le lien pour activer ton compte.
        </p>
        <p className="mt-2 text-sm text-[#6f748a] dark:text-[#a8afc6]">
          Confirme ton email puis reviens ici pour terminer l’activation de ton espace.
        </p>
        {statusMessage ? (
          <div className="mt-4 rounded-[22px] border border-[#dbe4f3] bg-[#f7fafe] p-4 text-sm text-[#36507a] dark:border-white/10 dark:bg-[#121826] dark:text-[#d4e4ff]">
            {statusMessage}
          </div>
        ) : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-full bg-[linear-gradient(135deg,#1954c9_0%,#2870ff_55%,#55a4ff_100%)] px-4 py-2.5 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(32,78,185,0.28)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_24px_48px_rgba(32,78,185,0.34)]"
          >
            Retour connexion
          </Link>
          <Button variant="secondary" onClick={() => void handleConfirmed()} disabled={checking}>
            <CheckCircle2 size={16} />
            {checking ? "Vérification..." : "J’ai confirmé mon email"}
          </Button>
          {email ? (
            <Button variant="secondary" onClick={() => void handleResend()} disabled={resending}>
              <MailCheck size={16} />
              {resending ? "Envoi..." : "Renvoyer l’email"}
            </Button>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
