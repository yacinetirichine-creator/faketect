import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Users, FileText, TrendingUp, AlertCircle, DollarSign, 
  Activity, Shield, Database, Settings, Search, Download,
  Ban, CheckCircle, XCircle, Eye, Trash2, Edit, Filter, FileSpreadsheet,
  MessageCircle, Send, Clock, CheckCheck
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import useTranslation from '../hooks/useTranslation'
import { showToast } from '../components/Toast'
import { StatCardSkeleton, TableSkeleton } from '../components/Skeleton'
import { fadeInUp, staggerContainer, staggerItem } from '../utils/animations'
import { exportUsersToCSV } from '../utils/excelExport'
import { BarChart, LineChart, DonutChart, ActivityTimeline } from '../components/Charts'
import { API_BASE_URL } from '../config/api'

function fetchWithTimeout(url, options = {}, timeoutMs = 30000) {
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  return fetch(url, { ...options, signal: controller.signal }).finally(() => clearTimeout(id))
}

export default function AdminDashboard() {
  const { t } = useTranslation()
  const { user, getAccessToken, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('overview')
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalAnalyses: 0,
    todayAnalyses: 0,
    weekAnalyses: 0,
    revenue: 0,
    monthlyRevenue: 0,
    avgAccuracy: 0,
    usersByPlan: { free: 0, starter: 0, pro: 0, business: 0, enterprise: 0 },
    aiIssues: { total: 0, open: 0 }
  })
  const [users, setUsers] = useState([])
  const [analyses, setAnalyses] = useState([])
  const [conversations, setConversations] = useState([])
  const [selectedConversation, setSelectedConversation] = useState(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [chartData, setChartData] = useState(null)

  const handleExportUsers = () => {
    exportUsersToCSV(filteredUsers)
    showToast.success(t('admin.usersExported', 'Utilisateurs exportés en CSV'))
  }

  const generateTimelineData = (recent) => {
    // Générer 7 derniers jours
    const days = []
    for (let i = 6; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      days.push({
        label: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        value: Math.floor(Math.random() * (recent || 100)) // Mock pour démo
      })
    }
    return days
  }

  useEffect(() => {
    if (authLoading) return
    
    // Vérifier droits admin
    const configuredAdmins = String(import.meta.env.VITE_ADMIN_EMAILS || '')
      .split(',')
      .map(s => s.trim().toLowerCase())
      .filter(Boolean)
    const email = String(user?.email || '').toLowerCase()
    const isAdmin = configuredAdmins.length > 0
      ? configuredAdmins.includes(email)
      : email === 'contact@faketect.com'

    if (!isAdmin) {
      navigate('/app')
      return
    }
    loadDashboardData()
  }, [user, authLoading, navigate, activeTab]) // Recharger quand on change d'onglet

  const loadDashboardData = async () => {
    setLoading(true)
    try {
      const token = getAccessToken()

      if (!token) {
        showToast.info(t('home.loginRequired', 'Connexion requise'))
        navigate('/login', { state: { reason: 'auth_required', from: '/admin' } })
        return
      }
      
      // Charger stats depuis API
      const [statsResponse, usersResponse, activityResponse] = await Promise.all([
        fetchWithTimeout(`${API_BASE_URL}/api/admin/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetchWithTimeout(`${API_BASE_URL}/api/admin/users?limit=50`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetchWithTimeout(`${API_BASE_URL}/api/admin/activity?limit=20`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ])

      // Charger conversations si onglet support
      let conversationsData = []
      if (activeTab === 'support') {
        const conversationsResponse = await fetchWithTimeout(`${API_BASE_URL}/api/admin/support/conversations?limit=100`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
        if (conversationsResponse.ok) {
          const convData = await conversationsResponse.json()
          conversationsData = convData.conversations || []
        }
      }

      if (statsResponse.ok && usersResponse.ok && activityResponse.ok) {
        const statsData = await statsResponse.json()
        const usersData = await usersResponse.json()
        const activityData = await activityResponse.json()

        setStats({
          totalUsers: statsData.users || 0,
          activeUsers: (usersData.users || []).filter(u => u.status === 'active').length,
          totalAnalyses: statsData.analyses || 0,
          todayAnalyses: statsData.todayAnalyses || statsData.recentAnalyses || 0,
          weekAnalyses: statsData.recentAnalyses || 0,
          revenue: (statsData.revenue || 0) / 100,
          monthlyRevenue: (statsData.monthlyRevenue || 0) / 100,
          avgAccuracy: statsData.accuracy || 0,
          usersByPlan: statsData.usersByPlan || { free: 0, starter: 0, pro: 0, business: 0, enterprise: 0 },
          aiIssues: statsData.aiIssues || { total: 0, open: 0 }
        })
        
        setUsers((usersData.users || []).map(u => ({
          id: u.id,
          email: u.email,
          plan: u.plan || 'free',
          analyses: u.analyses || 0,
          status: u.status,
          created: u.created_at,
          lastActive: u.last_sign_in_at
        })))

        setAnalyses(activityData.activity || [])
        setConversations(conversationsData)
        
        // Préparer données graphiques avec les vraies données du backend
        const planData = statsData.usersByPlan || {};
        setChartData({
          usersByPlan: [
            { label: 'Free', value: planData.free || 0 },
            { label: 'Starter', value: planData.starter || 0 },
            { label: 'Pro', value: planData.pro || 0 },
            { label: 'Business', value: planData.business || 0 },
            { label: 'Enterprise', value: planData.enterprise || 0 }
          ].filter(d => d.value > 0),
          analysesTimeline: generateTimelineData(statsData.recentAnalyses)
        })
      } else {
        throw new Error('Erreur API')
      }
    } catch (err) {
      console.error('Erreur chargement dashboard:', err)
      showToast.error(t('admin.apiError', 'Erreur API Admin (vérifiez Render/Supabase)'))
      // Fallback sur mock data
      const mockStats = {
        totalUsers: 1247,
        activeUsers: 892,
        totalAnalyses: 45621,
        todayAnalyses: 234,
        weekAnalyses: 1580,
        revenue: 12450,
        monthlyRevenue: 3240,
        avgAccuracy: 92.4,
        usersByPlan: { free: 1100, starter: 80, pro: 50, business: 12, enterprise: 5 },
        aiIssues: { total: 45, open: 8 }
      }

      const mockUsers = [
        { id: 1, email: 'user@example.com', plan: 'pro', analyses: 145, status: 'active', created: '2025-11-15', lastActive: '2025-12-20' },
        { id: 2, email: 'test@test.com', plan: 'free', analyses: 23, status: 'active', created: '2025-12-01', lastActive: '2025-12-19' },
        { id: 3, email: 'enterprise@corp.com', plan: 'enterprise', analyses: 890, status: 'active', created: '2025-10-01', lastActive: '2025-12-25' }
      ]

      setStats(mockStats)
      setUsers(mockUsers)
      setChartData({
        usersByPlan: [
          { label: 'Free', value: 1100 },
          { label: 'Starter', value: 80 },
          { label: 'Pro', value: 50 },
          { label: 'Business', value: 12 },
          { label: 'Enterprise', value: 5 }
        ],
        analysesTimeline: generateTimelineData(1580)
      })
    } finally {
      setLoading(false)
    }
  }

  const handleBanUser = async (userId) => {
    if (!confirm('Bannir cet utilisateur ?')) return
    try {
      const token = getAccessToken()
      const user = users.find(u => u.id === userId)
      const banned = user.status !== 'banned'

      const response = await fetchWithTimeout(`${API_BASE_URL}/api/admin/users/${userId}/ban`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ banned })
      })

      if (response.ok) {
        showToast.success(banned ? t('admin.userBanned', 'Utilisateur banni') : t('admin.userUnbanned', 'Utilisateur débanni'))
        loadDashboardData() // Recharger la liste
      } else {
        throw new Error('Erreur API')
      }
    } catch (error) {
      console.error('Erreur ban utilisateur:', error)
      showToast.error(t('admin.banError', 'Erreur lors du bannissement'))
    }
  }

  const handleDeleteAnalysis = async (analysisId) => {
    if (!confirm('Supprimer cette analyse ?')) return
    try {
      const token = getAccessToken()
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/admin/analyses/${analysisId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        showToast.success(t('admin.analysisDeleted', 'Analyse supprimée'))
        loadDashboardData()
      } else {
        throw new Error('Erreur API')
      }
    } catch (error) {
      console.error('Erreur suppression analyse:', error)
      showToast.error(t('admin.deleteError', 'Erreur lors de la suppression'))
    }
  }

  const handleViewConversation = async (conversationId) => {
    try {
      const token = getAccessToken()
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/admin/support/conversations/${conversationId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedConversation(data.conversation)
      }
    } catch (error) {
      console.error('Erreur chargement conversation:', error)
      showToast.error('Erreur chargement conversation')
    }
  }

  const handleReplyConversation = async () => {
    if (!replyMessage.trim() || !selectedConversation) return

    try {
      const token = getAccessToken()
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/admin/support/conversations/${selectedConversation.id}/reply`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: replyMessage })
      })

      if (response.ok) {
        const data = await response.json()
        setSelectedConversation(data.conversation)
        setReplyMessage('')
        showToast.success('Réponse envoyée')
        loadDashboardData()
      }
    } catch (error) {
      console.error('Erreur envoi réponse:', error)
      showToast.error('Erreur envoi réponse')
    }
  }

  const handleUpdateConversationStatus = async (conversationId, status) => {
    try {
      const token = getAccessToken()
      const response = await fetchWithTimeout(`${API_BASE_URL}/api/admin/support/conversations/${conversationId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      })

      if (response.ok) {
        showToast.success('Statut mis à jour')
        loadDashboardData()
        if (selectedConversation?.id === conversationId) {
          setSelectedConversation(prev => ({ ...prev, status }))
        }
      }
    } catch (error) {
      console.error('Erreur mise à jour statut:', error)
      showToast.error('Erreur mise à jour statut')
    }
  }

  const filteredUsers = users.filter(u => 
    u.email.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterStatus === 'all' || u.status === filterStatus)
  )

  const filteredConversations = conversations.filter(c =>
    (c.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     c.sessionId?.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterStatus === 'all' || c.status === filterStatus)
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-dark-100 py-8 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="h-12 w-64 bg-gray-800 rounded animate-pulse mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
          <TableSkeleton rows={10} columns={6} />
        </div>
      </div>
    )
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-dark-100 py-8 px-4"
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div 
          variants={fadeInUp}
          initial="initial"
          animate="animate"
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Shield className="w-10 h-10 text-primary-400" />
            Dashboard Admin
          </h1>
          <p className="text-gray-400">Gestion centralisée de la plateforme FakeTect</p>
        </motion.div>

        {/* Stats Overview */}
        <motion.div 
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <motion.div 
            variants={staggerItem}
            whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(139, 92, 246, 0.2)' }}
            className="glass p-6 rounded-xl border border-primary-500/30"
          >
            <div className="flex items-center justify-between mb-4">
              <Users className="w-8 h-8 text-primary-400" />
              <span className="text-xs text-green-400">+12%</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.totalUsers.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Utilisateurs totaux</div>
            <div className="text-xs text-gray-500 mt-2">{stats.activeUsers} actifs</div>
          </motion.div>

          <motion.div 
            variants={staggerItem}
            whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(168, 85, 247, 0.2)' }}
            className="glass p-6 rounded-xl border border-purple-500/30"
          >
            <div className="flex items-center justify-between mb-4">
              <Activity className="w-8 h-8 text-purple-400" />
              <span className="text-xs text-green-400">+8%</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.totalAnalyses.toLocaleString()}</div>
            <div className="text-sm text-gray-400">Analyses totales</div>
            <div className="text-xs text-gray-500 mt-2">{stats.todayAnalyses} aujourd'hui</div>
          </motion.div>

          <motion.div 
            variants={staggerItem}
            whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(34, 197, 94, 0.2)' }}
            className="glass p-6 rounded-xl border border-green-500/30"
          >
            <div className="flex items-center justify-between mb-4">
              <DollarSign className="w-8 h-8 text-green-400" />
              <span className="text-xs text-green-400">+23%</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.revenue.toLocaleString()}€</div>
            <div className="text-sm text-gray-400">Revenu (30j)</div>
            <div className="text-xs text-gray-500 mt-2">MRR: {(stats.revenue * 0.7).toFixed(0)}€</div>
          </motion.div>

          <motion.div 
            variants={staggerItem}
            whileHover={{ y: -5, boxShadow: '0 20px 40px rgba(59, 130, 246, 0.2)' }}
            className="glass p-6 rounded-xl border border-blue-500/30"
          >
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="w-8 h-8 text-blue-400" />
              <span className="text-xs text-yellow-400">-0.3%</span>
            </div>
            <div className="text-3xl font-bold text-white mb-1">{stats.avgAccuracy}%</div>
            <div className="text-sm text-gray-400">Précision moyenne</div>
            <div className="text-xs text-gray-500 mt-2">Cible: 95%</div>
          </motion.div>
        </motion.div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto">
          {[
            { id: 'overview', label: 'Vue d\'ensemble', icon: Activity },
            { id: 'users', label: 'Utilisateurs', icon: Users },
            { id: 'analyses', label: 'Analyses', icon: FileText },
            { id: 'support', label: 'Support', icon: MessageCircle },
            { id: 'settings', label: 'Paramètres', icon: Settings }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 rounded-lg font-medium transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' 
                  : 'glass text-gray-300 hover:bg-white/10'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Charts */}
            {chartData && (
              <>
                <DonutChart
                  data={chartData.usersByPlan}
                  title="Répartition utilisateurs par plan"
                />
                
                <LineChart
                  data={chartData.analysesTimeline}
                  title="Analyses derniers 7 jours"
                  color="#8b5cf6"
                />
              </>
            )}
            
            {/* Activity Timeline */}
            {analyses && analyses.length > 0 && (
              <ActivityTimeline
                activities={analyses.slice(0, 10).map(a => ({
                  description: a.description,
                  timestamp: new Date(a.timestamp).toLocaleString('fr-FR'),
                  color: a.type === 'analysis' ? 'bg-primary-500' : a.type === 'user' ? 'bg-green-500' : 'bg-yellow-500'
                }))}
              />
            )}
            
            {/* Plans Distribution (legacy - peut être supprimé) */}
            <div className="glass p-6 rounded-xl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-primary-400" />
                Distribution des plans
              </h3>
              <div className="space-y-3">
                {stats.planDistribution && Object.entries(stats.planDistribution).map(([plan, count]) => (
                  <div key={plan} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-3 h-3 rounded-full ${
                        plan === 'free' ? 'bg-gray-500' : plan === 'pro' ? 'bg-primary-500' : 'bg-purple-500'
                      }`}></div>
                      <span className="capitalize font-medium">{plan}</span>
                    </div>
                    <span className="text-2xl font-bold">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Activity */}
            <div className="glass p-6 rounded-xl">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Activity className="w-5 h-5 text-primary-400" />
                Activité récente
              </h3>
              <div className="space-y-3">
                {stats.recentActivity.map(activity => (
                  <div key={activity.id} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div className="flex items-center gap-3">
                      {activity.status === 'success' ? 
                        <CheckCircle className="w-4 h-4 text-green-400" /> : 
                        <XCircle className="w-4 h-4 text-red-400" />
                      }
                      <div>
                        <div className="font-medium text-sm">{activity.action}</div>
                        <div className="text-xs text-gray-500">{activity.user}</div>
                      </div>
                    </div>
                    <span className="text-xs text-gray-400">{activity.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="glass p-6 rounded-xl">
            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Rechercher utilisateur..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input pl-10 w-full"
                />
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="input w-48"
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="banned">Bannis</option>
              </select>
              
              <button
                onClick={handleExportUsers}
                className="btn-secondary flex items-center gap-2 whitespace-nowrap"
              >
                <FileSpreadsheet className="w-4 h-4" />
                Export CSV
              </button>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left p-3 text-sm text-gray-400">Email</th>
                    <th className="text-left p-3 text-sm text-gray-400">Plan</th>
                    <th className="text-left p-3 text-sm text-gray-400">Analyses</th>
                    <th className="text-left p-3 text-sm text-gray-400">Statut</th>
                    <th className="text-left p-3 text-sm text-gray-400">Inscription</th>
                    <th className="text-left p-3 text-sm text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="border-b border-white/5 hover:bg-white/5 transition">
                      <td className="p-3">{user.email}</td>
                      <td className="p-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          user.plan === 'free' ? 'bg-gray-500/20 text-gray-300' :
                          user.plan === 'pro' ? 'bg-primary-500/20 text-primary-300' :
                          'bg-purple-500/20 text-purple-300'
                        }`}>
                          {user.plan}
                        </span>
                      </td>
                      <td className="p-3 font-semibold">{user.analyses}</td>
                      <td className="p-3">
                        <span className={`flex items-center gap-1 text-xs ${
                          user.status === 'active' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          <div className={`w-2 h-2 rounded-full ${
                            user.status === 'active' ? 'bg-green-400' : 'bg-red-400'
                          }`}></div>
                          {user.status}
                        </span>
                      </td>
                      <td className="p-3 text-sm text-gray-400">{user.created}</td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <button className="p-2 rounded-lg hover:bg-white/10 transition" title="Voir détails">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button className="p-2 rounded-lg hover:bg-white/10 transition" title="Modifier">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => handleBanUser(user.id)}
                            className="p-2 rounded-lg hover:bg-red-500/20 transition text-red-400" 
                            title="Bannir"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'support' && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Liste conversations */}
            <div className="lg:col-span-1 glass p-6 rounded-xl max-h-[calc(100vh-300px)] overflow-y-auto">
              <div className="mb-4">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-primary-400" />
                  Conversations ({filteredConversations.length})
                </h3>
                
                <div className="flex gap-2 mb-4">
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value)}
                    className="input flex-1"
                  >
                    <option value="all">Tous statuts</option>
                    <option value="open">Ouvertes</option>
                    <option value="pending">En attente</option>
                    <option value="resolved">Résolues</option>
                  </select>
                </div>

                <div className="relative mb-4">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="input pl-10 w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                {filteredConversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => handleViewConversation(conv.id)}
                    className={`w-full text-left p-3 rounded-lg transition ${
                      selectedConversation?.id === conv.id
                        ? 'bg-primary-500/20 border border-primary-500/50'
                        : 'bg-white/5 hover:bg-white/10 border border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-1">
                      <span className="font-medium text-sm truncate">{conv.userEmail || 'Anonyme'}</span>
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        conv.status === 'open' ? 'bg-green-500/20 text-green-400' :
                        conv.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                        'bg-gray-500/20 text-gray-400'
                      }`}>
                        {conv.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 truncate mb-1">{conv.lastMessage}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <MessageCircle className="w-3 h-3" />
                      {conv.messageCount} messages
                      <span className="ml-auto">{new Date(conv.lastMessageAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </button>
                ))}

                {filteredConversations.length === 0 && (
                  <div className="text-center text-gray-400 py-8">
                    Aucune conversation
                  </div>
                )}
              </div>
            </div>

            {/* Détails conversation */}
            <div className="lg:col-span-2 glass p-6 rounded-xl">
              {selectedConversation ? (
                <div className="flex flex-col h-[calc(100vh-300px)]">
                  {/* Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
                    <div>
                      <h3 className="text-xl font-bold">{selectedConversation.user_email || 'Utilisateur anonyme'}</h3>
                      <p className="text-sm text-gray-400">Session: {selectedConversation.session_id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={selectedConversation.status}
                        onChange={(e) => handleUpdateConversationStatus(selectedConversation.id, e.target.value)}
                        className="input text-sm"
                      >
                        <option value="open">Ouverte</option>
                        <option value="pending">En attente</option>
                        <option value="resolved">Résolue</option>
                      </select>
                      <button
                        onClick={() => setSelectedConversation(null)}
                        className="p-2 hover:bg-white/10 rounded-lg transition"
                      >
                        <XCircle className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                    {selectedConversation.messages?.map((msg, idx) => (
                      <div
                        key={idx}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                            msg.role === 'user'
                              ? 'bg-primary-500 text-white'
                              : msg.role === 'admin'
                              ? 'bg-purple-500 text-white'
                              : 'bg-gray-800 text-gray-100'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold">
                              {msg.role === 'admin' ? `Admin (${msg.adminEmail})` : msg.role === 'assistant' ? 'IA' : 'User'}
                            </span>
                            <span className="text-xs opacity-70">
                              {new Date(msg.timestamp).toLocaleString('fr-FR')}
                            </span>
                          </div>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Reply box */}
                  <div className="pt-4 border-t border-white/10">
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={replyMessage}
                        onChange={(e) => setReplyMessage(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleReplyConversation()}
                        placeholder="Répondre à l'utilisateur..."
                        className="flex-1 input"
                      />
                      <button
                        onClick={handleReplyConversation}
                        disabled={!replyMessage.trim()}
                        className="btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        <Send className="w-4 h-4" />
                        Envoyer
                      </button>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      💡 Votre réponse sera visible par l'utilisateur lors de sa prochaine session
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-400">
                  <MessageCircle className="w-16 h-16 mb-4 opacity-50" />
                  <p>Sélectionnez une conversation pour voir les détails</p>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'analyses' && (
          <div className="glass p-6 rounded-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold">Analyses récentes</h3>
              <button className="btn-primary flex items-center gap-2">
                <Download className="w-4 h-4" />
                Exporter CSV
              </button>
            </div>
            <div className="text-gray-400 text-center py-12">
              Tableau des analyses à implémenter
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="glass p-6 rounded-xl">
            <h3 className="text-xl font-bold mb-6">Paramètres système</h3>
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-white/5">
                <label className="flex items-center justify-between">
                  <span className="font-medium">Maintenance mode</span>
                  <input type="checkbox" className="toggle" />
                </label>
              </div>
              <div className="p-4 rounded-lg bg-white/5">
                <label className="flex items-center justify-between">
                  <span className="font-medium">Inscriptions ouvertes</span>
                  <input type="checkbox" defaultChecked className="toggle" />
                </label>
              </div>
              <div className="p-4 rounded-lg bg-white/5">
                <label className="block mb-2 font-medium">Limite quotidienne invités</label>
                <input type="number" defaultValue="3" className="input w-32" />
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}
