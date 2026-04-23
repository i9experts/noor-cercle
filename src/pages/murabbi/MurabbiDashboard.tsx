import StatCard from "@/components/shared/StatCard";
import QuranBox from "@/components/shared/QuranBox";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import Timeline from "@/components/shared/Timeline";
import SectionTitle from "@/components/shared/SectionTitle";
import { BookOpen, Users, Calendar, Award } from "lucide-react";

export default function MurabbiDashboard() {
  const myStudents = [
    { name: 'Ahmed Ali', circle: 'Gulshan Circle 1', progress: 85, attendance: '95%', status: 'active' },
    { name: 'Fatima Zahra', circle: 'Gulshan Circle 1', progress: 92, attendance: '100%', status: 'active' },
    { name: 'Zaid Khan', circle: 'Gulshan Circle 1', progress: 78, attendance: '88%', status: 'active' },
    { name: 'Maryum Bibi', circle: 'Gulshan Circle 1', progress: 88, attendance: '92%', status: 'active' },
  ];

  return (
    <div className="page-animate">
      <SectionTitle 
        title="Assalam-o-Alaikum, Murabbi Ahmad!" 
        subtitle="Here is what's happening in your circles today."
      />

      <QuranBox
        arabic="اقْرَأْ بِاسْمِ رَبِّكَ الَّذِي خَلَقَ"
        translation='"Read in the name of your Lord who created."'
        reference="SURAH AL-ALAQ · 96:1"
      />

      <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 mb-7">
        <StatCard label="My Students" value={12} meta="Active in 2 circles" color="teal" />
        <StatCard label="Attendance Rate" value="94%" meta="↑ 2% this week" color="purple" metaUp />
        <StatCard label="Sessions Taught" value={48} meta="Year 1 · Level 1" color="gold" />
        <StatCard label="Reward Points" value={1250} meta="To be distributed" color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <NcCard>
          <CardHeader>
            <CardTitle sub="Your active students and their progress">My Students Progress</CardTitle>
            <button className="text-primary text-sm font-medium hover:underline">View All</button>
          </CardHeader>
          <div className="flex flex-col gap-3 mt-2">
            {myStudents.map((student) => (
              <div key={student.name} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg border border-border/50">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <div className="text-sm font-semibold">{student.name}</div>
                    <div className="text-[11px] text-nc-muted">{student.circle}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-medium text-foreground">{student.progress}% Progress</div>
                  <div className="w-24 h-1.5 bg-secondary rounded-full mt-1 overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${student.progress}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </NcCard>

        <div className="flex flex-col gap-5">
          <NcCard>
            <CardHeader>
              <CardTitle>Upcoming Sessions</CardTitle>
            </CardHeader>
            <div className="space-y-3 mt-2">
              <div className="flex gap-4 p-3.5 bg-primary/5 border border-primary/10 rounded-lg">
                <div className="bg-primary text-white p-2 rounded-md h-fit">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-primary">Friday, 24 April · 4:00 PM</div>
                  <div className="text-[13px] font-medium mt-0.5">Character Building: Honesty (Sidq)</div>
                  <div className="text-xs text-nc-muted mt-1">Gulshan Circle 1 · Community Center</div>
                </div>
              </div>
              <div className="flex gap-4 p-3.5 bg-gold/5 border border-gold/10 rounded-lg">
                <div className="bg-gold text-white p-2 rounded-md h-fit">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <div className="text-sm font-bold text-gold-dim">Sunday, 26 April · 10:00 AM</div>
                  <div className="text-[13px] font-medium mt-0.5">Quranic Studies: Surah Al-Fatiha Deep Dive</div>
                  <div className="text-xs text-nc-muted mt-1">DHA Circle 1 · Masjid Bilal</div>
                </div>
              </div>
            </div>
          </NcCard>

          <NcCard>
            <CardHeader>
              <CardTitle>Recent Notifications</CardTitle>
            </CardHeader>
            <Timeline items={[
              { title: 'New student Ahmad Ali added to your circle', meta: '1 hour ago', dotColor: 'teal' },
              { title: 'Monthly report for March is due tomorrow', meta: '5 hours ago', dotColor: 'gold' },
              { title: 'Feedback received from Fatima\'s parents', meta: 'Yesterday', dotColor: 'green' },
              { title: 'New teaching material: Level 1 Module 4 uploaded', meta: '2 days ago', dotColor: 'purple' },
            ]} />
          </NcCard>
        </div>
      </div>
    </div>
  );
}
