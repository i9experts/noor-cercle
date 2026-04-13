import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  meta: string;
  color: 'teal' | 'gold' | 'green' | 'purple' | 'red';
  metaUp?: boolean;
}

const colorMap = {
  teal: 'bg-teal',
  gold: 'bg-gold',
  green: 'bg-nc-green',
  purple: 'bg-nc-purple',
  red: 'bg-nc-red',
};

export default function StatCard({ label, value, meta, color, metaUp }: StatCardProps) {
  return (
    <div className="bg-card border border-border rounded-lg p-5 relative overflow-hidden shadow-nc">
      <div className={cn("absolute top-0 left-0 w-1 h-full rounded-l-lg", colorMap[color])} />
      <div className="text-xs text-nc-muted font-medium uppercase tracking-wide mb-2">{label}</div>
      <div className="font-serif text-[32px] text-foreground leading-none">{value}</div>
      <div className={cn("text-xs mt-1.5", metaUp ? "text-nc-green" : "text-nc-muted")}>{meta}</div>
    </div>
  );
}
