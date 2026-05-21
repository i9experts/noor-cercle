import { useEffect, useMemo, useState } from 'react';
import NcCard, { CardHeader } from '@/components/shared/NcCard';
import SectionTitle from '@/components/shared/SectionTitle';
import Modal from '@/components/shared/Modal';
import {
  attendanceService,
  adminService,
  studentsService,
  circlesService,
} from '@/services/api.service';
import { useToast } from '@/hooks/use-toast';
import {
  Search, X, Pencil, Trash2, Plus, Users, BookOpen,
  Calendar, CheckCircle2, XCircle, Clock,
} from 'lucide-react';

// ── helpers ───────────────────────────────────────────────────────────────────

function getApiError(e: unknown) {
  const m = (e as any)?.response?.data?.message;
  return typeof m === 'string' && m ? m : null;
}

function presentRate(records: any[]) {
  if (!records?.length) return 0;
  return Math.round(records.filter((r) => r.status === 'present').length / records.length * 100);
}

function fmtDate(d: string | Date) {
  return new Date(d).toLocaleDateString('en-PK', { day: 'numeric', month: 'short', year: 'numeric' });
}

const STATUS_COLORS: Record<string, string> = {
  present: 'text-nc-green bg-nc-green/10 border border-nc-green/20',
  absent : 'text-nc-red  bg-nc-red/10  border border-nc-red/20',
  excused: 'text-gold    bg-gold/10    border border-gold/20',
};

const STATUS_CYCLE: Record<string, string> = {
  present: 'absent',
  absent : 'excused',
  excused: 'present',
};

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
  const [topic,   setTopic]   = useState(record.topic || '');
  const [date,    setDate]    = useState(
    record.sessionDate ? new Date(record.sessionDate).toISOString().split('T')[0] : '',
  );
  const [sessNum, setSessNum] = useState<number>(record.sessionNumber ?? 1);
  const [rows,    setRows]    = useState<any[]>(
    (record.records || []).map((r: any) => ({
      student: r.student?._id || r.student,
      name   : r.student?.fullName || '—',
      status : r.status,
      note   : r.note || '',
    })),
  );
  const [saving, setSaving] = useState(false);

  const cycleStatus = (idx: number) =>
    setRows((prev) =>
      prev.map((r, i) => i === idx ? { ...r, status: STATUS_CYCLE[r.status] || 'present' } : r),
    );

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await attendanceService.update(record._id, {
        topic, sessionDate: date, sessionNumber: sessNum,
        records: rows.map((r) => ({ student: r.student, status: r.status, note: r.note })),
      });
      toast({ title: 'Attendance updated!' });
      onSaved(updated.data?.data || updated.data);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Update failed', description: getApiError(e) || 'Try again.' });
    } finally {
      setSaving(false);
    }
  };

  const pCount = rows.filter((r) => r.status === 'present').length;
  const aCount = rows.filter((r) => r.status === 'absent').length;
  const eCount = rows.filter((r) => r.status === 'excused').length;

  return (
    <Modal
      open
      onClose={onClose}
      title="Edit Attendance Session"
      subtitle={`${record.circle?.name || '—'} · Session #${record.sessionNumber}`}
    >
      {/* Session meta */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div>
          <label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">Session #</label>
          <input
            type="number" min={1}
            className="w-full px-3 py-2 border border-border rounded-md text-sm bg-card focus:border-teal outline-none"
            value={sessNum}
            onChange={(e) => setSessNum(Number(e.target.value))}
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">Date</label>
          <input
            type="date"
            className="w-full px-3 py-2 border border-border rounded-md text-sm bg-card focus:border-teal outline-none"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div>
          <label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">Topic</label>
          <input
            type="text"
            className="w-full px-3 py-2 border border-border rounded-md text-sm bg-card focus:border-teal outline-none"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          />
        </div>
      </div>

      {/* Summary chips */}
      <div className="flex gap-2 mb-3">
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-nc-green/10 text-nc-green">{pCount} Present</span>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-nc-red/10  text-nc-red">{aCount} Absent</span>
        <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gold/10    text-gold">{eCount} Excused</span>
        <span className="ml-auto text-[11px] text-nc-muted">Click status to cycle: Present → Absent → Excused</span>
      </div>

      {/* Student rows */}
      <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
        {rows.map((r, i) => (
          <div key={r.student} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/30">
            <div className="w-8 h-8 rounded-full bg-teal/10 flex items-center justify-center text-teal font-bold text-xs flex-shrink-0">
              {r.name.charAt(0)}
            </div>
            <span className="flex-1 text-[13px] font-medium text-foreground">{r.name}</span>
            <button
              onClick={() => cycleStatus(i)}
              className={`px-3 py-1 rounded-full text-[11px] font-bold capitalize cursor-pointer transition-all ${STATUS_COLORS[r.status]}`}
            >
              {r.status}
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-3 mt-5 pt-4 border-t border-border">
        <button onClick={onClose} className="flex-1 btn-outline">Cancel</button>
        <button onClick={handleSave} disabled={saving} className="flex-1 btn-primary">
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>
    </Modal>
  );
}

// ── Delete Confirm ────────────────────────────────────────────────────────────

function DeleteConfirm({
  record,
  onClose,
  onDeleted,
}: {
  record: any;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    try {
      await attendanceService.remove(record._id);
      toast({ title: 'Session deleted.' });
      onDeleted(record._id);
    } catch (e) {
      toast({ variant: 'destructive', title: 'Delete failed', description: getApiError(e) || 'Try again.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal open onClose={onClose} title="Delete Session" subtitle="This action cannot be undone.">
      <p className="text-[13px] text-nc-muted mb-6">
        Are you sure you want to delete the attendance record for{' '}
        <strong>{record.circle?.name || '—'}</strong> — Session #{record.sessionNumber} ({fmtDate(record.sessionDate)})?
      </p>
      <div className="flex gap-3">
        <button onClick={onClose} className="flex-1 btn-outline">Cancel</button>
        <button
          onClick={confirm} disabled={busy}
          className="flex-1 py-2 px-4 rounded-md bg-nc-red text-white text-sm font-bold hover:bg-nc-red/90 transition-colors"
        >
          {busy ? 'Deleting…' : 'Yes, Delete'}
        </button>
      </div>
    </Modal>
  );
}

// ── Sessions Table ────────────────────────────────────────────────────────────

function SessionsTable({
  sessions,
  onEdit,
  onDelete,
}: {
  sessions: any[];
  onEdit: (r: any) => void;
  onDelete: (r: any) => void;
}) {
  if (!sessions.length)
    return <div className="text-center py-12 text-nc-muted text-sm">No sessions found.</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-[13px]">
        <thead>
          <tr>
            {['Circle', 'Session #', 'Date', 'Topic', 'Students', 'Present %', 'Submitted By', ''].map((h) => (
              <th key={h} className="bg-muted px-3.5 py-2.5 text-left text-[11px] font-semibold text-nc-muted uppercase tracking-wide border-b border-border whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sessions.map((rec) => {
            const rate = presentRate(rec.records);
            return (
              <tr key={rec._id} className="hover:bg-teal-lt/50 transition-colors group">
                <td className="px-3.5 py-3 border-b border-border font-semibold">{rec.circle?.name || '—'}</td>
                <td className="px-3.5 py-3 border-b border-border text-center">
                  <span className="font-bold text-teal text-[13px]">#{rec.sessionNumber}</span>
                </td>
                <td className="px-3.5 py-3 border-b border-border text-nc-muted whitespace-nowrap">{fmtDate(rec.sessionDate)}</td>
                <td className="px-3.5 py-3 border-b border-border max-w-[160px] truncate text-slate">{rec.topic || '—'}</td>
                <td className="px-3.5 py-3 border-b border-border text-center text-nc-muted">{rec.records?.length ?? 0}</td>
                <td className="px-3.5 py-3 border-b border-border">
                  <div className="flex items-center gap-2">
                    <div className="w-14 h-1.5 bg-muted rounded-full overflow-hidden flex-shrink-0">
                      <div
                        className={`h-full rounded-full ${rate >= 85 ? 'bg-nc-green' : rate >= 60 ? 'bg-gold' : 'bg-nc-red'}`}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold ${rate >= 85 ? 'text-nc-green' : rate >= 60 ? 'text-gold-dim' : 'text-nc-red'}`}>
                      {rate}%
                    </span>
                  </div>
                </td>
                <td className="px-3.5 py-3 border-b border-border text-nc-muted text-xs">{rec.submittedBy?.fullName || '—'}</td>
                <td className="px-3.5 py-3 border-b border-border">
                  <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEdit(rec)}
                      className="p-1.5 rounded-md hover:bg-teal/10 text-teal transition-colors"
                      title="Edit"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => onDelete(rec)}
                      className="p-1.5 rounded-md hover:bg-nc-red/10 text-nc-red transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = 'all' | 'murabbi' | 'student';

export default function AttendancePage() {
  const { toast } = useToast();

  // Data
  const [sessions,  setSessions]  = useState<any[]>([]);
  const [murabbis,  setMurabbis]  = useState<any[]>([]);
  const [students,  setStudents]  = useState<any[]>([]);
  const [loading,   setLoading]   = useState(true);

  // Filters
  const [tab,        setTab]        = useState<Tab>('all');
  const [search,     setSearch]     = useState('');
  const [murabbiId,  setMurabbiId]  = useState('');
  const [studentId,  setStudentId]  = useState('');
  const [filteredMurabbi,  setFilteredMurabbi]  = useState<any[]>([]);
  const [filteredStudent,  setFilteredStudent]  = useState<any[]>([]);
  const [murabbiLoading,   setMurabbiLoading]   = useState(false);
  const [studentLoading,   setStudentLoading]   = useState(false);

  // Modals
  const [editTarget,   setEditTarget]   = useState<any>(null);
  const [deleteTarget, setDeleteTarget] = useState<any>(null);
  const [markOpen,     setMarkOpen]     = useState(false);

  // Load base data
  function load() {
    setLoading(true);
    Promise.all([
      attendanceService.getAll(),
      adminService.getMurabbis(),
      studentsService.getAll(),
    ])
      .then(([aRes, mRes, sRes]) => {
        setSessions(aRes.data.data || []);
        setMurabbis(mRes.data.data || []);
        setStudents(sRes.data.data || []);
      })
      .catch(() => toast({ variant: 'destructive', title: 'Failed to load data' }))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  // Load by-murabbi when murabbiId changes
  useEffect(() => {
    if (!murabbiId) { setFilteredMurabbi([]); return; }
    setMurabbiLoading(true);
    attendanceService.getByMurabbi(murabbiId)
      .then((res) => setFilteredMurabbi(res.data.data || []))
      .catch(() => toast({ variant: 'destructive', title: 'Failed to load murabbi sessions' }))
      .finally(() => setMurabbiLoading(false));
  }, [murabbiId]);

  // Load by-student when studentId changes
  useEffect(() => {
    if (!studentId) { setFilteredStudent([]); return; }
    setStudentLoading(true);
    attendanceService.getByStudent(studentId)
      .then((res) => setFilteredStudent(res.data.data || []))
      .catch(() => toast({ variant: 'destructive', title: 'Failed to load student history' }))
      .finally(() => setStudentLoading(false));
  }, [studentId]);

  // Stats
  const stats = useMemo(() => {
    const total = sessions.length;
    const avgRate = total
      ? Math.round(sessions.reduce((s, r) => s + presentRate(r.records), 0) / total)
      : 0;
    const totalStudentSlots = sessions.reduce((s, r) => s + (r.records?.length || 0), 0);
    return { total, avgRate, totalStudentSlots };
  }, [sessions]);

  // All-sessions search filter
  const visibleSessions = useMemo(() => {
    if (!search.trim()) return sessions;
    const q = search.toLowerCase();
    return sessions.filter(
      (r) =>
        r.circle?.name?.toLowerCase().includes(q) ||
        r.topic?.toLowerCase().includes(q) ||
        r.submittedBy?.fullName?.toLowerCase().includes(q),
    );
  }, [sessions, search]);

  // Murabbi-tab search filter
  const visibleMurabbi = useMemo(() => {
    if (!search.trim()) return filteredMurabbi;
    const q = search.toLowerCase();
    return filteredMurabbi.filter(
      (r) => r.circle?.name?.toLowerCase().includes(q) || r.topic?.toLowerCase().includes(q),
    );
  }, [filteredMurabbi, search]);

  // Student-tab filter
  const visibleStudent = useMemo(() => {
    if (!search.trim()) return filteredStudent;
    const q = search.toLowerCase();
    return filteredStudent.filter(
      (r) => r.circle?.name?.toLowerCase().includes(q) || r.topic?.toLowerCase().includes(q),
    );
  }, [filteredStudent, search]);

  const handleEdited = (updated: any) => {
    setSessions((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
    if (murabbiId) setFilteredMurabbi((prev) => prev.map((s) => (s._id === updated._id ? updated : s)));
    setEditTarget(null);
  };

  const handleDeleted = (id: string) => {
    setSessions((prev) => prev.filter((s) => s._id !== id));
    setFilteredMurabbi((prev) => prev.filter((s) => s._id !== id));
    setDeleteTarget(null);
  };

  const TABS: { key: Tab; label: string; icon: React.ElementType }[] = [
    { key: 'all',      label: 'All Sessions',   icon: BookOpen  },
    { key: 'murabbi',  label: 'By Murabbi',      icon: Users     },
    { key: 'student',  label: 'By Student',      icon: Calendar  },
  ];

  return (
    <div className="page-animate">
      <div className="flex items-start justify-between mb-6">
        <SectionTitle
          title="Attendance Management"
          subtitle="View, edit and manage all attendance records."
        />
        <button className="btn-gold flex items-center gap-2 flex-shrink-0" onClick={() => setMarkOpen(true)}>
          <Plus className="h-4 w-4" /> Mark Attendance
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Sessions',     value: stats.total,            color: 'text-teal',     icon: BookOpen     },
          { label: 'Avg Present Rate',   value: `${stats.avgRate}%`,    color: 'text-nc-green', icon: CheckCircle2 },
          { label: 'Student Attendances',value: stats.totalStudentSlots, color: 'text-gold',    icon: Users        },
        ].map(({ label, value, color, icon: Icon }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center flex-shrink-0`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <div>
              <p className={`text-2xl font-bold font-serif ${color}`}>{loading ? '—' : value}</p>
              <p className="text-[11px] text-nc-muted mt-0.5">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <NcCard>
        {/* Tab bar + search */}
        <CardHeader>
          <div className="flex flex-wrap items-center gap-3 w-full">
            {/* Tabs */}
            <div className="flex bg-muted rounded-lg p-1 gap-0.5">
              {TABS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => { setTab(key); setSearch(''); }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    tab === key ? 'bg-card text-foreground shadow-sm' : 'text-nc-muted hover:text-foreground'
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" /> {label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-nc-muted" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  tab === 'student'
                    ? 'Search by circle or topic…'
                    : 'Search by circle, topic, or murabbi…'
                }
                className="w-full pl-9 pr-8 py-2 text-sm border border-border rounded-lg bg-card focus:border-teal focus:shadow-[0_0_0_3px_rgba(14,107,114,0.08)] outline-none transition-colors"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-nc-muted hover:text-foreground">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            {/* Murabbi dropdown */}
            {tab === 'murabbi' && (
              <select
                value={murabbiId}
                onChange={(e) => setMurabbiId(e.target.value)}
                className="px-3 py-2 text-sm border border-border rounded-lg bg-card focus:border-teal outline-none min-w-[200px]"
              >
                <option value="">— Select Murabbi —</option>
                {murabbis.map((m) => (
                  <option key={m._id} value={m._id}>{m.fullName}</option>
                ))}
              </select>
            )}

            {/* Student dropdown */}
            {tab === 'student' && (
              <select
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                className="px-3 py-2 text-sm border border-border rounded-lg bg-card focus:border-teal outline-none min-w-[200px]"
              >
                <option value="">— Select Student —</option>
                {students.map((s) => (
                  <option key={s._id} value={s._id}>{s.fullName} — {s.circle?.name || 'No circle'}</option>
                ))}
              </select>
            )}
          </div>
        </CardHeader>

        {/* Content */}
        {loading ? (
          <div className="text-center py-16 text-nc-muted text-sm animate-pulse">Loading attendance records…</div>
        ) : tab === 'all' ? (
          <SessionsTable sessions={visibleSessions} onEdit={setEditTarget} onDelete={setDeleteTarget} />

        ) : tab === 'murabbi' ? (
          !murabbiId ? (
            <div className="text-center py-16 text-nc-muted text-sm">Select a murabbi to view their sessions.</div>
          ) : murabbiLoading ? (
            <div className="text-center py-16 text-nc-muted text-sm animate-pulse">Loading…</div>
          ) : (
            <SessionsTable sessions={visibleMurabbi} onEdit={setEditTarget} onDelete={setDeleteTarget} />
          )

        ) : (
          /* Student tab */
          !studentId ? (
            <div className="text-center py-16 text-nc-muted text-sm">Select a student to view their attendance history.</div>
          ) : studentLoading ? (
            <div className="text-center py-16 text-nc-muted text-sm animate-pulse">Loading…</div>
          ) : visibleStudent.length === 0 ? (
            <div className="text-center py-16 text-nc-muted text-sm">No attendance records found for this student.</div>
          ) : (
            <div className="overflow-x-auto">
              {/* Student summary */}
              {(() => {
                const p = visibleStudent.filter((r) => r.status === 'present').length;
                const a = visibleStudent.filter((r) => r.status === 'absent').length;
                const e = visibleStudent.filter((r) => r.status === 'excused').length;
                const rate = visibleStudent.length ? Math.round(p / visibleStudent.length * 100) : 0;
                return (
                  <div className="flex items-center gap-4 px-4 py-3 mb-4 bg-muted/50 rounded-lg border border-border">
                    <span className="text-[12px] font-semibold text-nc-muted">Overall:</span>
                    <span className="text-[13px] font-bold text-nc-green">{p} Present</span>
                    <span className="text-[13px] font-bold text-nc-red">{a} Absent</span>
                    <span className="text-[13px] font-bold text-gold">{e} Excused</span>
                    <span className={`ml-auto text-lg font-bold font-serif ${rate >= 85 ? 'text-nc-green' : rate >= 60 ? 'text-gold' : 'text-nc-red'}`}>
                      {rate}% Attendance
                    </span>
                  </div>
                );
              })()}
              <table className="w-full border-collapse text-[13px]">
                <thead>
                  <tr>
                    {['Session #', 'Date', 'Circle', 'Topic', 'Status', 'Note'].map((h) => (
                      <th key={h} className="bg-muted px-3.5 py-2.5 text-left text-[11px] font-semibold text-nc-muted uppercase tracking-wide border-b border-border">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visibleStudent.map((rec) => (
                    <tr key={rec._id} className="hover:bg-teal-lt/50 transition-colors">
                      <td className="px-3.5 py-3 border-b border-border">
                        <span className="font-bold text-teal">#{rec.sessionNumber}</span>
                      </td>
                      <td className="px-3.5 py-3 border-b border-border text-nc-muted whitespace-nowrap">{fmtDate(rec.sessionDate)}</td>
                      <td className="px-3.5 py-3 border-b border-border font-medium">{rec.circle?.name || '—'}</td>
                      <td className="px-3.5 py-3 border-b border-border text-slate max-w-[160px] truncate">{rec.topic || '—'}</td>
                      <td className="px-3.5 py-3 border-b border-border">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold capitalize ${STATUS_COLORS[rec.status]}`}>
                          {rec.status === 'present'
                            ? <CheckCircle2 className="h-3 w-3" />
                            : rec.status === 'absent'
                            ? <XCircle className="h-3 w-3" />
                            : <Clock className="h-3 w-3" />}
                          {rec.status}
                        </span>
                      </td>
                      <td className="px-3.5 py-3 border-b border-border text-nc-muted text-xs">{rec.note || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </NcCard>

      {/* Modals */}
      {editTarget   && <EditModal   record={editTarget}   onClose={() => setEditTarget(null)}   onSaved={handleEdited}  />}
      {deleteTarget && <DeleteConfirm record={deleteTarget} onClose={() => setDeleteTarget(null)} onDeleted={handleDeleted} />}

      {markOpen && (
        <MarkAttendanceModal
          murabbis={murabbis}
          onClose={() => setMarkOpen(false)}
          onSuccess={load}
        />
      )}
    </div>
  );
}

// ── Mark Attendance Modal ─────────────────────────────────────────────────────

function MarkAttendanceModal({
  onClose,
  onSuccess,
}: {
  murabbis: any[];
  onClose: () => void;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const [circles,    setCircles]    = useState<any[]>([]);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [selectedCircle, setSelectedCircle] = useState<any>(null);
  const [records,   setRecords]    = useState<Record<string, string>>({});
  const [topic,     setTopic]      = useState('');
  const [sessNum,   setSessNum]    = useState(1);
  const [date,      setDate]       = useState(new Date().toISOString().split('T')[0]);
  const [submitting, setSubmitting] = useState(false);
  const [loading,    setLoading]   = useState(true);

  useEffect(() => {
    Promise.all([circlesService.getAll(), studentsService.getAll()])
      .then(([cRes, sRes]) => {
        const c = cRes.data.data || [];
        setCircles(c);
        setAllStudents(sRes.data.data || []);
        if (c.length) setSelectedCircle(c[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  const circleStudents = allStudents.filter(
    (s) => selectedCircle && (s.circle?._id === selectedCircle._id || s.circle === selectedCircle._id),
  );

  const getStatus = (id: string) => records[id] || 'present';
  const cycle = (id: string) =>
    setRecords((p) => ({ ...p, [id]: STATUS_CYCLE[p[id] || 'present'] || 'present' }));

  const handleSubmit = async () => {
    if (!selectedCircle || !circleStudents.length) return;
    setSubmitting(true);
    try {
      await attendanceService.submit({
        circle: selectedCircle._id,
        sessionNumber: sessNum,
        sessionDate: date,
        topic: topic || 'General Session',
        records: circleStudents.map((s) => ({ student: s._id, status: getStatus(s._id), note: '' })),
      });
      toast({ title: 'Attendance submitted!', description: `Session #${sessNum} recorded.` });
      onClose();
      onSuccess();
    } catch (e) {
      toast({ variant: 'destructive', title: 'Submit failed', description: getApiError(e) || 'Try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const pCount = circleStudents.filter((s) => getStatus(s._id) === 'present').length;

  return (
    <Modal open onClose={onClose} title="Mark Attendance" subtitle="Submit attendance for a circle session">
      {loading ? (
        <div className="text-center py-8 text-nc-muted text-sm animate-pulse">Loading…</div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">Circle</label>
              <select
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-card focus:border-teal outline-none"
                value={selectedCircle?._id || ''}
                onChange={(e) => setSelectedCircle(circles.find((c) => c._id === e.target.value))}
              >
                {circles.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">Session #</label>
              <input
                type="number" min={1} value={sessNum}
                onChange={(e) => setSessNum(Number(e.target.value))}
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-card focus:border-teal outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">Date</label>
              <input
                type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-card focus:border-teal outline-none"
              />
            </div>
            <div>
              <label className="block text-[11px] font-semibold text-nc-muted uppercase tracking-wide mb-1">Topic</label>
              <input
                type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
                placeholder="Session topic"
                className="w-full px-3 py-2 border border-border rounded-md text-sm bg-card focus:border-teal outline-none"
              />
            </div>
          </div>

          <div className="flex gap-2 mb-3">
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-nc-green/10 text-nc-green">{pCount} Present</span>
            <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-nc-red/10 text-nc-red">{circleStudents.length - pCount} Absent</span>
            <span className="ml-auto text-[11px] text-nc-muted">Click to cycle status</span>
          </div>

          {circleStudents.length === 0 ? (
            <div className="text-center py-6 text-nc-muted text-sm">No students in this circle.</div>
          ) : (
            <div className="max-h-[280px] overflow-y-auto space-y-2 pr-1">
              {circleStudents.map((s) => (
                <div
                  key={s._id}
                  onClick={() => cycle(s._id)}
                  className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all ${
                    getStatus(s._id) === 'present'
                      ? 'bg-green-50/30 border-green-200'
                      : getStatus(s._id) === 'excused'
                      ? 'bg-gold/5 border-gold/30'
                      : 'bg-red-50/30 border-red-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                      getStatus(s._id) === 'present' ? 'bg-green-100 text-green-700'
                      : getStatus(s._id) === 'excused' ? 'bg-gold/20 text-gold-dim'
                      : 'bg-red-100 text-red-700'
                    }`}>
                      {s.fullName?.charAt(0)}
                    </div>
                    <span className="text-[13px] font-medium">{s.fullName}</span>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[11px] font-bold capitalize ${STATUS_COLORS[getStatus(s._id)]}`}>
                    {getStatus(s._id)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="flex gap-3 mt-5 pt-4 border-t border-border">
            <button onClick={onClose} className="flex-1 btn-outline">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={submitting || circleStudents.length === 0}
              className="flex-1 btn-primary"
            >
              {submitting ? 'Submitting…' : 'Submit Attendance'}
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}