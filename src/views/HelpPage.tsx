import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

import { getMe } from "@/lib/api";
import { getErrorMessage } from "@/lib/errorMessages";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";

export default function HelpPage() {
  const { t } = useTranslation();
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const [params] = useSearchParams();
  const requestedSubject = params.get("subject");
  const subjects = [
    t("help.subjects.general"),
    t("help.subjects.bug"),
    t("help.subjects.feature"),
    t("help.subjects.enterprise")
  ] as const;
  const defaultSubject = useMemo(() => {
    if (requestedSubject === "enterprise") return t("help.subjects.enterprise");
    return t("help.subjects.general");
  }, [requestedSubject, t]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const effectiveName = name || meQuery.data?.workspace?.name || "";
  const effectiveEmail = email || meQuery.data?.user?.email || "";
  const isValid = Boolean(effectiveName.trim() && effectiveEmail.trim() && subject.trim() && message.trim());

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) {
      setShowErrors(true);
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: effectiveName,
          email: effectiveEmail,
          subject,
          message,
          context: {
            userId: meQuery.data?.user?.id ?? null,
            workspaceId: meQuery.data?.workspace?.id ?? null,
            currentUrl: window.location.href,
            userAgent: window.navigator.userAgent,
            timestamp: new Date().toISOString(),
            appVersion: "0.1.0"
          }
        })
      });

      if (!response.ok) {
        throw new Error("SUPPORT_REQUEST_FAILED");
      }

      setSubmitted(true);
      setShowErrors(false);
    } catch (error) {
      toast.error(getErrorMessage(error instanceof Error ? error.message : "SUPPORT_REQUEST_FAILED"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleReportIssue = () => {
    setSubject(t("help.subjects.bug"));
    setSubmitted(false);
  };

  return (
    <section className="stack-page">
      <Card className="page-hero card-pad">
        <p className="section-kicker">{t("help.kicker")}</p>
        <h1 className="section-title mt-2">{t("help.title")}</h1>
        <p className="section-copy mt-2">{t("help.subtitle")}</p>
        <div className="mt-5">
          <Button type="button" onClick={handleReportIssue}>
            {t("actions.REPORT_ISSUE")}
          </Button>
        </div>
      </Card>

      <Card className="card-pad">
        {submitted ? (
          <div className="rounded-[24px] border border-[#d8e8dd] bg-[#f4fbf6] p-4 text-sm text-[#256146] dark:border-[#28543d] dark:bg-[#102419] dark:text-[#92d3a9]">
            {t("success.SUPPORT_SENT")}
          </div>
        ) : null}

        <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
          <Input
            aria-label="help-name"
            placeholder={t("help.placeholders.name")}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          {showErrors && !effectiveName.trim() ? <p className="text-sm text-red-600">{t("help.errors.name")}</p> : null}

          <Input
            aria-label="help-email"
            placeholder={t("help.placeholders.email")}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {showErrors && !effectiveEmail.trim() ? <p className="text-sm text-red-600">{t("help.errors.email")}</p> : null}

          <label className="grid gap-2 text-sm font-medium text-[#42506a] dark:text-[#c8d2ea]">
            {t("help.subjectLabel")}
            <select
              aria-label="help-subject"
              className="rounded-[22px] border border-[#dce3f1] bg-white/96 px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-[#151515]"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            >
              {subjects.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </label>

          <Textarea
            aria-label="help-message"
            placeholder={t("help.placeholders.message")}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={6}
          />
          {showErrors && !message.trim() ? <p className="text-sm text-red-600">{t("help.errors.message")}</p> : null}

          <div className="flex justify-end">
            <Button type="submit" disabled={submitting}>
              {submitting ? t("help.submitting") : t("help.submit")}
            </Button>
          </div>
        </form>
      </Card>
    </section>
  );
}
