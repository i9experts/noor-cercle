import { useState } from "react";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import { students, circles, getInitials } from "@/data/mockData";
import { Check, X } from "lucide-react";

export default function AttendancePage() {
  const attStudents = students.slice(0, 8);

  return (
    <div className="page-animate">
      <div className="flex items-center justify-between mb-5">
        <div className="text-lg font-semibold text-foreground">Attendance Management</div>
        <div className="flex gap-2.5">
          <select className="px-3.5 py-[9px] border border-border rounded-sm text-sm bg-card text-foreground w-[200px]">
            <option>Gulshan Circle 1</option><option>DHA Circle 1</option><option>Clifton Circle 1</option>
          </select>
          <select className="px-3.5 py-[9px] border border-border rounded-sm text-sm bg-card text-foreground w-[160px]">
            <option>Session 16 — Today</option><option>Session 15</option><option>Session 14</option>
          </select>
          <button className="btn-primary">Mark Attendance</button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-5">
        <NcCard>
          <CardHeader>
            <CardTitle sub="Today · 16 Apr 2025">Session 16 — Gulshan Circle 1</CardTitle>
          </CardHeader>
          {attStudents.map((s, i) => {
            const status = i < 6 ? 'present' : (i === 6 ? 'absent' : 'excused');
            return (
              <div key={s.name} className="flex justify-between items-center py-2.5 border-b border-border last:border-b-0">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-lt flex items-center justify-center text-xs font-bold text-teal">{getInitials(s.name)}</div>
                  <div className="text-[13px] font-medium text-foreground">{s.name}</div>
                </div>
                <div className="flex gap-1.5">
                  <AttButton icon="present" active={status === 'present'} color="bg-nc-green" />
                  <AttButton icon="absent" active={status === 'absent'} color="bg-nc-red" />
                  <AttButton label="E" active={status === 'excused'} color="bg-nc-amber" />
                </div>
              </div>
            );
          })}
          <div className="flex gap-3 mt-4 pt-4 border-t border-border">
            <Legend color="bg-nc-green" label="Present" />
            <Legend color="bg-nc-red-lt border border-nc-red/30" label="Absent" />
            <Legend color="bg-nc-amber-lt border border-nc-amber/30" label="Excused" />
          </div>
        </NcCard>

        <NcCard>
          <CardHeader><CardTitle>Attendance History — All Circles</CardTitle></CardHeader>
          <div className="text-[13px] text-nc-muted mb-3">Sessions 1–16 · Each dot = one session</div>
          {circles.slice(0, 4).map((c) => (
            <div key={c.name} className="mb-3.5">
              <div className="text-xs font-semibold text-foreground mb-1.5">{c.name}</div>
              <div className="grid grid-cols-10 gap-1">
                {Array.from({ length: 40 }, (_, i) => {
                  const cls = i < c.session
                    ? (Math.random() > 0.12 ? 'bg-nc-green' : (Math.random() > 0.5 ? 'bg-nc-red-lt border border-nc-red/20' : 'bg-nc-amber-lt border border-nc-amber/20'))
                    : 'bg-muted border border-dashed border-border';
                  return <div key={i} className={`aspect-square rounded-full cursor-pointer transition-transform hover:scale-110 ${cls}`} title={`Session ${i + 1}`} />;
                })}
              </div>
            </div>
          ))}
        </NcCard>
      </div>
    </div>
  );
}

function AttButton({ label, icon, active, color }: { label?: string; icon?: "present" | "absent"; active: boolean; color: string }) {
  return (
    <button className={`px-3 py-1 rounded text-xs cursor-pointer border border-border ${active ? `${color} text-primary-foreground` : 'bg-transparent text-nc-muted'}`}>
      {icon === "present" ? <Check className="h-3.5 w-3.5" /> : icon === "absent" ? <X className="h-3.5 w-3.5" /> : label}
    </button>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5 text-xs text-nc-muted">
      <div className={`w-2.5 h-2.5 rounded-full ${color}`} />
      {label}
    </div>
  );
}
