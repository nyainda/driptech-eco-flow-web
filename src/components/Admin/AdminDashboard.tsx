import RealDataDashboard from "./Dashboard";

interface AdminDashboardProps {
  onNavigate?: (tabId: string) => void;
}

const AdminDashboard = ({ onNavigate }: AdminDashboardProps) => {
  return <RealDataDashboard onNavigate={onNavigate} />;
};

export default AdminDashboard;
