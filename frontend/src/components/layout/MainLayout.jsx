import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, Menu, X, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../../stores/authStore';
import { languages, normalizeLanguage, persistLanguage } from '../../i18n';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../services/api';
import NewsletterSubscribe from '../NewsletterSubscribe';

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
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur-xl border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between h-16 items-center">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative w-8 h-8">
              <div className="absolute inset-0 bg-primary/50 blur-lg rounded-full group-hover:bg-primary/80 transition-all" />
              <div className="relative w-full h-full bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                <ShieldCheck size={18} className="text-white" />
              </div>
            </div>
            <span className="font-display font-bold text-xl tracking-tight">FakeTect</span>
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
                <Link to="/dashboard" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">{t('nav.dashboard')}</Link>
                {user?.role === 'ADMIN' && <Link to="/admin" className="text-sm font-medium text-accent hover:text-accent-400 transition-colors">{t('nav.admin')}</Link>}
                <button onClick={() => { logout(); navigate('/'); }} className="px-4 py-2 text-sm rounded-lg bg-white/5 hover:bg-white/10 text-white border border-white/10 transition-all">{t('nav.logout')}</button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">{t('nav.login')}</Link>
                <Link to="/register" className="px-4 py-2 text-sm rounded-lg bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 transition-all">{t('nav.register')}</Link>
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
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <ShieldCheck size={18} className="text-white" />
                </div>
                <span className="font-display font-bold text-xl">FakeTect</span>
              </div>
              <p className="text-gray-400 max-w-sm mb-6">
                {t('footer.description', 'Détection de deepfakes par intelligence artificielle.')}
              </p>
              <NewsletterSubscribe />
              <p className="text-xs text-gray-500 mt-4">
                JARVIS - SAS au capital de 100 EUR<br />
                SIREN : 928 499 166 - RCS Paris<br />
                128 Rue la Boétie, 75008 PARIS
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">{t('footer.product', 'Produit')}</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/pricing" className="hover:text-primary transition-colors">{t('footer.links.pricing', 'Tarifs')}</Link></li>
                <li><Link to="/dashboard" className="hover:text-primary transition-colors">{t('footer.links.features', 'Fonctionnalités')}</Link></li>
                <li><a href="mailto:contact@faketect.com" className="hover:text-primary transition-colors">{t('footer.links.contact', 'Contact')}</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">{t('footer.legal', 'Mentions légales')}</h3>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link to="/legal/mentions" className="hover:text-primary transition-colors">Mentions légales</Link></li>
                <li><Link to="/legal/privacy" className="hover:text-primary transition-colors">Politique de confidentialité</Link></li>
                <li><Link to="/legal/cookies" className="hover:text-primary transition-colors">Politique de cookies</Link></li>
                <li><Link to="/legal/terms" className="hover:text-primary transition-colors">CGU</Link></li>
                <li><Link to="/legal/sales" className="hover:text-primary transition-colors">CGV</Link></li>
                <li>
                  <button 
                    onClick={() => {
                      localStorage.removeItem('cookie_consent');
                      window.location.reload();
                    }}
                    className="hover:text-primary transition-colors"
                  >
                    Gérer les cookies
                  </button>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-12 pt-8">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-center md:text-left">
              <p className="text-gray-500 text-sm">
                © {new Date().getFullYear()} JARVIS - Tous droits réservés
              </p>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>🇫🇷 Conforme RGPD</span>
                <span>•</span>
                <span>🔒 Paiements sécurisés Stripe</span>
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
