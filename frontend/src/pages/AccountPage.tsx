import { useQuery } from "@tanstack/react-query";

import { getMe, toApiMessage } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

export default function AccountPage() {
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });

  if (meQuery.isLoading) {
    return <Card>Chargement du compte...</Card>;
  }
  if (meQuery.error) {
    return <Card>{toApiMessage(meQuery.error)}</Card>;
  }

  const user = meQuery.data?.user;
  const org = meQuery.data?.org;
  const role = meQuery.data?.role ?? "member";
  const plan = meQuery.data?.plan ?? "free";

  return (
    <section className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Compte</h1>
        <p className="mt-1 text-sm text-[#6f748a] dark:text-[#a8afc6]">Informations de votre profil utilisateur.</p>
      </div>

      <Card className="p-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Email</p>
            <p className="mt-1 font-semibold">{user?.email ?? "Non disponible"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">ID utilisateur</p>
            <p className="mt-1 font-semibold">{user?.id ?? "Non disponible"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Organisation</p>
            <p className="mt-1 font-semibold">{org?.name ?? "Aucune"}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Rôle</p>
            <div className="mt-1"><Badge>{role}</Badge></div>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Plan</p>
            <div className="mt-1"><Badge>{plan}</Badge></div>
          </div>
        </div>
      </Card>
    </section>
  );
}
