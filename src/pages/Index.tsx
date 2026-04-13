import { useState } from "react";
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
import { EnrollModal, NewCircleModal, AwardPointsModal, AddMurabbiModal } from "@/components/modals/AllModals";

const Index = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [enrollOpen, setEnrollOpen] = useState(false);
  const [newCircleOpen, setNewCircleOpen] = useState(false);
  const [awardOpen, setAwardOpen] = useState(false);
  const [addMurabbiOpen, setAddMurabbiOpen] = useState(false);

  const handleNav = (page: string) => {
    setActivePage(page);
    window.scrollTo(0, 0);
  };

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard': return <DashboardPage />;
      case 'world': return <WorldPage />;
      case 'students': return <StudentsPage onEnroll={() => setEnrollOpen(true)} />;
      case 'murabbis': return <MurabbisPage onAddMurabbi={() => setAddMurabbiOpen(true)} />;
      case 'parents': return <ParentsPage />;
      case 'circles': return <CirclesPage onNewCircle={() => setNewCircleOpen(true)} />;
      case 'attendance': return <AttendancePage />;
      case 'sessions': return <SessionsPage />;
      case 'performance': return <PerformancePage />;
      case 'incentives': return <IncentivesPage onAwardPoints={() => setAwardOpen(true)} />;
      case 'training': return <TrainingPage />;
      case 'neighbourhoods': return <NeighbourhoodsPage />;
      case 'reports': return <ReportsPage />;
      case 'settings': return <SettingsPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <>
      <Sidebar activePage={activePage} onNavigate={handleNav} />
      <div className="ml-[260px] min-h-screen flex flex-col">
        <TopBar activePage={activePage} onEnroll={() => setEnrollOpen(true)} />
        <div className="p-8 flex-1">
          {renderPage()}
        </div>
      </div>
      <EnrollModal open={enrollOpen} onClose={() => setEnrollOpen(false)} />
      <NewCircleModal open={newCircleOpen} onClose={() => setNewCircleOpen(false)} />
      <AwardPointsModal open={awardOpen} onClose={() => setAwardOpen(false)} />
      <AddMurabbiModal open={addMurabbiOpen} onClose={() => setAddMurabbiOpen(false)} />
    </>
  );
};

export default Index;
