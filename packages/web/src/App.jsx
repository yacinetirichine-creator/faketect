import { Routes, Route } from 'react-router-dom'
import { useState, useEffect, lazy, Suspense } from 'react'
import { useAuth } from './context/AuthContext'
import Header from './components/Header'
import CookieConsent from './components/CookieConsent'
import i18n from '@shared/i18n'

// Lazy loading pour optimiser performance
const HomePage = lazy(() => import('./pages/HomePage'))
const LandingPage = lazy(() => import('./pages/LandingPage'))
const HistoryPage = lazy(() => import('./pages/HistoryPage'))
const AuthPage = lazy(() => import('./pages/AuthPage'))
const LegalPage = lazy(() => import('./pages/LegalPage'))
const InvoicesPage = lazy(() => import('./pages/InvoicesPage'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const ClientDashboard = lazy(() => import('./pages/ClientDashboard'))
const PricingPage = lazy(() => import('./pages/PricingPage'))
const AIAgent = lazy(() => import('./components/AIAgent'))

// Loading component pour Suspense fallback
function PageLoader() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-gray-400 animate-pulse">Chargement...</p>
      </div>
    </div>
  )
}

export default function App() {
  const { loading } = useAuth()
  const [isAIAgentOpen, setIsAIAgentOpen] = useState(false)
  const [, forceUpdate] = useState()

  // Écouter changements de langue
  useEffect(() => {
    const handleLanguageChange = () => forceUpdate({})
    window.addEventListener('languagechange', handleLanguageChange)
    return () => window.removeEventListener('languagechange', handleLanguageChange)
  }, [])

  // Do not block rendering of the whole app on auth loading.
  // Some browsers/extensions can delay Supabase session restore; we still want
  // the marketing site and public app UI to render immediately.

  return (
    <div className="min-h-screen grid-bg">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/app" element={<HomePage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/history" element={<HistoryPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/dashboard" element={<ClientDashboard />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/auth/callback" element={<AuthPage />} />
            <Route path="/login" element={<AuthPage initialMode="login" />} />
            <Route path="/signup" element={<AuthPage initialMode="signup" />} />
          
          {/* Pages juridiques */}
          <Route path="/legal/mentions-legales" element={<LegalPage type="mentions-legales" />} />
          <Route path="/legal/confidentialite" element={<LegalPage type="confidentialite" />} />
          <Route path="/legal/cgu" element={<LegalPage type="cgu" />} />
          <Route path="/legal/cgv" element={<LegalPage type="cgv" />} />
          <Route path="/legal/cookies" element={<LegalPage type="cookies" />} />
          </Routes>
        </Suspense>
      </main>
      <footer className="border-t border-white/5 mt-20 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6">
            {/* Legal Links */}
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-xs">
              <a href="/legal/mentions-legales" className="text-gray-500 hover:text-primary-400 transition-colors">{i18n.t('legal.mentions')}</a>
              <a href="/legal/confidentialite" className="text-gray-500 hover:text-primary-400 transition-colors">{i18n.t('legal.privacy')}</a>
              <a href="/legal/cgu" className="text-gray-500 hover:text-primary-400 transition-colors">{i18n.t('legal.terms')}</a>
              <a href="/legal/cgv" className="text-gray-500 hover:text-primary-400 transition-colors">{i18n.t('legal.sales')}</a>
              <a href="/legal/cookies" className="text-gray-500 hover:text-primary-400 transition-colors">{i18n.t('legal.cookies')}</a>
              <a href="mailto:dpo@faketect.com" className="text-gray-500 hover:text-primary-400 transition-colors">{i18n.t('legal.dpo')}</a>
            </div>
            
            {/* Compliance Badges */}
            <div className="flex gap-3 text-xs text-gray-600">
              <span className="px-2 py-1 bg-primary-500/10 rounded">RGPD</span>
              <span className="px-2 py-1 bg-primary-500/10 rounded">IA Act</span>
              <span className="px-2 py-1 bg-primary-500/10 rounded">ISO 27001</span>
              <span className="px-2 py-1 bg-primary-500/10 rounded">ePrivacy</span>
            </div>
          </div>
          
          <div className="text-center border-t border-white/5 pt-6">
            <p className="text-sm text-gray-500">{i18n.t('footer.tagline')}</p>
            <p className="text-xs text-gray-600 mt-2">{i18n.t('footer.copyright', { year: new Date().getFullYear() })}</p>
          </div>
        </div>
      </footer>
      
      {/* Bouton flottant agent IA */}
      {!isAIAgentOpen && (
        <button
          onClick={() => setIsAIAgentOpen(true)}
          className="fixed bottom-4 right-4 z-40 w-14 h-14 bg-gradient-to-br from-primary-500 to-purple-500 rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform group"
          aria-label={i18n.t('chatbot.title')}
        >
          <span className="text-2xl">🤖</span>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-gray-900 animate-pulse" />
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            {i18n.t('chatbot.title')}
          </div>
        </button>
      )}
      
      <Suspense fallback={null}>
        {isAIAgentOpen && <AIAgent isOpen={isAIAgentOpen} onClose={() => setIsAIAgentOpen(false)} />}
      </Suspense>
      <CookieConsent />
    </div>
  )
}
