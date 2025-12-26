/**
 * Export données en Excel (XLSX)
 * Utilitaire pour exporter historique, stats, rapports
 */

/**
 * Convertir données JSON en CSV
 * @param {Array} data - Tableau d'objets
 * @param {Array} columns - Colonnes à exporter
 * @returns {string} - CSV string
 */
export function jsonToCSV(data, columns) {
  if (!data || data.length === 0) return ''

  // Headers
  const headers = columns.map(col => col.label || col.key).join(',')
  
  // Rows
  const rows = data.map(row => {
    return columns.map(col => {
      let value = row[col.key]
      
      // Format valeur
      if (col.format) {
        value = col.format(value, row)
      }
      
      // Échapper virgules et guillemets
      if (typeof value === 'string') {
        value = value.replace(/"/g, '""')
        if (value.includes(',') || value.includes('\n') || value.includes('"')) {
          value = `"${value}"`
        }
      }
      
      return value ?? ''
    }).join(',')
  })
  
  return [headers, ...rows].join('\n')
}

/**
 * Télécharger CSV
 * @param {string} csv - Contenu CSV
 * @param {string} filename - Nom fichier
 */
export function downloadCSV(csv, filename = 'export.csv') {
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  URL.revokeObjectURL(url)
}

/**
 * Exporter historique analyses en CSV
 * @param {Array} analyses - Analyses à exporter
 */
export function exportAnalysesToCSV(analyses) {
  const columns = [
    { key: 'created_at', label: 'Date', format: (val) => new Date(val).toLocaleString('fr-FR') },
    { key: 'type', label: 'Type' },
    { key: 'result', label: 'Score IA', format: (val) => val?.ai_probability ? (val.ai_probability * 100).toFixed(1) + '%' : 'N/A' },
    { key: 'result', label: 'Verdict', format: (val) => {
      if (!val?.ai_probability) return 'N/A'
      const score = val.ai_probability
      if (score > 0.7) return 'IA détectée'
      if (score > 0.4) return 'Incertain'
      return 'Authentique'
    }},
    { key: 'result', label: 'Confiance', format: (val) => val?.confidence ? (val.confidence * 100).toFixed(1) + '%' : 'N/A' }
  ]
  
  const csv = jsonToCSV(analyses, columns)
  const date = new Date().toISOString().split('T')[0]
  downloadCSV(csv, `faketect-analyses-${date}.csv`)
}

/**
 * Exporter stats utilisateur en CSV
 * @param {Object} stats - Statistiques
 */
export function exportStatsToCSV(stats) {
  const data = [
    { metric: 'Analyses totales', value: stats.totalAnalyses || 0 },
    { metric: 'Images analysées', value: stats.images || 0 },
    { metric: 'Vidéos analysées', value: stats.videos || 0 },
    { metric: 'Documents analysés', value: stats.documents || 0 },
    { metric: 'IA détectée', value: stats.aiDetected || 0 },
    { metric: 'Authentiques', value: stats.authentic || 0 },
    { metric: 'Incertains', value: stats.uncertain || 0 },
    { metric: 'Précision moyenne', value: stats.avgAccuracy ? (stats.avgAccuracy * 100).toFixed(1) + '%' : 'N/A' }
  ]
  
  const columns = [
    { key: 'metric', label: 'Métrique' },
    { key: 'value', label: 'Valeur' }
  ]
  
  const csv = jsonToCSV(data, columns)
  const date = new Date().toISOString().split('T')[0]
  downloadCSV(csv, `faketect-stats-${date}.csv`)
}

/**
 * Exporter utilisateurs admin en CSV
 * @param {Array} users - Liste utilisateurs
 */
export function exportUsersToCSV(users) {
  const columns = [
    { key: 'email', label: 'Email' },
    { key: 'plan', label: 'Plan' },
    { key: 'analyses', label: 'Analyses' },
    { key: 'status', label: 'Statut' },
    { key: 'created', label: 'Inscription', format: (val) => new Date(val).toLocaleDateString('fr-FR') },
    { key: 'lastActive', label: 'Dernière activité', format: (val) => val ? new Date(val).toLocaleDateString('fr-FR') : 'Jamais' }
  ]
  
  const csv = jsonToCSV(users, columns)
  const date = new Date().toISOString().split('T')[0]
  downloadCSV(csv, `faketect-users-${date}.csv`)
}

/**
 * Exporter données batch analyses
 * @param {Object} batch - Batch d'analyses
 */
export function exportBatchToCSV(batch) {
  if (!batch || !batch.results) return
  
  const columns = [
    { key: 'filename', label: 'Fichier' },
    { key: 'ai_probability', label: 'Score IA', format: (val) => (val * 100).toFixed(1) + '%' },
    { key: 'confidence', label: 'Confiance', format: (val) => (val * 100).toFixed(1) + '%' },
    { key: 'verdict', label: 'Verdict', format: (val, row) => {
      const score = row.ai_probability
      if (score > 0.7) return 'IA détectée'
      if (score > 0.4) return 'Incertain'
      return 'Authentique'
    }},
    { key: 'models_used', label: 'Modèles utilisés', format: (val) => val ? val.join(', ') : 'N/A' }
  ]
  
  const csv = jsonToCSV(batch.results, columns)
  downloadCSV(csv, `batch-${batch.id || 'export'}.csv`)
}

/**
 * Créer tableau Excel HTML (pour copier-coller)
 * @param {Array} data - Données
 * @param {Array} columns - Colonnes
 * @returns {string} - HTML table
 */
export function createExcelTable(data, columns) {
  const headers = columns.map(col => `<th>${col.label}</th>`).join('')
  const rows = data.map(row => {
    const cells = columns.map(col => {
      let value = row[col.key]
      if (col.format) value = col.format(value, row)
      return `<td>${value ?? ''}</td>`
    }).join('')
    return `<tr>${cells}</tr>`
  }).join('')
  
  return `
    <table border="1" cellpadding="5" cellspacing="0">
      <thead><tr>${headers}</tr></thead>
      <tbody>${rows}</tbody>
    </table>
  `
}

/**
 * Copier tableau dans clipboard (Excel compatible)
 * @param {Array} data - Données
 * @param {Array} columns - Colonnes
 */
export async function copyToClipboard(data, columns) {
  const html = createExcelTable(data, columns)
  const text = jsonToCSV(data, columns)
  
  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([text], { type: 'text/plain' })
      })
    ])
    return true
  } catch (err) {
    console.error('Erreur copie clipboard:', err)
    // Fallback: copie texte simple
    await navigator.clipboard.writeText(text)
    return true
  }
}
