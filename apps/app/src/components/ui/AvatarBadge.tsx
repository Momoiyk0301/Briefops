type Props = {
  label: string;
  imageUrl?: string | null;
  initials: string;
  className?: string;
};

export function AvatarBadge({ label, imageUrl, initials, className = "" }: Props) {
  if (imageUrl) {
    return <img src={imageUrl} alt={label} className={`h-9 w-9 rounded-full object-cover ${className}`.trim()} />;
  }

  return (
    <span className={`inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand-500/15 text-xs font-semibold text-brand-600 dark:text-brand-300 ${className}`.trim()}>
      {initials}
    </span>
  );
}
