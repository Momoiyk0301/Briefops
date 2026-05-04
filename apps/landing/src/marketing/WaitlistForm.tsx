"use client";

import { useState } from "react";

export function WaitlistForm({ source = "landing", dark = false }: { source?: string; dark?: boolean }) {
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
      <div
        className="inline-flex items-center gap-2 rounded-[12px] px-5 py-3 text-sm font-medium"
        style={{
          background: dark ? "rgba(255,255,255,0.1)" : "#f0fdf4",
          border: dark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #bbf7d0",
          color: dark ? "rgba(255,255,255,0.85)" : "#15803d"
        }}
      >
        <svg width="15" height="15" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Tu es sur la liste !
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-[400px]" noValidate>
      <div
        className="flex w-full overflow-hidden rounded-[14px]"
        style={{
          border: dark ? "1px solid rgba(255,255,255,0.15)" : "1px solid var(--border-2, #cbd5e8)",
          boxShadow: dark
            ? "0 8px 24px rgba(0,0,0,0.3)"
            : "0 8px 24px oklch(49% 0.22 258 / 0.32)"
        }}
      >
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="ton@email.com"
          className="h-12 flex-1 min-w-0 bg-transparent px-4 text-[14px] outline-none placeholder:opacity-50"
          style={{
            color: dark ? "#fff" : "var(--ink, #0b1525)",
            background: dark ? "rgba(255,255,255,0.07)" : "#fff",
            fontFamily: "var(--font-body, 'DM Sans', sans-serif)"
          }}
          disabled={status === "loading"}
        />
        <button
          type="submit"
          disabled={status === "loading"}
          className="flex shrink-0 items-center gap-2 px-5 text-[14px] font-bold text-white disabled:opacity-60 transition hover:-translate-y-px"
          style={{
            background: dark ? "oklch(55% 0.22 258)" : "oklch(49% 0.22 258)",
            fontFamily: "var(--font-display, 'Space Grotesk', sans-serif)",
            letterSpacing: "-0.01em"
          }}
        >
          {status === "loading" ? "..." : "Rejoindre →"}
        </button>
      </div>
      {status === "error" && (
        <p className="mt-2 text-xs" style={{ color: dark ? "#fca5a5" : "#dc2626" }}>{errorMsg}</p>
      )}
    </form>
  );
}
