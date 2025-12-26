import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { History, Bot, User, AlertTriangle, Clock, FileText, Download, FileSpreadsheet, GitCompare } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { getHistory, getStats, getBatches, generateReport, getReportDownloadUrl, setAuthToken } from '../utils/api'
import useTranslation from '../hooks/useTranslation'
import { showToast } from '../components/Toast'
import { TableSkeleton, StatCardSkeleton } from '../components/Skeleton'
import { fadeInUp, staggerContainer, staggerItem } from '../utils/animations'
import { exportAnalysesToCSV, exportStatsToCSV } from '../utils/excelExport'
import ImageComparison from '../components/ImageComparison'

export default function HistoryPage() {
  const { t } = useTranslation()
  const { isAuthenticated, getAccessToken, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [history, setHistory] = useState([])
  const [batches, setBatches] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('all')
  const [compareImages, setCompareImages] = useState(null)
  const [selectedForCompare, setSelectedForCompare] = useState([])

  useEffect(() => {
    if (authLoading) return
    if (!isAuthenticated) { navigate('/auth'); return }
    loadData()
  }, [isAuthenticated, authLoading, navigate])

  const loadData = async () => {
    try {
      setAuthToken(getAccessToken())
      const [h, s, b] = await Promise.all([getHistory(), getStats(), getBatches()])
      setHistory(h)
      setStats(s)
      setBatches(b)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const handleReport = async (batchId) => {
    try {
      showToast.info(t('history.generatingReport', 'Génération du rapport...'))
      const res = await generateReport(batchId)
      window.open(getReportDownloadUrl(res.report.filename), '_blank')
      showToast.success(t('history.reportReady', 'Rapport prêt !'))
    } catch (err) {
      showToast.error(t('history.reportError', 'Erreur génération rapport'))
    }
  }

  const getIcon = (level, isAi) => {
    if (level === 'high' && isAi) return <Bot className="w-4 h-4 text-red-400" />
    if (level === 'high' && !isAi) return <User className="w-4 h-4 text-green-400" />
    return <AlertTriangle className="w-4 h-4 text-yellow-400" />
  }

  const handleCompareImages = (img1, img2) => {
    setCompareImages({
      image1: { url: img1.url, name: img1.filename || 'Image 1' },
      image2: { url: img2.url, name: img2.filename || 'Image 2' }
    })
  }

  const toggleSelectForCompare = (item) => {
    if (selectedForCompare.find(s => s.id === item.id)) {
      setSelectedForCompare(selectedForCompare.filter(s => s.id !== item.id))
    } else {
      if (selectedForCompare.length >= 2) {
        showToast.warning(t('history.maxCompare', 'Maximum 2 images pour comparaison'))
        return
      }
      setSelectedForCompare([...selectedForCompare, item])
    }
  }

  const handleExportCSV = () => {
    exportAnalysesToCSV(history)
    showToast.success(t('history.exported', 'Historique exporté en CSV'))
  }

  const handleExportStats = () => {
    exportStatsToCSV(stats)
    showToast.success(t('history.statsExported', 'Statistiques exportées'))
  }

  if (loading) {
    return (
      <div className="py-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <div className="h-10 w-48 bg-gray-800 rounded animate-pulse mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </div>
        </div>
        <TableSkeleton rows={8} columns={5} />
      </div>
    )
  }

  return (
    <div className="py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <History className="w-8 h-8 text-primary-400" /> 
          {t('history.title', 'Historique')}
        </h1>
        
        <div className="flex gap-2">
          {selectedForCompare.length === 2 && (
            <button
              onClick={() => handleCompareImages(selectedForCompare[0], selectedForCompare[1])}
              className="btn-primary flex items-center gap-2"
            >
              <GitCompare className="w-4 h-4" />
              Comparer
            </button>
          )}
          
          <button
            onClick={handleExportStats}
            className="btn-secondary flex items-center gap-2"
            disabled={!stats}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Stats CSV
          </button>
          
          <button
            onClick={handleExportCSV}
            className="btn-secondary flex items-center gap-2"
            disabled={history.length === 0}
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="glass p-4"><div className="text-3xl font-bold text-primary-400">{stats.total_analyses}</div><div className="text-sm text-gray-400">Analyses</div></div>
          <div className="glass p-4"><div className="text-3xl font-bold text-red-400">{stats.ai_detected}</div><div className="text-sm text-gray-400">IA détectées</div></div>
          <div className="glass p-4"><div className="text-3xl font-bold text-accent-400">{stats.average_score}%</div><div className="text-sm text-gray-400">Score moyen</div></div>
          <div className="glass p-4"><div className="text-3xl font-bold text-green-400">{stats.remaining_today}/{stats.daily_limit}</div><div className="text-sm text-gray-400">Quota jour</div></div>
          <div className="glass p-4"><div className="text-xl font-bold text-yellow-400 capitalize">{stats.plan}</div><div className="text-sm text-gray-400">Plan actuel</div></div>
        </div>
      )}

      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('all')} className={`px-4 py-2 rounded-lg text-sm ${tab === 'all' ? 'bg-primary-500 text-white' : 'glass'}`}>{t('history.filter.all', 'Toutes')}</button>
        <button onClick={() => setTab('batches')} className={`px-4 py-2 rounded-lg text-sm ${tab === 'batches' ? 'bg-primary-500 text-white' : 'glass'}`}>{t('history.filter.batches', 'Lots & Documents')}</button>
      </div>

      {tab === 'batches' ? (
        batches.length === 0 ? <div className="text-center py-16 glass"><p className="text-gray-400">Aucun lot</p></div> : (
          <div className="space-y-3">
            {batches.map(b => (
              <div key={b.id} className="glass p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <FileText className="w-6 h-6 text-accent-400" />
                  <div>
                    <div className="font-medium">{b.name || b.original_filename || 'Lot'}</div>
                    <div className="text-sm text-gray-400">{b.total_images} images • {b.ai_detected_count} IA • {new Date(b.created_at).toLocaleDateString('fr-FR')}</div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className={`text-xl font-bold ${(b.average_score || 0) > 0.5 ? 'text-red-400' : 'text-green-400'}`}>
                    {Math.round((b.average_score || 0) * 100)}%
                  </div>
                  <button onClick={() => handleReport(b.id)} className="p-2 rounded-lg bg-white/5 hover:bg-white/10">
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        history.length === 0 ? <div className="text-center py-16 glass"><p className="text-gray-400">Aucune analyse</p></div> : (
          <div className="glass overflow-hidden">
            <table className="w-full">
              <thead><tr className="border-b border-white/5">
                <th className="text-left p-4 text-sm text-gray-400">
                  {selectedForCompare.length > 0 && (
                    <span className="text-primary-400">({selectedForCompare.length}/2)</span>
                  )}
                </th>
                <th className="text-left p-4 text-sm text-gray-400">Fichier</th>
                <th className="text-left p-4 text-sm text-gray-400">Type</th>
                <th className="text-left p-4 text-sm text-gray-400">Score cumulé</th>
                <th className="text-left p-4 text-sm text-gray-400 hidden sm:table-cell">Date</th>
              </tr></thead>
              <tbody>
                {history.map(item => {
                  const isSelected = selectedForCompare.find(s => s.id === item.id)
                  const canSelect = item.source_type === 'image' || item.type === 'image'
                  
                  return (
                    <tr key={item.id} className={`border-b border-white/5 hover:bg-white/5 transition-colors ${isSelected ? 'bg-primary-500/10' : ''}`}>
                      <td className="p-4">
                        {canSelect && (
                          <input
                            type="checkbox"
                            checked={!!isSelected}
                            onChange={() => toggleSelectForCompare({ id: item.id, url: item.file_url, filename: item.filename })}
                            className="w-4 h-4 rounded border-gray-600 bg-gray-800 checked:bg-primary-500"
                          />
                        )}
                      </td>
                      <td className="p-4 flex items-center gap-3">
                        {getIcon(item.confidence_level, item.is_ai_generated)}
                        <span className="truncate max-w-[200px]">{item.filename}</span>
                        {item.exif_has_ai_markers && <span className="text-xs text-red-400">EXIF⚠️</span>}
                      </td>
                      <td className="p-4"><span className="px-2 py-1 rounded text-xs bg-white/5">{item.source_type || 'image'}</span></td>
                      <td className="p-4"><span className={`font-mono font-bold ${item.combined_score > 0.7 ? 'text-red-400' : item.combined_score > 0.4 ? 'text-yellow-400' : 'text-green-400'}`}>{Math.round(item.combined_score * 100)}%</span></td>
                      <td className="p-4 hidden sm:table-cell text-sm text-gray-500"><Clock className="w-3 h-3 inline mr-1" />{new Date(item.created_at).toLocaleDateString('fr-FR')}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )
      )}
      
      {/* Image Comparison Modal */}
      <AnimatePresence>
        {compareImages && (
          <ImageComparison
            image1={compareImages.image1}
            image2={compareImages.image2}
            onClose={() => setCompareImages(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
