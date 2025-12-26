import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { FileText, Download, Clock, CheckCircle, AlertCircle, Filter } from 'lucide-react'
import { API_BASE_URL } from '../config/api'

export default function InvoicesPage() {
  const { isAuthenticated, getAccessToken, loading: authLoading } = useAuth()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [filter, setFilter] = useState('all') // all, paid, pending

  useEffect(() => {
    if (authLoading) return
    if (isAuthenticated) {
      fetchInvoices()
    } else {
      setLoading(false)
    }
  }, [isAuthenticated, authLoading, filter])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const token = getAccessToken()
      if (!token) throw new Error('Token manquant')
      const url = new URL(`${API_BASE_URL}/api/billing/invoices`)
      if (filter !== 'all') {
        url.searchParams.set('status', filter === 'paid' ? 'paid' : 'sent')
      }

      const res = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!res.ok) {
        const text = await res.text().catch(() => '')
        throw new Error(text || 'Erreur de chargement')
      }

      const data = await res.json()
      setInvoices(data.invoices || [])
    } catch (err) {
      console.error('Erreur:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = async (invoiceId, invoiceNumber) => {
    try {
      const token = getAccessToken()
      if (!token) throw new Error('Token manquant')
      const res = await fetch(
        `${API_BASE_URL}/api/billing/invoices/${invoiceId}/pdf`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      )

      if (!res.ok) throw new Error('Erreur de téléchargement')

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `facture_${invoiceNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error('Erreur téléchargement:', err)
      alert('Erreur lors du téléchargement du PDF')
    }
  }

  const getStatusBadge = (status) => {
    const configs = {
      draft: {
        icon: Clock,
        color: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
        label: 'Brouillon'
      },
      sent: {
        icon: Clock,
        color: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
        label: 'Envoyée'
      },
      paid: {
        icon: CheckCircle,
        color: 'bg-green-500/10 text-green-400 border-green-500/20',
        label: 'Payée'
      },
      overdue: {
        icon: AlertCircle,
        color: 'bg-red-500/10 text-red-400 border-red-500/20',
        label: 'En retard'
      },
      cancelled: {
        icon: AlertCircle,
        color: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
        label: 'Annulée'
      }
    }

    const config = configs[status] || configs.draft
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${config.color}`}>
        <Icon className="w-3.5 h-3.5" />
        {config.label}
      </span>
    )
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }

  const formatCurrency = (cents) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR'
    }).format(cents / 100)
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="glass p-12 text-center">
          <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Connexion requise</h3>
          <p className="text-gray-400 mb-6">Veuillez vous connecter pour voir vos factures.</p>
          <a href="/auth" className="btn-primary inline-block">Se connecter</a>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* En-tête */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mes factures</h1>
          <p className="text-gray-400">Consultez et téléchargez vos factures</p>
        </div>

        {/* Filtres */}
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input py-2 px-3"
          >
            <option value="all">Toutes</option>
            <option value="paid">Payées</option>
            <option value="pending">En attente</option>
          </select>
        </div>
      </div>

      {/* Messages d'erreur */}
      {error && (
        <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          {error}
        </div>
      )}

      {/* Liste des factures */}
      {invoices.length === 0 ? (
        <div className="glass p-12 text-center">
          <FileText className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold mb-2">Aucune facture</h3>
          <p className="text-gray-400">Vos factures apparaîtront ici après vos achats.</p>
        </div>
      ) : (
        <div className="glass overflow-hidden">
          {/* Version desktop - Tableau */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Numéro
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Montant
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-medium text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {invoices.map((invoice) => (
                  <tr key={invoice.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium">{invoice.invoice_number}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                      {formatDate(invoice.invoice_date)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {invoice.invoice_items?.[0]?.description || 'Facture'}
                        {invoice.invoice_items?.length > 1 && (
                          <span className="text-gray-500 ml-1">
                            +{invoice.invoice_items.length - 1} autre{invoice.invoice_items.length > 2 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm font-semibold">
                        {formatCurrency(invoice.total_cents)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={() => downloadPDF(invoice.id, invoice.invoice_number)}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 transition-colors text-sm font-medium"
                      >
                        <Download className="w-4 h-4" />
                        PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Version mobile - Cartes */}
          <div className="md:hidden divide-y divide-white/10">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="p-4 hover:bg-white/5 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-gray-500" />
                    <span className="font-medium">{invoice.invoice_number}</span>
                  </div>
                  {getStatusBadge(invoice.status)}
                </div>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Date</span>
                    <span>{formatDate(invoice.invoice_date)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Montant</span>
                    <span className="font-semibold">{formatCurrency(invoice.total_cents)}</span>
                  </div>
                </div>

                <button
                  onClick={() => downloadPDF(invoice.id, invoice.invoice_number)}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary-500/10 text-primary-400 hover:bg-primary-500/20 transition-colors text-sm font-medium"
                >
                  <Download className="w-4 h-4" />
                  Télécharger PDF
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistiques */}
      {invoices.length > 0 && (
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="glass p-4">
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-5 h-5 text-gray-400" />
              <span className="text-sm text-gray-400">Total factures</span>
            </div>
            <div className="text-2xl font-bold">{invoices.length}</div>
          </div>

          <div className="glass p-4">
            <div className="flex items-center gap-2 mb-1">
              <CheckCircle className="w-5 h-5 text-green-400" />
              <span className="text-sm text-gray-400">Payées</span>
            </div>
            <div className="text-2xl font-bold text-green-400">
              {invoices.filter(i => i.status === 'paid').length}
            </div>
          </div>

          <div className="glass p-4">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-sm text-gray-400">En attente</span>
            </div>
            <div className="text-2xl font-bold text-blue-400">
              {invoices.filter(i => ['sent', 'draft'].includes(i.status)).length}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
