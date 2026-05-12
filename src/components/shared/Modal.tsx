import { useEffect, useState } from "react";
import { X, Eye, EyeOff } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}

export default function Modal({ open, onClose, title, subtitle, children }: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (open) document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/45 z-[200] flex items-center justify-center" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-card rounded-lg p-8 w-[560px] max-w-[95vw] max-h-[90vh] overflow-y-auto relative">
        <button className="absolute top-5 right-5 bg-muted border-none w-8 h-8 rounded-full cursor-pointer text-base text-nc-muted flex items-center justify-center hover:bg-teal-lt" onClick={onClose}><X className="h-4 w-4" /></button>
        <div className="font-serif text-[22px] text-foreground mb-1.5">{title}</div>
        {subtitle && <div className="text-[13px] text-nc-muted mb-6">{subtitle}</div>}
        {children}
      </div>
    </div>
  );
}

export function FormGroup({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="mb-[18px]">
      <label className="block text-[13px] font-medium text-slate mb-1.5">
        {label}{required && <span className="text-nc-red"> *</span>}
      </label>
      {children}
    </div>
  );
}

export function FormInput(props: React.ComponentPropsWithoutRef<'input'>) {
  const { className, ...rest } = props;
  return (
    <input
      {...rest}
      className={`w-full px-3.5 py-2.5 border border-border rounded-sm text-sm text-foreground bg-card focus:border-teal focus:shadow-[0_0_0_3px_rgba(14,107,114,0.08)] outline-none transition-colors ${className ?? ''}`}
    />
  );
}

export function FormSelect(props: React.ComponentPropsWithoutRef<'select'>) {
  const { className, children, ...rest } = props;
  return (
    <select
      {...rest}
      className={`w-full px-3.5 py-2.5 border border-border rounded-sm text-sm text-foreground bg-card focus:border-teal focus:shadow-[0_0_0_3px_rgba(14,107,114,0.08)] outline-none transition-colors ${className ?? ''}`}
    >
      {children}
    </select>
  );
}

export function FormTextarea(props: React.ComponentPropsWithoutRef<'textarea'>) {
  const { className, ...rest } = props;
  return (
    <textarea
      {...rest}
      className={`w-full px-3.5 py-2.5 border border-border rounded-sm text-sm text-foreground bg-card focus:border-teal focus:shadow-[0_0_0_3px_rgba(14,107,114,0.08)] outline-none transition-colors resize-y min-h-[80px] ${className ?? ''}`}
    />
  );
}

export function FormPasswordInput(props: React.ComponentPropsWithoutRef<'input'>) {
  const [show, setShow] = useState(false);
  const { className, ...rest } = props;
  return (
    <div className="relative">
      <input
        {...rest}
        type={show ? "text" : "password"}
        className={`w-full px-3.5 py-2.5 pr-10 border border-border rounded-sm text-sm text-foreground bg-card focus:border-teal focus:shadow-[0_0_0_3px_rgba(14,107,114,0.08)] outline-none transition-colors ${className ?? ''}`}
      />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-nc-muted hover:text-foreground transition-colors"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

export function FormRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-4">{children}</div>;
}
