import { pageNames } from "@/data/mockData";

interface TopBarProps {
  activePage: string;
  onEnroll: () => void;
}

export default function TopBar({ activePage, onEnroll }: TopBarProps) {
  const title = pageNames[activePage] || activePage;

  return (
    <div className="bg-card border-b border-border px-8 h-16 flex items-center justify-between sticky top-0 z-50">
      <div>
        <div className="font-serif text-[22px] text-foreground">
          {title}
          {activePage === 'dashboard' && <span className="font-sans text-[13px] text-nc-muted font-normal ml-2.5">Welcome back, Atiq Sahib</span>}
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5 bg-muted border border-border rounded-sm px-3.5 w-[280px]">
          <span className="text-nc-muted text-sm">⌕</span>
          <input
            className="border-none bg-transparent outline-none text-[13.5px] text-foreground flex-1 py-[9px] font-sans"
            placeholder="Search students, circles, murabbis…"
          />
        </div>
        <button className="btn-gold" onClick={onEnroll}>+ Enroll Student</button>
        <div className="w-9 h-9 rounded-full bg-teal-lt flex items-center justify-center text-sm font-semibold text-teal cursor-pointer" title="Atiq ur Rehman Ayubi">
          AA
        </div>
      </div>
    </div>
  );
}
