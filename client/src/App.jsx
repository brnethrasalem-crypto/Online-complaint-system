import { useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './routes/ProtectedRoute';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import FAQPage from './pages/FAQPage';
import DashboardPage from './pages/DashboardPage';
import ComplaintsPage from './pages/ComplaintsPage';
import OfficerWorkspace from './pages/OfficerWorkspace';
import AdminAnalytics from './pages/AdminAnalytics';

const PageWrapper = ({ children }) => (
  <div className="animate-page-enter transition-all duration-500 ease-out">
    {children}
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <Routes location={location} key={location.pathname}>
      <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
      <Route path="/login" element={<PageWrapper><LoginPage /></PageWrapper>} />
      <Route path="/register" element={<PageWrapper><RegisterPage /></PageWrapper>} />
      <Route path="/forgot-password" element={<PageWrapper><ForgotPasswordPage /></PageWrapper>} />
      <Route path="/faq" element={<PageWrapper><FAQPage /></PageWrapper>} />

      <Route element={<ProtectedRoute allowedRoles={['User', 'Officer', 'Admin']} />}>
        <Route path="/dashboard" element={<PageWrapper><DashboardPage /></PageWrapper>} />
        <Route path="/complaints" element={<PageWrapper><ComplaintsPage /></PageWrapper>} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['Officer']} />}>
        <Route path="/officer/workspace" element={<PageWrapper><OfficerWorkspace /></PageWrapper>} />
      </Route>
      <Route element={<ProtectedRoute allowedRoles={['Admin']} />}>
        <Route path="/admin/analytics" element={<PageWrapper><AdminAnalytics /></PageWrapper>} />
      </Route>

      <Route path="*" element={<Navigate to={useAuth().user ? '/dashboard' : '/'} replace />} />
    </Routes>
  );
};

const AppShell = () => {
  const { user } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(true);

  const themeClass = isDarkMode
    ? 'bg-slate-950 text-slate-100'
    : 'bg-slate-50 text-slate-950';

  return (
    <div className={`min-h-screen flex flex-col ${themeClass}`}>
      <Navbar isDarkMode={isDarkMode} toggleTheme={() => setIsDarkMode((value) => !value)} />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AnimatedRoutes />
      </main>
      <Footer />
      <ToastContainer position="top-right" theme={isDarkMode ? 'dark' : 'light'} />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <AppShell />
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
