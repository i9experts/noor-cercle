import { FormEvent, useEffect, useRef, useState } from 'react';
import NcCard, { CardHeader, CardTitle } from '@/components/shared/NcCard';
import SectionTitle from '@/components/shared/SectionTitle';
import PasswordInput from '@/components/shared/PasswordInput';
import { PasswordRules, isPasswordValid } from '@/components/shared/PasswordRules';
import { usersService, uploadService } from '@/services/api.service';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { User, Lock, Bell, Camera, Loader2 } from 'lucide-react';

function getApiError(error: unknown): string | null {
  const msg = (error as any)?.response?.data?.message;
  return typeof msg === 'string' && msg.length > 0 ? msg : null;
}

export default function MurabbiSettings() {
  const { toast } = useToast();
  const { updateUser } = useAuth();

  // Profile
  const [profile,    setProfile]   = useState({ fullName: '', email: '', phone: '', bio: '', image: '' });
  const [saving,     setSaving]   = useState(false);
  const [imgUploading, setImgUploading] = useState(false);
  const imgInputRef = useRef<HTMLInputElement>(null);

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
        image    : u.image    || '',
      });
    }).catch(() => {});
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: 'destructive', title: 'Image must be under 5 MB.' }); return;
    }
    setImgUploading(true);
    try {
      const res = await uploadService.image(file);
      const url = (res.data as any)?.url || (res.data as any)?.data?.url;
      if (!url) throw new Error('No URL');
      // save to backend + update AuthContext so navbar reflects instantly
      await usersService.updateMe({ image: url });
      setProfile((p) => ({ ...p, image: url }));
      updateUser({ image: url });
      toast({ title: 'Profile photo updated!' });
    } catch {
      toast({ variant: 'destructive', title: 'Image upload failed. Try again.' });
    } finally {
      setImgUploading(false);
      if (imgInputRef.current) imgInputRef.current.value = '';
    }
  };

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

  const inp = 'w-full px-3.5 py-2.5 border border-border rounded-md text-sm bg-card focus:border-teal focus:shadow-[0_0_0_3px_rgba(14,107,114,0.08)] outline-none transition-colors';
  const lbl = 'block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1.5';

  const initials = profile.fullName
    ? profile.fullName.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase()
    : '??';

  return (
    <div className="page-animate">
      <SectionTitle title="Settings" subtitle="Manage your profile and account preferences." />

      {/* ── Row 1: Profile + Change Password side by side ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

        {/* Profile */}
        <NcCard>
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
            {/* Clickable avatar */}
            <div
              className="relative flex-shrink-0 cursor-pointer group"
              onClick={() => imgInputRef.current?.click()}
              title="Change profile photo"
            >
              <div className="flex items-center justify-center w-14 h-14 rounded-full bg-teal text-white font-semibold text-lg shadow-nc select-none overflow-hidden">
                {imgUploading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : profile.image ? (
                  <img src={profile.image} alt={profile.fullName} className="w-full h-full object-cover" />
                ) : (
                  initials
                )}
              </div>
              {/* Camera overlay on hover */}
              <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-4 w-4 text-white" />
              </div>
            </div>
            <input ref={imgInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleImageUpload} />

            <div className="min-w-0">
              <p className="text-[15px] font-semibold text-foreground leading-tight truncate">{profile.fullName || '—'}</p>
              <p className="text-[13px] text-nc-muted mt-0.5 truncate">{profile.email}</p>
              <button
                type="button"
                className="mt-1.5 text-[11px] font-semibold text-teal hover:underline disabled:opacity-50"
                onClick={() => imgInputRef.current?.click()}
                disabled={imgUploading}
              >
                {imgUploading ? 'Uploading…' : profile.image ? 'Change Photo' : 'Upload Photo'}
              </button>
            </div>
          </div>

          <form onSubmit={handleProfileSave} className="flex flex-col gap-4">
            <div>
              <label className={lbl}>Full Name</label>
              <input type="text" required className={inp} value={profile.fullName}
                onChange={(e) => setProfile((p) => ({ ...p, fullName: e.target.value }))} />
            </div>
            <div>
              <label className={lbl}>Phone (optional)</label>
              <input type="tel" className={inp} placeholder="+92 300 0000000" value={profile.phone}
                onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} />
            </div>
            <div>
              <label className={lbl}>Email Address</label>
              <div className="relative">
                <div className="w-full px-3.5 py-2.5 border border-border rounded-md text-sm bg-muted text-nc-muted select-none pr-24 truncate">
                  {profile.email || '—'}
                </div>
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-nc-muted bg-border/40 px-1.5 py-0.5 rounded">
                  Read-only
                </span>
              </div>
            </div>
            <div>
              <label className={lbl}>Bio (optional)</label>
              <textarea rows={3} className={`${inp} resize-none`} placeholder="A short description about yourself..."
                value={profile.bio} onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))} />
            </div>
            <div className="pt-2 border-t border-border flex items-center justify-between gap-4">
              <p className="text-[11px] text-nc-muted">Email cannot be changed.</p>
              <button type="submit" className="btn-primary flex-shrink-0" disabled={saving}>
                {saving ? 'Saving…' : 'Save Profile'}
              </button>
            </div>
          </form>
        </NcCard>

        {/* Change Password */}
        <NcCard>
          <CardHeader className="pb-5 border-b border-border mb-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-md bg-gold-lt">
                <Lock className="h-4 w-4 text-gold" />
              </div>
              <CardTitle sub="Keep your account secure">Change Password</CardTitle>
            </div>
          </CardHeader>

          <form onSubmit={handlePasswordSave} className="flex flex-col gap-4">
            <div>
              <label className={lbl}>Current Password</label>
              <PasswordInput required placeholder="Enter current password"
                value={pwForm.currentPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, currentPassword: e.target.value }))}
                disabled={pwSaving} />
            </div>
            <div>
              <label className={lbl}>New Password</label>
              <PasswordInput required placeholder="Min 8 chars, 1 uppercase, 1 number"
                value={pwForm.newPassword}
                onChange={(e) => { setPwForm((p) => ({ ...p, newPassword: e.target.value })); setPwTouched(true); }}
                disabled={pwSaving} />
              {pwTouched && <PasswordRules password={pwForm.newPassword} />}
            </div>
            <div>
              <label className={lbl}>Confirm New Password</label>
              <PasswordInput required placeholder="Repeat new password"
                value={pwForm.confirmPassword}
                onChange={(e) => setPwForm((p) => ({ ...p, confirmPassword: e.target.value }))}
                disabled={pwSaving} />
              {pwForm.confirmPassword && pwForm.newPassword !== pwForm.confirmPassword && (
                <p className="text-[12px] font-medium text-nc-red mt-1.5">Passwords do not match.</p>
              )}
            </div>
            <div className="pt-2 border-t border-border flex items-center justify-between gap-4">
              <p className="text-[11px] text-nc-muted">You will stay logged in after updating.</p>
              <button type="submit" className="btn-gold flex-shrink-0" disabled={pwSaving}>
                {pwSaving ? 'Updating…' : 'Update Password'}
              </button>
            </div>
          </form>
        </NcCard>
      </div>

      {/* ── Row 2: Notification Preferences — full width ───── */}
      <NcCard>
        <CardHeader className="pb-5 border-b border-border mb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-md bg-secondary">
              <Bell className="h-4 w-4 text-primary" />
            </div>
            <CardTitle sub="Choose which notifications you receive">Notification Preferences</CardTitle>
          </div>
        </CardHeader>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {([
            { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive updates and reminders via email'    },
            { key: 'weeklyReminders',    label: 'Weekly Reminders',     desc: 'Get a weekly summary of your circles'      },
            { key: 'sessionAlerts',      label: 'Session Alerts',       desc: 'Alerts before your scheduled sessions'     },
          ] as const).map(({ key, label, desc }) => (
            <div key={key} className="flex items-start justify-between gap-4 p-4 rounded-lg border border-border bg-card hover:border-teal/30 transition-colors">
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-foreground leading-tight">{label}</p>
                <p className="text-[11px] text-nc-muted mt-0.5 leading-relaxed">{desc}</p>
              </div>
              <button
                type="button"
                onClick={() => setNotifs((n) => ({ ...n, [key]: !n[key] }))}
                className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                  notifs[key] ? 'bg-teal' : 'bg-border'
                }`}
              >
                <span className={`pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow transform transition duration-200 ${
                  notifs[key] ? 'translate-x-4' : 'translate-x-0'
                }`} />
              </button>
            </div>
          ))}
        </div>
      </NcCard>
    </div>
  );
}