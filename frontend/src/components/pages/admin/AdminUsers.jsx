import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Search, Trash2, Loader2 } from 'lucide-react';
import { adminApi } from '../../../services/api';
import toast from 'react-hot-toast';

export default function AdminUsers() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => { load(); }, [page, search]);

  const load = async () => {
    setLoading(true);
    const { data } = await adminApi.getUsers({ page, limit: 20, search });
    setUsers(data.users);
    setPagination(data.pagination);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet utilisateur ?')) return;
    await adminApi.deleteUser(id);
    setUsers(users.filter(u => u.id !== id));
    toast.success('Supprimé');
  };

  const handlePlanChange = async (id, plan) => {
    await adminApi.updateUser(id, { plan });
    setUsers(users.map(u => u.id === id ? { ...u, plan } : u));
    toast.success('Plan modifié');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('admin.users')}</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-surface-400" size={20} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Rechercher..." className="input pl-10 w-64" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-primary" size={32} /></div>
      ) : (
        <>
          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-surface-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Email</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Nom</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Plan</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Rôle</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold">Inscrit</th>
                  <th className="px-6 py-3 text-right text-sm font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-surface-50">
                    <td className="px-6 py-4 font-medium">{u.email}</td>
                    <td className="px-6 py-4">{u.name || '-'}</td>
                    <td className="px-6 py-4">
                      <select value={u.plan} onChange={(e) => handlePlanChange(u.id, e.target.value)} className="input py-1 px-2 text-sm">
                        <option value="FREE">FREE</option>
                        <option value="STARTER">STARTER</option>
                        <option value="PRO">PRO</option>
                        <option value="BUSINESS">BUSINESS</option>
                        <option value="ENTERPRISE">ENTERPRISE</option>
                      </select>
                    </td>
                    <td className="px-6 py-4"><span className={u.role === 'ADMIN' ? 'badge-danger' : 'badge-primary'}>{u.role}</span></td>
                    <td className="px-6 py-4 text-surface-500">{new Date(u.createdAt).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(u.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 size={18} /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
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
