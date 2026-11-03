import { FormEvent, useState } from "react";
import { usersService } from "@/services/api.service";
import { authService } from "@/services/auth.service";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Modal, { FormGroup } from "@/components/shared/Modal";
import PasswordInput from "@/components/shared/PasswordInput";
import { PasswordRules, isPasswordValid } from "@/components/shared/PasswordRules";
import { apiError, unwrap } from "@/lib/finance";

/** Change your password (parent and host portals); signs in again with the new one. */
export default function ChangePasswordModal({ onClose }: { onClose: () => void }) {
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
