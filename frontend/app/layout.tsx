import type { Metadata } from "next";

import "@/styles.css";

export const metadata: Metadata = {
  title: "BriefOPS",
  description: "BriefOPS frontend"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
