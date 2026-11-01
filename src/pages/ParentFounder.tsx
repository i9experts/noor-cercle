import { useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import FounderProfile from "@/components/founder/FounderProfile";

/** "Meet the Founder" for parents (Urdu first). */
export default function ParentFounder() {
  useEffect(() => { document.title = "Meet the Founder · Noor Circles"; }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-plum px-4 pb-10 pt-5 text-white sm:px-6" dir="rtl" lang="ur">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between gap-3">
            <img src="/brand/noor-circles-logo-horizontal-white.svg" alt="Noor Circles" className="h-9" />
            <Link to="/parent" className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-white/20">
              <ArrowRight className="h-3.5 w-3.5" /> <span className="urdu leading-[1.6]">فیملی پیج</span>
            </Link>
          </div>
          <h1 className="urdu mt-5 text-[28px] leading-[2] sm:text-[34px]">بانی سے ملیے</h1>
          <p className="text-[12px] text-white/60" dir="ltr">Meet the Founder</p>
        </div>
      </header>

      <main className="mx-auto -mt-6 max-w-4xl px-4 pb-12 sm:px-6">
        <FounderProfile audience="parent" />
      </main>
    </div>
  );
}
