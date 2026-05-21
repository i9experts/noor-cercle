import { CheckCircle2, XCircle } from "lucide-react";

const RULES = [
  { label: "At least 8 characters",       test: (p: string) => p.length >= 8 },
  { label: "At least 1 uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { label: "At least 1 number",           test: (p: string) => /[0-9]/.test(p) },
];

export function isPasswordValid(password: string): boolean {
  return RULES.every((r) => r.test(password));
}

export function PasswordRules({ password }: { password: string }) {
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1">
      {RULES.map((rule) => {
        const ok = rule.test(password);
        return (
          <div
            key={rule.label}
            className={`flex items-center gap-1.5 text-[12px] font-medium transition-colors ${
              ok ? "text-green-600" : "text-red-500"
            }`}
          >
            {ok
              ? <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0" />
              : <XCircle      className="h-3.5 w-3.5 flex-shrink-0" />
            }
            {rule.label}
          </div>
        );
      })}
    </div>
  );
}