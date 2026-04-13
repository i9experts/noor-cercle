import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";

export default function SettingsPage() {
  return (
    <div className="page-animate">
      <div className="grid grid-cols-2 gap-5">
        <NcCard>
          <CardHeader><CardTitle>Organisation Settings</CardTitle></CardHeader>
          <div className="flex flex-col gap-[18px]">
            <FormGroup label="Organisation Name" value="The Deen Way (TDW) Education Network" />
            <FormGroup label="City" value="Karachi, Pakistan" />
            <FormGroup label="Programme Year" value="Year 1 · 2025" />
            <FormGroup label="Director" value="Atiq ur Rehman Ayubi" />
            <button className="btn-primary w-fit">Save Settings</button>
          </div>
        </NcCard>

        <NcCard>
          <CardHeader><CardTitle>Notifications & Automation</CardTitle></CardHeader>
          <div className="flex flex-col gap-3.5 text-[13.5px]">
            {[
              'Weekly Home Card — auto send to parents',
              'Attendance alerts for absences 3+',
              'Monthly reports auto-generate',
              'Donor quarterly reports',
              'Murabbi peer group reminders',
            ].map((label) => (
              <div key={label} className="flex justify-between items-center py-2.5 border-b border-border last:border-b-0">
                <span className="text-foreground">{label}</span>
                <input type="checkbox" defaultChecked className="w-4 h-4 accent-teal" />
              </div>
            ))}
          </div>
        </NcCard>
      </div>
    </div>
  );
}

function FormGroup({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <label className="block text-[13px] font-medium text-slate mb-1.5">{label}</label>
      <input className="w-full px-3.5 py-2.5 border border-border rounded-sm text-sm text-foreground bg-card focus:border-teal focus:shadow-[0_0_0_3px_rgba(14,107,114,0.08)] outline-none transition-colors" defaultValue={value} />
    </div>
  );
}
