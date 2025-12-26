import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  BarChart3, Clock, FileText, Download, Eye, Trash2, 
  CreditCard, TrendingUp, Shield, AlertTriangle, CheckCircle,
  Bot, User, Filter, ChevronLeft, ChevronRight, Zap,
  Calendar, Target, Activity, Receipt, ArrowUpRight
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import useTranslation from '../hooks/useTranslation'
import { showToast } from '../components/Toast'
import { API_BASE_URL } from '../config/api'
import { LineChart, DonutChart } from '../components/Charts'

export default function ClientDashboard() {
  const { t } = useTranslation()
  const { user, getAccessToken, isAuthenticated } = useAuth()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [dashboard, setDashboard] = useState({
    totalAnalyses: 0,
    aiDetected: 0,
    realImages: 0,
    avgScore: 0,
    plan: 'free',
    quota: { used: 0, limit: 3, remaining: 3 },
    recentAnalyses: []
  })
  const [analyses, setAnalyses] = useState([])
  const [pagination, setPagination] = useState({ page: 1, total: 0, totalPages: 0 })
  const [filter, setFilter] = useState('all')
  const [stats, setStats] = useState(null)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth', { state: { from: '/dashboard' } })
      return
    }
    loadDashboard()
  }, [isAuthenticated, navigate])

  useEffect(() => {
    if (activeTab === 'analyses') {
      loadAnalyses()
    } else if (activeTab === 'stats') {
      loadStats()
    }
  }, [activeTab, pagination.page, filter])

  const fetchWithAuth = async (url, timeoutMs = 30000) => {
    const token = getAccessToken()
    const controller = new AbortController()
    const id = setTimeout(() => controller.abort(), timeoutMs)
    
    try {
      const response = await fetch(`${API_BASE_URL}${url}`, {
        headers: { 'Authorization': `Bearer ${token}` },
        signal: controller.signal
      })
      clearTimeout(id)
      if (!response.ok) throw new Error('Erreur API')
      return response.json()
    } catch (err) {
      clearTimeout(id)
      throw err
    }
  }

  const loadDashboard = async () => {
    setLoading(true)
    try {
      const data = await fetchWithAuth('/api/user/dashboard')
      setDashboard(data.data || dashboard)
    } catch (error) {
      console.error('Erreur chargement dashboard:', error)
      showToast.error('API indisponible - Données limitées affichées')
      // Garder les valeurs par défaut déjà initialisées
    } finally {
      setLoading(false)
    }
  }

  const loadAnalyses = async () => {
    try {
      const data = await fetchWithAuth(`/api/user/analyses?page=${pagination.page}&limit=20&filter=${filter}`)
      setAnalyses(data.data.analyses || [])
      setPagination(data.data.pagination || { page: 1, total: 0, totalPages: 0 })
    } catch (error) {
      console.error('Erreur chargement analyses:', error)
      setAnalyses([])
    }
  }

  const loadStats = async () => {
    try {
      const data = await fetchWithAuth('/api/user/stats?days=30')
      setStats(data.data || null)
    } catch (error) {
      console.error('Erreur chargement stats:', error)
      setStats(null)
    }
  }

  const handleDeleteAnalysis = async (id) => {
    if (!confirm('Supprimer cette analyse ?')) return
    try {
      const token = getAccessToken()
      await fetch(`${API_BASE_URL}/api/user/analyses/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      showToast.success('Analyse supprimée')
      loadAnalyses()
      loadDashboard()
    } catch (error) {
      showToast.error('Erreur lors de la suppression')
    }
  }

  const getScoreColor = (score) => {
    if (score >= 0.85) return 'text-red-400'
    if (score >= 0.6) return 'text-yellow-400'
    return 'text-green-400'
  }

  const getScoreBg = (score) => {
    if (score >= 0.85) return 'bg-red-500/20'
    if (score >= 0.6) return 'bg-yellow-500/20'
    return 'bg-green-500/20'
  }

  const getPlanBadge = (plan) => {
    const badges = {
      free: { bg: 'bg-gray-500/20', text: 'text-gray-400', label: 'Free' },
      starter: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Starter' },
      pro: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Pro' },
      business: { bg: 'bg-primary-500/20', text: 'text-primary-400', label: 'Business' },
      enterprise: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', label: 'Enterprise' }
    }
    return badges[plan] || badges.free
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
      </div>
    )
  }

  const planBadge = getPlanBadge(dashboard?.profile?.plan)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen py-8 px-4 md:px-8"
    >
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold mb-2">
              {t('dashboard.welcome', 'Bonjour')}, {dashboard?.profile?.fullName || dashboard?.profile?.email?.split('@')[0]} 👋
            </h1>
            <div className="flex items-center gap-3">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${planBadge.bg} ${planBadge.text}`}>
                Plan {planBadge.label}
              </span>
              <span className="text-gray-400 text-sm">
                Membre depuis {new Date(dashboard?.profile?.createdAt).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
              </span>
            </div>
          </div>
          <div className="flex gap-3">
            <Link to="/app" className="btn-primary flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Nouvelle analyse
            </Link>
            {dashboard?.profile?.plan === 'free' && (
              <Link to="/pricing" className="btn-secondary flex items-center gap-2">
                <ArrowUpRight className="w-4 h-4" />
                Passer à Pro
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Quota Card */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="glass p-6 rounded-xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Target className="w-5 h-5 text-primary-400" />
              Quota du jour
            </h3>
            <span className="text-sm text-gray-400">
              Réinitialisation à minuit
            </span>
          </div>
          <div className="flex items-end gap-4">
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-400">Utilisé</span>
                <span className="font-medium">{dashboard?.quota?.used || 0} / {dashboard?.quota?.limit || 3}</span>
              </div>
              <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-primary-500 to-primary-400 transition-all duration-500"
                  style={{ width: `${((dashboard?.quota?.used || 0) / (dashboard?.quota?.limit || 3)) * 100}%` }}
                />
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary-400">{dashboard?.quota?.remaining || 0}</div>
              <div className="text-sm text-gray-400">restantes</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: BarChart3 },
            { id: 'analyses', label: 'Historique', icon: Clock },
            { id: 'invoices', label: 'Factures', icon: Receipt },
            { id: 'stats', label: 'Statistiques', icon: TrendingUp }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-primary-500 text-white'
                  : 'bg-white/5 text-gray-400 hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="glass p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                    <Activity className="w-5 h-5 text-primary-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold">{dashboard?.stats?.totalAnalyses || 0}</div>
                <div className="text-sm text-gray-400">Analyses totales</div>
              </div>
              
              <div className="glass p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-red-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold text-red-400">{dashboard?.stats?.aiDetected || 0}</div>
                <div className="text-sm text-gray-400">IA détectées</div>
              </div>
              
              <div className="glass p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/20 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-yellow-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold">{dashboard?.stats?.avgScore || 0}%</div>
                <div className="text-sm text-gray-400">Score moyen</div>
              </div>
              
              <div className="glass p-6 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-green-400" />
                  </div>
                </div>
                <div className="text-2xl font-bold">{dashboard?.stats?.thisMonth || 0}</div>
                <div className="text-sm text-gray-400">Ce mois</div>
              </div>
            </div>

            {/* Recent Analyses */}
            <div className="glass p-6 rounded-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Analyses récentes</h3>
                <button 
                  onClick={() => setActiveTab('analyses')}
                  className="text-primary-400 text-sm hover:underline"
                >
                  Voir tout →
                </button>
              </div>
              
              {dashboard?.recentAnalyses?.length > 0 ? (
                <div className="space-y-3">
                  {dashboard.recentAnalyses.map(analysis => (
                    <div 
                      key={analysis.id}
                      className={`flex items-center justify-between p-4 rounded-lg ${getScoreBg(analysis.score)}`}
                    >
                      <div className="flex items-center gap-3">
                        {analysis.isAI ? (
                          <Bot className="w-5 h-5 text-red-400" />
                        ) : (
                          <User className="w-5 h-5 text-green-400" />
                        )}
                        <div>
                          <div className="font-medium truncate max-w-[200px]">{analysis.filename}</div>
                          <div className="text-xs text-gray-400">
                            {new Date(analysis.createdAt).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      </div>
                      <div className={`text-xl font-bold ${getScoreColor(analysis.score)}`}>
                        {Math.round((analysis.score || 0) * 100)}%
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <Activity className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>Aucune analyse récente</p>
                  <Link to="/app" className="text-primary-400 hover:underline mt-2 inline-block">
                    Lancer votre première analyse →
                  </Link>
                </div>
              )}
            </div>

            {/* Recent Invoices */}
            {dashboard?.invoices?.length > 0 && (
              <div className="glass p-6 rounded-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Dernières factures</h3>
                  <button 
                    onClick={() => setActiveTab('invoices')}
                    className="text-primary-400 text-sm hover:underline"
                  >
                    Voir tout →
                  </button>
                </div>
                <div className="space-y-2">
                  {dashboard.invoices.slice(0, 3).map(invoice => (
                    <div key={invoice.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div className="flex items-center gap-3">
                        <Receipt className="w-4 h-4 text-gray-400" />
                        <span className="font-mono text-sm">{invoice.number}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-medium">{invoice.amount?.toFixed(2)}€</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          invoice.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {invoice.status === 'paid' ? 'Payée' : 'En attente'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Analyses Tab */}
        {activeTab === 'analyses' && (
          <div className="glass p-6 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold">Historique des analyses</h3>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select 
                  value={filter}
                  onChange={(e) => {
                    setFilter(e.target.value)
                    setPagination(p => ({ ...p, page: 1 }))
                  }}
                  className="input text-sm"
                >
                  <option value="all">Toutes</option>
                  <option value="ai">IA détectée</option>
                  <option value="authentic">Authentiques</option>
                </select>
              </div>
            </div>

            {analyses.length > 0 ? (
              <>
                <div className="space-y-2 mb-6">
                  {analyses.map(analysis => (
                    <div 
                      key={analysis.id}
                      className={`flex items-center justify-between p-4 rounded-lg ${getScoreBg(analysis.score)} hover:bg-white/10 transition`}
                    >
                      <div className="flex items-center gap-4">
                        {analysis.isAI ? (
                          <Bot className="w-5 h-5 text-red-400" />
                        ) : (
                          <User className="w-5 h-5 text-green-400" />
                        )}
                        <div>
                          <div className="font-medium">{analysis.filename}</div>
                          <div className="text-xs text-gray-400">
                            {new Date(analysis.createdAt).toLocaleString('fr-FR')} • {analysis.sourceType}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className={`text-lg font-bold ${getScoreColor(analysis.score)}`}>
                            {Math.round((analysis.score || 0) * 100)}%
                          </div>
                          <div className="text-xs text-gray-400 capitalize">{analysis.confidence}</div>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleDeleteAnalysis(analysis.id)}
                            className="p-2 hover:bg-white/10 rounded-lg transition text-red-400"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">
                    Page {pagination.page} sur {pagination.totalPages} ({pagination.total} résultats)
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
                      disabled={pagination.page <= 1}
                      className="p-2 rounded-lg bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
                      disabled={pagination.page >= pagination.totalPages}
                      className="p-2 rounded-lg bg-white/5 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-white/10 transition"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucune analyse trouvée</p>
              </div>
            )}
          </div>
        )}

        {/* Invoices Tab */}
        {activeTab === 'invoices' && (
          <div className="glass p-6 rounded-xl">
            <h3 className="text-lg font-semibold mb-6">Mes factures</h3>
            
            {dashboard?.invoices?.length > 0 ? (
              <div className="space-y-3">
                {dashboard.invoices.map(invoice => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 rounded-lg bg-white/5 hover:bg-white/10 transition">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-lg bg-primary-500/20 flex items-center justify-center">
                        <Receipt className="w-5 h-5 text-primary-400" />
                      </div>
                      <div>
                        <div className="font-mono font-medium">{invoice.number}</div>
                        <div className="text-sm text-gray-400">
                          {new Date(invoice.date).toLocaleDateString('fr-FR', { 
                            day: 'numeric', 
                            month: 'long', 
                            year: 'numeric' 
                          })}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-lg font-bold">{invoice.amount?.toFixed(2)}€</div>
                        <span className={`text-xs px-2 py-1 rounded ${
                          invoice.status === 'paid' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'
                        }`}>
                          {invoice.status === 'paid' ? 'Payée' : 'En attente'}
                        </span>
                      </div>
                      {invoice.pdfUrl && (
                        <a 
                          href={invoice.pdfUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-white/10 rounded-lg transition"
                        >
                          <Download className="w-5 h-5 text-primary-400" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-400">
                <Receipt className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Aucune facture</p>
                <p className="text-sm mt-2">Vos factures apparaîtront ici après votre premier achat</p>
              </div>
            )}
          </div>
        )}

        {/* Stats Tab */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {stats ? (
              <>
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4">
                  <div className="glass p-6 rounded-xl text-center">
                    <div className="text-3xl font-bold text-primary-400">{stats.summary.total}</div>
                    <div className="text-sm text-gray-400">Analyses (30j)</div>
                  </div>
                  <div className="glass p-6 rounded-xl text-center">
                    <div className="text-3xl font-bold text-red-400">{stats.summary.aiDetected}</div>
                    <div className="text-sm text-gray-400">IA détectées</div>
                  </div>
                  <div className="glass p-6 rounded-xl text-center">
                    <div className="text-3xl font-bold text-yellow-400">{stats.summary.avgScore}%</div>
                    <div className="text-sm text-gray-400">Score moyen</div>
                  </div>
                </div>

                {/* Timeline Chart */}
                <div className="glass p-6 rounded-xl">
                  <h3 className="text-lg font-semibold mb-4">Activité (30 derniers jours)</h3>
                  <div className="h-64">
                    <LineChart 
                      data={stats.timeline.map(d => ({ 
                        label: new Date(d.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
                        value: d.count 
                      }))}
                    />
                  </div>
                </div>

                {/* Confidence Distribution */}
                <div className="glass p-6 rounded-xl">
                  <h3 className="text-lg font-semibold mb-4">Répartition par niveau de confiance</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-400">{stats.byConfidence.high}</div>
                      <div className="text-sm text-gray-400">Confiance haute</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-yellow-400">{stats.byConfidence.medium}</div>
                      <div className="text-sm text-gray-400">Confiance moyenne</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-400">{stats.byConfidence.low}</div>
                      <div className="text-sm text-gray-400">Confiance basse</div>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="glass p-12 rounded-xl text-center text-gray-400">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Chargement des statistiques...</p>
              </div>
            )}
          </div>
        )}
      </div>
    </motion.div>
  )
}
