import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AuthShell from "@/components/auth/AuthShell";
import PasswordInput from "@/components/shared/PasswordInput";
import { PasswordRules, isPasswordValid } from "@/components/shared/PasswordRules";
import { authService } from "@/services/auth.service";
import { homeFor, useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiError, unwrap } from "@/lib/finance";

/** /welcome/:token, opened from a welcome or reset email: choose a password, then go straight in. */
export default function WelcomePage() {
  const { token = "" } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { saveTokens } = useAuth();
  const [who, setWho] = useState<{ fullName: string; email: string } | null>(null);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    authService.setPasswordInfo(token)
      .then((r) => setWho(unwrap(r)))
      .catch((err) => setError(apiError(err, "This link has expired or was already used.")));
  }, [token]);

  const ok = isPasswordValid(password) && password === confirm;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ok) return;
    setSaving(true);
    try {
      const d = unwrap(await authService.setPassword(token, password));
      saveTokens(d.accessToken, d.refreshToken, d.user);
      toast({ title: "Password saved", description: "Welcome to Noor Circles." });
      navigate(homeFor(d.user.role), { replace: true });
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not save your password.") });
      setSaving(false);
    }
  }

  if (error) {
    return (
      <AuthShell title="Link expired" subtitle="Set-password links work once, for 72 hours.">
        <p className="text-[14px] text-nc-dark">{error}</p>
        <p className="text-[13px] text-nc-muted">
          If you already chose a password, just sign in. Otherwise use “Forgot password?” on the sign-in page, or reply to the email you received.
        </p>
        <Link to="/signin" className="inline-flex h-11 w-full items-center justify-center rounded-md bg-teal text-sm font-medium text-white hover:bg-teal-dk">Go to sign in</Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Choose your password"
      subtitle={who ? `Assalam-o-Alaikum ${who.fullName.split(" ")[0]}. Choose a password for your Noor Circles account.` : "Checking your link…"}
    >
      {who && (
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-nc-dark">Email</label>
            <div className="rounded-md border border-input bg-muted px-3 py-2.5 text-sm text-nc-dark">{who.email}</div>
          </div>
          <div className="space-y-2">
            <label htmlFor="new-password" className="text-sm font-medium text-nc-dark">Password</label>
            <PasswordInput id="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Choose a password" autoComplete="new-password" />
            <PasswordRules password={password} />
          </div>
          <div className="space-y-2">
            <label htmlFor="confirm-password" className="text-sm font-medium text-nc-dark">Confirm password</label>
            <PasswordInput id="confirm-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Type it again" autoComplete="new-password" />
            {confirm && confirm !== password && <p className="text-[12px] font-medium text-red-500">The passwords don’t match.</p>}
          </div>
          <Button type="submit" className="h-11 w-full bg-teal text-white hover:bg-teal-dk" disabled={saving || !ok}>
            {saving ? "Saving…" : "Save and sign in"}
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
