"use client";

import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle } from "lucide-react";
import { usePathname } from "next/navigation";

import { captureClientError } from "@/lib/monitoring";

type BoundaryProps = {
  area: string;
  tokenPresent: boolean;
  children: ReactNode;
};

type BoundaryState = {
  hasError: boolean;
};

class PublicBriefingBoundaryInner extends Component<
  BoundaryProps & { pathname: string },
  BoundaryState
> {
  state: BoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    captureClientError(error, {
      area: this.props.area,
      tokenPresent: this.props.tokenPresent,
      path: this.props.pathname,
      componentStack: info.componentStack
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <main className="mx-auto max-w-2xl px-4 py-8">
          <div className="rounded-[28px] border border-[#dfe6f2] bg-white/95 p-8 text-center shadow-[0_20px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-[#111827]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-[20px] bg-amber-500/12 text-amber-600 dark:text-amber-300">
              <AlertTriangle size={22} />
            </div>
            <p className="text-lg font-semibold text-[#111827] dark:text-white">Impossible d’afficher ce briefing</p>
            <p className="mt-2 text-sm text-[#6f748a] dark:text-[#a8afc6]">
              Le lien semble valide, mais l’affichage a rencontré un problème inattendu. Réessaie ou demande un nouveau lien.
            </p>
          </div>
        </main>
      );
    }

    return this.props.children;
  }
}

export function PublicBriefingErrorBoundary(props: BoundaryProps) {
  const pathname = usePathname() ?? "";

  return (
    <PublicBriefingBoundaryInner
      {...props}
      pathname={pathname}
    />
  );
}
