import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

import { Card } from "@/components/ui/Card";
import { completeAuthRedirectSession } from "@/lib/auth";

export default function AuthConfirmedPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let active = true;

    void (async () => {
      try {
        const session = await completeAuthRedirectSession();
        if (!active) return;

        if (session) {
          navigate("/onboarding", { replace: true });
          return;
        }

        setState("ready");
      } catch (error) {
        if (!active) return;
        toast.error(error instanceof Error ? error.message : t("authFlow.confirmed.finalizeError"));
        setState("error");
      }
    })();

    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <div className="flex min-h-full items-center justify-center p-6">
      <Card className="card-pad w-full max-w-lg">
        <h1 className="text-2xl font-semibold">{t("authFlow.confirmed.title")}</h1>
        {state === "loading" ? (
          <p className="mt-2 text-sm text-[#6f748a] dark:text-[#a8afc6]">
            {t("authFlow.confirmed.loading")}
          </p>
        ) : null}
        {state === "ready" ? (
          <p className="mt-2 text-sm text-[#6f748a] dark:text-[#a8afc6]">
            {t("authFlow.confirmed.ready")}
          </p>
        ) : null}
        {state === "error" ? (
          <p className="mt-2 text-sm text-[#6f748a] dark:text-[#a8afc6]">
            {t("authFlow.confirmed.error")}
          </p>
        ) : null}
        <div className="mt-5">
          <Link
            to="/login"
            className="inline-flex items-center justify-center rounded-full bg-brand-500 px-4 py-2 text-sm font-semibold text-white shadow-panel transition-all duration-200 hover:-translate-y-0.5 hover:bg-brand-600"
          >
            {state === "loading" ? t("authFlow.confirmed.backToLogin") : t("authFlow.confirmed.signIn")}
          </Link>
        </div>
      </Card>
    </div>
  );
}
