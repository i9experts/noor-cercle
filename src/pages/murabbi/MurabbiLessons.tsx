import { useEffect, useState } from "react";
import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import SectionTitle from "@/components/shared/SectionTitle";
import { Book, Download, PlayCircle, ExternalLink, FileText } from "lucide-react";
import { lessonsService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";

export default function MurabbiLessons() {
  const { toast } = useToast();
  const [lessons, setLessons] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    lessonsService.getAll()
      .then((res) => setLessons(res.data.data || []))
      .catch(() => toast({ variant: "destructive", title: "Failed to load lessons" }))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="page-animate">
      <SectionTitle title="Lesson Plans" subtitle="Access and download curriculum materials for your sessions." />

      {loading ? (
        <div className="text-center py-20 text-nc-muted text-sm animate-pulse">Loading lesson plans...</div>
      ) : lessons.length === 0 ? (
        <div className="text-center py-20 text-nc-muted text-sm">No lesson plans available yet.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {lessons.map((lesson) => (
            <NcCard key={lesson._id} className="hover:border-primary/30 transition-all">
              <CardHeader>
                <div className="flex justify-between items-start w-full">
                  <div>
                    <NcBadge
                      variant={lesson.status === "Available" ? "green" : lesson.status === "Upcoming" ? "amber" : "slate"}
                      className="mb-2"
                    >
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
                <p className="text-sm text-nc-muted leading-relaxed">{lesson.description}</p>
                <div className="flex gap-3 mt-6">
                  <button
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-primary text-white text-xs font-bold rounded-md hover:bg-primary/90 transition-colors"
                    onClick={() => lesson.pdfUrl ? window.open(lesson.pdfUrl, "_blank") : toast({ title: "No PDF available yet" })}
                  >
                    <Download className="h-3.5 w-3.5" /> PDF Plan
                  </button>
                  <button
                    className="flex-1 flex items-center justify-center gap-2 py-2 bg-muted text-foreground text-xs font-bold rounded-md hover:bg-muted/80 transition-colors"
                    onClick={() => lesson.videoUrl ? window.open(lesson.videoUrl, "_blank") : toast({ title: "No video available yet" })}
                  >
                    <PlayCircle className="h-3.5 w-3.5" /> Video Guide
                  </button>
                </div>
              </div>
            </NcCard>
          ))}
        </div>
      )}

      <NcCard className="mt-8 bg-gold/5 border-gold/20">
        <div className="flex items-center gap-4">
          <div className="bg-gold p-3 rounded-full text-white">
            <FileText className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gold-dim">Custom Activity Worksheet</h3>
            <p className="text-xs text-nc-muted mt-1">Need a custom worksheet for your circle? Request from the curriculum team.</p>
          </div>
          <button className="ml-auto btn-gold text-xs px-4">Request Material</button>
        </div>
      </NcCard>
    </div>
  );
}