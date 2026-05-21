import { FormEvent, useEffect, useState } from 'react';
import NcCard, { CardHeader, CardTitle } from '@/components/shared/NcCard';
import SectionTitle from '@/components/shared/SectionTitle';
import PasswordInput from '@/components/shared/PasswordInput';
import { PasswordRules, isPasswordValid } from '@/components/shared/PasswordRules';
import { usersService } from '@/services/api.service';
import { useToast } from '@/hooks/use-toast';
import { User, Lock, Bell } from 'lucide-react';

function getApiError(error: unknown): string | null {
  const msg = (error as any)?.response?.data?.message;
  return typeof msg === 'string' && msg.length > 0 ? msg : null;
}

export default function MurabbiSettings() {
  const { toast } = useToast();

  // Profile
  const [profile, setProfile]     = useState({ fullName: '', email: '', phone: '', bio: '' });
  const [saving,  setSaving]      = useState(false);

  // Password
  const [pwForm,    setPwForm]    = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [pwTouched, setPwTouched] = useState(false);
  const [pwSaving,  setPwSaving]  = useState(false);

  // Notifications (UI-only toggles — stored locally)
  const [notifs, setNotifs] = useState({ emailNotifications: true, weeklyReminders: true, sessionAlerts: true });

  useEffect(() => {
    usersService.getMe().then((res) => {
      const u = res.data.data || res.data;
      setProfile({
        fullName : u.fullName || '',
        email    : u.email    || '',
        phone    : u.phone    || '',
        bio      : u.bio      || '',
      });
    }).catch(() => {});
  }, []);

  const handleProfileSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await usersService.updateMe({
        fullName : profile.fullName,
        phone    : profile.phone,
        bio      : profile.bio,
      });
      const u = res.data.data || res.data;
      setProfile((p) => ({ ...p, fullName: u.fullName, phone: u.phone || '', bio: u.bio || '' }));
      toast({ title: 'Profile saved!' });
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

  return (
    <div className="page-animate max-w-4xl">
      <SectionTitle title="Settings" subtitle="Manage your profile and account preferences." />

      {/* Profile */}
      <NcCard className="mb-5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-teal" />
            <CardTitle>Profile</CardTitle>
          </div>
        </CardHeader>
        <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
          <div>
            <label className="block text-[13px] font-medium text-slate mb-1.5">Full Name</label>
            <input
              type="text" required
              className="w-full px-3.5 py-2.5 border border-border rounded-md text-sm bg-card focus:border-teal focus:shadow-[0_0_0_3px_rgba(14,107,114,0.08)] outline-none transition-colors"
              value={profile.fullName}
              onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-slate mb-1.5">Email</label>
            <input
              type="email" readOnly
              className="w-full px-3.5 py-2.5 border border-border rounded-md text-sm bg-muted text-nc-muted cursor-not-allowed outline-none"
              value={profile.email}
            />
            <p className="text-[11px] text-nc-muted mt-1">Email cannot be changed.</p>
          </div>
          <div>
            <label className="block text-[13px] font-medium text-slate mb-1.5">Phone (optional)</label>
            <input
              type="tel"
              className="w-full px-3.5 py-2.5 border border-border rounded-md text-sm bg-card focus:border-teal focus:shadow-[0_0_0_3px_rgba(14,107,114,0.08)] outline-none transition-colors"
              placeholder="+92 300 0000000"
              value={profile.phone}
              onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-slate mb-1.5">Bio (optional)</label>
            <textarea
              rows={3}
              className="w-full px-3.5 py-2.5 border border-border rounded-md text-sm bg-card focus:border-teal focus:shadow-[0_0_0_3px_rgba(14,107,114,0.08)] outline-none transition-colors resize-none"
              placeholder="A short description about yourself..."
              value={profile.bio}
              onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
            />
          </div>
          <div>
            <button type="submit" className="btn-primary w-fit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>
      </NcCard>

      {/* Change Password */}
      <NcCard className="mb-5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-4 w-4 text-gold" />
            <CardTitle>Change Password</CardTitle>
          </div>
        </CardHeader>
        <form onSubmit={handlePasswordSave} className="flex flex-col gap-4">
          <div>
            <label className="block text-[13px] font-medium text-slate mb-1.5">Current Password</label>
            <PasswordInput
              required
              placeholder="Enter current password"
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
              disabled={pwSaving}
            />
          </div>
          <div>
            <label className="block text-[13px] font-medium text-slate mb-1.5">New Password</label>
            <PasswordInput
              required
              placeholder="Min 8 chars, 1 uppercase, 1 number"
              value={pwForm.newPassword}
              onChange={(e) => { setPwForm((p) => ({ ...p, newPassword: e.target.value })); setPwTouched(true); }}
              disabled={pwSaving}
            />
            {pwTouched && <PasswordRules password={pwForm.newPassword} />}
          </div>
          <div>
            <label className="block text-[13px] font-medium text-slate mb-1.5">Confirm New Password</label>
            <PasswordInput
              required
              placeholder="Repeat new password"
              value={pwForm.confirmPassword}
              onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
              disabled={pwSaving}
            />
            {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
              <p className="text-[12px] font-medium text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>
          <div>
            <button type="submit" className="btn-gold w-fit" disabled={pwSaving}>
              {pwSaving ? 'Updating...' : 'Change Password'}
            </button>
          </div>
        </form>
      </NcCard>

      {/* Notification Preferences */}
      <NcCard>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <CardTitle>Notification Preferences</CardTitle>
          </div>
        </CardHeader>
        <div className="flex flex-col gap-1">
          {([
            { key: 'emailNotifications', label: 'Email Notifications',  desc: 'Receive updates and reminders via email' },
            { key: 'weeklyReminders',    label: 'Weekly Reminders',      desc: 'Get a weekly summary of your circles' },
            { key: 'sessionAlerts',      label: 'Session Alerts',        desc: 'Alerts before your scheduled sessions' },
          ] as const).map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-3 border-b border-border last:border-0">
              <div>
                <p className="text-[13px] font-semibold text-foreground">{label}</p>
                <p className="text-[11px] text-nc-muted mt-0.5">{desc}</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifs((n) => ({ ...n, [key]: !n[key] }))}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  notifs[key] ? 'bg-teal' : 'bg-muted border border-border'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                    notifs[key] ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          ))}
        </div>
      </NcCard>
    </div>
  );
}