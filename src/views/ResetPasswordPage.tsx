import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

import { PasswordPageShell } from "@/components/auth/PasswordPageShell";
import { PasswordUpdateForm } from "@/components/auth/PasswordUpdateForm";
import { Card } from "@/components/ui/Card";
import { completeAuthRedirectSession, getAuthRedirectErrorMessage, hasAuthCallbackParams, updatePassword, useAuth } from "@/lib/auth";
import { toApiMessage } from "@/lib/api";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
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
      setErrorMessage(t("resetPassword.invalidLink"));
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
      toast.success(t("resetPassword.updatedToast"));
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
      backLabel={status === "success" ? t("resetPassword.backToLogin") : t("resetPassword.requestNewLink")}
      description={t("resetPassword.description")}
      eyebrow={t("resetPassword.eyebrow")}
      title={t("resetPassword.title")}
    >
      {status === "checking" ? (
        <p className="text-sm text-[#6f748a] dark:text-[#a8afc6]">{t("resetPassword.checking")}</p>
      ) : null}

      {status === "invalid" ? (
        <Card className="rounded-[24px] border-[#f0d5da] bg-[#fff8f9] p-4 text-sm leading-6 text-[#8f3148] dark:border-[#4f2530] dark:bg-[#211419] dark:text-[#ff9cb0]">
          {t("resetPassword.noActiveLink")}
        </Card>
      ) : null}

      {status === "error" ? (
        <Card className="rounded-[24px] border-[#f0d5da] bg-[#fff8f9] p-4 text-sm leading-6 text-[#8f3148] dark:border-[#4f2530] dark:bg-[#211419] dark:text-[#ff9cb0]">
          {errorMessage ?? t("resetPassword.activateError")}
        </Card>
      ) : null}

      {status === "success" ? (
        <Card className="rounded-[24px] border-[#d8e8dd] bg-[#f4fbf6] p-4 text-sm leading-6 text-[#256146] dark:border-[#28543d] dark:bg-[#102419] dark:text-[#92d3a9]">
          {t("resetPassword.success")}
        </Card>
      ) : null}

      {status === "ready" ? (
        <PasswordUpdateForm
          helperText={t("resetPassword.helperText")}
          onSubmit={handleSubmit}
          pendingLabel={t("resetPassword.pendingLabel")}
          submitLabel={t("resetPassword.submitLabel")}
        />
      ) : null}
    </PasswordPageShell>
  );
}
