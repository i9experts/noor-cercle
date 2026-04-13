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

      <div className="grid grid-cols-2 gap-5 mb-6">
        {/* Hero card */}
        <div className="bg-sidebar from-nc-dark to-teal-dk rounded-lg p-6 border-none text-primary-foreground">
          <div className="flex justify-center mb-4">
            <img
              src="/noor-circle-logo-white.png"   
              alt="Noor Circles Logo"
              width={250}
              height={160}
              className="object-contain"
            />
          </div>
          <div className="text-[13px] text-white/50 leading-[1.7] mb-4">
            A neighbourhood-based Tarbiyah programme — small circles of 8–10 children, ages 6–13, gathering weekly for 2.5 hours, guided by a trained Murabbi, sustained across 12 months of intentional Islamic character formation.
          </div>

          <div className="flex gap-4 mt-5">
            {[
              { val: "40", label: "Sessions/year" },
              { val: "12", label: "Themes" },
              { val: "8–10", label: "Children/circle" }
            ].map((s) => (
              <div key={s.label} className="text-center">
                <div className="text-[28px] font-serif text-sidebar-primary">
                  {s.val}
                </div>
                <div className="text-[11px] text-white/40">{s.label}</div>
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
      <div className="grid grid-cols-3 gap-5 mb-6">
        {features.map((f) => (
          <div key={f.title} className="bg-gradient-to-br from-teal-lt to-card border border-teal/15 rounded-lg p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_28px_rgba(14,107,114,0.1)]">
            <div className="w-11 h-11 rounded-xl bg-teal flex items-center justify-center mb-3">
              <f.icon className="h-5 w-5 text-white" />
            </div>
            <div className="text-sm font-semibold text-foreground mb-1.5">{f.title}</div>
            <div className="text-[12.5px] text-nc-muted leading-relaxed">{f.desc}</div>
          </div>
        ))}
      </div>

      <SectionTitle>The Three Scholars Who Ground Every Session</SectionTitle>
      <div className="grid grid-cols-3 gap-5">
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
