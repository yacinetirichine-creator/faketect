import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, History, Settings, LogOut, Users, BarChart3, ChevronLeft, Menu } from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../../stores/authStore';

export default function DashboardLayout({ isAdmin = false }) {
  const { t } = useTranslation();
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [open, setOpen] = useState(true);

  const userLinks = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('dashboard.overview') },
    { to: '/dashboard/history', icon: History, label: t('dashboard.history') },
    { to: '/dashboard/settings', icon: Settings, label: t('dashboard.settings') }
  ];
  const adminLinks = [
    { to: '/admin', icon: BarChart3, label: t('admin.metrics') },
    { to: '/admin/users', icon: Users, label: t('admin.users') }
  ];
  const links = isAdmin ? adminLinks : userLinks;

  return (
    <div className="min-h-screen bg-surface-100 flex">
      <aside className={`${open ? 'w-64' : 'w-20'} bg-white border-r transition-all flex flex-col`}>
        <div className="h-16 flex items-center justify-between px-4 border-b">
          {open && <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg" />
            <span className="font-bold">FakeTect</span>
          </Link>}
          <button onClick={() => setOpen(!open)} className="p-2 hover:bg-surface-100 rounded-lg">
            {open ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {links.map(l => (
            <Link key={l.to} to={l.to} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${location.pathname === l.to ? 'bg-primary-50 text-primary-700' : 'text-surface-600 hover:bg-surface-100'}`}>
              <l.icon size={20} />
              {open && <span className="font-medium">{l.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="border-t p-4">
          {open && <div className="mb-3">
            <p className="font-medium truncate">{user?.name || user?.email}</p>
            <p className="text-sm text-surface-500">{user?.plan}</p>
          </div>}
          <button onClick={() => { logout(); navigate('/'); }} className="flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-xl w-full">
            <LogOut size={20} />
            {open && t('nav.logout')}
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-auto">
        <div className="max-w-7xl mx-auto"><Outlet /></div>
      </main>
    </div>
  );
}
