import { useEffect, useState } from "react";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import SectionTitle from "@/components/shared/SectionTitle";
import { usersService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";
import { User } from "lucide-react";

export default function MurabbiProfile() {
  const { toast } = useToast();
  const [form, setForm]     = useState({ fullName: "", email: "", role: "" });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    usersService.getMe()
      .then((res) => {
        const u = res.data.data || res.data;
        setForm({ fullName: u.fullName || "", email: u.email || "", role: u.role || "" });
      })
      .catch(() => toast({ variant: "destructive", title: "Failed to load profile" }))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await usersService.updateMe({ fullName: form.fullName });
      toast({ title: "Profile updated!" });
    } catch {
      toast({ variant: "destructive", title: "Update failed" });
    } finally {
      setSaving(false);
    }
  };

  const initials = form.fullName
    ? form.fullName.split(" ").slice(0, 2).map((w) => w[0]).join("").toUpperCase()
    : "??";

  return (
    <div className="page-animate max-w-2xl">
      <SectionTitle title="My Profile" subtitle="View and update your personal information." />

      {loading ? (
        <div className="text-center py-10 text-nc-muted text-sm animate-pulse">Loading...</div>
      ) : (
        <div className="space-y-5">
          {/* Avatar card */}
          <NcCard>
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-full bg-teal-lt flex items-center justify-center text-teal text-xl font-bold flex-shrink-0">
                {initials}
              </div>
              <div>
                <div className="text-lg font-bold">{form.fullName || "—"}</div>
                <div className="text-sm text-nc-muted">{form.email}</div>
                <span className="inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-teal-lt text-teal rounded-full">
                  {form.role}
                </span>
              </div>
            </div>
          </NcCard>

          {/* Edit form */}
          <NcCard>
            <CardHeader><CardTitle>Edit Profile</CardTitle></CardHeader>
            <div className="flex flex-col gap-4 mt-2">
              <div>
                <label className="block text-[13px] font-medium text-slate mb-1.5">Full Name</label>
                <input
                  type="text"
                  className="w-full px-3.5 py-2.5 border border-border rounded-sm text-sm bg-card focus:border-teal outline-none"
                  value={form.fullName}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-[13px] font-medium text-slate mb-1.5">Email</label>
                <input
                  type="email"
                  className="w-full px-3.5 py-2.5 border border-border rounded-sm text-sm bg-card text-nc-muted outline-none cursor-not-allowed"
                  value={form.email}
                  readOnly
                />
                <p className="text-[11px] text-nc-muted mt-1">Email cannot be changed.</p>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <User className="h-3.5 w-3.5 text-nc-muted" />
                <span className="text-[12px] text-nc-muted">Role: <strong className="text-foreground capitalize">{form.role}</strong></span>
              </div>
              <button
                className="btn-primary w-fit"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </NcCard>
        </div>
      )}
    </div>
  );
}
