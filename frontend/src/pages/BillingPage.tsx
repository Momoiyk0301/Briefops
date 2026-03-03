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
    <Card className="max-w-2xl border-l-4 border-l-brand-500">
      <h1 className="text-2xl font-semibold">{t("billing.title")}</h1>
      <p className="mt-2">{t("nav.plan")}: <span className="font-semibold">{meQuery.data?.plan ?? "unknown"}</span></p>
      <p className="mt-1 text-sm text-slate-500">{t("billing.freeLimit")}</p>
      <Button className="mt-4" onClick={() => toast(t("app.soon"))} withArrow>{t("billing.upgrade")}</Button>
    </Card>
  );
}
