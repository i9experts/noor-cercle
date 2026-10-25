import { useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { circlesService, syllabusService } from "@/services/api.service";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import Modal, { FormGroup, FormInput, FormRow, FormSelect, FormTextarea } from "@/components/shared/Modal";
import DeleteConfirmModal from "@/components/shared/DeleteConfirmModal";
import CalendarList from "@/components/shared/CalendarList";
import { apiError, apiMessage, unwrap } from "@/lib/finance";
import { addDays, formatDay, pkToday } from "@/lib/schedule";

const TYPE_LABEL: Record<string, string> = { holiday: "Holiday", parent_evening: "Parent evening", event: "Event" };
const WINDOW = 28;

export default function CalendarPage() {
  const { toast } = useToast();
  const [from, setFrom]       = useState(pkToday());
  const [circleId, setCircle] = useState("");
  const [circles, setCircles] = useState<any[]>([]);
  const [items, setItems]     = useState<any[]>([]);
  const [events, setEvents]   = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding]   = useState(false);
  const [toDelete, setToDelete] = useState<any>(null);

  const to = addDays(from, WINDOW - 1);

  async function load() {
    setLoading(true);
    try {
      const [cal, ev] = await Promise.all([
        syllabusService.calendar({ from, to, ...(circleId && { circleId }) }),
        syllabusService.events({ from: addDays(pkToday(), -30) }),
      ]);
      setItems(unwrap(cal).items || []);
      setEvents(unwrap(ev) || []);
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not load the calendar.") });
    } finally {
      setLoading(false);
    }
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { load(); }, [from, circleId]);
  useEffect(() => {
    circlesService.getAll().then((r) => setCircles((unwrap<any[]>(r) || []).filter((c) => c.isActive))).catch(() => {});
  }, []);

  async function remove() {
    if (!toDelete) return;
    try {
      await syllabusService.deleteEvent(toDelete._id);
      toast({ title: "Removed from the calendar." });
      load();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not remove it.") });
    } finally {
      setToDelete(null);
    }
  }

  return (
    <div className="page-animate">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-serif text-[26px] text-nc-dark">Calendar</h2>
          <p className="mt-1 max-w-2xl text-[13.5px] text-nc-muted">
            Every circle’s weekly meetings with the session they should cover, plus holidays and parent evenings.
            Families see their own circle’s calendar on their family page.
          </p>
        </div>
        <button className="btn-primary inline-flex items-center gap-1.5" onClick={() => setAdding(true)}>
          <Plus className="h-4 w-4" /> Add to calendar
        </button>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <NcCard className="p-4 sm:p-6">
          <div className="mb-4 flex flex-wrap items-center gap-2">
            <button className="rounded-md border border-border p-2 hover:border-primary" onClick={() => setFrom(addDays(from, -WINDOW))} aria-label="Previous four weeks"><ChevronLeft className="h-4 w-4" /></button>
            <button className="rounded-md border border-border px-3 py-1.5 text-[12.5px] hover:border-primary" onClick={() => setFrom(pkToday())}>Today</button>
            <button className="rounded-md border border-border p-2 hover:border-primary" onClick={() => setFrom(addDays(from, WINDOW))} aria-label="Next four weeks"><ChevronRight className="h-4 w-4" /></button>
            <span className="text-[13px] font-medium text-nc-dark">{formatDay(from)} – {formatDay(to, true)}</span>
            <select value={circleId} onChange={(e) => setCircle(e.target.value)} aria-label="Circle"
              className="ml-auto h-9 rounded-md border border-input bg-card px-2.5 text-[13px] focus:border-primary focus:outline-none">
              <option value="">All circles</option>
              {circles.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          {loading ? <div className="py-16 text-center text-sm text-nc-muted">Loading…</div> : <CalendarList items={items} showCircle />}
        </NcCard>

        <NcCard className="p-4 sm:p-6">
          <CardHeader><CardTitle sub="Holidays, parent evenings and events">Dates you’ve added</CardTitle></CardHeader>
          {events.length === 0 ? (
            <div className="py-8 text-center text-[12.5px] text-nc-muted">
              <CalendarDays className="mx-auto mb-2 h-7 w-7 text-pale" strokeWidth={1.5} />
              Nothing yet. Add Eid holidays, school breaks and parent evenings.
            </div>
          ) : (
            <div className="space-y-2">
              {events.map((e) => (
                <div key={e._id} className="flex items-start gap-2 rounded-md border border-border px-3 py-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-medium text-nc-dark">{e.title}</div>
                    <div className="text-[11.5px] text-nc-muted">
                      {TYPE_LABEL[e.type]} · {formatDay(e.startDate)}{e.endDate !== e.startDate ? ` – ${formatDay(e.endDate)}` : ""}
                      {e.cancelsSessions ? " · no circles" : ""}
                      {e.circles?.length ? ` · ${e.circles.map((c: any) => c.name).join(", ")}` : " · all circles"}
                    </div>
                  </div>
                  <button className="rounded-md p-1.5 text-nc-muted hover:bg-nc-red-lt hover:text-nc-red" onClick={() => setToDelete(e)} aria-label={`Remove ${e.title}`}>
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </NcCard>
      </div>

      {adding && <EventModal circles={circles} onClose={() => setAdding(false)} onSaved={() => { setAdding(false); load(); }} />}
      <DeleteConfirmModal
        open={!!toDelete}
        title="Remove from the calendar?"
        message={toDelete ? `“${toDelete.title}” will be removed. If it cancelled meetings, those weeks count as normal meetings again.` : ""}
        confirmLabel="Remove"
        onConfirm={remove}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}

function EventModal({ circles, onClose, onSaved }: { circles: any[]; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({ title: "", type: "holiday", startDate: pkToday(), endDate: "", scope: "all", circleIds: [] as string[], cancelsSessions: true, notes: "" });
  const set = (k: keyof typeof f, v: any) => setF((x) => ({ ...x, [k]: v }));

  async function save() {
    if (!f.title.trim()) { toast({ variant: "destructive", title: "Add a title." }); return; }
    setSaving(true);
    try {
      const r = await syllabusService.createEvent({
        title: f.title.trim(), type: f.type, startDate: f.startDate, ...(f.endDate && { endDate: f.endDate }),
        circleIds: f.scope === "all" ? [] : f.circleIds, cancelsSessions: f.cancelsSessions, notes: f.notes.trim() || undefined,
      });
      toast({ title: apiMessage(r) });
      onSaved();
    } catch (err) {
      toast({ variant: "destructive", title: apiError(err, "Could not add it.") });
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open onClose={onClose} title="Add to the calendar" subtitle="Holidays can cancel circle meetings, so the syllabus plan skips those weeks.">
      <FormGroup label="Title" required>
        <FormInput value={f.title} maxLength={150} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Eid ul-Adha break" />
      </FormGroup>
      <FormRow>
        <FormGroup label="Type">
          <FormSelect value={f.type} onChange={(e) => { set("type", e.target.value); set("cancelsSessions", e.target.value === "holiday"); }}>
            <option value="holiday">Holiday</option>
            <option value="parent_evening">Parent evening</option>
            <option value="event">Event</option>
          </FormSelect>
        </FormGroup>
        <FormGroup label="Circles">
          <FormSelect value={f.scope} onChange={(e) => set("scope", e.target.value)}>
            <option value="all">All circles</option>
            <option value="some">Selected circles</option>
          </FormSelect>
        </FormGroup>
      </FormRow>
      {f.scope === "some" && (
        <div className="mb-[18px] max-h-40 space-y-1 overflow-y-auto rounded-md border border-border p-2">
          {circles.map((c) => (
            <label key={c._id} className="flex items-center gap-2 text-[13px]">
              <input type="checkbox" checked={f.circleIds.includes(c._id)}
                onChange={(e) => set("circleIds", e.target.checked ? [...f.circleIds, c._id] : f.circleIds.filter((x) => x !== c._id))} />
              {c.name}
            </label>
          ))}
        </div>
      )}
      <FormRow>
        <FormGroup label="From" required>
          <FormInput type="date" value={f.startDate} onChange={(e) => set("startDate", e.target.value)} />
        </FormGroup>
        <FormGroup label="To (optional)">
          <FormInput type="date" value={f.endDate} min={f.startDate} onChange={(e) => set("endDate", e.target.value)} />
        </FormGroup>
      </FormRow>
      <label className="mb-[18px] flex items-center gap-2 text-[13px] text-nc-dark">
        <input type="checkbox" checked={f.cancelsSessions} onChange={(e) => set("cancelsSessions", e.target.checked)} />
        Circles don’t meet on these days
      </label>
      <FormGroup label="Notes">
        <FormTextarea rows={2} value={f.notes} maxLength={1000} onChange={(e) => set("notes", e.target.value)} />
      </FormGroup>
      <div className="flex justify-end gap-2">
        <button className="btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn-primary disabled:opacity-50" onClick={save} disabled={saving}>{saving ? "Saving…" : "Add"}</button>
      </div>
    </Modal>
  );
}
