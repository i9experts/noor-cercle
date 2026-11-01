import { ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import TrainingsBoard from "@/components/trainings/TrainingsBoard";
import ParentRatingCard from "@/components/trainings/ParentRatingCard";

/** A parent's trainings (Asaas for Parents and any others), the marketplace, their rating and rewards. */
export default function ParentTrainings() {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background" dir="rtl" lang="ur">
      <header className="bg-plum px-4 pb-10 pt-5 text-white sm:px-6">
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between gap-3">
            <img src="/brand/noor-circles-logo-horizontal-white.svg" alt="Noor Circles" className="h-9" />
            <Link to="/parent" className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-white/20">
              <ArrowRight className="h-3.5 w-3.5" /> <span className="urdu leading-[1.6]">فیملی پیج</span>
            </Link>
          </div>
          <h1 className="urdu mt-5 text-[28px] leading-[2] sm:text-[34px]">تربیتیں</h1>
          <p className="urdu text-[15px] leading-[2] text-white/85">
            السلام علیکم{user?.fullName ? `، ${user.fullName.split(" ")[0]}` : ""}۔ اپنی تربیتیں جاری رکھیں اور نئی تربیتوں میں شامل ہوں۔
          </p>
          <p className="text-[12px] text-white/60" dir="ltr">Trainings · your rating and rewards</p>
        </div>
      </header>

      <main className="mx-auto -mt-6 max-w-4xl space-y-6 px-4 pb-12 sm:px-6">
        <ParentRatingCard />
        <section>
          <TrainingsBoard lang="ur" onOpen={(t) => navigate(t.custom || t.key === "asaas-parents" ? "/parent/asaas" : `/parent/trainings/${t.key}`)} />
        </section>
      </main>
    </div>
  );
}
