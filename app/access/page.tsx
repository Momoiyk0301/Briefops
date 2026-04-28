"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

const ACCESS_PASSWORD = process.env.NEXT_PUBLIC_SITE_ACCESS_PASSWORD ?? "briefops-mvp";

export default function AccessPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (password !== ACCESS_PASSWORD) {
      setError("Mot de passe incorrect.");
      return;
    }

    const secure = window.location.protocol === "https:" ? "; secure" : "";
    document.cookie = `site_access=granted; path=/; max-age=2592000; SameSite=Lax${secure}`;
    router.replace("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f8fc] px-4 py-12 text-[#10203a]">
      <section className="w-full max-w-sm rounded-2xl border border-[#dbe4f0] bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,0.08)]">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#5870a8]">BriefOPS MVP</p>
        <h1 className="mt-3 text-2xl font-semibold">Acces prive</h1>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-[#34445f]" htmlFor="access-password">
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
            className="w-full rounded-xl border border-[#cfd9e8] bg-white px-4 py-3 text-base outline-none transition focus:border-[#5870a8] focus:ring-4 focus:ring-[#5870a8]/15"
            autoComplete="current-password"
            autoFocus
          />
          {error ? <p className="text-sm font-medium text-red-600">{error}</p> : null}
          <button
            type="submit"
            className="w-full rounded-xl bg-[#10203a] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#0d1a30] focus:outline-none focus:ring-4 focus:ring-[#10203a]/20"
          >
            Entrer
          </button>
        </form>
      </section>
    </main>
  );
}
