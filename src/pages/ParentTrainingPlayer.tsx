import { ArrowRight } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import MurabbiCourse from "./murabbi/MurabbiCourse";

/** A parent listening to one of their trainings (any training other than Asaas for Parents). */
export default function ParentTrainingPlayer() {
  const { key = "" } = useParams();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-plum px-4 py-4 text-white sm:px-6" dir="rtl" lang="ur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <img src="/brand/noor-circles-logo-horizontal-white.svg" alt="Noor Circles" className="h-8" />
          <Link to="/parent/trainings" className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-white/20">
            <ArrowRight className="h-3.5 w-3.5" /> <span className="urdu leading-[1.6]">تربیتیں</span>
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <MurabbiCourse key={key} courseKey={key} onBack={() => navigate("/parent/trainings")} />
      </main>
    </div>
  );
}
