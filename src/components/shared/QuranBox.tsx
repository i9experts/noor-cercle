interface QuranBoxProps {
  arabic: string;
  translation: string;
  reference: string;
}

export default function QuranBox({ arabic, translation, reference }: QuranBoxProps) {
  return (
    <div className="bg-gradient-to-br from-nc-dark-2 to-nc-dark-3 rounded-lg p-6 text-center mb-6">
      <div className="font-arabic text-[26px] text-sidebar-primary leading-relaxed" dir="rtl">{arabic}</div>
      <div className="text-[13px] text-white/65 italic mt-2">{translation}</div>
      <div className="text-[11px] text-white/35 mt-1 tracking-widest">{reference}</div>
    </div>
  );
}
