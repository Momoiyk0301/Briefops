type Props = {
  className?: string;
};

export function Skeleton({ className = "" }: Props) {
  return <div className={`animate-pulse rounded-md bg-slate-200/80 dark:bg-slate-800/80 ${className}`} />;
}
