import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import SectionTitle from "@/components/shared/SectionTitle";
import { Check, X, Calendar, Clock, MapPin } from "lucide-react";
import { useState } from "react";

export default function MurabbiAttendance() {
  const initialStudents = [
    { id: 1, name: 'Ahmed Ali', circle: 'Gulshan Circle 1', status: 'present' },
    { id: 2, name: 'Fatima Zahra', circle: 'Gulshan Circle 1', status: 'present' },
    { id: 3, name: 'Zaid Khan', circle: 'Gulshan Circle 1', status: 'absent' },
    { id: 4, name: 'Maryum Bibi', circle: 'Gulshan Circle 1', status: 'present' },
    { id: 5, name: 'Hassan Raza', circle: 'Gulshan Circle 1', status: 'present' },
    { id: 6, name: 'Ayesha Siddiqua', circle: 'Gulshan Circle 1', status: 'present' },
  ];

  const [students, setStudents] = useState(initialStudents);

  const toggleStatus = (id: number) => {
    setStudents(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, status: s.status === 'present' ? 'absent' : 'present' };
      }
      return s;
    }));
  };

  const presentCount = students.filter(s => s.status === 'present').length;

  return (
    <div className="page-animate">
      <SectionTitle 
        title="Mark Attendance" 
        subtitle="Record student presence for today's session."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <NcCard>
            <CardHeader>
              <CardTitle sub="Friday, 24 April · Character Building (Sidq)">Gulshan Circle 1 Session</CardTitle>
              <div className="flex gap-2">
                <span className="text-xs font-semibold px-2.5 py-1 bg-green-100 text-green-700 rounded-full">
                  {presentCount} Present
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 bg-red-100 text-red-700 rounded-full">
                  {students.length - presentCount} Absent
                </span>
              </div>
            </CardHeader>

            <div className="mt-4 space-y-2">
              {students.map((student) => (
                <div 
                  key={student.id} 
                  className={`flex justify-between items-center p-3.5 rounded-lg border transition-all cursor-pointer ${
                    student.status === 'present' 
                      ? 'bg-green-50/30 border-green-200' 
                      : 'bg-red-50/30 border-red-200'
                  }`}
                  onClick={() => toggleStatus(student.id)}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      student.status === 'present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {student.name.charAt(0)}
                    </div>
                    <div>
                      <div className="text-[15px] font-semibold text-foreground">{student.name}</div>
                      <div className="text-[11px] text-nc-muted">ID: #00{student.id} · {student.circle}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {student.status === 'present' ? (
                      <div className="flex items-center gap-2 bg-green-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">
                        <Check className="h-3.5 w-3.5" /> Present
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-red-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-sm">
                        <X className="h-3.5 w-3.5" /> Absent
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button className="btn-primary w-full md:w-auto px-10 py-2.5 shadow-lg shadow-primary/20">
                Submit Attendance
              </button>
            </div>
          </NcCard>
        </div>

        <div className="flex flex-col gap-6">
          <NcCard>
            <CardHeader><CardTitle>Session Details</CardTitle></CardHeader>
            <div className="space-y-4 mt-2">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  <Calendar className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[11px] text-nc-muted">Date</div>
                  <div className="text-sm font-semibold">Friday, 24 April 2026</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  <Clock className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[11px] text-nc-muted">Time</div>
                  <div className="text-sm font-semibold">4:00 PM - 5:30 PM</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                  <MapPin className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[11px] text-nc-muted">Location</div>
                  <div className="text-sm font-semibold">Gulshan Community Center</div>
                </div>
              </div>
            </div>
          </NcCard>

          <NcCard>
            <CardHeader><CardTitle>Instructions</CardTitle></CardHeader>
            <ul className="text-xs space-y-2.5 mt-2 text-nc-muted list-disc pl-4 leading-relaxed">
              <li>Please mark attendance within the first 15 minutes of the session.</li>
              <li>Add a note for students who are absent for 3 consecutive sessions.</li>
              <li>Attendance data is synced with parent dashboard in real-time.</li>
              <li>Confirm location to enable auto-attendance check-in for students.</li>
            </ul>
          </NcCard>
        </div>
      </div>
    </div>
  );
}
