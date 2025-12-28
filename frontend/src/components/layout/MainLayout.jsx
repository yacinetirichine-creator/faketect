import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, Menu, X, ShieldCheck } from 'lucide-react';
import { useState } from 'react';
import useAuthStore from '../../stores/authStore';
import { languages } from '../../i18n';
import { motion, AnimatePresence } from 'framer-motion';

export default function MainLayout() {
  const { t, i18n } = useTranslation();
  const { isAuthenticated, user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

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
                        onClick={() => { i18n.changeLanguage(l.code); setLangOpen(false); }}
                        className={`w-full px-4 py-2 text-left hover:bg-white/5 flex items-center gap-2 text-sm ${i18n.language === l.code ? 'text-primary font-medium' : 'text-gray-400'}`}
                      >
                        <span>{l.flag}</span> {l.name}
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
                <button onClick={() => { logout(); navigate('/'); }} className="btn-outline px-4 py-2 text-sm h-auto rounded-lg">{t('nav.logout')}</button>
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">{t('auth.login')}</Link>
                <Link to="/register" className="btn-primary px-4 py-2 text-sm h-auto rounded-lg shadow-none hover:shadow-lg hover:shadow-primary/20">{t('auth.register')}</Link>
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
                {isAuthenticated ? (
                  <>
                    <Link to="/dashboard" onClick={() => setMenuOpen(false)} className="block text-gray-400 hover:text-white">{t('nav.dashboard')}</Link>
                    <button onClick={() => { logout(); navigate('/'); }} className="block w-full text-left text-gray-400 hover:text-white">{t('nav.logout')}</button>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="col-span-1 md:col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-lg flex items-center justify-center">
                  <ShieldCheck size={18} className="text-white" />
                </div>
                <span className="font-display font-bold text-xl">FakeTect</span>
              </div>
              <p className="text-gray-400 max-w-sm">
                Advanced AI-powered deepfake detection platform securing digital authenticity in the modern age.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">Product</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
                <li><Link to="/features" className="hover:text-primary transition-colors">Features</Link></li>
                <li><Link to="/api" className="hover:text-primary transition-colors">API</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4 text-white">Company</h3>
              <ul className="space-y-2 text-gray-400">
                <li><Link to="/about" className="hover:text-primary transition-colors">About</Link></li>
                <li><Link to="/blog" className="hover:text-primary transition-colors">Blog</Link></li>
                <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 mt-12 pt-8 text-center text-gray-500 text-sm">
            © 2025 FakeTect. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
