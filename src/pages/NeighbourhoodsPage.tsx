import NcBadge from "@/components/shared/NcBadge";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import ProgressBar from "@/components/shared/ProgressBar";
import { neighbourhoods } from "@/data/mockData";

export default function NeighbourhoodsPage() {
  return (
    <div className="page-animate">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="font-serif text-[22px] text-foreground">Neighbourhood Management</div>
          <div className="text-xs text-nc-muted mt-0.5">4 active neighbourhoods · Karachi</div>
        </div>
        <button className="btn-gold">+ Add Neighbourhood</button>
      </div>

      <div className="grid grid-cols-2 gap-[18px] mb-5">
        {neighbourhoods.map((n) => (
          <div key={n.name} className="bg-card border border-border rounded-lg p-[18px] cursor-pointer transition-all hover:border-teal hover:shadow-[0_4px_16px_rgba(14,107,114,0.1)]">
            <div className="flex justify-between mb-3">
              <div>
                <div className="font-semibold text-[15px] text-foreground">{n.name}</div>
                <div className="text-xs text-nc-muted">{n.area} · {n.mosques}</div>
              </div>
              <NcBadge variant={n.status === 'active' ? 'green' : 'amber'}>{n.status}</NcBadge>
            </div>
            <div className="flex gap-4">
              {[
                { val: n.circles, label: 'Circles' },
                { val: n.students, label: 'Students' },
                { val: n.murabbis, label: 'Murabbis' },
              ].map((s) => (
                <div key={s.label} className="text-center">
                  <div className="text-[22px] font-bold font-serif text-teal">{s.val}</div>
                  <div className="text-[10px] text-nc-muted uppercase tracking-wide">{s.label}</div>
                </div>
              ))}
            </div>
            <ProgressBar value={(n.students / (n.circles * 10)) * 100} className="mt-3" />
            <div className="text-[11px] text-nc-muted mt-1">{n.students} of {n.circles * 10} capacity enrolled</div>
          </div>
        ))}
      </div>

      <NcCard>
        <CardHeader><CardTitle>Neighbourhood Expansion Pipeline</CardTitle></CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr>
                {['Neighbourhood', 'Area', 'Interest Level', 'Mosque Contact', 'Target Circles', 'Status', 'Action'].map(h => (
                  <th key={h} className="bg-muted px-3.5 py-2.5 text-left text-xs font-semibold text-nc-muted uppercase tracking-wide border-b border-border">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="hover:bg-teal-lt">
                <td className="px-3.5 py-3 border-b border-border">North Nazimabad</td>
                <td className="px-3.5 py-3 border-b border-border">Central Karachi</td>
                <td className="px-3.5 py-3 border-b border-border"><ProgressBar value={70} className="w-[120px]" /></td>
                <td className="px-3.5 py-3 border-b border-border">Masjid Al-Noor</td>
                <td className="px-3.5 py-3 border-b border-border">2</td>
                <td className="px-3.5 py-3 border-b border-border"><NcBadge variant="amber">In talks</NcBadge></td>
                <td className="px-3.5 py-3 border-b border-border"><button className="btn-ghost text-xs">Follow up</button></td>
              </tr>
              <tr className="hover:bg-teal-lt">
                <td className="px-3.5 py-3 border-b border-border">Korangi</td>
                <td className="px-3.5 py-3 border-b border-border">East Karachi</td>
                <td className="px-3.5 py-3 border-b border-border"><ProgressBar value={45} className="w-[120px]" /></td>
                <td className="px-3.5 py-3 border-b border-border">—</td>
                <td className="px-3.5 py-3 border-b border-border">1</td>
                <td className="px-3.5 py-3 border-b border-border"><NcBadge variant="dark">Prospecting</NcBadge></td>
                <td className="px-3.5 py-3 border-b border-border"><button className="btn-ghost text-xs">Contact</button></td>
              </tr>
              <tr className="hover:bg-teal-lt">
                <td className="px-3.5 py-3 border-b border-border">Orangi Town</td>
                <td className="px-3.5 py-3 border-b border-border">West Karachi</td>
                <td className="px-3.5 py-3 border-b border-border"><ProgressBar value={90} color="green" className="w-[120px]" /></td>
                <td className="px-3.5 py-3 border-b border-border">Jama Masjid</td>
                <td className="px-3.5 py-3 border-b border-border">3</td>
                <td className="px-3.5 py-3 border-b border-border"><NcBadge variant="green">Ready to launch</NcBadge></td>
                <td className="px-3.5 py-3 border-b border-border"><button className="btn-primary text-xs">Launch</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </NcCard>
    </div>
  );
}
