import { Link, useSearchParams } from "react-router-dom";

import { Card } from "@/components/ui/Card";

export default function CheckEmailPage() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <Card className="card-pad w-full max-w-lg">
        <h1 className="text-2xl font-semibold">Email de confirmation envoye</h1>
        <p className="mt-2 text-sm text-[#6f748a] dark:text-[#a8afc6]">
          {email ? `Nous avons envoye un lien a ${email}.` : "Nous avons envoye un lien de confirmation."} Ouvre ton
          mail puis clique sur le lien pour activer ton compte.
        </p>
        <p className="mt-2 text-sm text-[#6f748a] dark:text-[#a8afc6]">
          Tu peux ensuite choisir Starter, Plus ou Pro et finaliser le paiement Stripe.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-panel transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-600"
          >
            Retour connexion
          </Link>
          <Link
            to="/account?fromSignup=1"
            className="inline-flex items-center justify-center rounded-full border border-[#e6e8ef] bg-white px-4 py-2 text-sm font-semibold text-[#111] transition dark:border-white/10 dark:bg-[#171717] dark:text-white"
          >
            Voir les offres
          </Link>
        </div>
      </Card>
    </div>
  );
}
