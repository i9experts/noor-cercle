import { FormEvent, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import AuthShell from "@/components/auth/AuthShell";
import PasswordInput from "@/components/shared/PasswordInput";
import { PasswordRules, isPasswordValid } from "@/components/shared/PasswordRules";
import { usersService } from "@/services/api.service";
import { authService } from "@/services/auth.service";
import { homeFor, useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { apiError, unwrap } from "@/lib/finance";
import { rememberTempPassword, takeTempPassword } from "@/lib/tempPassword";

/** First sign-in with a temporary password: the person chooses their own. */
export default function SetPasswordPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, saveTokens, logout } = useAuth();
  const known = takeTempPassword();
  const [current, setCurrent] = useState(known ?? "");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  const mismatch = confirm.length > 0 && confirm !== password;
  const ok = isPasswordValid(password) && password === confirm && !!current && password !== current;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!user || !ok) return;
    setSaving(true);
    try {
      await usersService.changePassword({ currentPassword: current, newPassword: password });
      // Changing the password signs out every session, so sign in again with the new one.
      const d = unwrap(await authService.signin({ email: user.email, password }));
      saveTokens(d.accessToken, d.refreshToken, d.user);
      rememberTempPassword(null);
      toast({ title: "Password saved", description: "Welcome to Noor Circles." });
      navigate(homeFor(d.user.role), { replace: true });
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not save your password.") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthShell title="Choose your password" subtitle={`Assalam-o-Alaikum${user ? ` ${user.fullName.split(" ")[0]}` : ""}. You signed in with a temporary password; please choose your own to continue.`}>
      <form onSubmit={submit} className="space-y-4">
        {!known && (
          <div className="space-y-2">
            <label htmlFor="current" className="text-sm font-medium text-nc-dark">Temporary password</label>
            <PasswordInput id="current" required value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="The password you were sent" />
          </div>
        )}
        <div className="space-y-2">
          <label htmlFor="new-password" className="text-sm font-medium text-nc-dark">New password</label>
          <PasswordInput id="new-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Choose a password" autoComplete="new-password" />
          <PasswordRules password={password} />
        </div>
        <div className="space-y-2">
          <label htmlFor="confirm-password" className="text-sm font-medium text-nc-dark">Confirm new password</label>
          <PasswordInput id="confirm-password" required value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Type it again" autoComplete="new-password" />
          {mismatch && <p className="text-[12px] font-medium text-red-500">The passwords don’t match.</p>}
          {password && current && password === current && <p className="text-[12px] font-medium text-red-500">Choose a password different from the temporary one.</p>}
        </div>
        <Button type="submit" className="h-11 w-full bg-teal text-white hover:bg-teal-dk" disabled={saving || !ok}>
          {saving ? "Saving…" : "Save and continue"}
        </Button>
      </form>
      <button className="mx-auto block text-sm text-nc-muted hover:text-nc-dark" onClick={logout}>Sign out</button>
    </AuthShell>
  );
}
