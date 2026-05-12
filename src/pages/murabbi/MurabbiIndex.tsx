import { useState } from "react";
import MurabbiSidebar from "@/components/murabbi/MurabbiSidebar";
import TopBar from "@/components/layout/TopBar";
import MurabbiDashboard from "./MurabbiDashboard";
import MurabbiStudents from "./MurabbiStudents";
import MurabbiAttendance from "./MurabbiAttendance";
import MurabbiLessons from "./MurabbiLessons";
import MurabbiTraining from "./MurabbiTraining";
import MurabbiReports from "./MurabbiReports";
import MurabbiSettings from "./MurabbiSettings";
import { EnrollModal, AwardPointsModal } from "@/components/modals/AllModals";

const MurabbiIndex = () => {
  const [activePage, setActivePage] = useState('murabbi-dashboard');
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [awardOpen, setAwardOpen] = useState(false);

  const handleNav = (page: string) => {
    setActivePage(page);
    window.scrollTo(0, 0);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'murabbi-dashboard': return <MurabbiDashboard />;
      case 'murabbi-students': return <MurabbiStudents />;
      case 'murabbi-attendance': return <MurabbiAttendance />;
      case 'murabbi-circles': return <div className="page-animate p-10 text-center text-nc-muted">My Circles Page Coming Soon</div>;
      case 'murabbi-lessons': return <MurabbiLessons />;
      case 'murabbi-training': return <MurabbiTraining />;
      case 'murabbi-reports': return <MurabbiReports />;
      case 'settings': return <MurabbiSettings />;
      default: return <MurabbiDashboard />;
    }
  };

  return (
    <>
      <MurabbiSidebar activePage={activePage} onNavigate={handleNav} />
      <div className="ml-[260px] min-h-screen flex flex-col">
        <TopBar activePage={activePage} onEnroll={() => setEnrollOpen(true)} />
        <div className="p-8 flex-1">
          {renderPage()}
        </div>
      </div>
      <EnrollModal open={enrollOpen} onClose={() => setEnrollOpen(false)} />
      <AwardPointsModal open={awardOpen} onClose={() => setAwardOpen(false)} />
    </>
  );
};
export default MurabbiIndex;