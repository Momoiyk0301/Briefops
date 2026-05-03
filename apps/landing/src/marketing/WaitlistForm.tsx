"use client";

import { useState } from "react";

export function WaitlistForm({ source = "landing" }: { source?: string }) {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setStatus("loading");
    setErrorMsg("");

    const res = await fetch("/api/waitlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, source })
    });

    if (res.ok) {
      setStatus("success");
    } else {
      const data = await res.json().catch(() => ({}));
      setErrorMsg(data.error ?? "Une erreur est survenue");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-medium text-emerald-700">
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="7" stroke="#059669" strokeWidth="1.5" />
          <path d="M5 8l2 2 4-4" stroke="#059669" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Tu es sur la liste !
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap gap-2" noValidate>
      <input
        type="email"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="ton@email.com"
        className="h-11 min-w-[220px] flex-1 rounded-full border border-[#d4deef] bg-white px-5 text-sm text-[#10203a] placeholder:text-[#8a97b0] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/30"
        disabled={status === "loading"}
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="h-11 rounded-full bg-[#10203a] px-6 text-sm font-semibold text-white shadow-[0_20px_40px_rgba(16,32,58,0.18)] transition hover:bg-[#1d4ed8] disabled:opacity-60"
      >
        {status === "loading" ? "..." : "Rejoindre la liste"}
      </button>
      {status === "error" && (
        <p className="w-full text-xs text-red-600">{errorMsg}</p>
      )}
    </form>
  );
}
