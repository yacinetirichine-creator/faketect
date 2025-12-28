import { useState, useEffect } from 'react';
import { Mail, Users, Send, Calendar, TrendingUp, Loader2, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import api from '../../../services/api';

export default function AdminNewsletter() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('subscribers');
  const [subscribers, setSubscribers] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCampaignModal, setShowCampaignModal] = useState(false);

  // Form campagne
  const [campaignForm, setCampaignForm] = useState({
    subject: '',
    content: '',
    language: 'fr',
    type: 'product_update'
  });
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      if (activeTab === 'subscribers') {
        const { data } = await api.get('/newsletter/subscribers');
        setSubscribers(data.subscribers);
        setStats(data.stats);
      } else {
        const { data } = await api.get('/newsletter/campaigns');
        setCampaigns(data.campaigns);
      }
    } catch (error) {
      console.error('Load newsletter data error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendCampaign = async (e) => {
    e.preventDefault();
    if (!campaignForm.subject || !campaignForm.content) return;

    setIsSending(true);
    try {
      await api.post('/newsletter/campaigns', campaignForm);
      alert('Campagne envoyée avec succès !');
      setShowCampaignModal(false);
      setCampaignForm({ subject: '', content: '', language: 'fr', type: 'product_update' });
      loadData();
    } catch (error) {
      console.error('Send campaign error:', error);
      alert('Erreur lors de l\'envoi');
    } finally {
      setIsSending(false);
    }
  };

  const campaignTypes = [
    { value: 'product_update', label: 'Nouveauté produit', icon: '✨' },
    { value: 'case_study', label: 'Cas d\'usage', icon: '📰' },
    { value: 'monthly_stats', label: 'Statistiques mensuelles', icon: '📊' },
    { value: 'promotional', label: 'Promotion', icon: '🎁' }
  ];

  const languages = [
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'pt', name: 'Português', flag: '🇵🇹' },
    { code: 'it', name: 'Italiano', flag: '🇮🇹' }
  ];

  return (
    <div className="min-h-screen bg-background text-white p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">📬 Gestion Newsletter</h1>
          <p className="text-gray-400">Gérez vos abonnés et campagnes email</p>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-surface border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <Users size={24} className="text-primary" />
                <span className="text-2xl font-bold">{stats.total}</span>
              </div>
              <p className="text-sm text-gray-400">Total abonnés</p>
            </div>
            <div className="bg-surface border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp size={24} className="text-green-400" />
                <span className="text-2xl font-bold text-green-400">{stats.active}</span>
              </div>
              <p className="text-sm text-gray-400">Actifs</p>
            </div>
            <div className="bg-surface border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <Mail size={24} className="text-accent" />
                <span className="text-2xl font-bold">{stats.inactive}</span>
              </div>
              <p className="text-sm text-gray-400">Désabonnés</p>
            </div>
            <div className="bg-surface border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <Send size={24} className="text-blue-400" />
                <span className="text-2xl font-bold">
                  {((stats.active / stats.total) * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-sm text-gray-400">Taux d'engagement</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setActiveTab('subscribers')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'subscribers'
                ? 'bg-primary text-white'
                : 'bg-surface text-gray-400 hover:text-white'
            }`}
          >
            <Users size={18} className="inline mr-2" />
            Abonnés
          </button>
          <button
            onClick={() => setActiveTab('campaigns')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              activeTab === 'campaigns'
                ? 'bg-primary text-white'
                : 'bg-surface text-gray-400 hover:text-white'
            }`}
          >
            <Send size={18} className="inline mr-2" />
            Campagnes
          </button>
          {activeTab === 'campaigns' && (
            <button
              onClick={() => setShowCampaignModal(true)}
              className="ml-auto px-6 py-3 bg-accent hover:bg-accent-600 text-white rounded-lg font-medium transition-colors"
            >
              <Plus size={18} className="inline mr-2" />
              Nouvelle campagne
            </button>
          )}
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <Loader2 className="animate-spin text-primary" size={48} />
          </div>
        ) : (
          <>
            {/* Subscribers Tab */}
            {activeTab === 'subscribers' && (
              <div className="bg-surface border border-white/10 rounded-xl overflow-hidden">
                <table className="w-full">
                  <thead className="bg-white/5">
                    <tr>
                      <th className="text-left px-6 py-4 text-sm font-semibold">Email</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold">Nom</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold">Langue</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold">Source</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold">Statut</th>
                      <th className="text-left px-6 py-4 text-sm font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscribers.map((sub) => (
                      <tr key={sub.id} className="border-t border-white/5 hover:bg-white/5">
                        <td className="px-6 py-4 text-sm">{sub.email}</td>
                        <td className="px-6 py-4 text-sm text-gray-400">{sub.name || '-'}</td>
                        <td className="px-6 py-4 text-sm">
                          {languages.find(l => l.code === sub.language)?.flag} {sub.language.toUpperCase()}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">{sub.source}</td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            sub.isActive 
                              ? 'bg-green-500/20 text-green-400' 
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {sub.isActive ? 'Actif' : 'Désabonné'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-400">
                          {new Date(sub.createdAt).toLocaleDateString('fr-FR')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Campaigns Tab */}
            {activeTab === 'campaigns' && (
              <div className="space-y-4">
                {campaigns.map((campaign) => (
                  <div key={campaign.id} className="bg-surface border border-white/10 rounded-xl p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold mb-1">{campaign.subject}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>
                            {campaignTypes.find(t => t.value === campaign.type)?.icon}{' '}
                            {campaignTypes.find(t => t.value === campaign.type)?.label}
                          </span>
                          <span>
                            {languages.find(l => l.code === campaign.language)?.flag}{' '}
                            {languages.find(l => l.code === campaign.language)?.name}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        {campaign.sentAt ? (
                          <div className="text-sm">
                            <p className="text-green-400 font-medium">✓ Envoyée</p>
                            <p className="text-gray-400">
                              {new Date(campaign.sentAt).toLocaleDateString('fr-FR')}
                            </p>
                            <p className="text-gray-500 text-xs mt-1">
                              {campaign.sentTo} destinataires
                            </p>
                          </div>
                        ) : (
                          <span className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">
                            Programmée
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-sm text-gray-400 line-clamp-2">
                      {campaign.content.replace(/<[^>]*>/g, '').substring(0, 150)}...
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal Nouvelle Campagne */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-surface border border-white/10 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-8">
            <h2 className="text-2xl font-bold mb-6">Nouvelle campagne newsletter</h2>
            
            <form onSubmit={handleSendCampaign} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">Langue</label>
                <select
                  value={campaignForm.language}
                  onChange={(e) => setCampaignForm({ ...campaignForm, language: e.target.value })}
                  className="w-full px-4 py-3 bg-background border border-white/10 rounded-lg text-white focus:border-primary"
                >
                  {languages.map(lang => (
                    <option key={lang.code} value={lang.code}>
                      {lang.flag} {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Type de campagne</label>
                <div className="grid grid-cols-2 gap-3">
                  {campaignTypes.map(type => (
                    <button
                      key={type.value}
                      type="button"
                      onClick={() => setCampaignForm({ ...campaignForm, type: type.value })}
                      className={`px-4 py-3 rounded-lg border text-left transition-colors ${
                        campaignForm.type === type.value
                          ? 'bg-primary/20 border-primary text-white'
                          : 'bg-background border-white/10 text-gray-400 hover:border-white/30'
                      }`}
                    >
                      <span className="text-lg mr-2">{type.icon}</span>
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Sujet</label>
                <input
                  type="text"
                  value={campaignForm.subject}
                  onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                  placeholder="Sujet de l'email..."
                  className="w-full px-4 py-3 bg-background border border-white/10 rounded-lg text-white focus:border-primary"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Contenu (HTML)</label>
                <textarea
                  value={campaignForm.content}
                  onChange={(e) => setCampaignForm({ ...campaignForm, content: e.target.value })}
                  placeholder="<h2>Titre</h2><p>Votre message...</p>"
                  className="w-full px-4 py-3 bg-background border border-white/10 rounded-lg text-white focus:border-primary font-mono text-sm"
                  rows={10}
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Le lien de désabonnement sera ajouté automatiquement
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowCampaignModal(false)}
                  className="flex-1 px-6 py-3 bg-white/5 hover:bg-white/10 rounded-lg font-medium transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="flex-1 px-6 py-3 bg-accent hover:bg-accent-600 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <>
                      <Loader2 className="animate-spin" size={18} />
                      Envoi en cours...
                    </>
                  ) : (
                    <>
                      <Send size={18} />
                      Envoyer maintenant
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
