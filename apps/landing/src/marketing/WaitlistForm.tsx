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
      <div style={{
        display: "inline-flex", alignItems: "center", gap: 8,
        padding: "10px 18px", borderRadius: "var(--r-md)",
        background: dark ? "rgba(255,255,255,0.08)" : "#ecfdf5",
        border: dark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #86efac",
        color: dark ? "rgba(255,255,255,0.85)" : "#15803d",
        fontSize: 13, fontWeight: 600
      }}>
        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5" />
          <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Tu es sur la liste !
      </div>
    );
  }

  if (dark) {
    return (
      <form onSubmit={handleSubmit} className="waitlist-form" noValidate>
        <div className="waitlist-input-row">
          <input
            type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="ton@email.com"
            className="waitlist-input"
            disabled={status === "loading"}
          />
          <button type="submit" className="btn-waitlist-form" disabled={status === "loading"}>
            {status === "loading" ? "..." : "Rejoindre →"}
          </button>
        </div>
        <p className="waitlist-note">Aucun engagement · Accès anticipé gratuit · Pas de CB</p>
        {status === "error" && <p style={{ fontSize: 11, color: "#fca5a5", marginTop: 4 }}>{errorMsg}</p>}
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate style={{ display: "flex", flexDirection: "column", gap: 0, maxWidth: 400 }}>
      <button
        type="submit"
        disabled={status === "loading"}
        style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          width: "100%", maxWidth: 400,
          background: "var(--accent)", color: "#fff",
          border: "none", borderRadius: "var(--r-lg)", cursor: "pointer",
          padding: "16px 28px", fontSize: 15, fontWeight: 700,
          fontFamily: "var(--ff-head)", letterSpacing: "-0.02em",
          textAlign: "left",
          boxShadow: "0 8px 24px oklch(49% 0.22 258 / 0.32)",
          transition: "background 0.15s, transform 0.1s, box-shadow 0.15s"
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          el.style.background = "var(--accent-h)";
          el.style.transform = "translateY(-2px)";
          el.style.boxShadow = "0 12px 32px oklch(49% 0.22 258 / 0.38)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.background = "var(--accent)";
          el.style.transform = "translateY(0)";
          el.style.boxShadow = "0 8px 24px oklch(49% 0.22 258 / 0.32)";
        }}
      >
        <span>{status === "loading" ? "..." : "Rejoindre la waitlist"}</span>
        <span style={{ fontSize: 18 }}>→</span>
      </button>
      {status === "error" && <p style={{ fontSize: 11, color: "#dc2626", marginTop: 6 }}>{errorMsg}</p>}
    </form>
  );
}
