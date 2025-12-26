import { Link, useLocation } from 'react-router-dom'
import { History, LogOut, LogIn, Scan, FileText, Zap, CreditCard, Shield } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useEffect, useState } from 'react'
import { getQuota, setAuthToken } from '../utils/api'
import LanguageSelector from './LanguageSelector'
import useTranslation from '../hooks/useTranslation'

export default function Header() {
  const { t } = useTranslation()
  const location = useLocation()
  const { user, profile, signOut, isAuthenticated, getAccessToken } = useAuth()
  const [quota, setQuota] = useState(null)

  // Vérifier si l'utilisateur est admin (liste explicite).
  // Config optionnelle côté Vercel: VITE_ADMIN_EMAILS="a@b.com,c@d.com"
  const configuredAdmins = String(import.meta.env.VITE_ADMIN_EMAILS || '')
    .split(',')
    .map(s => s.trim().toLowerCase())
    .filter(Boolean)
  const email = String(user?.email || '').toLowerCase()
  const isAdmin = configuredAdmins.length > 0
    ? configuredAdmins.includes(email)
    : email === 'contact@faketect.com'

  useEffect(() => {
    const loadQuota = async () => {
      try {
        if (isAuthenticated) {
          setAuthToken(getAccessToken())
        }
        const data = await getQuota()
        setQuota(data?.quota)
      } catch (err) {
        console.error('Error loading quota:', err)
      }
    }
    loadQuota()
    
    // Recharger le quota toutes les 30 secondes si authentifié
    const interval = isAuthenticated ? setInterval(loadQuota, 30000) : null
    return () => interval && clearInterval(interval)
  }, [isAuthenticated, getAccessToken])

  const getQuotaColor = () => {
    if (!quota) return 'text-gray-400'
    const total = quota.limit || quota.total
    if (!total) return 'text-gray-400'
    const percentage = (quota.remaining / total) * 100
    if (percentage > 50) return 'text-green-400'
    if (percentage > 20) return 'text-orange-400'
    return 'text-red-400'
  }

  return (
    <header className="border-b border-white/10 glass sticky top-0 z-50 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-12">
        <div className="flex items-center justify-between py-5">
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/logo.png"
              alt="FakeTect"
              className="h-9 w-auto"
              onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = '/favicon.svg' }}
            />
            <div className="leading-tight">
              <div className="text-[22px] font-bold tracking-tight">
                Fake<span className="text-primary-500">Tect</span>
              </div>
              <div className="text-xs text-gray-300 tracking-[0.3em] uppercase">Detecting AI Fakes</div>
            </div>
          </Link>

          <nav className="flex items-center">
            <Link
              to="/app"
              className={`text-white font-medium opacity-85 hover:opacity-100 transition-opacity ${location.pathname === '/app' ? 'opacity-100' : ''}`}
            >
              <span className="inline-flex items-center gap-2">
                <Scan className="w-4 h-4" />
                {t('navbar.app', 'Analyser')}
              </span>
            </Link>

            <Link
              to="/pricing"
              className={`ml-6 text-white font-medium opacity-85 hover:opacity-100 transition-opacity ${location.pathname === '/pricing' ? 'opacity-100' : ''}`}
            >
              <span className="inline-flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                {t('navbar.pricing', 'Tarifs')}
              </span>
            </Link>
            
            {isAuthenticated && (
              <>
                <Link
                  to="/history"
                  className={`ml-6 text-white font-medium opacity-85 hover:opacity-100 transition-opacity ${location.pathname === '/history' ? 'opacity-100' : ''}`}
                >
                  <span className="inline-flex items-center gap-2">
                    <History className="w-4 h-4" />
                    {t('navbar.history', 'Historique')}
                  </span>
                </Link>
                
                <Link
                  to="/invoices"
                  className={`ml-6 text-white font-medium opacity-85 hover:opacity-100 transition-opacity ${location.pathname === '/invoices' ? 'opacity-100' : ''}`}
                >
                  <span className="inline-flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    {t('navbar.invoices', 'Factures')}
                  </span>
                </Link>

                {/* Lien Admin - visible uniquement pour les admins */}
                {isAdmin && (
                  <Link
                    to="/admin"
                    className={`ml-6 text-white font-medium opacity-85 hover:opacity-100 transition-opacity ${location.pathname === '/admin' ? 'opacity-100' : ''}`}
                  >
                    <span className="inline-flex items-center gap-2">
                      <Shield className="w-4 h-4 text-primary-400" />
                      <span className="text-primary-400 font-bold">Admin</span>
                    </span>
                  </Link>
                )}
              </>
            )}

            {isAuthenticated ? (
              <div className="flex items-center gap-4 ml-4">
                {quota && (
                  <Link 
                    to="/pricing"
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-200/50 border border-dark-300 hover:border-primary-500 transition-all"
                  >
                    <Zap className={`w-4 h-4 ${getQuotaColor()}`} />
                    <span className={`text-sm font-semibold ${getQuotaColor()}`}>
                      {quota.remaining}/{quota.limit || quota.total}
                    </span>
                  </Link>
                )}
                <LanguageSelector variant="compact" />
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-white">{profile?.full_name || user?.email?.split('@')[0]}</p>
                  <p className="text-xs text-primary-300 capitalize font-medium">{profile?.plan || 'free'} plan</p>
                </div>
                <button onClick={signOut} className="p-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-300 hover:scale-110">
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 ml-4">
                {quota && (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-dark-200/50 border border-dark-300">
                    <Zap className={`w-4 h-4 ${getQuotaColor()}`} />
                    <span className={`text-sm font-semibold ${getQuotaColor()}`}>
                      {quota.remaining}/{quota.limit || quota.total}
                    </span>
                  </div>
                )}
                <LanguageSelector variant="compact" />
                <Link to="/login" className="flex items-center gap-2 px-5 py-2.5 rounded-xl glass hover:bg-white/10 transition-all text-white font-semibold">
                  <LogIn className="w-4 h-4" /><span className="hidden sm:inline">Connexion</span>
                </Link>
                <Link to="/signup" className="btn-primary px-6 py-2.5">
                  <span className="hidden sm:inline">Créer un compte</span>
                  <span className="sm:hidden">Compte</span>
                </Link>
              </div>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
