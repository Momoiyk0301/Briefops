import type { Metadata } from "next";

import "@/styles.css";

export const metadata: Metadata = {
  title: "BriefOps",
  description: "BriefOps MVP",
  icons: {
    icon: "/logo.ico",
    shortcut: "/logo.ico",
    apple: "/logo.ico"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
