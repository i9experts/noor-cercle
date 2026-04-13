interface SectionTitleProps {
  children: React.ReactNode;
}

export default function SectionTitle({ children }: SectionTitleProps) {
  return (
    <div className="flex items-center gap-2.5 mb-[18px]">
      <h3 className="text-base font-semibold text-foreground">{children}</h3>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
