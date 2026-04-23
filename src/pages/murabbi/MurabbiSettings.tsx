import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import SectionTitle from "@/components/shared/SectionTitle";
import { User, Bell, Shield, Palette, Globe, LogOut } from "lucide-react";

export default function MurabbiSettings() {
  return (
    <div className="page-animate">
      <SectionTitle 
        title="Settings" 
        subtitle="Manage your profile, notifications, and account preferences."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-4">
          <NcCard className="p-0 overflow-hidden">
            <div className="p-6 bg-primary/5 flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-bold mb-4 border-4 border-white shadow-sm">
                M
              </div>
              <h3 className="font-bold text-lg">Murabbi Ahmad</h3>
              <p className="text-sm text-nc-muted">Senior Teacher · Since 2024</p>
              <button className="mt-4 px-6 py-1.5 bg-white border border-border rounded-full text-xs font-bold hover:bg-muted transition-colors">
                Edit Profile
              </button>
            </div>
            <div className="p-2">
              <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors">
                <User className="h-4 w-4 text-nc-muted" /> Profile Information
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors">
                <Bell className="h-4 w-4 text-nc-muted" /> Notification Settings
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors">
                <Shield className="h-4 w-4 text-nc-muted" /> Password & Security
              </button>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground hover:bg-muted rounded-lg transition-colors">
                <Palette className="h-4 w-4 text-nc-muted" /> Appearance
              </button>
              <div className="my-2 border-t border-border mx-4"></div>
              <button className="w-full flex items-center gap-3 px-4 py-3 text-sm font-medium text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                <LogOut className="h-4 w-4" /> Log Out
              </button>
            </div>
          </NcCard>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <NcCard>
            <CardHeader><CardTitle>Public Profile</CardTitle></CardHeader>
            <div className="mt-4 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-nc-muted uppercase">Full Name</label>
                  <input type="text" defaultValue="Murabbi Ahmad Ali" className="w-full px-3 py-2 bg-muted/50 border border-border rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-nc-muted uppercase">Email Address</label>
                  <input type="email" defaultValue="ahmad.ali@noorcircles.com" className="w-full px-3 py-2 bg-muted/50 border border-border rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/20" />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-nc-muted uppercase">Bio / Introduction</label>
                <textarea rows={4} className="w-full px-3 py-2 bg-muted/50 border border-border rounded-md text-sm outline-none focus:ring-2 focus:ring-primary/20 resize-none">
                  Dedicated Murabbi with over 2 years of experience in character building and Islamic education. Passionate about nurturing the fitrah of every child.
                </textarea>
              </div>
              <div className="flex justify-end">
                <button className="btn-primary px-8">Save Changes</button>
              </div>
            </div>
          </NcCard>

          <NcCard>
            <CardHeader><CardTitle>Communication Preferences</CardTitle></CardHeader>
            <div className="mt-4 space-y-4">
              <div className="flex justify-between items-center py-2 border-b border-border">
                <div>
                  <div className="text-sm font-semibold">Email Notifications</div>
                  <div className="text-xs text-nc-muted">Receive weekly summaries and important updates.</div>
                </div>
                <div className="w-10 h-5 bg-primary rounded-full relative cursor-pointer">
                  <div className="absolute right-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex justify-between items-center py-2 border-b border-border">
                <div>
                  <div className="text-sm font-semibold">WhatsApp Alerts</div>
                  <div className="text-xs text-nc-muted">Get instant alerts for circle attendance and parent messages.</div>
                </div>
                <div className="w-10 h-5 bg-muted rounded-full relative cursor-pointer">
                  <div className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full"></div>
                </div>
              </div>
              <div className="flex justify-between items-center py-2">
                <div>
                  <div className="text-sm font-semibold">Language</div>
                  <div className="text-xs text-nc-muted">Choose your preferred language for the dashboard.</div>
                </div>
                <select className="bg-muted border-none rounded-md px-3 py-1 text-xs font-bold outline-none">
                  <option>English</option>
                  <option>Urdu</option>
                </select>
              </div>
            </div>
          </NcCard>
        </div>
      </div>
    </div>
  );
}
