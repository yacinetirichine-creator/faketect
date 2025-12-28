import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Users, BarChart3, TrendingUp, DollarSign, Loader2 } from 'lucide-react';
import { adminApi } from '../../../services/api';

export default function AdminDashboard() {
  const { t } = useTranslation();
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => { 
    adminApi.getMetrics()
      .then(({ data }) => { 
        setMetrics(data); 
        setLoading(false); 
      })
      .catch((err) => {
        console.error('Admin metrics error:', err);
        setError(err.response?.data?.error || 'Erreur de chargement');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={32} /></div>;
  
  if (error) return <div className="card bg-red-50 border-red-200 text-red-600"><p>Erreur: {error}</p></div>;

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
          <h2 className="text-xl font-semibold mb-4">Utilisateurs par plan</h2>
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
          <h2 className="text-xl font-semibold mb-4">Analyses aujourd'hui</h2>
          <div className="text-center py-8">
            <p className="text-5xl font-bold text-primary-600">{metrics?.analyses?.today || 0}</p>
            <p className="text-surface-500 mt-2">analyses effectuées</p>
          </div>
        </div>
      </div>
    </div>
  );
}
