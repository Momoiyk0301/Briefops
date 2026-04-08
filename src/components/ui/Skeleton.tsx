type Props = {
  className?: string;
};

export function Skeleton({ className = "" }: Props) {
  return <div className={`animate-pulse rounded-2xl bg-[#eceef7] dark:bg-[#222] ${className}`} />;
}
