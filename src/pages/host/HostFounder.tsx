import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
import HostShell from "@/components/host/HostShell";
import FounderProfile from "@/components/founder/FounderProfile";

/** "Meet the Founder" for hosts (Urdu first, as for parents). */
export default function HostFounder() {
  useEffect(() => { document.title = "Meet the Founder · Noor Circles"; }, []);
  return (
    <HostShell titleUr="بانی سے ملیے" titleEn="Meet the Founder">
      <Link to="/host" className="inline-flex items-center gap-1 rounded-full bg-card px-3 py-1.5 text-[13px] text-nc-dark shadow-nc hover:text-plum">
        <ArrowLeft className="h-4 w-4" /> Back to home · <span lang="ur" className="urdu leading-[1.6]">واپس</span>
      </Link>
      <FounderProfile audience="host" />
    </HostShell>
  );
}
