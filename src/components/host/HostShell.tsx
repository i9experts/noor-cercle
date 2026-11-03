import { ReactNode, useState } from "react";
import { GraduationCap, Home, KeyRound, LogOut, Mail, Sparkles, Warehouse } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import Modal from "@/components/shared/Modal";
import ChangePasswordModal from "@/components/shared/ChangePasswordModal";
import EmailPreferences from "@/components/shared/EmailPreferences";
import { cn } from "@/lib/utils";

const pill = "inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-white/20";

const TABS = [
  { to: "/host",          end: true,  Icon: Home,          ur: "ہوم",       en: "Home" },
  { to: "/host/space",    end: false, Icon: Warehouse,     ur: "میری جگہ",  en: "My space" },
  { to: "/host/training", end: false, Icon: GraduationCap, ur: "تربیت",     en: "Training" },
  { to: "/host/founder",  end: false, Icon: Sparkles,      ur: "بانی",      en: "Founder" },
];

/** The host portal's frame: plum header band with the logo, account buttons and the page's tabs. */
export default function HostShell({ titleUr, titleEn, sub, children }: {
  /** The page heading, Urdu first with English beneath. */
  titleUr?: string;
  titleEn: string;
  sub?: ReactNode;
  children: ReactNode;
}) {
  const { logout } = useAuth();
  const [pwOpen, setPwOpen] = useState(false);
  const [mailOpen, setMailOpen] = useState(false);

  return (
    <div className="min-h-screen overflow-x-hidden bg-background">
      <header className="bg-plum px-4 pb-10 pt-6 text-white sm:px-6">
        <div className="mx-auto max-w-3xl">
          <div className="flex items-center justify-between gap-3">
            <Link to="/host" className="flex-shrink-0"><img src="/brand/noor-circles-logo-horizontal-white.svg" alt="Noor Circles" className="h-9" /></Link>
            <div className="flex flex-wrap justify-end gap-2">
              <Link to="/host/training" className={`${pill} !bg-gold !text-[#361a2c] hover:!brightness-105`} aria-label="Training">
                <GraduationCap className="h-3.5 w-3.5" />
                <span dir="rtl" lang="ur" className="urdu hidden leading-[1.6] sm:inline">تربیت</span>
                <span className="hidden sm:inline">· Training</span>
              </Link>
              <Link to="/host/founder" className={pill} aria-label="Meet the Founder">
                <Sparkles className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Founder</span>
              </Link>
              <button className={pill} onClick={() => setMailOpen(true)} aria-label="Email settings">
                <Mail className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Emails</span>
              </button>
              <button className={pill} onClick={() => setPwOpen(true)} aria-label="Change password">
                <KeyRound className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Password</span>
              </button>
              <button className={pill} onClick={logout} aria-label="Sign out">
                <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Sign out</span>
              </button>
            </div>
          </div>

          {titleUr && <h1 dir="rtl" lang="ur" className="urdu mt-6 text-right text-[26px] leading-[2] sm:text-[32px]">{titleUr}</h1>}
          <p className={cn(titleUr ? "text-right text-[13px] text-white/70" : "mt-6 font-serif text-[28px] leading-tight sm:text-[34px]")}>{titleEn}</p>
          {sub && <div className={cn("mt-1 text-[14px] text-white/80", titleUr && "text-right")}>{sub}</div>}

          <nav className="mt-5 flex flex-wrap gap-1.5" aria-label="Host portal">
            {TABS.map(({ to, end, Icon, ur, en }) => (
              <NavLink key={to} to={to} end={end}
                className={({ isActive }) => cn("inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[12.5px] font-medium",
                  isActive ? "bg-white text-plum" : "bg-white/10 text-white hover:bg-white/20")}>
                <Icon className="h-3.5 w-3.5" />
                <span dir="rtl" lang="ur" className="urdu leading-[1.6]">{ur}</span>
                <span className="hidden sm:inline">· {en}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto -mt-6 max-w-3xl space-y-5 px-4 pb-10 sm:px-6">
        {children}
        <footer className="pt-2 text-center text-[11.5px] text-nc-muted">Noor Circles · A Circle of Light in Every Neighbourhood</footer>
      </main>

      {pwOpen && <ChangePasswordModal onClose={() => setPwOpen(false)} />}
      {mailOpen && (
        <Modal open onClose={() => setMailOpen(false)} title="Email settings">
          <EmailPreferences only={["announcements"]} />
        </Modal>
      )}
    </div>
  );
}

/** A white card on the host pages, with an Urdu heading and English beneath (both on the right). */
export function HostCard({ ur, en, icon, children, className, action }: {
  ur?: string; en: string; icon?: ReactNode; children: ReactNode; className?: string;
  /** A small button or link shown opposite the heading. */
  action?: ReactNode;
}) {
  return (
    <section className={cn("rounded-xl border border-border bg-card p-4 shadow-nc sm:p-6", className)}>
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex-shrink-0">{action}</div>
        <div className="min-w-0 text-right">
          {ur && <h2 dir="rtl" lang="ur" className="urdu flex items-center gap-2 text-[19px] leading-[2] text-nc-dark">{icon}<span>{ur}</span></h2>}
          <p className={cn(ur ? "text-[12px] text-nc-muted" : "flex items-center justify-end gap-2 font-serif text-[20px] text-nc-dark")}>{!ur && icon}{en}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

/** Urdu line with its English beneath. */
export function Bi({ ur, en, className, urCls = "text-[15px]", enCls = "text-[12.5px] text-nc-muted", enLeft }: {
  ur: string; en: string; className?: string; urCls?: string; enCls?: string;
  /** Long English text reads better from the left. */
  enLeft?: boolean;
}) {
  return (
    <div className={className}>
      <p dir="rtl" lang="ur" className={cn("urdu text-right leading-[2.1] text-nc-dark", urCls)}>{ur}</p>
      <p className={cn(enLeft ? "text-left" : "text-right", enCls)}>{en}</p>
    </div>
  );
}
