import { Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, Suspense, lazy } from 'react';
import useAuthStore from './stores/authStore';
import { useLanguageSync } from './hooks/useLanguageSync';
import MainLayout from './components/layout/MainLayout';
import DashboardLayout from './components/layout/DashboardLayout';
import { Loader2 } from 'lucide-react';
import ErrorBoundary from './components/ErrorBoundary';
import CookieConsent from './components/CookieConsent';
import Chatbot from './components/Chatbot';

// Lazy loading des pages pour réduire le bundle initial
const Landing = lazy(() => import('./components/pages/Landing'));
const Pricing = lazy(() => import('./components/pages/Pricing'));
const Login = lazy(() => import('./components/pages/Login'));
const Register = lazy(() => import('./components/pages/Register'));
const Dashboard = lazy(() => import('./components/pages/Dashboard'));
const History = lazy(() => import('./components/pages/History'));
const Settings = lazy(() => import('./components/pages/Settings'));
const AdminDashboard = lazy(() => import('./components/pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./components/pages/admin/AdminUsers'));
const AdminChat = lazy(() => import('./components/pages/admin/AdminChat'));
const AdminNewsletter = lazy(() => import('./components/pages/admin/AdminNewsletter'));
const PrivacyPolicy = lazy(() => import('./components/pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./components/pages/TermsOfService'));
const LegalPage = lazy(() => import('./components/pages/LegalPage'));
const CookiesPage = lazy(() => import('./components/pages/CookiesPage'));

// Composant de chargement réutilisable
const PageLoader = () => (
  <div className="flex items-center justify-center h-64">
    <Loader2 className="animate-spin text-primary" size={32} />
  </div>
);

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
      <Suspense fallback={<PageLoader />}>
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
            <Route path="newsletter" element={<AdminNewsletter />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
      <CookieConsent />
      <Chatbot />
    </ErrorBoundary>
  );
}
