import { ReactNode } from "react";
import { Link } from "react-router-dom";

import { Card } from "@/components/ui/Card";

type Props = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  backTo?: string;
  backLabel?: string;
};

export function PasswordPageShell({ eyebrow, title, description, children, backTo = "/login", backLabel = "Retour à la connexion" }: Props) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,#e7f0ff,transparent_42%),linear-gradient(180deg,#f8fbff_0%,#eef3fb_58%,#f4efe7_100%)] px-4 py-8 dark:bg-[#0b1120] sm:px-6">
      <Card className="w-full max-w-xl rounded-[32px] border-white/70 p-6 shadow-[0_30px_80px_rgba(20,30,60,0.12)] sm:p-8">
        <div className="mb-6">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-[20px] bg-brand-500 text-lg font-bold text-white shadow-panel">
            B
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600 dark:text-brand-400">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-[#111827] dark:text-white">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-[#6f748a] dark:text-[#a8afc6]">{description}</p>
        </div>

        {children}

        <div className="mt-6 border-t border-[#e8edf6] pt-5 dark:border-white/10">
          <Link className="text-sm font-medium text-brand-600 transition hover:text-brand-700 dark:text-brand-400" to={backTo}>
            {backLabel}
          </Link>
        </div>
      </Card>
    </div>
  );
}
