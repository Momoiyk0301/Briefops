import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";

import { getMe, toApiMessage } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Input } from "@/components/ui/Input";

export default function AccountPage() {
  const navigate = useNavigate();
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
  const usage = meQuery.data?.usage;
  const [phone, setPhone] = useState("");

  useEffect(() => {
    setPhone(localStorage.getItem("briefops:account:phone") ?? "");
  }, []);

  useEffect(() => {
    localStorage.setItem("briefops:account:phone", phone);
  }, [phone]);

  return (
    <section className="stack-page">
      <div>
        <h1 className="text-2xl font-bold">Compte</h1>
        <p className="mt-1 text-sm text-[#6f748a] dark:text-[#a8afc6]">Informations de votre profil utilisateur.</p>
      </div>

      <Card className="card-pad">
        <div className="cards-grid-2">
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
          <div>
            <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Restant PDF</p>
            <p className="mt-1 font-semibold">
              {usage?.pdf_exports_remaining === null
                ? "Illimité"
                : `${usage?.pdf_exports_remaining ?? 0} restant(s)`}
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-[#7f859b] dark:text-[#969eb8]">Téléphone</p>
            <div className="mt-1">
              <Input value={phone} onChange={(event) => setPhone(event.target.value)} placeholder="+33 ..." />
            </div>
          </div>
        </div>
        <div className="mt-5">
          <Button onClick={() => navigate("/settings/billing")}>Upgrade</Button>
        </div>
      </Card>
    </section>
  );
}
