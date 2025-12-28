import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Globe, CreditCard, ExternalLink, Loader2, ShieldCheck } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import api, { stripeApi } from '../../services/api';
import { languages, normalizeLanguage, persistLanguage } from '../../i18n';
import toast from 'react-hot-toast';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const currentLang = normalizeLanguage(i18n.resolvedLanguage || i18n.language);
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put('/auth/profile', { name });
      updateUser(data.user);
      toast.success('Enregistré');
    } catch { toast.error('Erreur'); }
    finally { setLoading(false); }
  };

  const changeLang = async (code) => {
    const lang = persistLanguage(code);
    i18n.changeLanguage(lang);
    try { await api.put('/auth/profile', { language: lang }); updateUser({ language: lang }); } catch {}
  };

  const openCustomerPortal = async () => {
    try {
      setPortalLoading(true);
      const { data } = await stripeApi.getCustomerPortal();
      window.location.href = data.url;
    } catch (error) {
      toast.error(error.response?.data?.error || 'Erreur');
      setPortalLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">{t('dashboard.settings')}</h1>

      {user?.role === 'ADMIN' && (
        <div className="card bg-surface/50 border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center"><ShieldCheck className="text-accent" size={20} /></div>
            <h2 className="text-xl font-semibold text-white">Admin</h2>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
            <div>
              <p className="font-semibold text-white">Accès administrateur</p>
              <p className="text-sm text-gray-400">Ouvrir le dashboard admin et gérer les utilisateurs</p>
            </div>
            <a href="/admin" className="btn-primary">Ouvrir</a>
          </div>
        </div>
      )}

      <div className="card bg-surface/50 border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center"><User className="text-primary" size={20} /></div>
          <h2 className="text-xl font-semibold text-white">Profil</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4 max-w-md">
          <div>
            <label className="label">Email</label>
            <input type="email" value={user?.email || ''} disabled className="input bg-white/5 cursor-not-allowed" />
          </div>
          <div>
            <label className="label">{t('auth.name')}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? t('common.loading') : t('common.save')}</button>
        </form>
      </div>

      <div className="card bg-surface/50 border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center"><Globe className="text-accent" size={20} /></div>
          <h2 className="text-xl font-semibold text-white">Langue</h2>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 max-w-2xl">
          {languages.map(l => (
            <button key={l.code} onClick={() => changeLang(l.code)} className={`flex items-center justify-center gap-2 p-3 rounded-xl transition-colors ${currentLang === l.code ? 'bg-primary/20 text-primary border-2 border-primary/50' : 'bg-white/5 hover:bg-white/10 text-gray-400 border border-white/10'}`}>
              <span className="text-xl">{l.flag}</span>
              <span className="font-medium">{l.code.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card bg-surface/50 border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-500/10 rounded-lg flex items-center justify-center"><CreditCard className="text-green-400" size={20} /></div>
          <h2 className="text-xl font-semibold text-white">Abonnement</h2>
        </div>

        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
          <div>
            <p className="font-semibold text-white">Plan {user?.plan}</p>
            <p className="text-sm text-gray-400">{user?.plan === 'FREE' ? '3 analyses/jour' : 'Abonnement actif'}</p>
          </div>
          <div className="flex gap-3">
            {user?.plan !== 'FREE' && (
              <button 
                onClick={openCustomerPortal}
                disabled={portalLoading}
                className="btn-outline flex items-center gap-2"
              >
                {portalLoading ? <Loader2 className="animate-spin" size={16} /> : <ExternalLink size={16} />}
                Gérer l'abonnement
              </button>
            )}
            <a href="/pricing" className="btn-primary">
              {user?.plan === 'FREE' ? 'Upgrade' : 'Changer'}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
