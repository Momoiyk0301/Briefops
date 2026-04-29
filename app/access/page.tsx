"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

export default function AccessPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    const response = await fetch("/api/access", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ password })
    });

    setIsSubmitting(false);

    if (!response.ok) {
      setError("Mot de passe incorrect.");
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-surface-page px-4 py-12 text-ink-strong">
      <section className="w-full max-w-sm rounded-2xl border border-surface-line bg-surface-card p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">BriefOPS MVP</p>
        <h1 className="mt-3 text-2xl font-semibold">Acces prive</h1>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-ink" htmlFor="access-password">
            Mot de passe
          </label>
          <input
            id="access-password"
            type="password"
            value={password}
            onChange={(event) => {
              setPassword(event.target.value);
              setError("");
            }}
            className="w-full rounded-xl border border-surface-lineStrong bg-surface-card px-4 py-3 text-base outline-none transition focus:border-brand-600 focus:ring-4 focus:ring-brand-500/15"
            autoComplete="current-password"
            autoFocus
          />
          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-xl bg-[#10203a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0d1a30] focus:outline-none focus:ring-4 focus:ring-[#10203a]/20"
          >
            {isSubmitting ? "Verification..." : "Entrer"}
          </button>
        </form>
      </section>
    </main>
  );
}
