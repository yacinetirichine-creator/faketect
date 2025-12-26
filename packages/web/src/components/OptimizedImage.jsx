/**
 * Composant Image optimisé avec lazy loading et compression
 */
import { useState, useEffect, useRef } from 'react'
import { observeLazyLoad } from '../utils/imageOptimizer'

export default function OptimizedImage({ 
  src, 
  alt, 
  className = '',
  width,
  height,
  lazy = true,
  placeholder = 'blur',
  onLoad,
  onError,
  ...props 
}) {
  const [loaded, setLoaded] = useState(!lazy)
  const [error, setError] = useState(false)
  const [imageSrc, setImageSrc] = useState(lazy ? null : src)
  const imgRef = useRef(null)
  const observerRef = useRef(null)

  useEffect(() => {
    if (!lazy || !imgRef.current) return

    // Observer lazy loading
    observerRef.current = observeLazyLoad(imgRef.current, () => {
      setImageSrc(src)
    })

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [src, lazy])

  const handleLoad = (e) => {
    setLoaded(true)
    if (onLoad) onLoad(e)
  }

  const handleError = (e) => {
    setError(true)
    if (onError) onError(e)
  }

  // Placeholder pendant chargement
  if (!imageSrc && lazy) {
    return (
      <div
        ref={imgRef}
        className={`bg-gray-800 animate-pulse ${className}`}
        style={{ width, height }}
        aria-label={`Chargement: ${alt}`}
      />
    )
  }

  // Image erreur
  if (error) {
    return (
      <div
        className={`bg-gray-800 flex items-center justify-center text-gray-500 ${className}`}
        style={{ width, height }}
      >
        <span className="text-xs">Image non chargée</span>
      </div>
    )
  }

  return (
    <div className="relative" style={{ width, height }}>
      {/* Placeholder blur pendant chargement */}
      {!loaded && placeholder === 'blur' && (
        <div
          className={`absolute inset-0 bg-gray-800 animate-pulse ${className}`}
        />
      )}
      
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className={`${className} ${!loaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`}
        width={width}
        height={height}
        loading={lazy ? 'lazy' : 'eager'}
        onLoad={handleLoad}
        onError={handleError}
        {...props}
      />
    </div>
  )
}

/**
 * Hook pour précharger images critiques
 */
export function usePreloadImages(images) {
  useEffect(() => {
    images.forEach(src => {
      const img = new Image()
      img.src = src
    })
  }, [images])
}
