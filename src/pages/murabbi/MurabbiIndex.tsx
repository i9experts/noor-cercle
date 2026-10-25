import { useState } from "react";
import MurabbiSidebar from "@/components/murabbi/MurabbiSidebar";
import TopBar from "@/components/layout/TopBar";
import MurabbiDashboard from "./MurabbiDashboard";
import MurabbiStudents from "./MurabbiStudents";
import MurabbiAttendance from "./MurabbiAttendance";
import MurabbiCircles from "./MurabbiCircles";
import MurabbiLessons from "./MurabbiLessons";
import MurabbiTraining from "./MurabbiTraining";
import MurabbiReports from "./MurabbiReports";
import MurabbiSettings from "./MurabbiSettings";
import MurabbiProfile from "./MurabbiProfile";
import MurabbiAnnouncements from "./MurabbiAnnouncements";
import MurabbiAgenda from "./MurabbiAgenda";
import { EnrollModal, AwardPointsModal } from "@/components/modals/AllModals";

const MurabbiIndex = () => {
  const [activePage, setActivePage] = useState('murabbi-dashboard');
  const [navOpen, setNavOpen] = useState(false);
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [awardOpen, setAwardOpen] = useState(false);

  const handleNav = (page: string) => {
    setActivePage(page);
    setNavOpen(false);
    window.scrollTo(0, 0);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'murabbi-dashboard': return <MurabbiDashboard />;
      case 'murabbi-students': return <MurabbiStudents />;
      case 'murabbi-agenda': return <MurabbiAgenda />;
      case 'murabbi-attendance': return <MurabbiAttendance />;
      case 'murabbi-circles': return <MurabbiCircles />;
      case 'murabbi-lessons': return <MurabbiLessons />;
      case 'murabbi-training': return <MurabbiTraining />;
      case 'murabbi-reports': return <MurabbiReports />;
      case 'murabbi-announcements': return <MurabbiAnnouncements />;
      case 'murabbi-profile': return <MurabbiProfile />;
      case 'settings': return <MurabbiSettings />;
      default: return <MurabbiDashboard />;
    }
  };

  return (
    <>
      <MurabbiSidebar activePage={activePage} onNavigate={handleNav} open={navOpen} onClose={() => setNavOpen(false)} />
      <div className="lg:ml-[264px] min-h-screen flex flex-col">
        <TopBar activePage={activePage} onEnroll={() => setEnrollOpen(true)} onMenu={() => setNavOpen(true)} onMurabbiNav={handleNav} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {renderPage()}
        </main>
      </div>
      <EnrollModal open={enrollOpen} onClose={() => setEnrollOpen(false)} murabbiMode={true} />
      <AwardPointsModal open={awardOpen} onClose={() => setAwardOpen(false)} />
    </>
  );
};
export default MurabbiIndex;