/**
 * Composant Toast pour notifications élégantes
 * Usage: import { showToast } from './utils/toast'
 *        showToast.success('Message réussi')
 */
import { createRoot } from 'react-dom/client'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { useState, useEffect } from 'react'

const toastContainerId = 'toast-container'
let toastId = 0

// Types de toast
const toastTypes = {
  success: { icon: CheckCircle, color: 'bg-green-500', borderColor: 'border-green-500' },
  error: { icon: XCircle, color: 'bg-red-500', borderColor: 'border-red-500' },
  warning: { icon: AlertCircle, color: 'bg-yellow-500', borderColor: 'border-yellow-500' },
  info: { icon: Info, color: 'bg-blue-500', borderColor: 'border-blue-500' }
}

function Toast({ id, type = 'info', message, duration = 4000, onClose }) {
  const [isVisible, setIsVisible] = useState(true)
  const config = toastTypes[type]
  const Icon = config.icon

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false)
      setTimeout(onClose, 300) // Attendre animation de sortie
    }, duration)

    return () => clearTimeout(timer)
  }, [duration, onClose])

  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      className={`flex items-center gap-3 bg-gray-900 border-l-4 ${config.borderColor} rounded-lg shadow-2xl p-4 min-w-[300px] max-w-md mb-3`}
    >
      <div className={`${config.color} p-2 rounded-full`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      
      <p className="flex-1 text-sm text-gray-100">{message}</p>
      
      <button
        onClick={() => {
          setIsVisible(false)
          setTimeout(onClose, 300)
        }}
        className="text-gray-400 hover:text-white transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  )
}

function ToastContainer() {
  const [toasts, setToasts] = useState([])

  // Exposer fonction d'ajout globalement
  useEffect(() => {
    window.__addToast = (toast) => {
      setToasts(prev => [...prev, { ...toast, id: toastId++ }])
    }

    return () => {
      delete window.__addToast
    }
  }, [])

  const removeToast = (id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return (
    <div
      id={toastContainerId}
      className="fixed top-4 right-4 z-[9999] flex flex-col items-end"
    >
      <AnimatePresence>
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            {...toast}
            onClose={() => removeToast(toast.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

// Initialiser container toast
let containerInitialized = false

function initToastContainer() {
  if (containerInitialized) return
  
  let container = document.getElementById(toastContainerId)
  
  if (!container) {
    container = document.createElement('div')
    container.id = toastContainerId + '-root'
    document.body.appendChild(container)
    
    const root = createRoot(container)
    root.render(<ToastContainer />)
    
    containerInitialized = true
  }
}

// API publique
export const showToast = {
  success: (message, duration) => {
    initToastContainer()
    window.__addToast?.({ type: 'success', message, duration })
  },
  error: (message, duration) => {
    initToastContainer()
    window.__addToast?.({ type: 'error', message, duration })
  },
  warning: (message, duration) => {
    initToastContainer()
    window.__addToast?.({ type: 'warning', message, duration })
  },
  info: (message, duration) => {
    initToastContainer()
    window.__addToast?.({ type: 'info', message, duration })
  }
}

export default ToastContainer
