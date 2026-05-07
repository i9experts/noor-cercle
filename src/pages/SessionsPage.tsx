import { useEffect, useState } from "react";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import { sessionsService } from "@/services/api.service";

export default function SessionsPage() {
  const [curriculum, setCurriculum] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    sessionsService.getCurriculum()
      .then((res) => setCurriculum(res.data.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const currentMonth = curriculum?.currentMonth || 4;
  const themes = curriculum?.themes || [
    { month: 1, theme: "Identity", status: "completed" },
    { month: 2, theme: "Honesty", status: "completed" },
    { month: 3, theme: "Family", status: "completed" },
    { month: 4, theme: "Gratitude", status: "current" },
    { month: 5, theme: "Courage", status: "upcoming" },
    { month: 6, theme: "Friendship", status: "upcoming" },
    { month: 7, theme: "Patience", status: "upcoming" },
    { month: 8, theme: "Generosity", status: "upcoming" },
    { month: 9, theme: "Body", status: "upcoming" },
    { month: 10, theme: "Knowledge", status: "upcoming" },
    { month: 11, theme: "Community", status: "upcoming" },
    { month: 12, theme: "Legacy", status: "upcoming" },
  ];

  return (
    <div className="page-animate">
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="font-serif text-[22px] text-foreground">Sessions & Curriculum</div>
          <div className="text-xs text-nc-muted mt-0.5">
            {curriculum ? `${curriculum.totalSessions} sessions · ${curriculum.totalMonths} months` : "40 sessions · 12 months"}
          </div>
        </div>
      </div>

      <NcCard>
        <CardHeader>
          <CardTitle sub={`Month ${currentMonth} of 12 · Current theme: ${themes.find((t: any) => t.status === "current")?.theme || "—"}`}>
            Year Curriculum Overview
          </CardTitle>
        </CardHeader>
        {loading ? (
          <div className="text-center py-8 text-nc-muted text-sm animate-pulse">Loading curriculum...</div>
        ) : (
          <>
            <div className="grid grid-cols-12 gap-1.5 mb-3">
              {themes.map((t: any) => (
                <div
                  key={t.month}
                  className={`p-2.5 px-1.5 rounded-lg text-center cursor-pointer transition-all hover:scale-105 border ${
                    t.status === "completed"
                      ? "bg-teal border-teal text-primary-foreground"
                      : t.status === "current"
                      ? "bg-gold border-gold text-primary-foreground"
                      : "bg-muted border-border text-nc-muted"
                  }`}
                >
                  <div className="text-[11px] font-bold opacity-60">M{t.month}</div>
                  <div className="text-[11px] font-semibold mt-0.5 leading-tight">{t.theme}</div>
                </div>
              ))}
            </div>
            <div className="flex gap-4 text-xs text-nc-muted">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-teal rounded-[2px] inline-block" />Completed</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-gold rounded-[2px] inline-block" />Current</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 bg-border rounded-[2px] border border-border inline-block" />Upcoming</span>
            </div>
          </>
        )}
      </NcCard>
    </div>
  );
}