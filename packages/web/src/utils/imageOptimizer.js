/**
 * Utilitaires d'optimisation d'images
 * - Lazy loading
 * - Compression
 * - WebP conversion
 * - Responsive images
 */

/**
 * Compresser une image avant upload
 * @param {File} file - Fichier image à compresser
 * @param {Object} options - Options de compression
 * @returns {Promise<File>} - Image compressée
 */
export async function compressImage(file, options = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.85,
    format = 'image/jpeg'
  } = options

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        // Calculer dimensions optimales
        let width = img.width
        let height = img.height
        
        if (width > maxWidth) {
          height = (height * maxWidth) / width
          width = maxWidth
        }
        
        if (height > maxHeight) {
          width = (width * maxHeight) / height
          height = maxHeight
        }
        
        // Créer canvas pour compression
        const canvas = document.createElement('canvas')
        canvas.width = width
        canvas.height = height
        
        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)
        
        // Convertir en blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Erreur compression image'))
              return
            }
            
            // Créer nouveau fichier compressé
            const compressedFile = new File(
              [blob],
              file.name.replace(/\.[^.]+$/, `.${format.split('/')[1]}`),
              { type: format }
            )
            
            console.log(`📉 Image compressée: ${(file.size / 1024).toFixed(0)}KB → ${(compressedFile.size / 1024).toFixed(0)}KB`)
            resolve(compressedFile)
          },
          format,
          quality
        )
      }
      
      img.onerror = () => reject(new Error('Erreur chargement image'))
      img.src = e.target.result
    }
    
    reader.onerror = () => reject(new Error('Erreur lecture fichier'))
    reader.readAsDataURL(file)
  })
}

/**
 * Vérifier si le navigateur supporte WebP
 * @returns {Promise<boolean>}
 */
export function supportsWebP() {
  return new Promise((resolve) => {
    const webP = 'data:image/webp;base64,UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAwA0JaQAA3AA/vuUAAA='
    const img = new Image()
    
    img.onload = () => resolve(img.width === 1)
    img.onerror = () => resolve(false)
    img.src = webP
  })
}

/**
 * Lazy loading observer pour images
 * @param {HTMLElement} element - Element à observer
 * @param {Function} callback - Callback quand visible
 */
export function observeLazyLoad(element, callback) {
  if (!('IntersectionObserver' in window)) {
    // Fallback: charger immédiatement
    callback()
    return null
  }
  
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          callback()
          observer.disconnect()
        }
      })
    },
    {
      rootMargin: '50px', // Charger 50px avant d'être visible
      threshold: 0.01
    }
  )
  
  observer.observe(element)
  return observer
}

/**
 * Générer srcset pour images responsive
 * @param {string} baseUrl - URL de base de l'image
 * @param {number[]} widths - Largeurs à générer
 * @returns {string} - Attribut srcset
 */
export function generateSrcSet(baseUrl, widths = [320, 640, 960, 1280, 1920]) {
  return widths
    .map(width => {
      // Ajouter paramètre width si URL supporte (ex: Cloudinary, Imgix)
      const separator = baseUrl.includes('?') ? '&' : '?'
      return `${baseUrl}${separator}w=${width} ${width}w`
    })
    .join(', ')
}

/**
 * Précharger image critique
 * @param {string} src - URL de l'image
 * @returns {Promise<void>}
 */
export function preloadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

/**
 * Convertir image en base64 optimisé (thumbnail)
 * @param {File} file - Fichier image
 * @param {number} maxSize - Taille max thumbnail (px)
 * @returns {Promise<string>} - Base64 string
 */
export async function createThumbnail(file, maxSize = 200) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    
    reader.onload = (e) => {
      const img = new Image()
      
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        
        // Calculer dimensions carrées
        const size = Math.min(img.width, img.height, maxSize)
        canvas.width = size
        canvas.height = size
        
        // Centrer l'image
        const offsetX = (img.width - size) / 2
        const offsetY = (img.height - size) / 2
        
        ctx.drawImage(img, offsetX, offsetY, size, size, 0, 0, size, size)
        
        resolve(canvas.toDataURL('image/jpeg', 0.7))
      }
      
      img.onerror = () => reject(new Error('Erreur création thumbnail'))
      img.src = e.target.result
    }
    
    reader.onerror = () => reject(new Error('Erreur lecture fichier'))
    reader.readAsDataURL(file)
  })
}

/**
 * Calculer ratio de compression optimal selon taille
 * @param {number} fileSize - Taille fichier en bytes
 * @returns {number} - Quality ratio (0-1)
 */
export function getOptimalQuality(fileSize) {
  const MB = fileSize / (1024 * 1024)
  
  if (MB < 1) return 0.9  // Petit fichier: haute qualité
  if (MB < 3) return 0.85 // Moyen: équilibré
  if (MB < 5) return 0.8  // Grand: compression modérée
  return 0.75             // Très grand: compression forte
}

/**
 * Cache manager pour images
 */
class ImageCache {
  constructor(maxSize = 50) {
    this.cache = new Map()
    this.maxSize = maxSize
  }
  
  set(key, value) {
    if (this.cache.size >= this.maxSize) {
      // Supprimer première entrée (FIFO)
      const firstKey = this.cache.keys().next().value
      this.cache.delete(firstKey)
    }
    this.cache.set(key, value)
  }
  
  get(key) {
    return this.cache.get(key)
  }
  
  has(key) {
    return this.cache.has(key)
  }
  
  clear() {
    this.cache.clear()
  }
}

export const imageCache = new ImageCache()
