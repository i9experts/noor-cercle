import { useEffect, useState } from "react";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import SectionTitle from "@/components/shared/SectionTitle";
import Modal from "@/components/shared/Modal";
import { Check, X, Clock, Pencil, CalendarDays, Users } from "lucide-react";
import { murabbisService, attendanceService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";

type Status = "present" | "absent" | "excused";

const STATUS_CYCLE: Record<Status, Status> = {
  present: "absent",
  absent : "excused",
  excused: "present",
};

const STATUS_COLORS: Record<Status, string> = {
  present: "bg-nc-green/10 text-nc-green border-nc-green/20",
  absent : "bg-nc-red/10  text-nc-red  border-nc-red/20",
  excused: "bg-gold/10    text-gold-dim     border-gold/20",
};

function getApiError(e: unknown) {
  const m = (e as any)?.response?.data?.message;
  return typeof m === "string" && m ? m : null;
}

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString("en-PK", { day: "numeric", month: "short", year: "numeric" });
}

function presentRate(records: any[]) {
  if (!records?.length) return 0;
  return Math.round((records.filter((r) => r.status === "present").length / records.length) * 100);
}

// ── Edit Modal ────────────────────────────────────────────────────────────────

function EditModal({
  record,
  onClose,
  onSaved,
}: {
  record: any;
  onClose: () => void;
  onSaved: (updated: any) => void;
}) {
  const { toast } = useToast();
  const [topic,   setTopic]   = useState(record.topic || "");
  const [date,    setDate]    = useState(
    record.sessionDate ? new Date(record.sessionDate).toISOString().split("T")[0] : ""
  );
  const [sessNum, setSessNum] = useState<number>(record.sessionNumber ?? 1);
  const [rows,    setRows]    = useState<any[]>(
    (record.records || []).map((r: any) => ({
      student: r.student?._id || r.student,
      name   : r.student?.fullName || "—",
      status : r.status as Status,
      note   : r.note || "",
    }))
  );
  const [saving, setSaving] = useState(false);

  const cycleStatus = (idx: number) =>
    setRows((prev) =>
      prev.map((r, i) => i === idx ? { ...r, status: STATUS_CYCLE[r.status as Status] } : r)
    );

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await attendanceService.update(record._id, {
        topic, sessionDate: date, sessionNumber: sessNum,
        records: rows.map((r) => ({ student: r.student, status: r.status, note: r.note })),
      });
      toast({ title: "Attendance updated!" });
      onSaved(updated.data?.data || updated.data);
    } catch (e) {
      toast({ variant: "destructive", title: "Update failed", description: getApiError(e) || "Try again." });
    } finally {
      setSaving(false);
    }
  };

  const pCount = rows.filter((r) => r.status === "present").length;
  const aCount = rows.filter((r) => r.status === "absent").length;
  const eCount = rows.filter((r) => r.status === "excused").length;

  return (
    <Modal open onClose={onClose} title="Edit Attendance" subtitle={`${record.circle?.name || "—"} · ${fmtDate(record.sessionDate)}`}>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
        <div>
          <label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">Session #</label>
          <input type="number" min={1} value={sessNum}
            onChange={(e) => setSessNum(Number(e.target.value))}
            className="w-full px-3 py-2 border border-border rounded-md text-sm bg-card focus:border-teal outline-none" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md text-sm bg-card focus:border-teal outline-none" />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">Topic</label>
          <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
            className="w-full px-3 py-2 border border-border rounded-md text-sm bg-card focus:border-teal outline-none" />
        </div>
      </div>

      <div className="flex gap-2 mb-3">
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-nc-green/10 text-nc-green">{pCount} Present</span>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-nc-red/10 text-nc-red">{aCount} Absent</span>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gold/10 text-gold-dim">{eCount} Excused</span>
        <span className="ml-auto text-[11px] text-nc-muted">Click to cycle status</span>
      </div>

      <div className="scroll-hover max-h-[280px] space-y-2 pr-1">
        {rows.map((r, i) => (
          <div key={r.student}
            onClick={() => cycleStatus(i)}
            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${STATUS_COLORS[r.status as Status]}`}
          >
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center font-bold text-xs flex-shrink-0">
              {r.name.charAt(0)}
            </div>
            <span className="flex-1 text-[13px] font-medium text-foreground">{r.name}</span>
            <span className={`px-3 py-1 rounded-full text-[11px] font-bold capitalize border ${STATUS_COLORS[r.status as Status]}`}>
              {r.status === "present" ? <><Check className="inline h-3 w-3 mr-0.5" />Present</>
               : r.status === "absent"  ? <><X    className="inline h-3 w-3 mr-0.5" />Absent</>
               : <><Clock className="inline h-3 w-3 mr-0.5" />Excused</>}
            </span>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-5 pt-4 border-t border-border">
        <button onClick={onClose} className="flex-1 btn-outline">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary">
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>
    </Modal>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function MurabbiAttendance() {
  const { toast } = useToast();

  // Data
  const [circles,        setCircles]        = useState<any[]>([]);
  const [students,       setStudents]       = useState<any[]>([]);
  const [pastSessions,   setPastSessions]   = useState<any[]>([]);
  const [selectedCircle, setSelectedCircle] = useState<any>(null);
  const [loading,        setLoading]        = useState(true);
  const [pastLoading,    setPastLoading]    = useState(false);

  // Form state
  const [records,       setRecords]       = useState<Record<string, Status>>({});
  const [topic,         setTopic]         = useState("");
  const [sessionNumber, setSessionNumber] = useState(1);
  const [sessionDate,   setSessionDate]   = useState(new Date().toISOString().split("T")[0]);
  const [submitting,    setSubmitting]    = useState(false);

  // Edit modal
  const [editTarget, setEditTarget] = useState<any>(null);

  // Load circles + students
  useEffect(() => {
    Promise.all([murabbisService.getMyCircles(), murabbisService.getMyStudents()])
      .then(([cRes, sRes]) => {
        const c = cRes.data.data || [];
        setCircles(c);
        setStudents(sRes.data.data || []);
        if (c.length > 0) setSelectedCircle(c[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  // Load past sessions when circle changes
  useEffect(() => {
    if (!selectedCircle?._id) return;
    setPastLoading(true);
    attendanceService.getByCircle(selectedCircle._id)
      .then((res) => {
        const data = res.data.data || [];
        setPastSessions(data);
        // Auto-set next session number
        const maxSess = data.reduce((max: number, s: any) => Math.max(max, s.sessionNumber || 0), 0);
        setSessionNumber(maxSess + 1);
      })
      .catch(() => setPastSessions([]))
      .finally(() => setPastLoading(false));
  }, [selectedCircle]);

  const circleStudents = students.filter(
    (s) => selectedCircle && (s.circle?._id === selectedCircle._id || s.circle === selectedCircle._id)
  );

  const getStatus = (id: string): Status => records[id] || "present";
  const cycle = (id: string) =>
    setRecords((prev) => ({ ...prev, [id]: STATUS_CYCLE[prev[id] as Status || "present"] }));

  const handleSubmit = async () => {
    if (!selectedCircle || circleStudents.length === 0) return;
    setSubmitting(true);
    try {
      await attendanceService.submit({
        circle       : selectedCircle._id,
        sessionNumber,
        sessionDate,
        topic        : topic.trim() || "General Session",
        records      : circleStudents.map((s) => ({ student: s._id, status: getStatus(s._id), note: "" })),
      });
      toast({ title: "Attendance submitted!", description: `${fmtDate(sessionDate)} recorded.` });
      setRecords({});
      setTopic("");
      // Reload past sessions
      setPastLoading(true);
      attendanceService.getByCircle(selectedCircle._id)
        .then((res) => {
          const data = res.data.data || [];
          setPastSessions(data);
          setSessionNumber(data.reduce((max: number, s: any) => Math.max(max, s.sessionNumber || 0), 0) + 1);
        })
        .finally(() => setPastLoading(false));
    } catch (e) {
      toast({ variant: "destructive", title: "Failed to submit", description: getApiError(e) || "Try again." });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdited = (updated: any) => {
    setPastSessions((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
    setEditTarget(null);
  };

  const pCount = circleStudents.filter((s) => getStatus(s._id) === "present").length;
  const aCount = circleStudents.filter((s) => getStatus(s._id) === "absent").length;
  const eCount = circleStudents.filter((s) => getStatus(s._id) === "excused").length;

  if (loading) return (
    <div className="page-animate text-center py-16 text-nc-muted text-sm animate-pulse">Loading…</div>
  );

  return (
    <div className="page-animate">
      <SectionTitle title="Mark Attendance" subtitle="Record student presence for today's session." />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left: New Attendance Form ──────────────────────────────── */}
        <div className="lg:col-span-2">
          <NcCard>
            <CardHeader>
              <CardTitle>
                {selectedCircle?.name || "Select a Circle"}
              </CardTitle>
              <div className="flex gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 bg-nc-green/10 text-nc-green rounded-full">{pCount} Present</span>
                <span className="text-xs font-semibold px-2.5 py-1 bg-nc-red/10  text-nc-red  rounded-full">{aCount} Absent</span>
                {eCount > 0 && <span className="text-xs font-semibold px-2.5 py-1 bg-gold/10 text-gold-dim rounded-full">{eCount} Excused</span>}
              </div>
            </CardHeader>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-3 mt-4 mb-4">
              <div>
                <label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">Circle</label>
                <select
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-card focus:border-teal outline-none"
                  value={selectedCircle?._id || ""}
                  onChange={(e) => {
                    setSelectedCircle(circles.find((c) => c._id === e.target.value));
                    setRecords({});
                  }}
                >
                  {circles.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">Date</label>
                <input
                  type="date"
                  value={sessionDate}
                  onChange={(e) => setSessionDate(e.target.value)}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-card focus:border-teal outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">Session #</label>
                <input
                  type="number" min={1} value={sessionNumber}
                  onChange={(e) => setSessionNumber(Number(e.target.value))}
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-card focus:border-teal outline-none"
                />
              </div>
              <div>
                <label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">Topic</label>
                <input
                  type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
                  placeholder="Session topic (optional)"
                  className="w-full border border-border rounded-md px-3 py-2 text-sm bg-card focus:border-teal outline-none"
                />
              </div>
            </div>

            <p className="text-[11px] text-nc-muted mb-3">Click a student to cycle: <strong>Present → Absent → Excused</strong></p>

            {circleStudents.length === 0 ? (
              <div className="text-center py-8 text-nc-muted text-sm">No students in this circle.</div>
            ) : (
              <div className="scroll-hover max-h-[320px] space-y-2 pr-1">
                {circleStudents.map((s) => {
                  const status = getStatus(s._id);
                  return (
                    <div
                      key={s._id}
                      onClick={() => cycle(s._id)}
                      className={`flex items-center justify-between p-3.5 rounded-lg border cursor-pointer transition-all ${
                        status === "present" ? "bg-green-50/30 border-green-200"
                        : status === "excused" ? "bg-gold/5 border-gold/30"
                        : "bg-red-50/30 border-red-200"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                          status === "present" ? "bg-green-100 text-green-700"
                          : status === "excused" ? "bg-gold/20 text-gold-dim"
                          : "bg-red-100 text-red-700"
                        }`}>
                          {s.fullName?.charAt(0)}
                        </div>
                        <div>
                          <div className="text-[14px] font-semibold">{s.fullName}</div>
                          <div className="text-[11px] text-nc-muted">{s.circle?.name || "—"}</div>
                        </div>
                      </div>
                      <span className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold border ${STATUS_COLORS[status]}`}>
                        {status === "present" ? <><Check className="h-3 w-3" /> Present</>
                         : status === "absent"  ? <><X    className="h-3 w-3" /> Absent</>
                         : <><Clock className="h-3 w-3" /> Excused</>}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-5 pt-4 border-t border-border">
              <button
                className="btn-primary w-full py-2.5"
                onClick={handleSubmit}
                disabled={submitting || circleStudents.length === 0}
              >
                {submitting ? "Submitting…" : `Submit Attendance — ${fmtDate(sessionDate)}`}
              </button>
            </div>
          </NcCard>
        </div>

        {/* ── Right: Past Sessions ───────────────────────────────────── */}
        <div>
          <NcCard>
            <CardHeader>
              <CardTitle sub={selectedCircle?.name || "—"}>
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={14} /> Past Sessions
                </span>
              </CardTitle>
              {!pastLoading && (
                <span className="text-xs text-nc-muted">{pastSessions.length} recorded</span>
              )}
            </CardHeader>

            {pastLoading ? (
              <div className="text-center py-8 text-nc-muted text-sm animate-pulse">Loading…</div>
            ) : pastSessions.length === 0 ? (
              <div className="py-8 text-center">
                <Users size={28} className="text-nc-muted/30 mx-auto mb-2" />
                <p className="text-sm text-nc-muted">No sessions yet for this circle.</p>
              </div>
            ) : (
              <div className="scroll-hover max-h-[420px] space-y-2 pr-1 mt-1">
                {pastSessions.map((s: any) => {
                  const rate = presentRate(s.records);
                  return (
                    <div
                      key={s._id}
                      className="p-3 rounded-lg border border-border bg-muted/30 hover:border-teal/40 transition-colors group"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-foreground">
                            Session #{s.sessionNumber}
                          </p>
                          <p className="text-[11px] text-nc-muted mt-0.5">{fmtDate(s.sessionDate)}</p>
                          {s.topic && (
                            <p className="text-[11px] text-nc-muted/70 truncate mt-0.5">{s.topic}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className={`text-[12px] font-bold ${rate >= 85 ? "text-nc-green" : rate >= 60 ? "text-gold-dim" : "text-nc-red"}`}>
                            {rate}%
                          </span>
                          <button
                            onClick={() => setEditTarget(s)}
                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-md hover:bg-teal/10 text-teal transition-all"
                            title="Edit"
                          >
                            <Pencil size={13} />
                          </button>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-2">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-nc-green/10 text-nc-green font-medium">
                          {s.records.filter((r: any) => r.status === "present").length}P
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-nc-red/10 text-nc-red font-medium">
                          {s.records.filter((r: any) => r.status === "absent").length}A
                        </span>
                        {s.records.filter((r: any) => r.status === "excused").length > 0 && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold-dim font-medium">
                            {s.records.filter((r: any) => r.status === "excused").length}E
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </NcCard>
        </div>
      </div>

      {editTarget && (
        <EditModal record={editTarget} onClose={() => setEditTarget(null)} onSaved={handleEdited} />
      )}
    </div>
  );
}