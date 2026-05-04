import type { Metadata } from "next";

import { AnalyticsGate } from "@/components/AnalyticsGate";
import "@/styles.css";

export const metadata: Metadata = {
  title: "BriefOps",
  description: "BriefOps MVP",
  icons: {
    icon: [
      { url: "/assets/logo.svg", type: "image/svg+xml" },
      { url: "/logo.ico", sizes: "48x48", type: "image/x-icon" }
    ],
    shortcut: "/logo.ico",
    apple: "/logo.ico"
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
      </head>
      <body className="font-sans">
        {children}
        <AnalyticsGate />
      </body>
    </html>
  );
}
