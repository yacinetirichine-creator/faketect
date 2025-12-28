import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, Menu, X } from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../../stores/authStore';
import { languages } from '../../i18n';

export default function MainLayout() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  return (
    <div className="min-h-screen bg-surface-50">
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-surface-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg" />
            <span className="font-bold text-xl">FakeTect</span>
          </Link>

          <div className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-surface-600 hover:text-surface-900">{t('nav.home')}</Link>
            <Link to="/pricing" className="text-surface-600 hover:text-surface-900">{t('nav.pricing')}</Link>
            
            <div className="relative">
              <button onClick={() => setLangOpen(!langOpen)} className="p-2 hover:bg-surface-100 rounded-lg">
                <Globe size={20} />
              </button>
              {langOpen && (
                <div className="absolute right-0 mt-2 w-40 bg-white rounded-xl shadow-lg border py-2">
                  {languages.map(l => (
                    <button key={l.code} onClick={() => { i18n.changeLanguage(l.code); setLangOpen(false); }}
                      className={`w-full px-4 py-2 text-left hover:bg-surface-100 flex items-center gap-2 ${i18n.language === l.code ? 'text-primary-600 font-medium' : ''}`}>
                      <span>{l.flag}</span> {l.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="text-surface-600 hover:text-surface-900">{t('nav.dashboard')}</Link>
                {user?.role === 'ADMIN' && <Link to="/admin" className="text-accent-600">{t('nav.admin')}</Link>}
                <button onClick={() => { logout(); navigate('/'); }} className="btn-outline">{t('nav.logout')}</button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-surface-600 hover:text-surface-900">{t('nav.login')}</Link>
                <Link to="/register" className="btn-primary">{t('nav.register')}</Link>
              </>
            )}
          </div>

          <button className="md:hidden" onClick={() => setMenuOpen(!menuOpen)}>
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t bg-white p-4 space-y-3">
            <Link to="/" className="block py-2">{t('nav.home')}</Link>
            <Link to="/pricing" className="block py-2">{t('nav.pricing')}</Link>
            {isAuthenticated ? (
              <>
                <Link to="/dashboard" className="block py-2">{t('nav.dashboard')}</Link>
                <button onClick={() => { logout(); navigate('/'); }} className="text-red-600">{t('nav.logout')}</button>
              </>
            ) : (
              <>
                <Link to="/login" className="block py-2">{t('nav.login')}</Link>
                <Link to="/register" className="btn-primary w-full text-center">{t('nav.register')}</Link>
              </>
            )}
          </div>
        )}
      </nav>

      <main><Outlet /></main>

      <footer className="bg-surface-900 text-surface-300 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-accent-500 rounded-lg" />
            <span className="font-bold text-xl text-white">FakeTect</span>
          </div>
          <p className="text-sm">© 2024 FakeTect. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  );
}
