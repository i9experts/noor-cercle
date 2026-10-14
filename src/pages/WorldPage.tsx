import QuranBox from "@/components/shared/QuranBox";
import NcCard from "@/components/shared/NcCard";
import SectionTitle from "@/components/shared/SectionTitle";
import { Link2, MapPin, Medal, MoonStar, UserRound, BarChart3 } from "lucide-react";

const curriculum = [
  { months: 'Month 1–2', theme: 'Identity & Honesty', bg: 'bg-teal-lt', border: 'border-teal', color: 'text-teal' },
  { months: 'Month 3–4', theme: 'Family & Gratitude', bg: 'bg-gold-lt', border: 'border-gold', color: 'text-gold-dim' },
  { months: 'Month 5–6', theme: 'Courage & Friendship', bg: 'bg-nc-red-lt', border: 'border-nc-red', color: 'text-nc-red' },
  { months: 'Month 7–8', theme: 'Patience & Generosity', bg: 'bg-nc-purple-lt', border: 'border-nc-purple', color: 'text-nc-purple' },
  { months: 'Month 9–10', theme: 'Body & Knowledge', bg: 'bg-nc-green-lt', border: 'border-nc-green', color: 'text-nc-green' },
  { months: 'Month 11–12', theme: 'Community & Legacy', bg: 'bg-muted', border: 'border-foreground', color: 'text-slate' },
];

const features = [
  { icon: MoonStar, title: 'Fitrah-First Design', desc: 'Every session builds on what Allah already placed in the child — not correction, but activation. The circle unlocks what is already there.' },
  { icon: MapPin, title: 'Hyper-Local Model', desc: 'Formation happens where life happens — in the neighbourhood. Every circle is rooted in a specific street and community, making it real and lasting.' },
  { icon: UserRound, title: 'Maximum 10 Children', desc: 'Never a class. Always a circle. Every child is known by name, watched with care, and seen in their full individuality — every session, every year.' },
  { icon: BarChart3, title: 'Data-Driven Tarbiyah', desc: 'Attendance, character growth indicators, parent engagement, and milestone tracking — bringing Islamic formation into the era of evidence and accountability.' },
  { icon: Medal, title: 'Incentive Architecture', desc: 'A points system that rewards character, service, and consistency — not just knowledge. Murabbis are recognised and supported through structured awards.' },
  { icon: Link2, title: 'Parent Partnership', desc: 'Weekly home action cards, parent evenings, progress reports, and a parent portal — the family is not the audience of the circle, they are its partners.' },
];

const scholars = [
  { name: 'Al-Ghazali', work: 'Ihya Ulum al-Din', desc: 'Habit formation, individualised attention, and the teacher as a physician of souls — not a dispenser of information.' },
  { name: 'Ibn al-Qayyim', work: 'Tuhfat al-Mawdud', desc: 'The urgency of the pre-teen window, joy in education, and the fitrah as the most precious thing in a child to nurture and protect.' },
  { name: 'Ibn Khaldun', work: 'Muqaddimah', desc: 'Asabiyyah — that social cohesion and character are formed in the local lived environment, not in institutions alone.' },
];

export default function WorldPage() {
  return (
    <div className="page-animate">
      <QuranBox arabic="خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ" translation='"The best of people are those most beneficial to people."' reference="PROPHET MUHAMMAD ﷺ" />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 mb-6">
        {/* Hero card */}
        <div className="bg-gradient-to-br from-teal-lt to-card border border-teal/15 rounded-xl p-4 sm:p-5 md:p-6 transition-all shadow-sm">

          {/* Top Section (Responsive) */}
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 mb-6">

            {/* Logo */}
            <div className="flex-shrink-0">
              <img
                src="/brand/noor-circles-logo.svg"
                alt="Noor Circles"
                className="h-28 sm:h-32 md:h-36 w-auto mx-auto"
              />
            </div>

            {/* Description */}
            <p className="text-[12px] sm:text-[13px] md:text-[14px] text-black/70 leading-relaxed text-center md:text-left">
              A neighbourhood-based Tarbiyah programme — small circles of 8–10 children, ages 6–13,
              gathering weekly for 2.5 hours, guided by a trained Murabbi, sustained across
              12 months of intentional Islamic character formation.
            </p>

          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {[
              { val: "40", label: "Sessions/year" },
              { val: "12", label: "Themes" },
              { val: "8–10", label: "Children/circle" }
            ].map((s) => (
              <div
                key={s.label}
                className="text-center bg-black/5 rounded-lg py-3"
              >
                <div className="text-[20px] sm:text-[22px] md:text-[24px] font-semibold text-sidebar-primary">
                  {s.val}
                </div>
                <div className="text-[10px] sm:text-[11px] text-black/50 mt-1">
                  {s.label}
                </div>
              </div>
            ))}
          </div>

        </div>

        {/* Curriculum */}
        <div className="flex flex-col gap-3.5">
          <div className="text-base font-semibold text-foreground font-serif">12-Month Curriculum Journey</div>
          <div className="grid grid-cols-2 gap-2">
            {curriculum.map((c) => (
              <div key={c.months} className={`p-2.5 px-3 ${c.bg} rounded-lg border-l-[3px] ${c.border}`}>
                <div className={`text-[11px] ${c.color} font-semibold uppercase tracking-wide`}>{c.months}</div>
                <div className="text-[13px] font-semibold text-foreground">{c.theme}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <SectionTitle>World-Class Features — What Makes Noor Circles Extraordinary</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-6">
        {features.map((f) => (
          <div key={f.title} className="bg-gradient-to-br from-teal-lt to-card border border-teal/15 rounded-lg p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(105,28,70,0.1)]">
            <div className="w-11 h-11 rounded-xl bg-teal flex items-center justify-center mb-3">
              <f.icon className="h-5 w-5 text-white" />
            </div>
            <div className="text-sm font-semibold text-foreground mb-1.5">{f.title}</div>
            <div className="text-[12.5px] text-nc-muted leading-relaxed">{f.desc}</div>
          </div>
        ))}
      </div>

      <SectionTitle>The Three Scholars Who Ground Every Session</SectionTitle>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {scholars.map((s) => (
          <NcCard key={s.name} small>
            <div className="font-bold text-[15px] text-teal mb-1">{s.name}</div>
            <div className="text-[11px] text-nc-muted mb-2">{s.work}</div>
            <div className="text-[12.5px] text-slate leading-relaxed">{s.desc}</div>
          </NcCard>
        ))}
      </div>
    </div>
  );
}
