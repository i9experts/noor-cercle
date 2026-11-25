import { useEffect } from "react";
import { ArrowRight, Headphones } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import MurabbiJournal from "@/pages/murabbi/MurabbiJournal";
import { PARENT_JOURNAL } from "@/lib/journal";

/** The Parent Journal: the at-home writing of Asaas for Parents. Private to the parent. */
export default function ParentJournalPage() {
  const navigate = useNavigate();
  useEffect(() => { document.title = "Parent Journal · Noor Circles"; }, []);
  const pill = "inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-white/20";

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-plum px-4 pb-6 pt-5 text-white sm:px-6" dir="rtl" lang="ur">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between gap-3">
            <img src="/brand/noor-circles-logo-horizontal-white.svg" alt="Noor Circles" className="h-9" />
            <div className="flex flex-wrap justify-end gap-2">
              <Link to="/parent" className={pill}>
                <ArrowRight className="h-3.5 w-3.5" /> <span className="urdu leading-[1.6]">فیملی پیج</span>
              </Link>
              <Link to="/parent/asaas" className={`${pill} !bg-gold !text-[#361a2c] hover:!brightness-105`}>
                <Headphones className="h-3.5 w-3.5" /> <span className="urdu leading-[1.6]">والدین کا Asaas</span>
              </Link>
            </div>
          </div>
          <h1 className="urdu mt-5 text-[28px] leading-[2] sm:text-[34px]">والدین کا جرنل</h1>
          <p className="text-[12px] text-white/60" dir="ltr">Parent Journal</p>
        </div>
      </header>

      <main className="mx-auto mt-5 max-w-4xl px-4 pb-12 sm:px-6">
        <MurabbiJournal variant={PARENT_JOURNAL} onOpenCourse={() => navigate("/parent/asaas")} />
      </main>
    </div>
  );
}
