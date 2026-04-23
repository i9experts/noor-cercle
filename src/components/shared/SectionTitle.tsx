interface SectionTitleProps {
  children?: React.ReactNode;
  title?: string;
  subtitle?: string;
}

export default function SectionTitle({ children, title, subtitle }: SectionTitleProps) {
  if (title || subtitle) {
    return (
      <div className="mb-6">
        <h1 className="font-serif text-[28px] text-foreground leading-tight">{title}</h1>
        {subtitle && <p className="text-[13px] text-nc-muted mt-1 font-sans">{subtitle}</p>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2.5 mb-[18px]">
      <h3 className="text-base font-semibold text-foreground">{children}</h3>
      <div className="flex-1 h-px bg-border" />
    </div>
  );
}
