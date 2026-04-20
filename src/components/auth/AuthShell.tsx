import { ReactNode } from "react";

interface AuthShellProps {
  children: ReactNode;
  title: string;
  subtitle: string;
}

const AuthShell = ({ children, title, subtitle }: AuthShellProps) => {
  return (
    <div className="min-h-screen bg-background px-4 py-10 md:px-8 flex items-center justify-center">
      <div className="grid w-full max-w-6xl overflow-hidden rounded-2xl border border-border bg-card shadow-sm md:grid-cols-2">
        <div className="flex flex-col justify-between bg-sidebar p-8 text-sidebar-foreground md:p-12">
          <div>
            <img
              src="/noor-circle-logo-white.png"
              alt="Noor Circle logo"
              className="h-24 w-auto object-contain"
            />
            <p className="mt-6 max-w-sm text-sm leading-6 text-sidebar-foreground/80">{subtitle}</p>
          </div>
          <p className="text-xs text-sidebar-foreground/60">Noor Circle Portal · 2026</p>
        </div>

        <div className="flex items-center bg-white p-5 md:p-10">
          <div className="w-full space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl serif text-nc-dark">{title}</h1>
            </div>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthShell;
