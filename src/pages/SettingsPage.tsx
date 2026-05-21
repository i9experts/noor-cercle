import { FormEvent, useEffect, useState } from 'react';
import NcCard, { CardHeader, CardTitle } from '@/components/shared/NcCard';
import SectionTitle from '@/components/shared/SectionTitle';
import PasswordInput from '@/components/shared/PasswordInput';
import { PasswordRules, isPasswordValid } from '@/components/shared/PasswordRules';
import { usersService } from '@/services/api.service';
import { useToast } from '@/hooks/use-toast';
import { User, Shield, Lock, Building2, CalendarDays, BadgeCheck } from 'lucide-react';

function getApiError(error: unknown): string | null {
  const msg = (error as any)?.response?.data?.message;
  return typeof msg === 'string' && msg.length > 0 ? msg : null;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1.5">
      {children}
    </label>
  );
}

export default function SettingsPage() {
  const { toast } = useToast();

  const [profile, setProfile] = useState({ fullName: '', email: '', role: '' });
  const [saving,  setSaving]  = useState(false);

  const [pwForm,    setPwForm]    = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwTouched, setPwTouched] = useState(false);
  const [pwSaving,  setPwSaving]  = useState(false);

  useEffect(() => {
    usersService.getMe().then((res) => {
      const u = res.data.data || res.data;
      setProfile({ fullName: u.fullName || '', email: u.email || '', role: u.role || '' });
    }).catch(() => {});
  }, []);

  const handleProfileSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await usersService.updateMe({ fullName: profile.fullName });
      const u = res.data.data || res.data;
      setProfile((p) => ({ ...p, fullName: u.fullName }));
      toast({ title: 'Profile updated!' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Update failed', description: getApiError(err) || 'Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordSave = async (e: FormEvent) => {
    e.preventDefault();
    setPwTouched(true);
    if (!isPasswordValid(pwForm.newPassword)) {
      toast({ variant: 'destructive', title: 'Password too weak', description: 'Please meet all password requirements.' });
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast({ variant: 'destructive', title: 'Passwords do not match' });
      return;
    }
    setPwSaving(true);
    try {
      await usersService.changePassword({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword });
      setPwForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setPwTouched(false);
      toast({ title: 'Password changed!', description: 'Your new password is active.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Password change failed', description: getApiError(err) || 'Please try again.' });
    } finally {
      setPwSaving(false);
    }
  };

  const initials = profile.fullName
    ? profile.fullName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?';

  return (
    <div className="page-animate max-w-4xl">
      <SectionTitle title="Settings" subtitle="Manage your account details and security preferences." />

      {/* ── Profile ─────────────────────────────────────────── */}
      <NcCard className="mb-5">
        <CardHeader className="pb-5 border-b border-border mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-teal-lt">
              <User className="h-4 w-4 text-teal" />
            </div>
            <CardTitle sub="Update your display name">Profile</CardTitle>
          </div>
        </CardHeader>

        {/* Avatar strip */}
        <div className="flex items-center gap-4 mb-6 p-4 rounded-lg bg-secondary border border-border">
          <div className="flex-shrink-0 flex items-center justify-center w-14 h-14 rounded-full bg-teal text-white font-semibold text-lg shadow-nc select-none">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold text-foreground leading-tight truncate">
              {profile.fullName || '—'}
            </p>
            <p className="text-[13px] text-nc-muted mt-0.5 truncate">{profile.email}</p>
            <span className="inline-block mt-1.5 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-teal-lt text-teal capitalize">
              {profile.role || 'Member'}
            </span>
          </div>
        </div>

        <form onSubmit={handleProfileSave} className="flex flex-col gap-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <FieldLabel>Full Name</FieldLabel>
              <input
                type="text" required
                className="w-full px-3.5 py-2.5 border border-border rounded-md text-sm bg-card focus:border-teal focus:shadow-[0_0_0_3px_rgba(14,107,114,0.08)] outline-none transition-all"
                value={profile.fullName}
                onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <FieldLabel>Role</FieldLabel>
              <div className="w-full px-3.5 py-2.5 border border-border rounded-md text-sm bg-muted text-nc-muted capitalize select-none">
                {profile.role || '—'}
              </div>
            </div>
          </div>

          <div>
            <FieldLabel>Email Address</FieldLabel>
            <div className="relative">
              <div className="w-full px-3.5 py-2.5 border border-border rounded-md text-sm bg-muted text-nc-muted select-none pr-24 truncate">
                {profile.email || '—'}
              </div>
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-nc-muted bg-border/40 px-1.5 py-0.5 rounded">
                Read-only
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between gap-4">
            <p className="text-[11px] text-nc-muted">Only your name can be edited.</p>
            <button type="submit" className="btn-primary flex-shrink-0" disabled={saving}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </form>
      </NcCard>

      {/* ── Change Password ──────────────────────────────────── */}
      <NcCard className="mb-5">
        <CardHeader className="pb-5 border-b border-border mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gold-lt">
              <Lock className="h-4 w-4 text-gold" />
            </div>
            <CardTitle sub="Keep your account secure with a strong password">Change Password</CardTitle>
          </div>
        </CardHeader>

        <form onSubmit={handlePasswordSave} className="flex flex-col gap-5">
          <div>
            <FieldLabel>Current Password</FieldLabel>
            <PasswordInput
              required
              placeholder="Enter your current password"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
              disabled={pwSaving}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <FieldLabel>New Password</FieldLabel>
              <PasswordInput
                required
                placeholder="Min 8 chars, uppercase & number"
                value={pwForm.newPassword}
                onChange={(e) => { setPwForm((p) => ({ ...p, newPassword: e.target.value })); setPwTouched(true); }}
                disabled={pwSaving}
              />
              {pwTouched && <PasswordRules password={pwForm.newPassword} />}
            </div>
            <div>
              <FieldLabel>Confirm New Password</FieldLabel>
              <PasswordInput
                required
                placeholder="Repeat new password"
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                disabled={pwSaving}
              />
              {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                <p className="text-[12px] font-medium text-nc-red mt-1.5">Passwords do not match.</p>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-border flex items-center justify-between gap-4">
            <p className="text-[11px] text-nc-muted">You will stay logged in after updating.</p>
            <button type="submit" className="btn-gold flex-shrink-0" disabled={pwSaving}>
              {pwSaving ? 'Updating…' : 'Update Password'}
            </button>
          </div>
        </form>
      </NcCard>

      {/* ── Account Info ─────────────────────────────────────── */}
      <NcCard>
        <CardHeader className="pb-5 border-b border-border mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-secondary">
              <Shield className="h-4 w-4 text-primary" />
            </div>
            <CardTitle sub="Your organisation and programme details">Account Info</CardTitle>
          </div>
        </CardHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            {
              icon: <BadgeCheck className="h-4 w-4 text-teal" />,
              iconBg: 'bg-teal-lt',
              label: 'Account Type',
              value: 'Administrator',
            },
            {
              icon: <Building2 className="h-4 w-4 text-nc-purple" />,
              iconBg: 'bg-nc-purple-lt',
              label: 'Organisation',
              value: 'The Deen Way (TDW) Education Network',
            },
            {
              icon: <CalendarDays className="h-4 w-4 text-gold" />,
              iconBg: 'bg-gold-lt',
              label: 'Programme Year',
              value: 'Year 1 · 2025',
            },
          ].map(({ icon, iconBg, label, value }) => (
            <div key={label} className="flex flex-col gap-3 p-4 rounded-lg border border-border bg-card">
              <div className={`flex items-center justify-center w-8 h-8 rounded-md ${iconBg}`}>
                {icon}
              </div>
              <div>
                <p className="text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">{label}</p>
                <p className="text-[13.5px] font-semibold text-foreground leading-snug">{value}</p>
              </div>
            </div>
          ))}
        </div>
      </NcCard>
    </div>
  );
}
