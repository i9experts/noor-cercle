import { BadgeCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { BADGE_NAME } from "@/lib/course";

/** The "Certified Asaas Murabbi" badge earned by completing the Asaas course. */
export default function CertifiedBadge({ label = BADGE_NAME, size = "sm", className }: { label?: string; size?: "sm" | "md"; className?: string }) {
  return (
    <span
      title={label}
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-gold/40 bg-gold/10 font-semibold text-gold-dim",
        size === "md" ? "px-3 py-1 text-[12.5px]" : "px-2 py-0.5 text-[11px]",
        className,
      )}
    >
      <BadgeCheck className={size === "md" ? "h-4 w-4" : "h-3.5 w-3.5"} />
      {label}
    </span>
  );
}
