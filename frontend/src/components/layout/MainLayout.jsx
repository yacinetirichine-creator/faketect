import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, Menu, X } from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../../stores/authStore';
import { languages, normalizeLanguage, persistLanguage } from '../../i18n';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import NewsletterSubscribe from '../NewsletterSubscribe';
import Logo from '../Logo';

export default function MainLayout() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user, logout, updateUser } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const currentLang = normalizeLanguage(i18n.resolvedLanguage || i18n.language);

  const changeLang = async (code) => {
    const lang = persistLanguage(code);
    i18n.changeLanguage(lang);
    setLangOpen(false);
    // Sauvegarder en base si connecté
    if (isAuthenticated) {
      try {
        await api.put('/auth/profile', { language: lang });
        updateUser({ language: lang });
      } catch (error) {
        console.error('Error saving language:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background text-white selection:bg-primary/30">
      <nav className="sticky top-0 z-50 bg-background/90 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-black/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-24 items-center">
          <Link to="/" className="flex items-center group hover:opacity-90 transition-opacity">
            <Logo size="2xl" />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">{t('nav.home')}</Link>
            <Link to="/pricing" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">{t('nav.pricing')}</Link>
            
            <div className="relative">
              <button 
                onClick={() => setLangOpen(!langOpen)} 
                className="p-2 hover:bg-white/5 rounded-lg text-gray-400 hover:text-white transition-colors"
              >
                <Globe size={20} />
              </button>
              <AnimatePresence>
                {langOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="absolute right-0 mt-2 w-40 bg-surface border border-white/10 rounded-xl shadow-xl py-2 overflow-hidden"
                  >
                    {languages.map(l => (
                      <button 
                        key={l.code} 
                        onClick={() => changeLang(l.code)}
                        className={`w-full px-4 py-2 text-left hover:bg-white/5 flex items-center gap-2 text-sm transition-colors ${currentLang === l.code ? 'text-primary font-semibold bg-primary/10' : 'text-gray-200 hover:text-white'}`}
                      >
                        <span className="text-base">{l.flag}</span> <span className="font-medium">{l.name}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <Link to="/dashboard" className="text-sm font-medium text-gray-300 hover:text-white transition-colors">{t('nav.dashboard')}</Link>
                {user?.role === 'ADMIN' && <Link to="/admin" className="text-sm font-medium text-purple-400 hover:text-purple-300 transition-colors">{t('nav.admin')}</Link>}
                <button onClick={() => { logout(); navigate('/'); }} className="px-4 py-2 text-sm rounded-xl bg-white/5 hover:bg-white/10 text-white border border-white/10 hover:border-white/20 transition-all duration-200">{t('nav.logout')}</button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link to="/login" className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white transition-colors">{t('nav.login')}</Link>
                <Link to="/register" className="px-5 py-2.5 text-sm font-semibold rounded-xl bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-500 text-white shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all duration-200 hover:-translate-y-0.5">{t('nav.register')}</Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 text-gray-400 hover:text-white">
            {menuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-white/10 bg-surface overflow-hidden"
            >
              <div className="px-4 py-6 space-y-4">
                <Link to="/" onClick={() => setMenuOpen(false)} className="block text-gray-400 hover:text-white">{t('nav.home')}</Link>
                <Link to="/pricing" onClick={() => setMenuOpen(false)} className="block text-gray-400 hover:text-white">{t('nav.pricing')}</Link>
                
                {/* Language selector mobile */}
                <div className="border-t border-white/10 pt-4">
                  <p className="text-xs text-gray-500 mb-2">{t('settings.sections.language')}</p>
                  <div className="grid grid-cols-2 gap-2">
                    {languages.map(l => (
                      <button 
                        key={l.code} 
                        onClick={() => { changeLang(l.code); setMenuOpen(false); }}
                        className={`px-3 py-2 rounded-lg text-sm flex items-center gap-2 transition-colors ${currentLang === l.code ? 'bg-primary/20 text-primary border border-primary/50' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}
                      >
                        <span>{l.flag}</span> {l.name}
                      </button>
                    ))}
                  </div>
                </div>
                
                {isAuthenticated ? (
                  <>
                    <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block text-gray-400 hover:text-white">{t('nav.dashboard')}</Link>
                    <button onClick={() => { logout(); navigate('/'); setMenuOpen(false); }} className="block w-full text-left text-gray-400 hover:text-white">{t('nav.logout')}</button>
                  </>
                ) : (
                  <>
                    <Link to="/login" onClick={() => setMenuOpen(false)} className="block text-gray-400 hover:text-white">{t('auth.login')}</Link>
                    <Link to="/register" onClick={() => setMenuOpen(false)} className="block w-full btn-primary text-center">{t('auth.register')}</Link>
                  </>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      <main>
        <Outlet />
      </main>

      <footer className="bg-surface border-t border-white/10 py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="mb-4">
                <Logo size="2xl" />
              </div>
              <p className="text-gray-400 max-w-sm mb-6">
                {t('footer.description')}
              </p>
              <NewsletterSubscribe />
              <p className="text-xs text-gray-500 mt-4">
                JARVIS - SAS au capital de 1 000 EUR<br />
                SIREN : 928 499 166 - RCS Créteil<br />
                64 Avenue Marinville, 94100 Saint-Maur-des-Fossés
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">{t('footer.product')}</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/pricing" className="hover:text-primary transition-colors">{t('footer.links.pricing')}</Link></li>
                <li><Link to="/dashboard" className="hover:text-primary transition-colors">{t('footer.links.features')}</Link></li>
                <li><a href="mailto:contact@faketect.com" className="hover:text-primary transition-colors">{t('footer.links.contact')}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">{t('footer.legal')}</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/legal/mentions" className="hover:text-primary transition-colors">{t('landing.footer.legalNotice')}</Link></li>
                <li><Link to="/legal/privacy" className="hover:text-primary transition-colors">{t('landing.footer.privacy')}</Link></li>
                <li><Link to="/legal/cookies" className="hover:text-primary transition-colors">{t('landing.footer.cookies')}</Link></li>
                <li><Link to="/legal/terms" className="hover:text-primary transition-colors">{t('footer.links.terms')}</Link></li>
                <li><Link to="/legal/sales" className="hover:text-primary transition-colors">{t('footer.links.sales')}</Link></li>
                <li>
                  <button
                    onClick={() => {
                      localStorage.removeItem('cookie_consent');
                      window.location.reload();
                    }}
                    className="hover:text-primary transition-colors"
                  >
                    {t('landing.footer.manageCookies')}
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
              <p className="text-gray-500 text-sm">
                © {new Date().getFullYear()} JARVIS - {t('landing.footer.rights')}
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>🇫🇷 {t('landing.footer.gdpr')}</span>
                <span>•</span>
                <span>🔒 {t('landing.footer.stripe')}</span>
                <span>•</span>
                <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                  CNIL
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
