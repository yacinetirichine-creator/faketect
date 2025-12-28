import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { LayoutDashboard, History, Settings, LogOut, Users, BarChart3, ChevronLeft, Menu, ShieldCheck } from 'lucide-react';
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
    <div className="min-h-screen bg-background flex text-white">
      <aside className={`${open ? 'w-64' : 'w-20'} bg-surface border-r border-white/10 transition-all duration-300 flex flex-col`}>
        <div className="h-16 flex items-center justify-between px-4 border-b border-white/10">
          {open && <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
              <ShieldCheck size={18} className="text-white" />
            </div>
            <span className="font-display font-bold text-lg">FakeTect</span>
          </Link>}
          <button onClick={() => setOpen(!open)} className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors">
            {open ? <ChevronLeft size={20} /> : <Menu size={20} />}
          </button>
        </div>

        <nav className="flex-1 py-4 px-3 space-y-1">
          {links.map(l => (
            <Link 
              key={l.to} 
              to={l.to} 
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                location.pathname === l.to 
                  ? 'bg-primary/10 text-primary border border-primary/20' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <l.icon size={20} />
              {open && <span className="font-medium">{l.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="border-t border-white/10 p-4">
          {open && <div className="mb-3">
            <p className="font-medium truncate text-white">{user?.name || user?.email}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wider">{user?.plan || 'Free Plan'}</p>
          </div>}
          <button 
            onClick={() => { logout(); navigate('/'); }} 
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors w-full ${!open && 'justify-center'}`}
          >
            <LogOut size={20} />
            {open && <span className="font-medium">{t('nav.logout')}</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
