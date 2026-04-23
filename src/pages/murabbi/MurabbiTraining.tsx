import NcCard, { CardHeader, CardTitle } from "@/components/shared/NcCard";
import NcBadge from "@/components/shared/NcBadge";
import SectionTitle from "@/components/shared/SectionTitle";
import ProgressBar from "@/components/shared/ProgressBar";
import { Video, FileText, CheckCircle2, Lock, Play } from "lucide-react";

export default function MurabbiTraining() {
  const modules = [
    {
      id: 1,
      title: "Foundations of Tarbiyah",
      progress: 100,
      type: "Video + Quiz",
      status: "Completed",
      lessons: 4
    },
    {
      id: 2,
      title: "Child Psychology & Development",
      progress: 75,
      type: "Video Course",
      status: "In Progress",
      lessons: 6
    },
    {
      id: 3,
      title: "Classroom Management Skills",
      progress: 0,
      type: "Reading Material",
      status: "Locked",
      lessons: 3
    },
    {
      id: 4,
      title: "Parent-Murabbi Communication",
      progress: 0,
      type: "Workshop",
      status: "Locked",
      lessons: 2
    }
  ];

  return (
    <div className="page-animate">
      <SectionTitle 
        title="Training Materials" 
        subtitle="Enhance your skills as a Murabbi with our curated training modules."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2 space-y-4">
          {modules.map((module) => (
            <NcCard key={module.id} className={module.status === 'Locked' ? 'opacity-70' : ''}>
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  module.status === 'Completed' ? 'bg-green-100 text-green-600' : 
                  module.status === 'In Progress' ? 'bg-primary/10 text-primary' : 
                  'bg-muted text-nc-muted'
                }`}>
                  {module.status === 'Completed' ? <CheckCircle2 className="h-7 w-7" /> : 
                   module.status === 'Locked' ? <Lock className="h-7 w-7" /> : 
                   <Play className="h-7 w-7 fill-current" />}
                </div>
                
                <div className="flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-[15px]">{module.title}</h3>
                      <div className="text-[11px] text-nc-muted flex items-center gap-2 mt-0.5">
                        <span>{module.type}</span>
                        <span>•</span>
                        <span>{module.lessons} Lessons</span>
                      </div>
                    </div>
                    <NcBadge variant={
                      module.status === 'Completed' ? 'green' : 
                      module.status === 'In Progress' ? 'purple' : 
                      'slate'
                    }>
                      {module.status}
                    </NcBadge>
                  </div>
                  
                  <div className="mt-4">
                    <div className="flex justify-between text-[10px] font-medium mb-1.5">
                      <span className="text-nc-muted">Course Progress</span>
                      <span className="text-foreground">{module.progress}%</span>
                    </div>
                    <ProgressBar value={module.progress} color={module.status === 'Completed' ? 'green' : 'primary'} />
                  </div>
                </div>
                
                {module.status !== 'Locked' && (
                  <button className="btn-ghost text-xs px-4 ml-2">Continue</button>
                )}
              </div>
            </NcCard>
          ))}
        </div>

        <div className="space-y-6">
          <NcCard>
            <CardHeader><CardTitle>Resources Library</CardTitle></CardHeader>
            <div className="space-y-3 mt-2">
              <a href="#" className="flex items-center gap-3 p-2.5 hover:bg-muted rounded-lg transition-colors group">
                <div className="p-2 bg-red-50 text-red-500 rounded-md">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="text-[13px] font-medium group-hover:text-primary transition-colors">Murabbi Handbook 2026.pdf</div>
              </a>
              <a href="#" className="flex items-center gap-3 p-2.5 hover:bg-muted rounded-lg transition-colors group">
                <div className="p-2 bg-blue-50 text-blue-500 rounded-md">
                  <Video className="h-4 w-4" />
                </div>
                <div className="text-[13px] font-medium group-hover:text-primary transition-colors">Teaching Techniques Video</div>
              </a>
              <a href="#" className="flex items-center gap-3 p-2.5 hover:bg-muted rounded-lg transition-colors group">
                <div className="p-2 bg-amber-50 text-amber-500 rounded-md">
                  <FileText className="h-4 w-4" />
                </div>
                <div className="text-[13px] font-medium group-hover:text-primary transition-colors">Activity Ideas Booklet</div>
              </a>
            </div>
          </NcCard>

          <NcCard className="bg-primary text-white">
            <h3 className="font-bold text-sm mb-2">Weekly Live Training</h3>
            <p className="text-xs text-white/80 leading-relaxed mb-4">Join our senior Murabbis for a live Q&A session every Saturday at 11:00 AM.</p>
            <button className="w-full py-2 bg-white text-primary text-xs font-bold rounded-md shadow-lg">Join Zoom Meeting</button>
          </NcCard>
        </div>
      </div>
    </div>
  );
}
