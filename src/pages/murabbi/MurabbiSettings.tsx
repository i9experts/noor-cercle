import { useEffect, useState } from "react";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import { usersService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";

export default function MurabbiSettings() {
  const { toast } = useToast();
  const [form, setForm] = useState({ fullName: "", phone: "", bio: "", emailNotifications: false, whatsappAlerts: false, language: "english" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    usersService.getMe().then((res) => {
      const u = res.data.data;
      setForm({
        fullName: u.fullName || "",
        phone: u.phone || "",
        bio: u.bio || "",
        emailNotifications: u.emailNotifications || false,
        whatsappAlerts: u.whatsappAlerts || false,
        language: u.language || "english",
      });
    }).catch(() => {});
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await usersService.updateMe(form);
      toast({ title: "Settings saved!" });
    } catch {
      toast({ variant: "destructive", title: "Save failed" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="page-animate">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <NcCard>
          <CardHeader><CardTitle>Profile Settings</CardTitle></CardHeader>
          <div className="flex flex-col gap-4">
            {[
              { label: "Full Name", key: "fullName", type: "text" },
              { label: "Phone", key: "phone", type: "tel" },
              { label: "Bio", key: "bio", type: "text" },
            ].map(({ label, key, type }) => (
              <div key={key}>
                <label className="block text-[13px] font-medium text-slate mb-1.5">{label}</label>
                <input type={type} className="w-full px-3.5 py-2.5 border border-border rounded-sm text-sm bg-card focus:border-teal outline-none"
                  value={(form as any)[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))} />
              </div>
            ))}
            <div>
              <label className="block text-[13px] font-medium text-slate mb-1.5">Language</label>
              <select className="w-full px-3.5 py-2.5 border border-border rounded-sm text-sm bg-card"
                value={form.language} onChange={(e) => setForm((f) => ({ ...f, language: e.target.value }))}>
                <option value="english">English</option>
                <option value="urdu">Urdu</option>
              </select>
            </div>
            <button className="btn-primary w-fit" onClick={handleSave} disabled={saving}>
              {saving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </NcCard>

        <NcCard>
          <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
          <div className="flex flex-col gap-3.5 text-[13.5px]">
            {[
              { label: "Email Notifications", key: "emailNotifications" },
              { label: "WhatsApp Alerts", key: "whatsappAlerts" },
            ].map(({ label, key }) => (
              <div key={key} className="flex justify-between items-center py-2.5 border-b border-border last:border-b-0">
                <span>{label}</span>
                <input type="checkbox" className="w-4 h-4 accent-teal"
                  checked={(form as any)[key]}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))} />
              </div>
            ))}
          </div>
        </NcCard>
      </div>
    </div>
  );
}