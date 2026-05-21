import { useEffect, useState } from "react";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import SectionTitle from "@/components/shared/SectionTitle";
import { Check, X } from "lucide-react";
import { murabbisService, attendanceService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";

type Status = "present" | "absent" | "excused";

export default function MurabbiAttendance() {
  const { toast } = useToast();
  const [circles, setCircles] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [records, setRecords] = useState<Record<string, Status>>({});
  const [selectedCircle, setSelectedCircle] = useState<any>(null);
  const [topic, setTopic] = useState("");
  const [sessionNumber, setSessionNumber] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([murabbisService.getMyCircles(), murabbisService.getMyStudents()])
      .then(([cRes, sRes]) => {
        const c = cRes.data.data || [];
        setCircles(c);
        if (c.length > 0) setSelectedCircle(c[0]);
        setStudents(sRes.data.data || []);
      })
      .finally(() => setLoading(false));
  }, []);

  const circleStudents = students.filter((s) => s.circle?._id === selectedCircle?._id || s.circle === selectedCircle?._id);

  const toggle = (id: string) => {
    setRecords((prev) => ({ ...prev, [id]: prev[id] === "present" ? "absent" : "present" }));
  };

  const getStatus = (id: string): Status => records[id] || "present";

  const handleSubmit = async () => {
    if (!selectedCircle) return;
    setSubmitting(true);
    try {
      await attendanceService.submit({
        circle: selectedCircle._id,
        sessionNumber,
        sessionDate: new Date().toISOString().split("T")[0],
        topic: topic || "General Session",
        records: circleStudents.map((s) => ({
          student: s._id,
          status: getStatus(s._id),
          note: "",
        })),
      });
      toast({ title: "Attendance submitted!", description: `Session #${sessionNumber} recorded.` });
      setSessionNumber((n) => n + 1);
    } catch {
      toast({ variant: "destructive", title: "Failed to submit attendance" });
    } finally {
      setSubmitting(false);
    }
  };

  const presentCount = circleStudents.filter((s) => getStatus(s._id) === "present").length;

  return (
    <div className="page-animate">
      <SectionTitle title="Mark Attendance" subtitle="Record student presence for today's session." />
      {loading ? (
        <div className="text-center py-10 text-nc-muted text-sm animate-pulse">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="lg:col-span-2">
            <NcCard>
              <CardHeader>
                <CardTitle>
                  {selectedCircle?.name || "Select a circle"}
                </CardTitle>
                <div className="flex gap-2">
                  <span className="text-xs font-semibold px-2.5 py-1 bg-green-100 text-green-700 rounded-full">{presentCount} Present</span>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-red-100 text-red-700 rounded-full">{circleStudents.length - presentCount} Absent</span>
                </div>
              </CardHeader>

              <div className="flex gap-3 mt-4 mb-4">
                <select className="border border-border rounded-md px-3 py-2 text-sm bg-white flex-1"
                  onChange={(e) => setSelectedCircle(circles.find((c) => c._id === e.target.value))}>
                  {circles.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
                <input type="number" min={1} value={sessionNumber}
                  onChange={(e) => setSessionNumber(Number(e.target.value))}
                  className="border border-border rounded-md px-3 py-2 text-sm bg-white w-28"
                  placeholder="Session #" />
                <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
                  placeholder="Session topic" className="border border-border rounded-md px-3 py-2 text-sm bg-white flex-1" />
              </div>

              {circleStudents.length === 0 ? (
                <div className="text-center py-8 text-nc-muted text-sm">No students in this circle.</div>
              ) : (
                <div className="scroll-hover max-h-[296px] mt-2 space-y-2">
                  {circleStudents.map((s) => (
                    <div key={s._id}
                      className={`flex justify-between items-center p-3.5 rounded-lg border cursor-pointer transition-all ${getStatus(s._id) === "present" ? "bg-green-50/30 border-green-200" : "bg-red-50/30 border-red-200"}`}
                      onClick={() => toggle(s._id)}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getStatus(s._id) === "present" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {s.fullName?.charAt(0)}
                        </div>
                        <div>
                          <div className="text-[15px] font-semibold">{s.fullName}</div>
                          <div className="text-[11px] text-nc-muted">Age: {s.age}</div>
                        </div>
                      </div>
                      {getStatus(s._id) === "present" ? (
                        <div className="flex items-center gap-2 bg-green-600 text-white px-4 py-1.5 rounded-full text-xs font-bold">
                          <Check className="h-3.5 w-3.5" /> Present
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-bold">
                          <X className="h-3.5 w-3.5" /> Absent
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button className="btn-primary w-full md:w-auto px-10 py-2.5" onClick={handleSubmit} disabled={submitting || circleStudents.length === 0}>
                  {submitting ? "Submitting..." : "Submit Attendance"}
                </button>
              </div>
            </NcCard>
          </div>
        </div>
      )}
    </div>
  );
}