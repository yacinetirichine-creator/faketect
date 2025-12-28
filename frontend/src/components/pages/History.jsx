import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileImage, Trash2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { analysisApi } from '../../services/api';
import toast from 'react-hot-toast';

export default function History() {
  const { t } = useTranslation();
  const [analyses, setAnalyses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => { load(); }, [page]);

  const load = async () => {
    const { data } = await analysisApi.getHistory({ page, limit: 20 });
    setAnalyses(data.analyses);
    setPagination(data.pagination);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm(t('common.confirmDelete'))) return;
    await analysisApi.delete(id);
    setAnalyses(analyses.filter(a => a.id !== id));
    toast.success(t('common.deleted'));
  };

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary-500" size={32} /></div>;

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('dashboard.history')}</h1>

      {!analyses.length ? (
        <div className="card text-center py-12">
          <FileImage className="mx-auto text-surface-300 mb-4" size={48} />
          <p className="text-surface-500">{t('dashboard.noHistory')}</p>
        </div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px]">
                <thead className="bg-surface-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-semibold">{t('historyPage.table.file')}</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">{t('historyPage.table.type')}</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">{t('historyPage.table.score')}</th>
                    <th className="px-6 py-3 text-left text-sm font-semibold">{t('historyPage.table.date')}</th>
                    <th className="px-6 py-3 text-right text-sm font-semibold">{t('historyPage.table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {analyses.map((a) => (
                    <tr key={a.id} className="hover:bg-surface-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <FileImage className="text-surface-400" size={20} />
                          <span className="font-medium truncate max-w-[200px]">{a.fileName || t('historyPage.url')}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4"><span className="badge-primary">{a.type}</span></td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {a.isAi ? <AlertCircle className="text-red-500" size={16} /> : <CheckCircle2 className="text-green-500" size={16} />}
                          <span className={a.isAi ? 'text-red-600' : 'text-green-600'}>{a.aiScore?.toFixed(1)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-surface-500">{new Date(a.createdAt).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <button onClick={() => handleDelete(a.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {pagination?.pages > 1 && (
            <div className="flex justify-center gap-2">
              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => setPage(p)} className={`px-4 py-2 rounded-lg ${page === p ? 'bg-primary-600 text-white' : 'bg-surface-100 hover:bg-surface-200'}`}>{p}</button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
