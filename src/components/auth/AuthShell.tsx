import { ReactNode } from "react";

interface AuthShellProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

/** The four-point star from the logo, used as a quiet decorative motif. */
const Star = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 100 140" className={className} aria-hidden="true">
    <path
      fill="currentColor"
      d="M50 0C44 34 25 58 0 70c34 6 48 52 50 70 4-24 19-62 50-70C75 59 59 37 50 0z"
    />
  </svg>
);

const AuthShell = ({ children, title, subtitle }: AuthShellProps) => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-8 md:px-8 md:py-10">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-card shadow-nc md:grid-cols-[1fr_1.05fr]">
        {/* Brand panel */}
        <div className="relative overflow-hidden bg-sidebar px-6 py-6 text-sidebar-foreground md:flex md:flex-col md:justify-between md:p-12">
          <Star className="pointer-events-none absolute -right-10 -top-6 h-56 text-white/[0.04] md:h-80" />
          <Star className="pointer-events-none absolute -bottom-16 -left-12 h-48 text-gold/[0.08] md:h-64" />

          {/* Phones: compact horizontal lockup */}
          <img
            src="/brand/noor-circles-logo-horizontal-white.svg"
            alt="Noor Circles — A Circle of Light in Every Neighbourhood"
            className="relative h-11 w-auto md:hidden"
          />

          {/* Tablet/desktop: full stacked logo */}
          <div className="relative hidden md:block">
            <img
              src="/brand/noor-circles-logo-white.svg"
              alt="Noor Circles — A Circle of Light in Every Neighbourhood"
              className="h-44 w-auto"
            />
            <div className="mt-8 h-px w-12 bg-gold" />
            <p className="mt-5 max-w-sm text-[15px] leading-7 text-sidebar-foreground/85">{subtitle}</p>
          </div>

          <p className="relative mt-3 text-[13px] leading-6 text-sidebar-foreground/80 md:hidden">{subtitle}</p>
          <p className="relative hidden text-xs tracking-wide text-sidebar-foreground/55 md:block">
            Noor Circles Portal · {new Date().getFullYear()}
          </p>
        </div>

        {/* Form panel */}
        <div className="flex items-center bg-card px-5 py-7 sm:px-8 md:px-12 md:py-12">
          <div className="w-full space-y-6">
            <h1 className="font-serif text-[28px] leading-tight text-nc-dark md:text-3xl">{title}</h1>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthShell;
