import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Mail, Lock, User, Chrome, Building2, UserCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import useTranslation from '../hooks/useTranslation'
import { API_BASE_URL } from '../config/api'

export default function AuthPage({ initialMode }) {
  const { t } = useTranslation()
  const [isLogin, setIsLogin] = useState(initialMode !== 'signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  // Nouveaux champs pour le type de compte
  const [accountType, setAccountType] = useState('individual')
  const [companyInfo, setCompanyInfo] = useState({
    company_name: '',
    company_legal_form: '',
    siret: '',
    vat_number: '',
    company_address: '',
    company_postal_code: '',
    company_city: '',
    company_country: 'FR',
    phone: ''
  })
  
  const { signIn, signUp, signInWithOAuth, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  useEffect(() => {
    if (isAuthenticated) {
      // Rediriger vers la page d'origine si spécifiée dans location.state
      const from = location.state?.from || '/app'
      navigate(from, { replace: true })
    }
  }, [isAuthenticated, navigate, location])

  useEffect(() => {
    if (initialMode === 'login') setIsLogin(true)
    if (initialMode === 'signup') setIsLogin(false)
  }, [initialMode])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    
    try {
      if (isLogin) {
        const { error } = await signIn(email, password)
        if (error) {
          console.error('Erreur connexion:', error)
          setError(error.message || 'Erreur de connexion')
        } else {
          navigate('/app')
        }
      } else {
        // Inscription
        console.log('Tentative inscription...', { email, name })
        const { data, error } = await signUp(email, password, name)
        
        if (error) {
          console.error('Erreur inscription:', error)
          // Messages d'erreur plus clairs
          if (error.message?.includes('only request this after')) {
            setError('Veuillez attendre 1 minute avant de réessayer (limite de sécurité)')
          } else if (error.message?.includes('already registered')) {
            setError('Cet email est déjà utilisé. Essayez de vous connecter.')
          } else {
            setError(error.message || 'Erreur lors de l\'inscription')
          }
        } else if (data?.session) {
          console.log('Inscription réussie, création profil...')
          console.log('Inscription réussie, création profil...')
          // Créer le profil de facturation
          try {
            const [firstName, ...lastNameParts] = name.trim().split(' ')
            const lastName = lastNameParts.join(' ') || ''
            
            const billingResponse = await fetch(`${API_BASE_URL}/api/billing/profile`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${data.session.access_token}`
              },
              body: JSON.stringify({
                account_type: accountType,
                first_name: firstName,
                last_name: lastName,
                email: email,
                ...(accountType === 'business' ? companyInfo : {})
              })
            })
            
            if (!billingResponse.ok) {
              console.warn('Profil facturation non créé:', await billingResponse.text())
            } else {
              console.log('Profil facturation créé ✅')
            }
          } catch (profileError) {
            console.error('Erreur création profil:', profileError)
            // Ne pas bloquer l'inscription si le profil échoue
          }
          navigate('/app')
        } else if (data?.user && !data?.session) {
          // Email de confirmation envoyé
          setError('Vérifiez votre email pour confirmer votre inscription ✉️')
          setLoading(false)
          return
        }
      }
    } catch (err) { 
      console.error('Erreur handleSubmit:', err)
      setError(err.message || 'Erreur lors de la soumission') 
    }
    finally { 
      setLoading(false) 
    }
  }

  return (
    <div className="max-w-2xl mx-auto py-12 px-4">
      <div className="glass p-8">
        <h2 className="text-2xl font-bold text-center mb-6">{isLogin ? 'Connexion' : 'Inscription'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input type="text" placeholder="Nom complet" value={name} onChange={(e) => setName(e.target.value)} className="input pl-11" required={!isLogin} />
              </div>

              {/* Type de compte */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-300">Type de compte</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setAccountType('individual')}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
                      accountType === 'individual'
                        ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                        : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <UserCircle className="w-5 h-5" />
                    <span className="font-medium">Particulier</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAccountType('business')}
                    className={`flex items-center justify-center gap-2 py-3 px-4 rounded-lg border-2 transition-all ${
                      accountType === 'business'
                        ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                        : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'
                    }`}
                  >
                    <Building2 className="w-5 h-5" />
                    <span className="font-medium">Entreprise</span>
                  </button>
                </div>
              </div>

              {/* Informations entreprise */}
              {accountType === 'business' && (
                <div className="space-y-3 p-4 rounded-lg bg-white/5 border border-white/10">
                  <h3 className="text-sm font-medium text-gray-300 mb-2">Informations de l'entreprise</h3>
                  
                  <input
                    type="text"
                    placeholder="Nom de l'entreprise *"
                    value={companyInfo.company_name}
                    onChange={(e) => setCompanyInfo({...companyInfo, company_name: e.target.value})}
                    className="input"
                    required={accountType === 'business'}
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Forme juridique (ex: SARL)"
                      value={companyInfo.company_legal_form}
                      onChange={(e) => setCompanyInfo({...companyInfo, company_legal_form: e.target.value})}
                      className="input"
                    />
                    <input
                      type="text"
                      placeholder="SIRET (14 chiffres)"
                      value={companyInfo.siret}
                      onChange={(e) => setCompanyInfo({...companyInfo, siret: e.target.value.replace(/\s/g, '')})}
                      className="input"
                      maxLength={14}
                    />
                  </div>

                  <input
                    type="text"
                    placeholder="N° TVA intracommunautaire (ex: FR12345678901)"
                    value={companyInfo.vat_number}
                    onChange={(e) => setCompanyInfo({...companyInfo, vat_number: e.target.value})}
                    className="input"
                  />

                  <input
                    type="text"
                    placeholder="Adresse"
                    value={companyInfo.company_address}
                    onChange={(e) => setCompanyInfo({...companyInfo, company_address: e.target.value})}
                    className="input"
                  />

                  <div className="grid grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Code postal"
                      value={companyInfo.company_postal_code}
                      onChange={(e) => setCompanyInfo({...companyInfo, company_postal_code: e.target.value})}
                      className="input"
                    />
                    <input
                      type="text"
                      placeholder="Ville"
                      value={companyInfo.company_city}
                      onChange={(e) => setCompanyInfo({...companyInfo, company_city: e.target.value})}
                      className="input col-span-2"
                    />
                  </div>

                  <input
                    type="tel"
                    placeholder="Téléphone (ex: +33123456789)"
                    value={companyInfo.phone}
                    onChange={(e) => setCompanyInfo({...companyInfo, phone: e.target.value})}
                    className="input"
                  />

                  <p className="text-xs text-gray-500 mt-2">
                    Ces informations seront utilisées pour générer vos factures.
                  </p>
                </div>
              )}
            </>
          )}
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="email" placeholder={t('auth.email', 'Email')} value={email} onChange={(e) => setEmail(e.target.value)} className="input pl-11" required />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input type="password" placeholder={t('auth.password', 'Mot de passe')} value={password} onChange={(e) => setPassword(e.target.value)} className="input pl-11" required minLength={6} />
          </div>
          {error && <div className="p-3 rounded-lg bg-red-500/10 text-red-400 text-sm">{error}</div>}
          <button type="submit" disabled={loading} className="w-full btn-primary">{loading ? t('common.loading', 'Chargement...') : isLogin ? t('auth.login', 'Se connecter') : t('auth.signup', 'S\'inscrire')}</button>
        </form>
        <div className="my-6 flex items-center gap-4"><div className="flex-1 h-px bg-white/10" /><span className="text-sm text-gray-500">{t('common.or', 'ou')}</span><div className="flex-1 h-px bg-white/10" /></div>
        <button onClick={() => signInWithOAuth('google')} className="w-full btn-secondary flex items-center justify-center gap-2"><Chrome className="w-5 h-5" />{t('auth.continueWithGoogle', 'Continuer avec Google')}</button>
        <p className="text-center text-sm text-gray-400 mt-6">
          {isLogin ? t('auth.noAccount', 'Pas de compte ?') : t('auth.hasAccount', 'Déjà un compte ?')}
          <button onClick={() => { setIsLogin(!isLogin); setError('') }} className="ml-1 text-primary-400 hover:underline">{isLogin ? t('auth.createAccount', 'Créer un compte') : t('auth.login', 'Connexion')}</button>
        </p>
      </div>
    </div>
  )
}
