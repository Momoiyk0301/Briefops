import { Link } from "react-router-dom";

import { Card } from "@/components/ui/Card";

export default function AuthConfirmedPage() {
  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <Card className="card-pad w-full max-w-lg">
        <h1 className="text-2xl font-semibold">Email confirme</h1>
        <p className="mt-2 text-sm text-[#6f748a] dark:text-[#a8afc6]">
          Ton email a ete valide. Tu peux maintenant acceder a ton espace BriefOPS.
        </p>
        <div className="mt-5">
          <Link
            to="/onboarding"
            className="inline-flex items-center justify-center rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-panel transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-600"
          >
            Continuer l'onboarding
          </Link>
        </div>
      </Card>
    </div>
  );
}
