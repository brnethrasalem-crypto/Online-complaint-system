import { useAuth } from '../context/AuthContext';
import UserDashboard from './UserDashboard';
import OfficerWorkspace from './OfficerWorkspace';
import AdminAnalytics from './AdminAnalytics';

const DashboardPage = () => {
  const { user } = useAuth();

  if (user?.role === 'Officer') {
    return <OfficerWorkspace />;
  }

  if (user?.role === 'Admin') {
    return <AdminAnalytics />;
  }

  return <UserDashboard />;
};

export default DashboardPage;
