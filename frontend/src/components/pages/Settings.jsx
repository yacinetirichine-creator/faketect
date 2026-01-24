import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { User, Globe, CreditCard, ExternalLink, Loader2, ShieldCheck, Trash2, AlertTriangle, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import useAuthStore from '../../stores/authStore';
import api, { stripeApi } from '../../services/api';
import { languages, normalizeLanguage, persistLanguage } from '../../i18n';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const { user, updateUser, logout } = useAuthStore();
  const navigate = useNavigate();
  const currentLang = normalizeLanguage(i18n.resolvedLanguage || i18n.language);
  const [name, setName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [portalLoading, setPortalLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [planChangeLoading, setPlanChangeLoading] = useState(false);

  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.put('/auth/profile', { name });
      updateUser(data.user);
      toast.success(t('common.saved'));
    } catch { toast.error(t('common.errorGeneric')); }
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
      toast.error(error.response?.data?.error || t('common.errorGeneric'));
      setPortalLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== user?.email) {
      toast.error(t('settings.deleteModal.incorrectEmail'));
      return;
    }

    setDeleteLoading(true);
    try {
      await api.delete('/user/account', {
        data: { confirmation: deleteConfirmation }
      });

      toast.success(t('settings.deleteModal.accountDeleted'));
      logout();
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error || t('settings.deleteModal.deleteError'));
      setDeleteLoading(false);
    }
  };

  const handleChangePlan = async (newPlan) => {
    setPlanChangeLoading(true);
    try {
      const { data } = await api.post('/user/change-plan', { newPlan });
      
      if (data.requiresPayment) {
        navigate('/pricing');
        return;
      }

      if (data.success) {
        toast.success(data.message);
        updateUser({ plan: data.newPlan });
        setShowPlanModal(false);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || t('settings.planModal.planChangeError'));
    } finally {
      setPlanChangeLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-white">{t('dashboard.settings')}</h1>

      {user?.role === 'ADMIN' && (
        <div className="card bg-surface/50 border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-accent/10 rounded-lg flex items-center justify-center"><ShieldCheck className="text-accent" size={20} /></div>
            <h2 className="text-xl font-semibold text-white">{t('settings.sections.admin')}</h2>
          </div>

          <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
            <div>
              <p className="font-semibold text-white">{t('settings.admin.accessTitle')}</p>
              <p className="text-sm text-gray-400">{t('settings.admin.accessDesc')}</p>
            </div>
            <a href="/admin" className="btn-primary">{t('settings.admin.open')}</a>
          </div>
        </div>
      )}

      <div className="card bg-surface/50 border-white/10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center"><User className="text-primary" size={20} /></div>
          <h2 className="text-xl font-semibold text-white">{t('settings.sections.profile')}</h2>
        </div>

        <form onSubmit={handleSave} className="space-y-4 max-w-md">
          <div>
            <label className="label">{t('auth.email')}</label>
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
          <h2 className="text-xl font-semibold text-white">{t('settings.sections.language')}</h2>
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
          <h2 className="text-xl font-semibold text-white">{t('settings.sections.subscription')}</h2>
        </div>

        <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
          <div>
            <p className="font-semibold text-white">{t('settings.subscription.plan', { plan: user?.plan })}</p>
            <p className="text-sm text-gray-400">{user?.plan === 'FREE' ? t('settings.freeQuotaHint') : t('settings.activeSubscription')}</p>
          </div>
          <div className="flex gap-3">
            {user?.plan !== 'FREE' && (
              <>
                <button 
                  onClick={openCustomerPortal}
                  disabled={portalLoading}
                  className="btn-outline flex items-center gap-2"
                >
                  {portalLoading ? <Loader2 className="animate-spin" size={16} /> : <ExternalLink size={16} />}
                  {t('settings.subscription.manage')}
                </button>
                <button
                  onClick={() => setShowPlanModal(true)}
                  className="btn-outline flex items-center gap-2 text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/10"
                >
                  <ArrowDownCircle size={16} />
                  {t('settings.subscription.changePlan')}
                </button>
              </>
            )}
            {user?.plan === 'FREE' && (
              <a href="/pricing" className="btn-primary flex items-center gap-2">
                <ArrowUpCircle size={16} />
                {t('settings.subscription.upgrade')}
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Delete Account Section */}
      <div className="card bg-surface/50 border-red-500/20">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center">
            <AlertTriangle className="text-red-400" size={20} />
          </div>
          <h2 className="text-xl font-semibold text-white">{t('settings.dangerZone.title')}</h2>
        </div>

        <div className="flex items-center justify-between p-4 bg-red-500/5 rounded-xl border border-red-500/20">
          <div>
            <p className="font-semibold text-white">{t('settings.dangerZone.deleteAccount')}</p>
            <p className="text-sm text-gray-400">{t('settings.dangerZone.deleteWarning')}</p>
          </div>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-500/30 transition-colors flex items-center gap-2"
          >
            <Trash2 size={16} />
            {t('settings.dangerZone.deleteButton')}
          </button>
        </div>
      </div>

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-red-500/30 rounded-2xl p-6 max-w-md w-full">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="text-red-400" size={24} />
              </div>
              <h3 className="text-xl font-bold text-white">{t('settings.deleteModal.title')}</h3>
            </div>

            <div className="space-y-4 mb-6">
              <p className="text-gray-300">
                {t('settings.deleteModal.question')}
              </p>
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                <p className="text-sm text-red-300 font-medium mb-2">{t('settings.deleteModal.actionWill')}</p>
                <ul className="text-sm text-red-200 space-y-1 list-disc list-inside">
                  <li>{t('settings.deleteModal.deleteAnalyses')}</li>
                  <li>{t('settings.deleteModal.cancelSubscription')}</li>
                  <li>{t('settings.deleteModal.deleteData')}</li>
                  <li>{t('settings.deleteModal.irreversible')}</li>
                </ul>
              </div>

              <div>
                <label className="label text-white">
                  {t('settings.deleteModal.typeEmail')} <span className="text-red-400">({user?.email})</span> {t('settings.deleteModal.toConfirm')}:
                </label>
                <input
                  type="email"
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  placeholder={user?.email}
                  className="input"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
                className="flex-1 btn-outline"
                disabled={deleteLoading}
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={deleteConfirmation !== user?.email || deleteLoading}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {deleteLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={16} />
                    {t('settings.deleteModal.deleting')}
                  </>
                ) : (
                  <>
                    <Trash2 size={16} />
                    {t('settings.deleteModal.deleteForever')}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Change Modal */}
      {showPlanModal && user?.plan !== 'FREE' && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-white mb-4">{t('settings.planModal.title')}</h3>

            <div className="space-y-3 mb-6">
              {user?.plan === 'BUSINESS' && (
                <button
                  onClick={() => handleChangePlan('PRO')}
                  disabled={planChangeLoading}
                  className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">{t('settings.plans.pro')}</p>
                      <p className="text-sm text-gray-400">{t('settings.plans.proDesc')}</p>
                    </div>
                    <ArrowDownCircle className="text-yellow-400" size={20} />
                  </div>
                </button>
              )}

              {user?.plan === 'PRO' && (
                <button
                  onClick={() => handleChangePlan('BUSINESS')}
                  disabled={planChangeLoading}
                  className="w-full p-4 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-colors text-left"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">{t('settings.plans.business')}</p>
                      <p className="text-sm text-gray-400">{t('settings.plans.businessDesc')}</p>
                    </div>
                    <ArrowUpCircle className="text-green-400" size={20} />
                  </div>
                </button>
              )}

              <button
                onClick={() => handleChangePlan('FREE')}
                disabled={planChangeLoading}
                className="w-full p-4 bg-red-500/10 hover:bg-red-500/20 rounded-xl border border-red-500/30 transition-colors text-left"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white">{t('settings.plans.free')}</p>
                    <p className="text-sm text-red-300">{t('settings.plans.freeDesc')}</p>
                  </div>
                  <ArrowDownCircle className="text-red-400" size={20} />
                </div>
              </button>
            </div>

            <button
              onClick={() => setShowPlanModal(false)}
              className="w-full btn-outline"
              disabled={planChangeLoading}
            >
              {t('common.cancel')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
