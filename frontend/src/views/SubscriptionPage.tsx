import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { getMe, toApiMessage } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function SubscriptionPage() {
  const navigate = useNavigate();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });

  if (meQuery.isLoading) return <Card>Chargement de l'abonnement...</Card>;
  if (meQuery.error) return <Card>{toApiMessage(meQuery.error)}</Card>;

  const plan = meQuery.data?.plan ?? "free";
  const usage = meQuery.data?.usage;

  return (
    <section className="stack-page">
      <div>
        <h1 className="text-2xl font-bold">Abonnement</h1>
        <p className="mt-1 text-sm text-[#6f748a] dark:text-[#a8afc6]">
          Vue rapide de votre plan et de votre utilisation PDF.
        </p>
      </div>

      <Card className="card-pad">
        <div className="cards-grid-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Plan</p>
            <p className="mt-1 text-2xl font-semibold">{plan}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Utilisation PDF</p>
            <p className="mt-1 text-sm font-medium">
              {usage
                ? usage.pdf_exports_limit === null
                  ? `${usage.pdf_exports_used} export(s) ce mois (illimite)`
                  : `${usage.pdf_exports_used}/${usage.pdf_exports_limit} export(s) - ${usage.pdf_exports_remaining ?? 0} restant(s)`
                : "Aucune donnee"}
            </p>
          </div>
        </div>

        <div className="mt-4">
          <Button onClick={() => navigate("/settings/billing")}>
            Upgrade
          </Button>
        </div>
      </Card>
    </section>
  );
}
