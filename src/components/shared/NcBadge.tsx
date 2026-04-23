import { cn } from "@/lib/utils";

type BadgeVariant = 'green' | 'amber' | 'red' | 'teal' | 'purple' | 'dark' | 'slate';

interface NcBadgeProps {
  variant: BadgeVariant;
  children: React.ReactNode;
  className?: string;
}

const variants: Record<BadgeVariant, string> = {
  green: 'bg-nc-green-lt text-nc-green',
  amber: 'bg-nc-amber-lt text-nc-amber',
  red: 'bg-nc-red-lt text-nc-red',
  teal: 'bg-teal-lt text-teal',
  purple: 'bg-nc-purple-lt text-nc-purple',
  dark: 'bg-teal/[0.08] text-slate',
  slate: 'bg-muted text-nc-muted',
};

export default function NcBadge({ variant, children, className }: NcBadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold", variants[variant], className)}>
      {children}
    </span>
  );
}
