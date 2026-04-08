import { useState } from "react";

type Props = {
  className?: string;
  compact?: boolean;
  size?: "sm" | "md";
};

export function BrandLogo({ className = "", compact = false, size = "sm" }: Props) {
  const [useFallback, setUseFallback] = useState(false);
  const logoSize = size === "md" ? "h-10 w-10 rounded-2xl" : "h-8 w-8 rounded-xl";
  const fallbackSize = size === "md" ? "h-10 w-10 rounded-2xl text-base" : "h-8 w-8 rounded-xl text-sm";
  const labelSize = size === "md" ? "text-base" : "text-sm";

  if (useFallback) {
    return (
      <span className={`inline-flex items-center gap-2 ${className}`}>
        <span className={`inline-flex items-center justify-center border border-white/25 bg-white/14 font-bold text-white ${fallbackSize}`}>
          B
        </span>
        {!compact ? <span className={`font-semibold text-white ${labelSize}`}>BriefOps</span> : null}
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img
        src="/assets/logo.svg"
        alt="BriefOps"
        className={`${logoSize} object-contain`}
        onError={() => setUseFallback(true)}
      />
      {!compact ? <span className={`font-semibold text-white ${labelSize}`}>BriefOps</span> : null}
    </span>
  );
}
