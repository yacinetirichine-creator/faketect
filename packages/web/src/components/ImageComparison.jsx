/**
 * Composant de comparaison côte-à-côte de 2 images
 * Avec slider interactif pour voir différences
 */
import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { X, Download, Maximize2, ZoomIn, ZoomOut, RefreshCw } from 'lucide-react'
import { fadeInUp, scaleIn } from '../utils/animations'

export default function ImageComparison({ image1, image2, onClose }) {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [zoom, setZoom] = useState(1)
  const containerRef = useRef(null)

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isDragging || !containerRef.current) return
      
      const rect = containerRef.current.getBoundingClientRect()
      const x = e.clientX - rect.left
      const percentage = (x / rect.width) * 100
      setSliderPosition(Math.max(0, Math.min(100, percentage)))
    }

    const handleMouseUp = () => setIsDragging(false)

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isDragging])

  const handleDownload = async (url, name) => {
    try {
      const response = await fetch(url)
      const blob = await response.blob()
      const link = document.createElement('a')
      link.href = URL.createObjectURL(blob)
      link.download = name
      link.click()
      URL.revokeObjectURL(link.href)
    } catch (err) {
      console.error('Erreur téléchargement:', err)
    }
  }

  return (
    <motion.div
      variants={scaleIn}
      initial="initial"
      animate="animate"
      exit="exit"
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        variants={fadeInUp}
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-900 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-xl font-bold">Comparaison d'images</h3>
          
          <div className="flex items-center gap-2">
            {/* Zoom controls */}
            <button
              onClick={() => setZoom(Math.max(1, zoom - 0.25))}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              disabled={zoom <= 1}
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            
            <span className="text-sm text-gray-400 min-w-[4rem] text-center">
              {(zoom * 100).toFixed(0)}%
            </span>
            
            <button
              onClick={() => setZoom(Math.min(3, zoom + 0.25))}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
              disabled={zoom >= 3}
            >
              <ZoomIn className="w-5 h-5" />
            </button>
            
            <button
              onClick={() => setZoom(1)}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
            
            <div className="w-px h-6 bg-white/10 mx-2"></div>
            
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Comparison container */}
        <div className="relative bg-black overflow-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          <div
            ref={containerRef}
            className="relative mx-auto"
            style={{
              width: 'fit-content',
              cursor: isDragging ? 'grabbing' : 'grab'
            }}
          >
            {/* Image 2 (background) */}
            <div className="relative">
              <img
                src={image2.url}
                alt={image2.name}
                className="block"
                style={{
                  transform: `scale(${zoom})`,
                  transformOrigin: 'top left'
                }}
              />
              
              {/* Image 1 (overlay with clip) */}
              <div
                className="absolute top-0 left-0 right-0 bottom-0 overflow-hidden"
                style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}
              >
                <img
                  src={image1.url}
                  alt={image1.name}
                  className="block"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top left'
                  }}
                />
              </div>

              {/* Slider */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl cursor-ew-resize"
                style={{ left: `${sliderPosition}%` }}
                onMouseDown={() => setIsDragging(true)}
              >
                {/* Slider handle */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-xl flex items-center justify-center">
                  <div className="w-4 h-0.5 bg-gray-900"></div>
                </div>
              </div>

              {/* Labels */}
              <div className="absolute top-4 left-4 bg-black/70 backdrop-blur px-3 py-1.5 rounded-lg text-sm">
                {image1.name}
              </div>
              <div className="absolute top-4 right-4 bg-black/70 backdrop-blur px-3 py-1.5 rounded-lg text-sm">
                {image2.name}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-white/10">
          <div className="text-sm text-gray-400">
            Déplacez le slider pour comparer les images
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => handleDownload(image1.url, image1.name)}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              {image1.name}
            </button>
            <button
              onClick={() => handleDownload(image2.url, image2.name)}
              className="btn-secondary flex items-center gap-2 text-sm"
            >
              <Download className="w-4 h-4" />
              {image2.name}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}
