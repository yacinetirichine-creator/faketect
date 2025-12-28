import { useMemo, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Users, BarChart3, TrendingUp, DollarSign, Loader2 } from 'lucide-react';
import { adminApi } from '../../../services/api';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [analyses, setAnalyses] = useState([]);
  const [analysesLoading, setAnalysesLoading] = useState(true);
  const [analysesError, setAnalysesError] = useState(null);
  const [analysesPage, setAnalysesPage] = useState(1);
  const [analysesPagination, setAnalysesPagination] = useState(null);

  useEffect(() => { 
    adminApi.getMetrics()
      .then(({ data }) => { 
        setMetrics(data); 
        setLoading(false); 
      })
      .catch((err) => {
        console.error('Admin metrics error:', err);
        setError(err.response?.data?.error || t('common.loadError'));
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    setAnalysesLoading(true);
    setAnalysesError(null);

    adminApi.getAnalyses({ page: analysesPage, limit: 20 })
      .then(({ data }) => {
        setAnalyses(data.analyses || []);
        setAnalysesPagination(data.pagination || null);
        setAnalysesLoading(false);
      })
      .catch((err) => {
        console.error('Admin analyses error:', err);
        setAnalysesError(err.response?.data?.error || t('common.loadError'));
        setAnalysesLoading(false);
      });
  }, [analysesPage]);

  const parsedAnalyses = useMemo(() => {
    return (analyses || []).map((a) => {
      let details = null;
      if (typeof a?.details === 'string' && a.details.trim()) {
        try {
          details = JSON.parse(a.details);
        } catch {
          details = null;
        }
      }

      const verdictKey = details?.verdict?.key;
      const verdictLabel = verdictKey
        ? t(`verdicts.${verdictKey}`)
        : a?.isAi === true
          ? t('verdicts.ai_generated')
          : a?.isAi === false
            ? t('verdicts.likely_real')
            : '-';

      const provider = details?.provider || '-';
      const score = typeof a?.aiScore === 'number' ? a.aiScore : null;

      return {
        ...a,
        _verdictLabel: verdictLabel,
        _provider: provider,
        _score: score
      };
    });
  }, [analyses, t]);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  
  if (error) return <div className="card bg-red-50 border-red-200 text-red-600"><p>{t('common.error')}: {error}</p></div>;

  const stats = [
    { icon: Users, label: t('admin.totalUsers'), value: metrics?.users?.total || 0, color: 'text-primary-600 bg-primary-100' },
    { icon: TrendingUp, label: t('admin.newToday'), value: metrics?.users?.newToday || 0, color: 'text-green-600 bg-green-100' },
    { icon: BarChart3, label: t('admin.totalAnalyses'), value: metrics?.analyses?.total || 0, color: 'text-accent-600 bg-accent-100' },
    { icon: DollarSign, label: t('admin.mrr'), value: `${metrics?.revenue?.mrr || 0}€`, color: 'text-yellow-600 bg-yellow-100' }
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold">{t('admin.title')}</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="card">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${s.color}`}><s.icon size={24} /></div>
            <p className="text-3xl font-bold">{s.value}</p>
            <p className="text-surface-500">{s.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">{t('admin.usersByPlan')}</h2>
          <div className="space-y-3">
            {Object.entries(metrics?.users?.byPlan || {}).map(([plan, count]) => (
              <div key={plan} className="flex items-center justify-between p-3 bg-surface-50 rounded-xl">
                <span className="font-medium">{plan}</span>
                <span className="badge-primary">{count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">{t('admin.analysesToday')}</h2>
          <div className="text-center py-8">
            <p className="text-5xl font-bold text-primary-600">{metrics?.analyses?.today || 0}</p>
            <p className="text-surface-500 mt-2">{t('admin.analysesPerformed')}</p>
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b bg-surface-50">
          <h2 className="text-xl font-semibold">{t('dashboard.recent')}</h2>
        </div>

        {analysesLoading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="animate-spin text-primary" size={28} /></div>
        ) : analysesError ? (
          <div className="p-6 text-red-600">{t('common.error')}: {analysesError}</div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-surface-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('admin.analysesTable.date')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('admin.analysesTable.user')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('admin.analysesTable.file')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('admin.analysesTable.type')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('admin.analysesTable.score')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('admin.analysesTable.verdict')}</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">{t('admin.analysesTable.provider')}</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {parsedAnalyses.map(a => (
                  <tr key={a.id} className="hover:bg-surface-50">
                    <td className="px-6 py-4 text-surface-500">{new Date(a.createdAt).toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{a.user?.email || '-'}</div>
                      <div className="text-sm text-surface-500">{a.user?.name || ''}</div>
                    </td>
                    <td className="px-6 py-4">
                      {a.fileUrl ? (
                        <a className="text-primary hover:underline" href={a.fileUrl} target="_blank" rel="noreferrer">
                          {a.fileName || a.fileUrl}
                        </a>
                      ) : (
                        <span>{a.fileName || '-'}</span>
                      )}
                    </td>
                    <td className="px-6 py-4">{a.type || '-'}</td>
                    <td className="px-6 py-4 font-medium">{typeof a._score === 'number' ? `${a._score.toFixed(1)}%` : '-'}</td>
                    <td className="px-6 py-4">{a._verdictLabel}</td>
                    <td className="px-6 py-4 text-surface-500">{a._provider}</td>
                  </tr>
                ))}
                {parsedAnalyses.length === 0 && (
                  <tr>
                    <td className="px-6 py-6 text-center text-surface-500" colSpan={7}>{t('admin.noAnalyses')}</td>
                  </tr>
                )}
              </tbody>
            </table>

            {analysesPagination?.pages > 1 && (
              <div className="flex justify-center gap-2 p-4 border-t bg-surface-50">
                {Array.from({ length: analysesPagination.pages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setAnalysesPage(p)}
                    className={`px-4 py-2 rounded-lg ${analysesPage === p ? 'bg-primary-600 text-white' : 'bg-surface-100 hover:bg-surface-200'}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
