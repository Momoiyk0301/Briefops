import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";

import "@/styles.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1
};

const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://peak-events.be/#organization",
      name: "Peak Events",
      url: "https://peak-events.be",
      logo: {
        "@type": "ImageObject",
        url: "https://events-ops.be/assets/logo.svg"
      },
      sameAs: []
    },
    {
      "@type": "WebSite",
      "@id": "https://events-ops.be/#website",
      url: "https://events-ops.be",
      name: "BriefOPS",
      description: "Cockpit opérationnel pour briefings terrain événementiels",
      publisher: { "@id": "https://peak-events.be/#organization" }
    },
    {
      "@type": "SoftwareApplication",
      "@id": "https://events-ops.be/#product",
      name: "BriefOPS",
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      description:
        "BriefOPS est le cockpit opérationnel pour monter, valider et partager des briefings terrain en quelques minutes. Conçu pour les professionnels de l'événementiel.",
      url: "https://events-ops.be",
      offers: {
        "@type": "Offer",
        price: "0",
        priceCurrency: "EUR",
        availability: "https://schema.org/ComingSoon"
      },
      publisher: { "@id": "https://peak-events.be/#organization" }
    }
  ]
};

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
        url: "/assets/logo.svg",
        alt: "BriefOPS — logo"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "BriefOPS — Briefings terrain pour équipes événementielles",
    description: "Montez, validez et partagez vos briefings terrain en quelques minutes.",
    images: ["/assets/logo.svg"]
  },
  icons: {
    icon: [
      { url: "/assets/logo.svg", type: "image/svg+xml" },
      { url: "/assets/logo.ico", sizes: "48x48", type: "image/x-icon" }
    ],
    shortcut: "/assets/logo.ico",
    apple: "/assets/logo.ico"
  },
  robots: {
    index: true,
    follow: true
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;1,9..40,400&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="font-sans">
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
