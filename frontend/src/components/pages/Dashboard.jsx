import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileImage, AlertCircle, CheckCircle2, TrendingUp, Shield, Clock, Loader2, Zap, History, Download, XCircle, HelpCircle } from 'lucide-react';
import { userApi, analysisApi } from '../../services/api';
import useAuthStore from '../../stores/authStore';
import toast from 'react-hot-toast';
import { downloadCertificatePdf } from '../../utils/certificatePdf';
import { interpretResult, getSimpleMessage, getConfidenceMessage } from '../../utils/resultInterpreter';
import i18n from '../../i18n';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [lastFile, setLastFile] = useState(null);
  const [downloadingCert, setDownloadingCert] = useState(false);

  const parsedDetails = (() => {
    if (!result?.details) return null;
    if (typeof result.details === 'string') {
      try { return JSON.parse(result.details); } catch { return { details: result.details }; }
    }
    return result.details;
  })();

  const confidenceValue = (() => {
    const v = result?.confidence ?? parsedDetails?.confidence;
    const n = typeof v === 'number' ? v : Number(v);
    if (!Number.isFinite(n)) return null;
    return Math.max(0, Math.min(100, n));
  })();

  const providerLabel = result?.provider ?? parsedDetails?.provider;
  const consensusLabel = parsedDetails?.consensus;
  const sources = Array.isArray(parsedDetails?.sources) ? parsedDetails.sources : [];
  const framesAnalyzed = (() => {
    const v = result?.framesAnalyzed ?? parsedDetails?.framesAnalyzed;
    const n = typeof v === 'number' ? v : Number(v);
    return Number.isFinite(n) ? n : null;
  })();
  const signals = (() => {
    const a = Array.isArray(parsedDetails?.anomalies) ? parsedDetails.anomalies : [];
    const i = Array.isArray(parsedDetails?.indicators) ? parsedDetails.indicators : [];
    const s = [...a, ...i].map((x) => String(x)).filter(Boolean);
    return s.slice(0, 3);
  })();

  useEffect(() => {
    let mounted = true;
    userApi.getDashboard()
      .then(({ data }) => {
        if (!mounted) return;
        setData(data);
        setLoadError(null);
        setLoading(false);
      })
      .catch((e) => {
        if (!mounted) return;
        setLoadError(e.response?.data?.error || e.message || t('common.errorGeneric'));
        setLoading(false);
      });
    return () => { mounted = false; };
  }, []);

  const onDrop = useCallback(async (files) => {
    if (!files.length) return;
    setLastFile(files[0]);
    setAnalyzing(true);
    setResult(null);
    try {
      const { data } = await analysisApi.analyzeFile(files[0]);
      setResult(data.analysis);
      userApi.getDashboard().then(({ data }) => setData(data));
      toast.success(t('dashboard.analysisCompleted'));
    } catch (e) { toast.error(e.response?.data?.error || t('common.errorGeneric')); }
    finally { setAnalyzing(false); }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
      'video/*': ['.mp4', '.mov', '.avi', '.mpeg'],
      'application/pdf': ['.pdf']
    },
    maxSize: 100 * 1024 * 1024,
    maxFiles: 1,
    disabled: analyzing
  });

  const verdictColor = (v) => {
    const verdictKey = typeof v === 'string' ? v : v?.key;
    const c = { 
      ai_generated: 'text-red-400 bg-red-500/10 border-red-500/20', 
      likely_ai: 'text-orange-400 bg-orange-500/10 border-orange-500/20', 
      possibly_ai: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20', 
      possibly_real: 'text-lime-400 bg-lime-500/10 border-lime-500/20', 
      likely_real: 'text-green-400 bg-green-500/10 border-green-500/20' 
    };
    return c[verdictKey] || 'text-gray-400 bg-gray-500/10 border-gray-500/20';
  };

  const onDownloadCertificate = async () => {
    if (!result) return;
    setDownloadingCert(true);
    try {
      await downloadCertificatePdf({ 
        t, 
        analysis: result, 
        user, 
        file: lastFile,
        currentLanguage: i18n.language
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Certificate PDF generation failed:', e);
      toast.error(t('certificate.downloadError'));
    } finally {
      setDownloadingCert(false);
    }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  if (loadError) return <div className="card bg-red-50 border-red-200 text-red-700"><p>{t('common.error')}: {loadError}</p></div>;

  // Backend returns { stats, limits, recentAnalyses }
  const stats = [
    { icon: TrendingUp, label: t('dashboard.total'), value: data?.stats?.total || 0, color: 'text-primary', bg: 'bg-primary/10' },
    { icon: AlertCircle, label: t('dashboard.aiDetected'), value: data?.stats?.aiDetected || 0, color: 'text-red-400', bg: 'bg-red-500/10' },
    { icon: Shield, label: t('dashboard.real'), value: data?.stats?.real || 0, color: 'text-green-400', bg: 'bg-green-500/10' },
  ];

  const remainingToday = data?.limits?.remainingToday;
  const remainingLabel = remainingToday === null || remainingToday === undefined
    ? null
    : `${remainingToday}`;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">{t('dashboard.welcome')}, {user?.name}</h1>
          <p className="text-gray-400">{t('dashboard.subtitle')}</p>
        </div>
        <div className="px-4 py-2 rounded-full bg-white/5 border border-white/10 text-sm text-gray-400 flex items-center gap-2">
          <Zap size={16} className="text-yellow-400" />
          {remainingLabel ? `${remainingLabel} ${t('dashboard.remaining')}` : t('dashboard.remaining')}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((s, i) => (
          <motion.div 
            key={i} 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: i * 0.1 }} 
            className="card bg-surface/50 border-white/10"
          >
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl ${s.bg} ${s.color}`}>
                <s.icon size={24} />
              </div>
              <div>
                <div className="text-sm text-gray-400">{s.label}</div>
                <div className="text-2xl font-bold text-white">{s.value}</div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="card bg-surface/50 border-white/10">
            <h2 className="text-xl font-bold text-white mb-6">{t('dashboard.newAnalysis')}</h2>
            
            <div {...getRootProps()} className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${isDragActive ? 'border-primary bg-primary/5' : 'border-white/10 hover:border-primary/50 hover:bg-white/5'}`}>
              <input {...getInputProps()} />
              <div className="w-16 h-16 bg-surface rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                {analyzing ? <Loader2 className="animate-spin text-primary" size={32} /> : <Upload className="text-primary" size={32} />}
              </div>
              <p className="text-lg font-medium text-white mb-2">{isDragActive ? t('dashboard.drop') : t('dashboard.drag')}</p>
              <p className="text-sm text-gray-400">{t('dashboard.uploadHint')}</p>
            </div>
          </div>

          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
                {(() => {
                  const interpretation = interpretResult(result.aiScore);
                  const message = getSimpleMessage(interpretation.level, i18n.language);
                  const confidenceMsg = getConfidenceMessage(confidenceValue, i18n.language);

                  return (
                    <div className={`card ${interpretation.bgColor} border-2 ${interpretation.borderColor}`}>
                      {/* En-tête avec verdict pédagogique */}
                      <div className="text-center mb-8">
                        <div className={`w-24 h-24 mx-auto rounded-full ${interpretation.bgColor} border-4 ${interpretation.borderColor} flex items-center justify-center mb-4`}>
                          <span className="text-6xl">
                            {interpretation.level === 'real' && <CheckCircle2 className={interpretation.textColor} size={64} strokeWidth={3} />}
                            {interpretation.level === 'uncertain' && <HelpCircle className={interpretation.textColor} size={64} strokeWidth={3} />}
                            {interpretation.level === 'fake' && <XCircle className={interpretation.textColor} size={64} strokeWidth={3} />}
                          </span>
                        </div>
                        
                        <h3 className={`text-3xl font-black ${interpretation.textColor} mb-3 tracking-wide`}>
                          {interpretation.emoji} {message.title}
                        </h3>
                        
                        <div className="max-w-2xl mx-auto">
                          <p className="text-xl text-white/90 leading-relaxed mb-2">
                            {message.explanation}
                          </p>
                          {confidenceValue !== null && (
                            <p className="text-sm text-white/60 italic">
                              {confidenceMsg}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Grande jauge visuelle */}
                      <div className="mb-8">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-lg font-semibold text-white">Résultat</span>
                          <span className={`text-4xl font-black ${interpretation.textColor}`}>
                            {interpretation.realPercentage.toFixed(0)}% {interpretation.level === 'real' ? 'RÉEL' : interpretation.level === 'fake' ? 'IA' : 'INCERTAIN'}
                          </span>
                        </div>
                        <div className="relative h-8 bg-white/10 rounded-full overflow-hidden shadow-inner">
                          <div 
                            className={`absolute top-0 left-0 h-full ${interpretation.barColor} rounded-full transition-all duration-1000 shadow-lg`}
                            style={{ width: `${interpretation.realPercentage}%` }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-sm font-bold text-white drop-shadow-lg">
                              {interpretation.realPercentage > 50 ? '← Plus réel' : 'Plus IA →'}
                            </span>
                          </div>
                        </div>
                        <div className="flex justify-between mt-2 text-xs text-white/50">
                          <span>100% Réel</span>
                          <span>50%</span>
                          <span>100% IA</span>
                        </div>
                      </div>

                      {/* Détails techniques (optionnel, repliable) */}
                      <details className="mt-6">
                        <summary className="cursor-pointer text-sm text-white/60 hover:text-white/80 mb-3">
                          📊 Voir les détails techniques
                        </summary>
                        
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="text-xs text-gray-400 mb-1">Score IA brut</div>
                            <div className="text-xl font-bold text-white">{Number(result.aiScore ?? 0).toFixed(1)}%</div>
                          </div>
                          <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                            <div className="text-xs text-gray-400 mb-1">Temps de traitement</div>
                            <div className="text-xl font-bold text-white">1.2s</div>
                            <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                              <Zap size={10} /> Ultra rapide
                            </div>
                          </div>
                        </div>

                        {confidenceValue !== null && (
                          <div className="mb-4">
                            <div className="text-xs text-gray-400 mb-2">Confiance: {confidenceValue.toFixed(0)}%</div>
                            <div className="w-full bg-white/10 h-2 rounded-full overflow-hidden">
                              <div className="bg-primary h-full rounded-full" style={{ width: `${confidenceValue}%` }} />
                            </div>
                          </div>
                        )}

                        <div className="text-xs text-gray-400 space-y-1">
                          <p><span className="text-gray-500">ID:</span> {result.id}</p>
                          {providerLabel && <p><span className="text-gray-500">Fournisseur:</span> {providerLabel}</p>}
                          {consensusLabel && <p><span className="text-gray-500">Consensus:</span> {consensusLabel}</p>}
                          {framesAnalyzed !== null && <p><span className="text-gray-500">Frames analysées:</span> {Math.round(framesAnalyzed)}</p>}
                        </div>

                        {signals.length > 0 && (
                          <div className="mt-3 text-xs">
                            <div className="text-gray-500 mb-1">Signaux détectés:</div>
                            <ul className="list-disc pl-4 space-y-1 text-gray-400">
                              {signals.map((s, idx) => <li key={idx}>{s}</li>)}
                            </ul>
                          </div>
                        )}
                      </details>

                      {/* Bouton certificat */}
                      <div className="mt-6 text-center">
                        <button 
                          type="button" 
                          className="btn-primary px-6 py-3 inline-flex items-center gap-2" 
                          onClick={onDownloadCertificate} 
                          disabled={downloadingCert}
                        >
                          {downloadingCert ? <Loader2 className="animate-spin" size={18} /> : <Download size={18} />}
                          Télécharger le certificat
                        </button>
                        <p className="text-xs text-white/40 mt-2">Certificat PDF avec preuve d'analyse</p>
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div>
          <div className="card bg-surface/50 border-white/10 h-full">
            <h2 className="text-xl font-bold text-white mb-6">{t('dashboard.recent')}</h2>
            <div className="space-y-4">
              {data?.recentAnalyses?.length > 0 ? data.recentAnalyses.map((item) => (
                <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${item.isAi ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                    <FileImage size={20} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-white truncate">{item.fileName || t('dashboard.fileFallback')}</p>
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Clock size={10} /> {new Date(item.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className={`text-xs font-bold px-2 py-1 rounded border ${verdictColor({ key: item.isAi ? 'likely_ai' : 'likely_real' })}`}>
                    {Math.round(item.aiScore || 0)}%
                  </div>
                </div>
              )) : (
                <div className="text-center py-8 text-gray-500">
                  <History size={32} className="mx-auto mb-2 opacity-50" />
                  <p>{t('dashboard.noHistory')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
