import { useState } from "react";
import { studentsService, notificationsService } from "@/services/api.service";
import { useToast } from "@/hooks/use-toast";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import DashboardPage from "@/pages/DashboardPage";
import WorldPage from "@/pages/WorldPage";
import StudentsPage from "@/pages/StudentsPage";
import MurabbisPage from "@/pages/MurabbisPage";
import ParentsPage from "@/pages/ParentsPage";
import CirclesPage from "@/pages/CirclesPage";
import AttendancePage from "@/pages/AttendancePage";
import SessionsPage from "@/pages/SessionsPage";
import PerformancePage from "@/pages/PerformancePage";
import IncentivesPage from "@/pages/IncentivesPage";
import TrainingPage from "@/pages/TrainingPage";
import NeighbourhoodsPage from "@/pages/NeighbourhoodsPage";
import ReportsPage from "@/pages/ReportsPage";
import SettingsPage from "@/pages/SettingsPage";
import InterestPage from "@/pages/InterestPage";
import ContributionsPage from "@/pages/ContributionsPage";
import RewardsPage from "@/pages/RewardsPage";
import MurabbiRatingsPage from "@/pages/MurabbiRatingsPage";
import SyllabusPage from "@/pages/SyllabusPage";
import SyllabusProgressPage from "@/pages/SyllabusProgressPage";
import CalendarPage from "@/pages/CalendarPage";
import AsaasTrainingPage from "@/pages/AsaasTrainingPage";
import EmailsPage from "@/pages/EmailsPage";
import ParentInsightsPage from "@/pages/ParentInsightsPage";
import {
  EnrollModal,
  NewCircleModal,
  AwardPointsModal,
  AddMurabbiModal,
  EditStudentModal,
} from "@/components/modals/AllModals";
import { Trash2 } from "lucide-react";

const Index = () => {
  const { toast } = useToast();
  const [activePage, setActivePage]       = useState("dashboard");
  const [navOpen, setNavOpen]             = useState(false);
  const [enrollOpen, setEnrollOpen]       = useState(false);
  const [newCircleOpen, setNewCircleOpen] = useState(false);
  const [awardOpen, setAwardOpen]         = useState(false);
  const [addMurabbiOpen, setAddMurabbiOpen] = useState(false);

  // Delete-request flow — triggered when admin approves from NotificationBell
  const [editStudentData, setEditStudentData]   = useState<any>(null);
  const [editNotifId, setEditNotifId]           = useState<string | null>(null);
  const [showPermDelete, setShowPermDelete]     = useState(false);
  const [deleting, setDeleting]                 = useState(false);

  // Increment to trigger a data reload in the active page after modal success
  const [studentsKey,  setStudentsKey]  = useState(0);
  const [murabbisKey,  setMurabbisKey]  = useState(0);
  const [circlesKey,   setCirclesKey]   = useState(0);

  const handleNav = (page: string) => {
    setActivePage(page);
    setNavOpen(false);
    window.scrollTo(0, 0);
  };

  // Called when admin clicks "Approve" on a delete request notification
  async function handleApproveDeleteRequest(studentId: string, notifId: string) {
    try {
      const res = await studentsService.getOne(studentId);
      setEditStudentData(res.data.data || res.data);
      setEditNotifId(notifId);
    } catch {
      toast({ variant: "destructive", title: "Failed to load student data." });
    }
  }

  // Admin closed EditStudentModal → show mini confirm
  function handleEditClose() { setShowPermDelete(true); }

  // Admin saved changes in EditStudentModal → just close, no delete
  function handleEditSaved() {
    setEditStudentData(null);
    setEditNotifId(null);
    setStudentsKey((k) => k + 1);
  }

  // Confirm permanent delete
  async function handlePermDelete() {
    if (!editStudentData) return;
    setDeleting(true);
    try {
      await studentsService.remove(editStudentData._id);
      if (editNotifId) notificationsService.accept(editNotifId).catch(() => {});
      toast({ title: `"${editStudentData.fullName}" permanently deleted.` });
      setShowPermDelete(false);
      setEditStudentData(null);
      setEditNotifId(null);
      setStudentsKey((k) => k + 1);
    } catch (err: any) {
      toast({ variant: "destructive", title: err?.response?.data?.message || "Delete failed." });
    } finally { setDeleting(false); }
  }

  function handlePermDeleteCancel() {
    setShowPermDelete(false);
    setEditStudentData(null);
    setEditNotifId(null);
  }

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":      return <DashboardPage />;
      case "world":          return <WorldPage />;
      case "students":       return <StudentsPage onEnroll={() => setEnrollOpen(true)} refreshKey={studentsKey} />;
      case "murabbis":       return <MurabbisPage onAddMurabbi={() => setAddMurabbiOpen(true)} refreshKey={murabbisKey} />;
      case "parents":        return <ParentsPage />;
      case "circles":        return <CirclesPage onNewCircle={() => setNewCircleOpen(true)} refreshKey={circlesKey} />;
      case "attendance":     return <AttendancePage />;
      case "sessions":       return <SessionsPage />;
      case "performance":    return <PerformancePage />;
      case "incentives":     return <IncentivesPage onAwardPoints={() => setAwardOpen(true)} />;
      case "training":       return <TrainingPage />;
      case "asaas":          return <AsaasTrainingPage />;
      case "emails":         return <EmailsPage />;
      case "neighbourhoods": return <NeighbourhoodsPage />;
      case "reports":        return <ReportsPage />;
      case "interest":       return <InterestPage />;
      case "parent-insights": return <ParentInsightsPage />;
      case "contributions":  return <ContributionsPage />;
      case "rewards":        return <RewardsPage />;
      case "ratings":        return <MurabbiRatingsPage />;
      case "syllabus":       return <SyllabusPage />;
      case "syllabus-progress": return <SyllabusProgressPage />;
      case "calendar":       return <CalendarPage />;
      case "settings":       return <SettingsPage />;
      default:               return <DashboardPage />;
    }
  };

  return (
    <>
      <Sidebar activePage={activePage} onNavigate={handleNav} open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="lg:ml-[264px] min-h-screen flex flex-col">
        <TopBar
          activePage={activePage}
          onEnroll={() => setEnrollOpen(true)}
          onMenu={() => setNavOpen(true)}
          onAdminNav={handleNav}
          onApproveDeleteRequest={handleApproveDeleteRequest}
        />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{renderPage()}</main>
      </div>

      <EnrollModal
        open={enrollOpen}
        onClose={() => setEnrollOpen(false)}
        onSuccess={() => setStudentsKey((k) => k + 1)}
      />
      <NewCircleModal
        open={newCircleOpen}
        onClose={() => setNewCircleOpen(false)}
        onSuccess={() => setCirclesKey((k) => k + 1)}
      />
      <AwardPointsModal
        open={awardOpen}
        onClose={() => setAwardOpen(false)}
      />
      <AddMurabbiModal
        open={addMurabbiOpen}
        onClose={() => setAddMurabbiOpen(false)}
        onSuccess={() => setMurabbisKey((k) => k + 1)}
      />

      {/* Delete-request flow: Edit modal → mini confirm */}
      <EditStudentModal
        open={!!editStudentData && !showPermDelete}
        student={editStudentData}
        onClose={handleEditClose}
        onSuccess={handleEditSaved}
      />

      {showPermDelete && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-card border border-border rounded-xl shadow-xl w-[360px] max-w-[calc(100vw-2rem)] p-5">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-9 h-9 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
                <Trash2 className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="font-semibold text-[14px]">Delete student permanently?</p>
                <p className="text-[12.5px] text-nc-muted mt-1 leading-relaxed">
                  <span className="font-semibold text-foreground">{editStudentData?.fullName}</span> will be
                  removed from all circles, attendance records, and the entire project. This cannot be undone.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="flex-1 py-2 text-[13px] font-semibold rounded-lg text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-50"
                onClick={handlePermDelete}
                disabled={deleting}
              >
                {deleting ? "Deleting…" : "Delete Permanently"}
              </button>
              <button
                className="flex-1 py-2 text-[13px] font-semibold rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-50"
                onClick={handlePermDeleteCancel}
                disabled={deleting}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Index;
