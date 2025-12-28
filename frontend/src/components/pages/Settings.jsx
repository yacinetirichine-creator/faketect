import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Globe, CreditCard } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import api from '../../services/api';
import { languages } from '../../i18n';
import toast from 'react-hot-toast';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);

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
    i18n.changeLanguage(code);
    try { await api.put('/auth/profile', { language: code }); updateUser({ language: code }); } catch {}
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('dashboard.settings')}</h1>

      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center"><User className="text-primary-600" size={20} /></div>
          <h2 className="text-xl font-semibold">Profil</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4 max-w-md">
          <div>
            <label className="label">Email</label>
            <input type="email" value={user?.email || ''} disabled className="input bg-surface-100" />
          </div>
          <div>
            <label className="label">{t('auth.name')}</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input" />
          </div>
          <button type="submit" disabled={loading} className="btn-primary">{loading ? t('common.loading') : t('common.save')}</button>
        </form>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-accent-100 rounded-lg flex items-center justify-center"><Globe className="text-accent-600" size={20} /></div>
          <h2 className="text-xl font-semibold">Langue</h2>
        </div>

        <div className="grid grid-cols-3 md:grid-cols-5 gap-3 max-w-2xl">
          {languages.map(l => (
            <button key={l.code} onClick={() => changeLang(l.code)} className={`flex items-center justify-center gap-2 p-3 rounded-xl transition-colors ${i18n.language === l.code ? 'bg-primary-100 text-primary-700 ring-2 ring-primary-500' : 'bg-surface-100 hover:bg-surface-200'}`}>
              <span className="text-xl">{l.flag}</span>
              <span className="font-medium">{l.code.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center"><CreditCard className="text-green-600" size={20} /></div>
          <h2 className="text-xl font-semibold">Abonnement</h2>
        </div>

        <div className="flex items-center justify-between p-4 bg-surface-50 rounded-xl">
          <div>
            <p className="font-semibold">Plan {user?.plan}</p>
            <p className="text-sm text-surface-500">{user?.plan === 'FREE' ? '3 analyses/jour' : 'Voir tarifs'}</p>
          </div>
          <a href="/pricing" className="btn-outline">Changer</a>
        </div>
      </div>
    </div>
  );
}
