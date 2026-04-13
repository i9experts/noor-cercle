import { cn } from "@/lib/utils";

interface TimelineItem {
  title: string;
  meta: string;
  dotColor?: 'teal' | 'gold' | 'green';
}

interface TimelineProps {
  items: TimelineItem[];
}

const dotColors = {
  teal: 'bg-teal',
  gold: 'bg-gold',
  green: 'bg-nc-green',
};

export default function Timeline({ items }: TimelineProps) {
  return (
    <div className="relative pl-6">
      <div className="absolute left-[7px] top-1 bottom-1 w-0.5 bg-border" />
      {items.map((item, i) => (
        <div key={i} className="relative mb-[18px]">
          <div className={cn("absolute -left-[21px] top-[3px] w-3.5 h-3.5 rounded-full border-2 border-card", dotColors[item.dotColor || 'teal'])} />
          <div className="bg-muted rounded-sm p-2.5 px-3.5">
            <div className="text-[13px] font-semibold text-foreground">{item.title}</div>
            <div className="text-[11px] text-nc-muted mt-0.5">{item.meta}</div>
          </div>
        </div>
      ))}
    </div>
  );
}
