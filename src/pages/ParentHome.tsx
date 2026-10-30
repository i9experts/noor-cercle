import { FormEvent, useCallback, useState } from "react";
import { KeyRound, LogOut, Mail } from "lucide-react";
import { familyService, usersService } from "@/services/api.service";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Modal, { FormGroup } from "@/components/shared/Modal";
import PasswordInput from "@/components/shared/PasswordInput";
import { PasswordRules, isPasswordValid } from "@/components/shared/PasswordRules";
import { apiError, unwrap } from "@/lib/finance";
import { FamilyScreen } from "./FamilyPage";
import EmailPreferences from "@/components/shared/EmailPreferences";

/** A signed-in parent's home: their family page, plus account actions. */
export default function ParentHome() {
  const { logout } = useAuth();
  const [pwOpen, setPwOpen] = useState(false);
  const [mailOpen, setMailOpen] = useState(false);
  const load = useCallback(() => familyService.mine(), []);

  const btn = "inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-white/20";
  return (
    <>
      <FamilyScreen
        load={load}
        actions={
          <div className="flex gap-2">
            <button className={btn} onClick={() => setMailOpen(true)} aria-label="Email settings">
              <Mail className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Emails</span>
            </button>
            <button className={btn} onClick={() => setPwOpen(true)} aria-label="Change password">
              <KeyRound className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Password</span>
            </button>
            <button className={btn} onClick={logout} aria-label="Sign out">
              <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        }
      />
      {pwOpen && <ChangePasswordModal onClose={() => setPwOpen(false)} />}
      {mailOpen && (
        <Modal open onClose={() => setMailOpen(false)} title="Email settings">
          <EmailPreferences only={["announcements"]} />
        </Modal>
      )}
    </>
  );
}

function ChangePasswordModal({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const { user, saveTokens } = useAuth();
  const [current, setCurrent] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);
  const ok = !!current && isPasswordValid(password) && password === confirm;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!ok || !user) return;
    setSaving(true);
    try {
      await usersService.changePassword({ currentPassword: current, newPassword: password });
      const d = unwrap(await authService.signin({ email: user.email, password }));
      saveTokens(d.accessToken, d.refreshToken, d.user);
      toast({ title: "Password changed." });
      onClose();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not change your password.") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Change password">
      <form onSubmit={submit}>
        <FormGroup label="Current password" required>
          <PasswordInput value={current} onChange={(e) => setCurrent(e.target.value)} autoComplete="current-password" />
        </FormGroup>
        <FormGroup label="New password" required>
          <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          <PasswordRules password={password} />
        </FormGroup>
        <FormGroup label="Confirm new password" required>
          <PasswordInput value={confirm} onChange={(e) => setConfirm(e.target.value)} autoComplete="new-password" />
          {confirm && confirm !== password && <p className="mt-1 text-[12px] font-medium text-red-500">The passwords don’t match.</p>}
        </FormGroup>
        <button type="submit" className="btn-primary w-full justify-center" disabled={saving || !ok}>{saving ? "Saving…" : "Change password"}</button>
      </form>
    </Modal>
  );
}
