import { ImageResponse } from "next/og";

export const alt = "BriefOPS — Briefings terrain pour équipes événementielles";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0f1e38",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          position: "relative"
        }}
      >
        {/* Top: logo + brand */}
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              width: 52,
              height: 52,
              background: "#1d4ed8",
              borderRadius: 13,
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
          >
            <svg viewBox="0 0 20 20" width="28" height="28" fill="none" stroke="white" strokeWidth="1.7" strokeLinecap="round">
              <rect x="2" y="2" width="7" height="7" rx="1.5" />
              <rect x="11" y="2" width="7" height="7" rx="1.5" />
              <rect x="2" y="11" width="7" height="7" rx="1.5" />
              <rect x="11" y="11" width="7" height="7" rx="1.5" />
            </svg>
          </div>
          <span style={{ color: "white", fontSize: 28, fontWeight: 700, letterSpacing: "-0.5px" }}>
            BriefOPS
          </span>
        </div>

        {/* Center: headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 900 }}>
          <div
            style={{
              color: "white",
              fontSize: 58,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-1px"
            }}
          >
            Briefings terrain pour{" "}
            <span style={{ color: "#60a5fa" }}>équipes événementielles</span>
          </div>
          <div
            style={{
              color: "rgba(255,255,255,0.58)",
              fontSize: 24,
              lineHeight: 1.55,
              maxWidth: 720
            }}
          >
            Montez, validez et partagez vos briefings en quelques minutes.
            Conçu pour les professionnels de l'événementiel.
          </div>
        </div>

        {/* Bottom: chips + domain */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: 12 }}>
            {["Briefings modulaires", "Export PDF", "Partage par équipe"].map((label) => (
              <div
                key={label}
                style={{
                  background: "rgba(255,255,255,0.08)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  borderRadius: 999,
                  padding: "8px 18px",
                  color: "rgba(255,255,255,0.75)",
                  fontSize: 16,
                  fontWeight: 500
                }}
              >
                {label}
              </div>
            ))}
          </div>
          <span style={{ color: "rgba(255,255,255,0.28)", fontSize: 18, fontWeight: 500 }}>
            events-ops.be
          </span>
        </div>
      </div>
    ),
    { ...size }
  );
}
