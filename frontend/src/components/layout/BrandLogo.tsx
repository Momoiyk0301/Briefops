import { useState } from "react";

type Props = {
  className?: string;
  compact?: boolean;
};

export function BrandLogo({ className = "", compact = false }: Props) {
  const [useFallback, setUseFallback] = useState(false);

  if (useFallback) {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        <span className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/25 bg-white/14 text-sm font-bold text-white">
          B
        </span>
        {!compact ? <span className="text-sm font-semibold text-white">BriefOps</span> : null}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img
        src="/logo.png"
        alt="BriefOps"
        className="h-8 w-8 rounded-xl object-contain"
        onError={() => setUseFallback(true)}
      />
      {!compact ? <span className="text-sm font-semibold text-white">BriefOps</span> : null}
    </span>
  );
}
