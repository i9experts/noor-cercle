import { useCallback, useState } from "react";
import { GraduationCap, Headphones, KeyRound, LogOut, Mail, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { familyService } from "@/services/api.service";
import { useAuth } from "@/context/AuthContext";
import Modal from "@/components/shared/Modal";
import ChangePasswordModal from "@/components/shared/ChangePasswordModal";
import { FamilyScreen } from "./FamilyPage";
import EmailPreferences from "@/components/shared/EmailPreferences";
import FounderCard from "@/components/founder/FounderCard";

/** A signed-in parent's home: their family page, plus account actions. */
export default function ParentHome() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [pwOpen, setPwOpen] = useState(false);
  const [mailOpen, setMailOpen] = useState(false);
  const load = useCallback(() => familyService.mine(), []);
  const save = useCallback((dto: object) => familyService.saveMyProfile(dto), []);

  const btn = "inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[12.5px] font-medium text-white hover:bg-white/20";
  return (
    <>
      <FamilyScreen
        load={load}
        saveProfile={save}
        extra={<FounderCard audience="parent" className="" onOpen={() => navigate("/parent/founder")} />}
        actions={
          <div className="flex flex-wrap justify-end gap-2">
            <Link to="/parent/asaas" className={`${btn} !bg-gold !text-[#361a2c] hover:!brightness-105`} aria-label="والدین کا Asaas">
              <Headphones className="h-3.5 w-3.5" />
              <span dir="rtl" lang="ur" className="urdu leading-[1.6] sm:hidden">Asaas</span>
              <span dir="rtl" lang="ur" className="urdu hidden leading-[1.6] sm:inline">والدین کا Asaas</span>
            </Link>
            <Link to="/parent/trainings" className={btn} aria-label="Trainings">
              <GraduationCap className="h-3.5 w-3.5" />
              <span dir="rtl" lang="ur" className="urdu leading-[1.6]">تربیتیں</span>
              <span className="hidden sm:inline">· Trainings</span>
            </Link>
            <Link to="/parent/founder" className={btn} aria-label="Meet the Founder">
              <Sparkles className="h-3.5 w-3.5" />
              <span dir="rtl" lang="ur" className="urdu leading-[1.6]">بانی سے ملیے</span>
              <span className="hidden sm:inline">· Founder</span>
            </Link>
            <button className={btn} onClick={() => setMailOpen(true)} aria-label="Email settings">
              <Mail className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Emails</span>
            </button>
            <button className={btn} onClick={() => setPwOpen(true)} aria-label="Change password">
              <KeyRound className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Password</span>
            </button>
            <button className={btn} onClick={logout} aria-label="Sign out">
              <LogOut className="h-3.5 w-3.5" /> <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        }
      />
      {pwOpen && <ChangePasswordModal onClose={() => setPwOpen(false)} />}
      {mailOpen && (
        <Modal open onClose={() => setMailOpen(false)} title="Email settings">
          <EmailPreferences only={["announcements"]} />
        </Modal>
      )}
    </>
  );
}
