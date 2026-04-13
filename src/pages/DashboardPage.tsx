import StatCard from "@/components/shared/StatCard";
import QuranBox from "@/components/shared/QuranBox";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import Timeline from "@/components/shared/Timeline";
import { useMemo } from "react";

export default function DashboardPage() {
  const attData = [72, 75, 79, 82, 85, 84, 87, 86, 88, 89, 91, 88, 90, 92, 91, 87];

  const circlesList = [
    { name: 'Gulshan Circle 1', murabbi: 'Umm Aisha', students: 8, att: 92, status: 'active' as const },
    { name: 'DHA Circle 1', murabbi: 'Br. Hassan', students: 10, att: 88, status: 'active' as const },
    { name: 'Clifton Circle 1', murabbi: 'Sr. Maryam', students: 9, att: 78, status: 'review' as const },
    { name: 'Nazimabad Circle 1', murabbi: 'Br. Ibrahim', students: 8, att: 91, status: 'active' as const },
  ];

  return (
    <div className="page-animate">
      <QuranBox
        arabic="فَأَقِمْ وَجْهَكَ لِلدِّينِ حَنِيفًا ۚ فِطْرَتَ اللَّهِ الَّتِي فَطَرَ النَّاسَ عَلَيْهَا"
        translation='"The fitrah of Allah upon which He has created all people."'
        reference="SURAH AR-RUM · 30:30"
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(180px,1fr))] gap-4 mb-7">
        <StatCard label="Total Students" value={84} meta="↑ 12 this month" color="teal" metaUp />
        <StatCard label="Active Circles" value={9} meta="Across 4 neighbourhoods" color="gold" />
        <StatCard label="Certified Murabbis" value={9} meta="3 in training" color="green" metaUp />
        <StatCard label="Avg. Attendance" value="87%" meta="↑ 4% vs last month" color="purple" metaUp />
        <StatCard label="Sessions Completed" value={312} meta="Year 1 · Month 4" color="teal" />
        <StatCard label="Parent Engagement" value="72%" meta="↑ 8% this month" color="gold" metaUp />
      </div>

      <div className="grid grid-cols-2 gap-5">
        <NcCard>
          <CardHeader>
            <CardTitle sub="All 9 circles · Month 4 of 12">Active Circles</CardTitle>
            <button className="btn-ghost text-sm">View all →</button>
          </CardHeader>
          <div className="flex flex-col gap-2.5">
            {circlesList.map((c) => (
              <div key={c.name} className="flex justify-between items-center p-2.5 px-3 bg-muted rounded-sm">
                <div>
                  <div className="text-[13px] font-semibold text-foreground">{c.name}</div>
                  <div className="text-[11px] text-nc-muted">Murabbi: {c.murabbi} · {c.students} students</div>
                </div>
                <div className="text-right">
                  <NcBadge variant={c.status === 'active' ? 'green' : 'amber'}>{c.status === 'active' ? 'Active' : 'Review'}</NcBadge>
                  <div className="text-[11px] text-nc-muted mt-0.5">{c.att}% att.</div>
                </div>
              </div>
            ))}
          </div>
        </NcCard>

        <div className="flex flex-col gap-5">
          <NcCard>
            <CardHeader><CardTitle>Announcements</CardTitle></CardHeader>
            <div className="flex gap-3.5 p-3.5 bg-gold-lt border border-gold/20 rounded-sm mb-3">
              <span className="text-xl flex-shrink-0">📋</span>
              <div>
                <div className="text-[13px] font-semibold text-gold-dim">Session 16 — Gratitude Ceremony this Friday</div>
                <div className="text-xs text-slate mt-0.5">All circles: prepare Gratitude Jar and bring parent letters for delivery.</div>
              </div>
            </div>
            <div className="flex gap-3.5 p-3.5 bg-gold-lt border border-gold/20 rounded-sm mb-3">
              <span className="text-xl flex-shrink-0">🎓</span>
              <div>
                <div className="text-[13px] font-semibold text-gold-dim">Tier 1 Training — Batch 3 starts 20 April</div>
                <div className="text-xs text-slate mt-0.5">6 new Murabbi candidates registered. Training venue: TDW Campus.</div>
              </div>
            </div>
            <div className="flex gap-3.5 p-3.5 bg-teal-lt border border-teal/20 rounded-sm">
              <span className="text-xl flex-shrink-0">💰</span>
              <div>
                <div className="text-[13px] font-semibold text-teal">Donor milestone: PKR 420,000 raised</div>
                <div className="text-xs text-slate mt-0.5">7 Circle Founders and 12 Noor Donors confirmed for Year 1.</div>
              </div>
            </div>
          </NcCard>

          <NcCard>
            <CardHeader><CardTitle>Recent Activity</CardTitle></CardHeader>
            <Timeline items={[
              { title: 'Zaid Ahmad enrolled — Gulshan Circle 1', meta: '2 hours ago', dotColor: 'gold' },
              { title: 'Session 15 completed — DHA Circle 1', meta: 'Yesterday · 10/10 present', dotColor: 'teal' },
              { title: 'Br. Hassan certified — Tier 1 Asaas', meta: '2 days ago', dotColor: 'green' },
              { title: 'Parent evening held — Clifton Circle', meta: '3 days ago · 14 parents attended', dotColor: 'teal' },
            ]} />
          </NcCard>
        </div>
      </div>

      {/* Attendance Chart */}
      <NcCard className="mt-5">
        <CardHeader>
          <CardTitle sub="Sessions 1–16 · Year 1">Attendance Trend — All Circles</CardTitle>
        </CardHeader>
        <div className="h-40 bg-muted rounded-sm flex items-end p-3 px-2 gap-1 overflow-hidden relative">
          {attData.map((v, i) => (
            <div
              key={i}
              className="flex-1 bg-teal-lt rounded-t hover:bg-teal transition-colors cursor-pointer relative"
              style={{ height: `${v}%` }}
              title={`Session ${i + 1}: ${v}%`}
            >
              {i === attData.length - 1 && (
                <div className="absolute -top-[18px] left-1/2 -translate-x-1/2 text-[9px] text-nc-muted whitespace-nowrap">{v}%</div>
              )}
            </div>
          ))}
          <div className="absolute w-full border-t border-dashed border-gold top-[15%] pointer-events-none left-0" />
        </div>
        <div className="flex gap-5 mt-2.5 text-xs text-nc-muted">
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-teal rounded-[2px] inline-block" />Attendance %</span>
          <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-gold-lt border border-gold rounded-[2px] inline-block" />Target (85%)</span>
        </div>
      </NcCard>
    </div>
  );
}
