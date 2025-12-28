import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import useAuthStore from './stores/authStore';
import { useLanguageSync } from './hooks/useLanguageSync';
import MainLayout from './components/layout/MainLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import Landing from './components/pages/Landing';
import Pricing from './components/pages/Pricing';
import Login from './components/pages/Login';
import Register from './components/pages/Register';
import Dashboard from './components/pages/Dashboard';
import History from './components/pages/History';
import Settings from './components/pages/Settings';
import AdminDashboard from './components/pages/admin/AdminDashboard';
import AdminUsers from './components/pages/admin/AdminUsers';
import AdminChat from './components/pages/admin/AdminChat';
import PrivacyPolicy from './components/pages/PrivacyPolicy';
import TermsOfService from './components/pages/TermsOfService';
import LegalPage from './components/pages/LegalPage';
import CookiesPage from './components/pages/CookiesPage';
import CookieConsent from './components/CookieConsent';
import Chatbot from './components/Chatbot';
import { Loader2 } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';

const Protected = ({ children }) => {
  const { isAuthenticated, token, user, hasHydrated } = useAuthStore();

  if (!hasHydrated) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  if (token && !user) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const Admin = ({ children }) => {
  const { isAuthenticated, user, token, hasHydrated } = useAuthStore();

  if (!hasHydrated) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  if (token && !user) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (user?.role !== 'ADMIN') return <Navigate to="/dashboard" replace />;
  return children;
};

export default function App() {
  const { fetchUser, token, user, isFetchingUser } = useAuthStore();
  useLanguageSync();
  
  useEffect(() => {
    if (token && !user && !isFetchingUser) fetchUser();
  }, [token, user, isFetchingUser]);

  return (
    <ErrorBoundary>
      <CookieConsent />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Landing />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/legal/privacy" element={<PrivacyPolicy />} />
          <Route path="/legal/cookies" element={<CookiesPage />} />
          <Route path="/legal/terms" element={<TermsOfService />} />
          <Route path="/legal/sales" element={<LegalPage type="sales" />} />
          <Route path="/legal/mentions" element={<LegalPage type="legal" />} />
        </Route>
        <Route path="/dashboard" element={<Protected><DashboardLayout /></Protected>}>
          <Route index element={<Dashboard />} />
          <Route path="history" element={<History />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="/admin" element={<Admin><DashboardLayout isAdmin /></Admin>}>
          <Route index element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="chat" element={<AdminChat />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <CookieConsent />
      <Chatbot />
    </ErrorBoundary>
  );
}
