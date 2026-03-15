import type { Metadata } from "next";

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
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
