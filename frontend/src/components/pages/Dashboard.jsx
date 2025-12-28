import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileImage, AlertCircle, CheckCircle2, TrendingUp, Shield, Clock, Loader2 } from 'lucide-react';
import { userApi, analysisApi } from '../../services/api';
import useAuthStore from '../../stores/authStore';
import toast from 'react-hot-toast';

export default function Dashboard() {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => { userApi.getDashboard().then(({ data }) => { setData(data); setLoading(false); }); }, []);

  const onDrop = useCallback(async (files) => {
    if (!files.length) return;
    setAnalyzing(true);
    setResult(null);
    try {
      const { data } = await analysisApi.analyzeFile(files[0]);
      setResult(data.analysis);
      userApi.getDashboard().then(({ data }) => setData(data));
      toast.success('Analyse terminée !');
    } catch (e) { toast.error(e.response?.data?.error || 'Erreur'); }
    finally { setAnalyzing(false); }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp'], 'application/pdf': ['.pdf'] },
    maxFiles: 1,
    disabled: analyzing
  });

  const verdictColor = (v) => {
    const c = { ai_generated: 'text-red-600 bg-red-100', likely_ai: 'text-orange-600 bg-orange-100', possibly_ai: 'text-yellow-600 bg-yellow-100', possibly_real: 'text-lime-600 bg-lime-100', likely_real: 'text-green-600 bg-green-100' };
    return c[v?.key] || 'text-gray-600 bg-gray-100';
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary-500" size={32} /></div>;

  const stats = [
    { icon: TrendingUp, label: t('dashboard.total'), value: data?.stats?.total || 0, color: 'text-primary-600 bg-primary-100' },
    { icon: AlertCircle, label: t('dashboard.aiDetected'), value: data?.stats?.aiDetected || 0, color: 'text-red-600 bg-red-100' },
    { icon: Shield, label: t('dashboard.real'), value: data?.stats?.real || 0, color: 'text-green-600 bg-green-100' },
    { icon: Clock, label: t('dashboard.remaining'), value: data?.limits?.remainingMonth ?? '∞', color: 'text-accent-600 bg-accent-100' }
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">{t('dashboard.welcome')}, {user?.name || user?.email?.split('@')[0]} 👋</h1>
        <p className="text-surface-600">Plan: <span className="text-primary-600 font-medium">{user?.plan}</span></p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.color}`}><s.icon size={20} /></div>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-sm text-surface-500">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="card">
        <h2 className="text-xl font-semibold mb-4">{t('dashboard.quick')}</h2>
        <div {...getRootProps()} className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${isDragActive ? 'border-primary-500 bg-primary-50' : 'border-surface-300 hover:border-primary-400'} ${analyzing ? 'opacity-50' : ''}`}>
          <input {...getInputProps()} />
          {analyzing ? <><Loader2 className="animate-spin text-primary-500 mx-auto mb-4" size={48} /><p>{t('dashboard.analyzing')}</p></> : <><Upload className="mx-auto text-surface-400 mb-4" size={48} /><p className="font-medium">{t('dashboard.dropzone')}</p><p className="text-surface-400 text-sm mt-1">{t('dashboard.formats')}</p></>}
        </div>

        <AnimatePresence>
          {result && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-6 p-6 bg-surface-50 rounded-xl">
              <h3 className="text-lg font-semibold mb-4">{t('dashboard.result')}</h3>
              <div className="grid md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-white rounded-xl">
                  <p className="text-sm text-surface-500 mb-1">{t('dashboard.score')}</p>
                  <p className={`text-4xl font-bold ${result.aiScore >= 50 ? 'text-red-600' : 'text-green-600'}`}>{result.aiScore?.toFixed(1)}%</p>
                </div>
                <div className="text-center p-4 bg-white rounded-xl">
                  <p className="text-sm text-surface-500 mb-1">{t('dashboard.confidence')}</p>
                  <p className="text-4xl font-bold text-primary-600">{result.confidence}%</p>
                </div>
                <div className="text-center p-4 bg-white rounded-xl">
                  <p className="text-sm text-surface-500 mb-1">{t('dashboard.verdict')}</p>
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full font-semibold ${verdictColor(result.verdict)}`}>
                    {result.isAi ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
                    {t(`verdicts.${result.verdict?.key}`) || result.verdict?.key}
                  </span>
                </div>
              </div>
              {result.demo && <p className="text-center text-sm text-yellow-600 mt-4 bg-yellow-50 p-2 rounded-lg">⚠️ Mode démo - Configurez les APIs</p>}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {data?.recentAnalyses?.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Récent</h2>
          <div className="space-y-3">
            {data.recentAnalyses.map((a) => (
              <div key={a.id} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <FileImage className="text-surface-400" size={20} />
                  <div>
                    <p className="font-medium">{a.fileName || 'URL'}</p>
                    <p className="text-sm text-surface-500">{new Date(a.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${a.isAi ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>{a.aiScore?.toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
