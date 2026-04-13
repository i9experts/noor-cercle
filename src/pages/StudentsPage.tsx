import { useState } from "react";
import StatCard from "@/components/shared/StatCard";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import ProgressBar from "@/components/shared/ProgressBar";
import { students, getInitials } from "@/data/mockData";

export default function StudentsPage({ onEnroll }: { onEnroll: () => void }) {
  const [search, setSearch] = useState('');
  const [circleFilter, setCircleFilter] = useState('');

  const filtered = students.filter(s =>
    (!search || s.name.toLowerCase().includes(search.toLowerCase()) || s.nbh.toLowerCase().includes(search.toLowerCase())) &&
    (!circleFilter || s.circle === circleFilter)
  );

  return (
    <div className="page-animate">
      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-7">
        <StatCard label="Total Enrolled" value={84} meta="Across 9 circles" color="teal" />
        <StatCard label="Seedlings (6–9)" value={38} meta="45% of students" color="gold" />
        <StatCard label="Growers (10–13)" value={46} meta="55% of students" color="green" />
        <StatCard label="Avg. Attendance" value="87%" meta="↑ Improving" color="purple" metaUp />
      </div>

      <NcCard>
        <CardHeader>
          <CardTitle sub="84 enrolled · Year 1 · 2025">All Students</CardTitle>
          <div className="flex gap-2.5 items-center">
            <div className="flex items-center gap-2.5 bg-muted border border-border rounded-sm px-3.5 w-[220px]">
              <span className="text-nc-muted text-sm">⌕</span>
              <input className="border-none bg-transparent outline-none text-[13.5px] text-foreground flex-1 py-[9px] font-sans" placeholder="Search students…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="form-select w-40 px-3.5 py-[9px] border border-border rounded-sm text-sm bg-card text-foreground" value={circleFilter} onChange={e => setCircleFilter(e.target.value)}>
              <option value="">All Circles</option>
              <option>Gulshan Circle 1</option>
              <option>DHA Circle 1</option>
              <option>Clifton Circle 1</option>
              <option>Nazimabad Circle 1</option>
            </select>
            <button className="btn-gold" onClick={onEnroll}>+ Enroll Student</button>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-[13.5px]">
            <thead>
              <tr>
                {['Student', 'Age Group', 'Circle', 'Neighbourhood', 'Sessions', 'Attendance', 'Character Score', 'Status', 'Actions'].map(h => (
                  <th key={h} className="bg-muted px-3.5 py-2.5 text-left text-xs font-semibold text-nc-muted uppercase tracking-wide border-b border-border">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.name} className="hover:bg-teal-lt">
                  <td className="px-3.5 py-3 border-b border-border">
                    <div className="flex items-center gap-2.5">
                      <div className="w-[34px] h-[34px] rounded-lg bg-teal-lt flex items-center justify-center text-xs font-bold text-teal">{getInitials(s.name)}</div>
                      <div>
                        <div className="font-semibold text-[13.5px] text-foreground">{s.name}</div>
                        <div className="text-[11px] text-nc-muted">Age {s.age}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3.5 py-3 border-b border-border"><NcBadge variant={s.ageGroup === 'Noor Grower' ? 'teal' : 'purple'}>{s.ageGroup}</NcBadge></td>
                  <td className="px-3.5 py-3 border-b border-border text-[13px] text-slate">{s.circle}</td>
                  <td className="px-3.5 py-3 border-b border-border text-[13px] text-slate">{s.nbh}</td>
                  <td className="px-3.5 py-3 border-b border-border text-[13px] text-foreground text-center">{s.sessions}/16</td>
                  <td className="px-3.5 py-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={s.att} color={s.att >= 85 ? 'green' : 'gold'} className="w-[60px]" />
                      <span className={`text-xs font-semibold ${s.att >= 85 ? 'text-nc-green' : s.att >= 70 ? 'text-nc-amber' : 'text-nc-red'}`}>{s.att}%</span>
                    </div>
                  </td>
                  <td className="px-3.5 py-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <ProgressBar value={s.char} color="gold" className="w-[60px]" />
                      <span className="text-xs font-semibold text-gold-dim">{s.char}</span>
                    </div>
                  </td>
                  <td className="px-3.5 py-3 border-b border-border"><NcBadge variant={s.status === 'active' ? 'green' : 'amber'}>{s.status === 'active' ? 'Active' : 'Review'}</NcBadge></td>
                  <td className="px-3.5 py-3 border-b border-border"><button className="btn-ghost text-xs">View</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </NcCard>
    </div>
  );
}
