import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { getMe } from "@/lib/api";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";

export default function BillingPage() {
  const { t } = useTranslation();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });

  return (
    <Card className="max-w-2xl">
      <h1 className="text-xl font-semibold">{t("billing.title")}</h1>
      <p className="mt-2">{t("nav.plan")}: {meQuery.data?.plan ?? "unknown"}</p>
      <p className="mt-1 text-sm text-slate-500">{t("billing.freeLimit")}</p>
      <Button className="mt-4" onClick={() => toast(t("app.soon"))}>{t("billing.upgrade")}</Button>
    </Card>
  );
}
