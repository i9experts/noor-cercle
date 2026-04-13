import { cn } from "@/lib/utils";

interface NcCardProps {
  children: React.ReactNode;
  className?: string;
  small?: boolean;
}

export default function NcCard({ children, className, small }: NcCardProps) {
  return (
    <div className={cn("bg-card border border-border rounded-lg shadow-nc", small ? "p-4 px-5" : "p-6", className)}>
      {children}
    </div>
  );
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn("flex items-center justify-between mb-5", className)}>{children}</div>;
}

export function CardTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div>
      <div className="text-[15px] font-semibold text-foreground">{children}</div>
      {sub && <div className="text-xs text-nc-muted mt-0.5">{sub}</div>}
    </div>
  );
}
