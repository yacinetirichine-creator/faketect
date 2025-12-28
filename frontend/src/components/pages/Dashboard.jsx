import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileImage, AlertCircle, CheckCircle2, TrendingUp, Shield, Clock, Loader2, Zap, History } from 'lucide-react';
import { userApi, analysisApi } from '../../services/api';
import useAuthStore from '../../stores/authStore';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

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
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'], 'application/pdf': ['.pdf'] },
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
                <div className="card bg-surface/50 border-white/10 border-l-4 border-l-primary">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-white mb-1">{t('dashboard.result')}</h3>
                      <p className="text-sm text-gray-400">ID: {result.id}</p>
                    </div>
                    <div className={`px-4 py-2 rounded-full border text-sm font-bold flex items-center gap-2 ${verdictColor(result.verdict)}`}>
                      {(result.verdict?.key || result.verdict) === 'likely_real' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
                      {t(`verdicts.${(result.verdict?.key || result.verdict)}`, String(result.verdict?.key || result.verdict || '').replace('_', ' ').toUpperCase())}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-sm text-gray-400 mb-1">{t('dashboard.score')}</div>
                      <div className="text-2xl font-bold text-white">{Number(result.aiScore ?? 0).toFixed(1)}%</div>
                      <div className="w-full bg-white/10 h-2 rounded-full mt-2 overflow-hidden">
                        <div className="bg-primary h-full rounded-full" style={{ width: `${Math.max(0, Math.min(100, Number(result.aiScore ?? 0)))}%` }} />
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                      <div className="text-sm text-gray-400 mb-1">{t('dashboard.processingTime')}</div>
                      <div className="text-2xl font-bold text-white">1.2s</div>
                      <div className="flex items-center gap-1 text-xs text-green-400 mt-2">
                        <Zap size={12} /> {t('dashboard.ultraFast')}
                      </div>
                    </div>
                  </div>

                  {result.details && (
                    <div className="bg-black/20 rounded-xl p-4 font-mono text-sm text-gray-300 overflow-x-auto">
                      <pre>{JSON.stringify((() => {
                        if (typeof result.details === 'string') {
                          try { return JSON.parse(result.details); } catch { return { details: result.details }; }
                        }
                        return result.details;
                      })(), null, 2)}</pre>
                    </div>
                  )}
                </div>
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
