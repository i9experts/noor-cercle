import { useCallback } from "react";
import SectionTitle from "@/components/shared/SectionTitle";
import IntroductionForm from "@/components/murabbi/IntroductionForm";
import { murabbiProfileService } from "@/services/api.service";
import { apiMessage, unwrap } from "@/lib/finance";
import { IntroductionResponse } from "@/lib/murabbiIntro";

/** "My Introduction": the murabbi tells the Noor Circles team about themselves (admins only see it). */
export default function MurabbiIntroduction() {
  const load = useCallback(async () => unwrap<IntroductionResponse>(await murabbiProfileService.me()), []);
  const save = useCallback(async (dto: object) => {
    const r = await murabbiProfileService.saveMine(dto);
    return { ...unwrap<IntroductionResponse>(r), message: apiMessage(r, "Saved.") };
  }, []);
  return (
    <div className="page-animate mx-auto max-w-4xl">
      <SectionTitle title="My Introduction" subtitle="Tell the Noor Circles team about yourself. Only the admin team sees this." />
      <p dir="rtl" lang="ur" className="urdu -mt-3 mb-5 text-[14px] leading-[2] text-nc-muted">
        نور سرکلز کی ٹیم کو اپنے بارے میں بتائیں۔ یہ صرف ایڈمن ٹیم دیکھتی ہے۔
      </p>
      <IntroductionForm load={load} save={save} />
    </div>
  );
}
