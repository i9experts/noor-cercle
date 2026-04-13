import { cn } from "@/lib/utils";

interface ProgressBarProps {
  value: number;
  color?: 'teal' | 'gold' | 'green';
  className?: string;
}

const fillColors = {
  teal: 'bg-teal',
  gold: 'bg-gold',
  green: 'bg-nc-green',
};

export default function ProgressBar({ value, color = 'teal', className }: ProgressBarProps) {
  return (
    <div className={cn("h-1.5 bg-teal-lt rounded-full overflow-hidden", className)}>
      <div
        className={cn("h-full rounded-full transition-all duration-700 ease-out", fillColors[color])}
        style={{ width: `${value}%` }}
      />
    </div>
  );
}
