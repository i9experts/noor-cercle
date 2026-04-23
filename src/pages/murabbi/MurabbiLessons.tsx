import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import SectionTitle from "@/components/shared/SectionTitle";
import { Book, FileText, Download, ExternalLink, PlayCircle } from "lucide-react";

export default function MurabbiLessons() {
  const lessons = [
    {
      id: 1,
      title: "Character Building: Honesty (Sidq)",
      level: "Level 1",
      module: "Module 3",
      duration: "90 mins",
      status: "Available",
      description: "In-depth lesson on the importance of truthfulness in Islam with practical exercises for students."
    },
    {
      id: 2,
      title: "Quranic Studies: Surah Al-Fatiha",
      level: "Level 1",
      module: "Module 4",
      duration: "60 mins",
      status: "Available",
      description: "Understanding the meanings and virtues of the Opening Chapter of the Quran."
    },
    {
      id: 3,
      title: "Prophetic Stories: Ibrahim (AS)",
      level: "Level 1",
      module: "Module 4",
      duration: "75 mins",
      status: "Upcoming",
      description: "Lessons from the life of Prophet Ibrahim (AS) regarding sacrifice and faith."
    },
    {
      id: 4,
      title: "Manners: Respecting Parents",
      level: "Level 1",
      module: "Module 5",
      duration: "60 mins",
      status: "Draft",
      description: "Adab towards parents according to Sunnah and Quranic injunctions."
    }
  ];

  return (
    <div className="page-animate">
      <SectionTitle 
        title="Lesson Plans" 
        subtitle="Access and download curriculum materials for your sessions."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {lessons.map((lesson) => (
          <NcCard key={lesson.id} className="hover:border-primary/30 transition-all">
            <CardHeader>
              <div className="flex justify-between items-start w-full">
                <div>
                  <NcBadge variant={lesson.status === 'Available' ? 'green' : lesson.status === 'Upcoming' ? 'amber' : 'slate'} className="mb-2">
                    {lesson.status}
                  </NcBadge>
                  <CardTitle>{lesson.title}</CardTitle>
                  <div className="text-[11px] text-nc-muted mt-1">
                    {lesson.level} · {lesson.module} · {lesson.duration}
                  </div>
                </div>
                <div className="bg-primary/10 p-2 rounded-lg text-primary">
                  <Book className="h-5 w-5" />
                </div>
              </div>
            </CardHeader>
            <div className="mt-2">
              <p className="text-sm text-nc-muted leading-relaxed">
                {lesson.description}
              </p>
              <div className="flex gap-3 mt-6">
                <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary text-white text-xs font-bold rounded-md hover:bg-primary/90 transition-colors">
                  <Download className="h-3.5 w-3.5" /> PDF Plan
                </button>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 bg-muted text-foreground text-xs font-bold rounded-md hover:bg-muted/80 transition-colors">
                  <PlayCircle className="h-3.5 w-3.5" /> Video Guide
                </button>
                <button className="p-2 bg-muted text-nc-muted rounded-md hover:bg-muted/80 transition-colors">
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          </NcCard>
        ))}
      </div>

      <NcCard className="mt-8 bg-gold/5 border-gold/20">
        <div className="flex items-center gap-4">
          <div className="bg-gold p-3 rounded-full text-white">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gold-dim">Custom Activity Worksheet</h3>
            <p className="text-xs text-nc-muted mt-1">Need a custom worksheet for your specific circle? Request one from the curriculum team.</p>
          </div>
          <button className="ml-auto btn-gold text-xs px-4">Request Material</button>
        </div>
      </NcCard>
    </div>
  );
}
