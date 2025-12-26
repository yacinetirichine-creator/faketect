import { useState, useCallback, useEffect } from 'react'
import { useDropzone } from 'react-dropzone'
import { motion, AnimatePresence } from 'framer-motion'
import { Upload, FileText, Link2, ImagePlus, Loader2, Bot, User, AlertTriangle, Camera, FileSearch, Download, Film, Shield, FileCheck, Scale } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { analyzeImage, analyzeUrl, analyzeBatchImages, analyzeDocument, analyzeVideo, generateReport, getReportDownloadUrl, setAuthToken, getQuota, invalidateHistoryCache } from '../utils/api'
import useTranslation from '../hooks/useTranslation'
import { showToast } from '../components/Toast'
import { fadeInUp, scaleIn, staggerContainer, staggerItem } from '../utils/animations'

export default function HomePage() {
  const { t } = useTranslation()
  
  const TABS = [
    { id: 'image', label: t('home.tabs.image', 'Image'), icon: Camera },
    { id: 'video', label: t('home.tabs.video', 'Vidéo'), icon: Film },
    { id: 'batch', label: t('home.tabs.batch', 'Multiple'), icon: ImagePlus },
    { id: 'document', label: t('home.tabs.document', 'Document'), icon: FileText },
    { id: 'url', label: t('home.tabs.url', 'URL'), icon: Link2 },
  ]
  const { isAuthenticated, getAccessToken } = useAuth()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('image')
  const [files, setFiles] = useState([])
  const [url, setUrl] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [guestQuota, setGuestQuota] = useState(null)
  const [uploadProgress, setUploadProgress] = useState(0)

  useEffect(() => {
    const loadQuota = async () => {
      try {
        if (isAuthenticated) return
        
        // Charger depuis localStorage en premier (persistance)
        const stored = localStorage.getItem('guestQuota')
        const storedData = stored ? JSON.parse(stored) : null
        const now = new Date()
        const storedDate = storedData?.date ? new Date(storedData.date) : null
        const isSameDay = storedDate && 
          storedDate.getFullYear() === now.getFullYear() &&
          storedDate.getMonth() === now.getMonth() &&
          storedDate.getDate() === now.getDate()
        
        // Si même jour, utiliser le quota stocké
        if (isSameDay && storedData?.quota) {
          setGuestQuota(storedData.quota)
        } else {
          // Sinon, récupérer depuis serveur
          const q = await getQuota()
          if (q?.quota) {
            setGuestQuota(q.quota)
            // Sauvegarder dans localStorage
            localStorage.setItem('guestQuota', JSON.stringify({
              quota: q.quota,
              date: now.toISOString()
            }))
          }
        }
      } catch (err) {
        // Fallback au localStorage si serveur indisponible
        const stored = localStorage.getItem('guestQuota')
        if (stored) {
          const { quota } = JSON.parse(stored)
          setGuestQuota(quota)
        }
      }
    }
    loadQuota()
  }, [isAuthenticated, navigate])

  const acceptedTypes = activeTab === 'document'
    ? { 'application/pdf': ['.pdf'], 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'], 'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'], 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'] }
    : activeTab === 'video'
      ? { 'video/mp4': ['.mp4'], 'video/webm': ['.webm'], 'video/quicktime': ['.mov'] }
      : { 'image/*': ['.jpg', '.jpeg', '.png', '.gif', '.webp'] }

  const maxSize = activeTab === 'video'
    ? 200 * 1024 * 1024
    : activeTab === 'document'
      ? 20 * 1024 * 1024
      : 10 * 1024 * 1024

  const onDrop = useCallback((acceptedFiles) => {
    if (activeTab === 'batch') {
      setFiles(prev => [...prev, ...acceptedFiles].slice(0, 20))
    } else {
      setFiles(acceptedFiles.slice(0, 1))
    }
    setResult(null)
    setError(null)
  }, [activeTab])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes,
    maxSize,
    multiple: activeTab === 'batch',
    disabled: analyzing
  })

  const handleAnalyze = async () => {
    setError(null)

    // ⛔ NOUVEAU: Bloquer les analyses anonymes - inscription obligatoire
    if (!isAuthenticated) {
      showToast.info('Inscription gratuite requise pour analyser')
      navigate('/auth?mode=signup', { 
        state: { 
          reason: 'analysis', 
          from: '/app',
          message: 'Créez un compte gratuit pour obtenir 3 analyses/jour'
        } 
      })
      return
    }

    if (activeTab === 'video' && !isAuthenticated) {
      navigate('/login', { state: { reason: 'video', from: '/app' } })
      return
    }

    setAnalyzing(true)
    if (isAuthenticated) setAuthToken(getAccessToken())

    try {
      let res
      if (activeTab === 'url') {
        if (!url) throw new Error('URL requise')
        res = await analyzeUrl(url)
      } else if (activeTab === 'batch') {
        if (files.length === 0) throw new Error('Aucun fichier')
        res = await analyzeBatchImages(files)
      } else if (activeTab === 'document') {
        if (files.length === 0) throw new Error('Aucun document')
        res = await analyzeDocument(files[0])
      } else if (activeTab === 'video') {
        if (files.length === 0) throw new Error('Aucune vidéo')
        res = await analyzeVideo(files[0], (progress) => {
          setUploadProgress(progress.percent)
        })
      } else {
        if (files.length === 0) throw new Error('Aucune image')
        res = await analyzeImage(files[0])
      }
      setResult(res)
      if (!isAuthenticated && res?.quota) {
        setGuestQuota(res.quota)
        // Sauvegarder le quota mis à jour dans localStorage
        localStorage.setItem('guestQuota', JSON.stringify({
          quota: res.quota,
          date: new Date().toISOString()
        }))
      }
      // 🔄 Invalider le cache d'historique pour voir la nouvelle analyse immédiatement
      invalidateHistoryCache()
      showToast.success(t('home.analysisComplete', 'Analyse terminée avec succès !'))
    } catch (err) {
      const status = err.response?.status
      const message = err.response?.data?.message || err.message
      setError(message)
      
      if (status === 429) {
        showToast.error(t('home.quotaExceeded', 'Quota épuisé. Passez à un plan payant.'))
        navigate('/pricing', { state: { reason: 'quota', from: '/app' } })
      } else if (status === 402) {
        showToast.warning(t('home.paymentRequired', 'Paiement requis pour cette fonctionnalité'))
        navigate('/pricing', { state: { reason: 'payment_required', from: '/app' } })
      } else if (status === 401 && !isAuthenticated) {
        showToast.info(t('home.loginRequired', 'Connexion requise'))
        navigate('/login', { state: { reason: 'auth_required', from: '/app' } })
      } else {
        showToast.error(message || t('home.analysisError', 'Erreur lors de l\'analyse'))
      }
    } finally {
      setAnalyzing(false)
    }
  }

  const handleGenerateReport = async () => {
    if (!result?.batch_id) return
    try {
      showToast.info(t('home.generatingReport', 'Génération du rapport en cours...'))
      const reportRes = await generateReport(result.batch_id)
      window.open(getReportDownloadUrl(reportRes.report.filename), '_blank')
      showToast.success(t('home.reportReady', 'Rapport PDF généré avec succès !'))
    } catch (err) {
      showToast.error(t('home.reportError', 'Erreur lors de la génération du rapport'))
      setError('Erreur génération rapport')
    }
  }

  const reset = () => {
    setFiles([])
    setUrl('')
    setResult(null)
    setError(null)
    setUploadProgress(0)
  }

  const getResultColor = (score) => score > 0.7 ? 'text-red-400' : score > 0.4 ? 'text-orange-400' : 'text-green-400'

  return (
    <div className="py-12 relative">
      {/* Floating orbs background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-500/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Hero */}
      <motion.div 
        initial={{ opacity: 0, y: -30 }} 
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center mb-12 relative z-10"
      >
        <h1 className="text-6xl font-bold mb-6 leading-tight">
          {t('home.hero.title', 'Détectez les contenus')}{' '}
          <span className="text-gradient animate-gradient">{t('home.hero.titleAI', 'générés par IA')}</span>
        </h1>
        <p className="text-xl text-gray-300 mb-4">{t('home.hero.subtitle', 'Analyse avancée d\'images et documents')}</p>
        <div className="flex items-center justify-center gap-4 text-sm text-primary-300">
          <span className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-primary-400 animate-pulse"></div>
            PDF • Word • PowerPoint • Excel
          </span>
        </div>
      </motion.div>

      {!isAuthenticated && guestQuota && (
        <div className="max-w-2xl mx-auto mb-6 relative z-10">
          <div className="glass p-4 text-center text-sm text-gray-300">
            {t('home.quotaRemaining', 'Tests gratuits restants')} : <span className="font-semibold text-white">{guestQuota.remaining}</span> / {guestQuota.limit}
            <span className="text-gray-500"> • </span>
            <button className="text-primary-300 hover:underline" onClick={() => navigate('/signup', { state: { from: '/app' } })}>
              {t('auth.createAccount', 'Créer un compte')}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <motion.div 
        variants={staggerContainer}
        initial="initial"
        animate="animate"
        className="flex justify-center gap-3 mb-12 relative z-10"
      >
        {TABS.map(tab => (
          <motion.button
            key={tab.id}
            variants={staggerItem}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => { setActiveTab(tab.id); reset() }}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300
              ${activeTab === tab.id 
                ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/40' 
                : 'glass-hover text-gray-300 hover:text-white'
              }`}
          >
            <tab.icon className="w-5 h-5" />
            <span>{tab.label}</span>
          </motion.button>
        ))}
      </motion.div>

      {/* Zone principale */}
      {!result ? (
        <div className="max-w-2xl mx-auto">
          {activeTab === 'url' ? (
            <div className="glass p-6">
              <div className="flex gap-3">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  className="input flex-1"
                  disabled={analyzing}
                />
                <button onClick={handleAnalyze} disabled={analyzing || !url || (!isAuthenticated && guestQuota?.remaining === 0)} className="btn-primary">
                  {analyzing ? <Loader2 className="w-5 h-5 animate-spin" /> : t('common.analyze', 'Analyser')}
                </button>
              </div>
            </div>
          ) : (
            <>
              <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-12 cursor-pointer transition-all
                ${isDragActive ? 'border-primary-400 bg-primary-500/10' : 'border-white/10 hover:border-white/20'}`}>
                <input {...getInputProps()} />
                <div className="flex flex-col items-center text-center">
                  <div className={`w-20 h-20 rounded-2xl mb-6 flex items-center justify-center ${isDragActive ? 'bg-primary-500/20' : 'bg-white/5'}`}>
                    {activeTab === 'document' ? <FileSearch className="w-8 h-8 text-gray-400" /> : 
                     activeTab === 'video' ? <Film className="w-8 h-8 text-gray-400" /> :
                     activeTab === 'batch' ? <ImagePlus className="w-8 h-8 text-gray-400" /> : 
                     <Upload className="w-8 h-8 text-gray-400" />}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">
                    {activeTab === 'document' ? t('home.upload.dropDocument', 'Déposez un document') : 
                     activeTab === 'video' ? t('home.upload.dropVideo', 'Déposez une vidéo') :
                     activeTab === 'batch' ? t('home.upload.dropBatch', 'Déposez jusqu\'\u00e0 20 images') : 
                     t('home.upload.dropImage', 'Déposez une image')}
                  </h3>
                  <p className="text-gray-400">{t('home.upload.orClick', 'ou cliquez pour sélectionner')}</p>
                  <p className="text-xs text-gray-500 mt-4">
                    {activeTab === 'document' ? t('home.upload.formatDoc', 'PDF, Word, PowerPoint, Excel • Max 20 MB') :
                     activeTab === 'video' ? t('home.upload.formatVideo', 'MP4, WebM, MOV • Max 200 MB • Connexion requise') :
                     t('home.upload.formatImage', 'JPG, PNG, GIF, WebP • Max 10 MB')}
                  </p>
                </div>
              </div>

              {files.length > 0 && (
                <div className="mt-6 glass p-4">
                  <div className="flex flex-wrap gap-2 mb-4">
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-1 rounded-lg bg-white/5 text-sm">
                        {activeTab === 'document' ? <FileText className="w-4 h-4" /> : activeTab === 'video' ? <Film className="w-4 h-4" /> : <Camera className="w-4 h-4" />}
                        <span className="truncate max-w-[150px]">{f.name}</span>
                        <button onClick={() => setFiles(files.filter((_, j) => j !== i))} className="text-gray-500 hover:text-red-400">×</button>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleAnalyze}
                    disabled={analyzing || (!isAuthenticated && guestQuota?.remaining === 0)}
                    className="w-full btn-primary flex items-center justify-center gap-2"
                  >
                    {analyzing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" /> 
                        {activeTab === 'video' && uploadProgress > 0 && uploadProgress < 100 
                          ? `${t('home.upload.uploading', 'Upload')}: ${uploadProgress}%` 
                          : t('home.upload.analyzing', 'Analyse en cours...')}
                      </>
                    ) : (
                      `${t('common.analyze', 'Analyser')} ${files.length > 1 ? `${files.length} ${t('home.upload.files', 'fichiers')}` : ''}`
                    )}
                  </button>
                </div>
              )}
            </>
          )}
          
          {error && <div className="mt-6 p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-center">{error}</div>}
        </div>
      ) : (
        /* Résultats */
        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
          {/* Résultat simple */}
          {result.data && !result.results && !result.data.video && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-6"
            >
              {/* Échelle de détection */}
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="glass-hover p-6"
              >
                <h3 className="text-sm font-bold mb-6 text-primary-300 tracking-wider">ÉCHELLE DE DÉTECTION</h3>
                <div className="space-y-3">
                  {[
                    { range: '90-100%', label: 'Généré par IA', color: 'bg-red-500', textColor: 'text-red-400', active: result.data.combined_score >= 0.90 },
                    { range: '70-89%', label: 'Probablement IA', color: 'bg-red-400', textColor: 'text-red-300', active: result.data.combined_score >= 0.70 && result.data.combined_score < 0.90 },
                    { range: '50-69%', label: 'Possiblement IA', color: 'bg-orange-500', textColor: 'text-orange-400', active: result.data.combined_score >= 0.50 && result.data.combined_score < 0.70 },
                    { range: '30-49%', label: 'Non concluant', color: 'bg-yellow-500', textColor: 'text-yellow-400', active: result.data.combined_score >= 0.30 && result.data.combined_score < 0.50 },
                    { range: '10-29%', label: 'Probablement réel', color: 'bg-green-400', textColor: 'text-green-400', active: result.data.combined_score >= 0.10 && result.data.combined_score < 0.30 },
                    { range: '0-9%', label: 'Image authentique', color: 'bg-green-500', textColor: 'text-green-500', active: result.data.combined_score < 0.10 }
                  ].map((item, i) => (
                    <motion.div 
                      key={i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + i * 0.1 }}
                      className={`flex items-center gap-3 p-4 rounded-xl transition-all duration-300 ${
                        item.active 
                          ? 'bg-gradient-to-r from-white/20 to-white/10 scale-105 border-l-4 border-primary-400 shadow-lg' 
                          : 'opacity-40 hover:opacity-60'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded-full ${item.color} ${item.active ? 'ring-4 ring-white/30 animate-pulse' : ''}`}></div>
                      <div className="flex-1">
                        <div className={`text-sm font-semibold ${item.active ? 'text-white' : 'text-gray-500'}`}>{item.label}</div>
                        <div className={`text-xs ${item.active ? 'text-gray-300' : 'text-gray-600'}`}>{item.range}</div>
                      </div>
                      {item.active && <div className="text-2xl animate-bounce">→</div>}
                    </motion.div>
                  ))}
                </div>
              </motion.div>

              {/* Résultat principal */}
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="glass-hover p-10 lg:col-span-2 relative overflow-hidden"
              >
                {/* Animated background gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-500/5 to-transparent opacity-50"></div>
                
                <div className="text-center mb-10 relative z-10">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                    className={`inline-flex w-40 h-40 rounded-full items-center justify-center mb-6 relative
                      ${result.data.is_ai_generated ? 'bg-gradient-to-br from-red-500/30 to-red-600/30' : 'bg-gradient-to-br from-green-500/30 to-green-600/30'}`}
                  >
                    <div className={`absolute inset-0 rounded-full ${result.data.is_ai_generated ? 'bg-red-500/20' : 'bg-green-500/20'} animate-ping`}></div>
                    {result.data.is_ai_generated ? 
                      <Bot className="w-20 h-20 text-red-400 relative z-10 animate-float" /> : 
                      <User className="w-20 h-20 text-green-400 relative z-10 animate-float" />
                    }
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.6 }}
                  >
                    <div className={`text-7xl font-black mb-4 ${getResultColor(result.data.combined_score)}`}>
                      {Math.round(result.data.combined_score * 100)}%
                    </div>
                    <div className="text-sm text-gray-400 mb-2">
                      Score cumulé (Sightengine + Illuminarty)
                    </div>
                    <div className="text-3xl font-bold mb-4 text-white">{result.data.interpretation?.title}</div>
                    <p className="text-lg text-gray-300 max-w-md mx-auto leading-relaxed">{result.data.interpretation?.description}</p>
                  </motion.div>
                </div>

                {(result.data.engines?.sightengine || result.data.engines?.illuminarty) && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.75 }}
                    className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6"
                  >
                    <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                      <div className="text-xs text-gray-400 mb-1">Sightengine</div>
                      <div className="text-lg font-semibold text-white">
                        {result.data.engines?.sightengine?.success && result.data.engines.sightengine.score != null
                          ? `${Math.round(result.data.engines.sightengine.score * 100)}%`
                          : 'En attente'}
                      </div>
                    </div>
                    <div className="p-4 rounded-2xl bg-white/10 border border-white/10">
                      <div className="text-xs text-gray-400 mb-1">Illuminarty</div>
                      <div className="text-lg font-semibold text-white">
                        {result.data.engines?.illuminarty?.success && result.data.engines.illuminarty.score != null
                          ? `${Math.round(result.data.engines.illuminarty.score * 100)}%`
                          : 'En attente'}
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {/* Alertes métadonnées */}
                {result.data.exif?.aiMarkers?.hasMarkers && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 }}
                    className="p-5 rounded-2xl bg-gradient-to-r from-red-500/20 to-red-600/20 border-2 border-red-500/50 text-red-300 mb-6 text-center relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-red-500/10 to-transparent animate-pulse"></div>
                    <AlertTriangle className="w-7 h-7 inline mr-3 animate-pulse" />
                    <span className="font-semibold">Métadonnées IA détectées : {result.data.exif.aiMarkers.markers[0]?.marker}</span>
                  </motion.div>
                )}
                
                {/* Informations EXIF */}
                {result.data.exif?.summary && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.9 }}
                    className="p-5 rounded-2xl bg-white/10 backdrop-blur-xl text-sm text-gray-300 mb-6 text-center border border-white/20"
                  >
                    <Camera className="w-6 h-6 inline mr-3 text-primary-400" />
                    <span className="font-medium">{result.data.exif.summary}</span>
                  </motion.div>
                )}

                {/* Certificat d'analyse - Juridique & Technique */}
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1 }}
                  className="mb-6 space-y-4"
                >
                  {/* Certificat Technique */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-blue-500/10 to-blue-600/10 border border-blue-500/30 backdrop-blur-sm">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-6 h-6 text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-blue-300 mb-2">Certificat Technique</h4>
                        <div className="space-y-2 text-sm text-gray-300">
                          <p><span className="font-semibold text-white">Méthode :</span> Analyse par IA multi-moteurs (Sightengine + Illuminarty)</p>
                          <p><span className="font-semibold text-white">Précision :</span> {Math.round((result.data.combined_score || 0) * 100)}% de confiance sur la détection</p>
                          <p><span className="font-semibold text-white">Technologies :</span> Deep Learning, Analyse des métadonnées EXIF, Détection d'artefacts</p>
                          <p><span className="font-semibold text-white">Horodatage :</span> {new Date().toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'medium' })}</p>
                          {result.data.exif?.aiMarkers?.hasMarkers && (
                            <p className="text-red-300"><span className="font-semibold text-red-400">⚠️ Alerte :</span> Métadonnées IA détectées dans le fichier</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Certificat Juridique */}
                  <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-purple-600/10 border border-purple-500/30 backdrop-blur-sm">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                        <Scale className="w-6 h-6 text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-bold text-purple-300 mb-2">Valeur Juridique</h4>
                        <div className="space-y-2 text-sm text-gray-300">
                          <p><span className="font-semibold text-white">Conformité RGPD :</span> Analyse réalisée dans le respect du RGPD (UE)</p>
                          <p><span className="font-semibold text-white">Traçabilité :</span> Rapport horodaté et certifié disponible en PDF</p>
                          <p><span className="font-semibold text-white">Admissibilité :</span> Ce rapport peut être utilisé comme preuve technique dans un cadre juridique</p>
                          <p><span className="font-semibold text-white">Responsabilité :</span> FakeTect certifie l'exactitude de l'analyse selon les standards actuels</p>
                          <p className="text-xs text-gray-400 mt-3 pt-3 border-t border-purple-500/20">
                            ⚖️ Pour un usage juridique formel, nous recommandons de générer le rapport PDF certifié avec signature cryptographique
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Call-to-action pour rapport certifié */}
                  {isAuthenticated && result.batch_id && (
                    <div className="p-4 rounded-xl bg-gradient-to-r from-primary-500/10 to-primary-600/10 border border-primary-500/30 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <FileCheck className="w-5 h-5 text-primary-400" />
                        <div className="text-sm">
                          <p className="font-semibold text-white">Rapport PDF certifié disponible</p>
                          <p className="text-gray-400 text-xs">Avec signature cryptographique et QR code de vérification</p>
                        </div>
                      </div>
                      <button onClick={handleGenerateReport} className="btn-primary text-sm px-4 py-2">
                        Générer
                      </button>
                    </div>
                  )}
                </motion.div>

                <motion.button 
                  onClick={reset}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.1 }}
                  className="w-full btn-primary text-lg py-4"
                >
                  {t('home.results.newAnalysis', 'Analyser une autre image')}
                </motion.button>
              </motion.div>
            </motion.div>
          )}

          {/* Résultat vidéo */}
          {result.data?.video && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="glass p-6"
            >
              <div className="flex items-start justify-between gap-4 mb-6">
                <div>
                  <div className="text-sm text-gray-400">Vidéo</div>
                  <div className="text-lg font-semibold text-white break-all">{result.data.video.filename}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    Analyse sur {result.data.video.analyzed_seconds}s • {result.data.results?.total_frames ?? 0} frames
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Score global</div>
                  <div className={`text-3xl font-black ${typeof result.data.results?.overall_score === 'number' ? getResultColor(result.data.results.overall_score) : 'text-gray-400'}`}>
                    {typeof result.data.results?.overall_score === 'number' ? `${Math.round(result.data.results.overall_score * 100)}%` : 'N/A'}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                <div className="glass p-4 text-center">
                  <div className="text-2xl font-bold text-red-400">{result.data.results?.ai_frames_count ?? 0}</div>
                  <div className="text-xs text-gray-400">Frames IA</div>
                </div>
                <div className="glass p-4 text-center">
                  <div className="text-2xl font-bold text-primary-300">
                    {typeof result.data.results?.ai_frames_ratio === 'number' ? `${Math.round(result.data.results.ai_frames_ratio * 100)}%` : 'N/A'}
                  </div>
                  <div className="text-xs text-gray-400">Ratio IA</div>
                </div>
                <div className="glass p-4 text-center">
                  <div className={`text-2xl font-bold ${typeof result.data.results?.max_score === 'number' ? getResultColor(result.data.results.max_score) : 'text-gray-400'}`}>
                    {typeof result.data.results?.max_score === 'number' ? `${Math.round(result.data.results.max_score * 100)}%` : 'N/A'}
                  </div>
                  <div className="text-xs text-gray-400">Max</div>
                </div>
              </div>

              {Array.isArray(result.data.evidence_frames) && result.data.evidence_frames.length > 0 && (
                <div className="mb-6">
                  <div className="text-sm font-semibold text-white mb-3">Frames les plus suspectes</div>
                  <div className="space-y-2">
                    {result.data.evidence_frames.map((f, i) => (
                      <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div className="text-sm text-gray-300">
                          {typeof f.ts_seconds === 'number' ? `${f.ts_seconds.toFixed(2)}s` : '—'}
                        </div>
                        <div className={`font-mono font-bold ${typeof f.combined_score === 'number' ? getResultColor(f.combined_score) : 'text-gray-400'}`}>
                          {typeof f.combined_score === 'number' ? `${Math.round(f.combined_score * 100)}%` : 'N/A'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={reset} className="w-full btn-primary">
                Analyser une autre vidéo
              </button>
            </motion.div>
          )}

          {/* Résultat batch/document */}
          {result.results && (
            <div className="glass p-6">
              {result.document && (
                <div className="mb-4 p-3 rounded-lg bg-white/5">
                  <div className="font-medium">{result.document.name}</div>
                  <div className="text-sm text-gray-400">Type: {result.document.type?.toUpperCase()} • {result.document.pageCount} pages</div>
                </div>
              )}
              
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="glass p-4 text-center">
                  <div className="text-2xl font-bold text-primary-400">{result.summary.total}</div>
                  <div className="text-xs text-gray-400">Images</div>
                </div>
                <div className="glass p-4 text-center">
                  <div className="text-2xl font-bold text-green-400">{result.summary.analyzed}</div>
                  <div className="text-xs text-gray-400">Analysées</div>
                </div>
                <div className="glass p-4 text-center">
                  <div className="text-2xl font-bold text-red-400">{result.summary.ai_detected}</div>
                  <div className="text-xs text-gray-400">IA détectées</div>
                </div>
                <div className="glass p-4 text-center">
                  <div className={`text-2xl font-bold ${getResultColor(result.summary.average_score / 100)}`}>{result.summary.average_score}%</div>
                  <div className="text-xs text-gray-400">Score moyen</div>
                </div>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto mb-6">
                {result.results.map((r, i) => (
                  <div key={i} className={`flex items-center justify-between p-3 rounded-lg ${r.is_ai_generated ? 'bg-red-500/10' : 'bg-green-500/10'}`}>
                    <div className="flex items-center gap-3">
                      {r.is_ai_generated ? <Bot className="w-5 h-5 text-red-400" /> : <User className="w-5 h-5 text-green-400" />}
                      <span className="text-sm truncate max-w-[200px]">{r.filename}</span>
                      {r.page && <span className="text-xs text-gray-500">p.{r.page}</span>}
                    </div>
                    <div className={`font-mono font-bold ${getResultColor(r.combined_score)}`}>
                      {r.combined_score != null ? Math.round(r.combined_score * 100) + '%' : r.error || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={reset} className="flex-1 btn-secondary">Nouvelle analyse</button>
                {result.batch_id && (
                  <>
                    {isAuthenticated ? (
                      <button onClick={handleGenerateReport} className="flex-1 btn-primary flex items-center justify-center gap-2">
                        <Download className="w-4 h-4" /> Télécharger rapport PDF
                      </button>
                    ) : (
                      <button 
                        onClick={() => {
                          showToast.info('Connexion requise pour générer un rapport PDF certifié')
                          navigate('/login', { state: { from: '/app', reason: 'report' } })
                        }} 
                        className="flex-1 btn-primary flex items-center justify-center gap-2"
                      >
                        <Download className="w-4 h-4" /> Rapport PDF (Connexion requise)
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}
