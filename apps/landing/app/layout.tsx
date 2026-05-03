import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "@/styles.css";

export const metadata: Metadata = {
  title: {
    default: "BriefOPS — Briefings terrain pour équipes événementielles",
    template: "%s — BriefOPS"
  },
  description: "BriefOPS est le cockpit opérationnel pour monter, valider et partager des briefings terrain en quelques minutes. Conçu pour les professionnels de l'événementiel.",
  keywords: ["briefing événementiel", "gestion équipe terrain", "briefing PDF", "event ops", "staff briefing"],
  authors: [{ name: "Peak Events SRL" }],
  creator: "Peak Events SRL",
  publisher: "Peak Events SRL",
  metadataBase: new URL("https://events-ops.be"),
  openGraph: {
    type: "website",
    locale: "fr_BE",
    url: "https://events-ops.be",
    siteName: "BriefOPS",
    title: "BriefOPS — Briefings terrain pour équipes événementielles",
    description: "Montez, validez et partagez vos briefings terrain en quelques minutes. Le cockpit opérationnel pour professionnels de l'événementiel.",
    images: [
      {
        url: "/assets/og-image.png",
        width: 1200,
        height: 630,
        alt: "BriefOPS — Briefings terrain"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "BriefOPS — Briefings terrain pour équipes événementielles",
    description: "Montez, validez et partagez vos briefings terrain en quelques minutes.",
    images: ["/assets/og-image.png"]
  },
  icons: {
    icon: [
      { url: "/assets/logo.svg", type: "image/svg+xml" },
      { url: "/logo.ico", sizes: "48x48", type: "image/x-icon" }
    ],
    shortcut: "/logo.ico",
    apple: "/logo.ico"
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="font-sans">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
