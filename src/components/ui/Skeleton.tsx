type Props = {
  className?: string;
};

export function Skeleton({ className = "" }: Props) {
  return <div className={`animate-pulse rounded-2xl bg-surface-chip dark:bg-[#222] ${className}`} />;
}
