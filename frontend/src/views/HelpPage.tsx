import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";

import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { getMe } from "@/lib/api";

const SUBJECTS = ["Question générale", "Bug", "Demande de fonctionnalité", "Demande Enterprise"] as const;

export default function HelpPage() {
  const meQuery = useQuery({ queryKey: ["me"], queryFn: getMe });
  const [params] = useSearchParams();
  const requestedSubject = params.get("subject");
  const defaultSubject = useMemo(() => {
    if (requestedSubject === "enterprise") return "Demande Enterprise";
    return "Question générale";
  }, [requestedSubject]);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState(defaultSubject);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [showErrors, setShowErrors] = useState(false);

  const effectiveName = name || meQuery.data?.workspace?.name || "";
  const effectiveEmail = email || meQuery.data?.user?.email || "";
  const isValid = Boolean(effectiveName.trim() && effectiveEmail.trim() && subject.trim() && message.trim());

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isValid) {
      setShowErrors(true);
      return;
    }

    setSubmitted(true);
    setShowErrors(false);
  };

  return (
    <section className="stack-page">
      <Card className="page-hero card-pad">
        <p className="section-kicker">Support</p>
        <h1 className="section-title mt-2">Aide</h1>
        <p className="section-copy mt-2">Pose une question, remonte un bug ou envoie une demande enterprise. Le formulaire confirme visuellement l’envoi pour ce MVP.</p>
      </Card>

      <Card className="card-pad">
        {submitted ? (
          <div className="rounded-[24px] border border-[#d8e8dd] bg-[#f4fbf6] p-4 text-sm text-[#256146] dark:border-[#28543d] dark:bg-[#102419] dark:text-[#92d3a9]">
            Message prepare. Nous reviendrons vers toi bientot.
          </div>
        ) : null}

        <form className="mt-4 grid gap-4" onSubmit={handleSubmit}>
          <Input
            aria-label="help-name"
            placeholder="Nom"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
          {showErrors && !effectiveName.trim() ? <p className="text-sm text-red-600">Le nom est requis.</p> : null}

          <Input
            aria-label="help-email"
            placeholder="Email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
          {showErrors && !effectiveEmail.trim() ? <p className="text-sm text-red-600">L’email est requis.</p> : null}

          <label className="grid gap-2 text-sm font-medium text-[#42506a] dark:text-[#c8d2ea]">
            Sujet
            <select
              aria-label="help-subject"
              className="rounded-[22px] border border-[#dce3f1] bg-white/96 px-4 py-3 text-sm outline-none dark:border-white/10 dark:bg-[#151515]"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
            >
              {SUBJECTS.map((entry) => (
                <option key={entry} value={entry}>
                  {entry}
                </option>
              ))}
            </select>
          </label>

          <Textarea
            aria-label="help-message"
            placeholder="Message"
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            rows={6}
          />
          {showErrors && !message.trim() ? <p className="text-sm text-red-600">Le message est requis.</p> : null}

          <div className="flex justify-end">
            <Button type="submit">Envoyer</Button>
          </div>
        </form>
      </Card>
    </section>
  );
}
