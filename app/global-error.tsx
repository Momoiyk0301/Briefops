"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html>
      <body className="bg-[linear-gradient(180deg,#f7fbff_0%,#eef4ff_48%,#fff7ef_100%)] text-[#10203a]">
        <main className="flex min-h-screen items-center justify-center px-6 py-10">
          <div className="w-full max-w-xl rounded-[32px] border border-white/70 bg-white/90 p-8 shadow-[0_28px_80px_rgba(15,23,42,0.1)]">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-[#6680aa]">Erreur application</p>
            <h1 className="mt-4 text-3xl font-semibold">Impossible d’afficher cette page</h1>
            <p className="mt-3 text-sm leading-7 text-[#576781]">
              Une erreur inattendue est survenue. L’incident a été remonté pour diagnostic et tu peux relancer l’affichage.
            </p>
            {error.digest ? (
              <p className="mt-2 text-xs text-[#7d8ca5]">Référence: {error.digest}</p>
            ) : null}
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={reset}
                className="rounded-full bg-[#10203a] px-5 py-3 text-sm font-semibold text-white"
              >
                Réessayer
              </button>
              <a
                className="rounded-full border border-[#d4deef] bg-white px-5 py-3 text-sm font-medium text-[#29436c]"
                href="/briefings"
              >
                Ouvrir l’app
              </a>
            </div>
          </div>
        </main>
      </body>
    </html>
  );
}
