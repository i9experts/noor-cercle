import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import SectionTitle from "@/components/shared/SectionTitle";
import { Search, MoreVertical, Mail, Phone, MessageSquare } from "lucide-react";

export default function MurabbiStudents() {
  const students = [
    { id: 1, name: 'Ahmed Ali', circle: 'Gulshan Circle 1', age: 12, parent: 'Muhammad Ali', contact: '0300-1234567', attendance: '95%', points: 450, status: 'Active' },
    { id: 2, name: 'Fatima Zahra', circle: 'Gulshan Circle 1', age: 11, parent: 'Zahra Khan', contact: '0321-7654321', attendance: '100%', points: 520, status: 'Active' },
    { id: 3, name: 'Zaid Khan', circle: 'Gulshan Circle 1', age: 13, parent: 'Osman Khan', contact: '0333-9876543', attendance: '88%', points: 380, status: 'Active' },
    { id: 4, name: 'Maryum Bibi', circle: 'Gulshan Circle 1', age: 12, parent: 'Sajid Ali', contact: '0312-3456789', attendance: '92%', points: 410, status: 'Active' },
    { id: 5, name: 'Hassan Raza', circle: 'DHA Circle 1', age: 14, parent: 'Raza Ahmad', contact: '0345-1122334', attendance: '85%', points: 320, status: 'Review' },
    { id: 6, name: 'Ayesha Siddiqua', circle: 'DHA Circle 1', age: 11, parent: 'Umar Farooq', contact: '0301-2233445', attendance: '98%', points: 490, status: 'Active' },
  ];

  return (
    <div className="page-animate">
      <SectionTitle 
        title="My Students" 
        subtitle="Manage and track progress of students in your circles."
      />

      <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-nc-muted" />
          <input 
            type="text" 
            placeholder="Search students..." 
            className="w-full pl-10 pr-4 py-2 bg-white border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>
        <div className="flex gap-2">
          <select className="bg-white border border-border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20">
            <option>All Circles</option>
            <option>Gulshan Circle 1</option>
            <option>DHA Circle 1</option>
          </select>
          <button className="btn-primary text-sm px-4">Message All</button>
        </div>
      </div>

      <NcCard>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="px-4 py-4 text-[13px] font-semibold text-nc-muted">Student Name</th>
                <th className="px-4 py-4 text-[13px] font-semibold text-nc-muted">Circle</th>
                <th className="px-4 py-4 text-[13px] font-semibold text-nc-muted">Attendance</th>
                <th className="px-4 py-4 text-[13px] font-semibold text-nc-muted">Noor Points</th>
                <th className="px-4 py-4 text-[13px] font-semibold text-nc-muted">Status</th>
                <th className="px-4 py-4 text-[13px] font-semibold text-nc-muted">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs">
                        {student.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{student.name}</div>
                        <div className="text-[11px] text-nc-muted">Age: {student.age} · {student.parent}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-foreground">{student.circle}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium">{student.attendance}</div>
                    <div className="w-16 h-1 bg-secondary rounded-full mt-1">
                      <div 
                        className="h-full bg-green-500 rounded-full" 
                        style={{ width: student.attendance }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-gold-dim font-bold text-sm">{student.points}</span>
                      <span className="text-[10px] text-nc-muted">pts</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <NcBadge variant={student.status === 'Active' ? 'green' : 'amber'}>
                      {student.status}
                    </NcBadge>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button className="p-1.5 hover:bg-muted rounded-md text-nc-muted" title="Message">
                        <MessageSquare className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 hover:bg-muted rounded-md text-nc-muted" title="Call Parent">
                        <Phone className="h-4 w-4" />
                      </button>
                      <button className="p-1.5 hover:bg-muted rounded-md text-nc-muted">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </NcCard>
    </div>
  );
}
