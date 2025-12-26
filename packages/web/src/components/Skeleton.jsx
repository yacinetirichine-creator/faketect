/**
 * Composant Loading Skeleton pour améliorer UX pendant chargement
 */

export function Skeleton({ className = '', width, height, variant = 'rectangular' }) {
  const baseClass = 'animate-pulse bg-gray-800/50'
  
  const variants = {
    rectangular: 'rounded',
    circular: 'rounded-full',
    text: 'rounded h-4'
  }
  
  const style = {
    width: width || '100%',
    height: height || (variant === 'text' ? '1rem' : '100%')
  }
  
  return (
    <div 
      className={`${baseClass} ${variants[variant]} ${className}`}
      style={style}
    />
  )
}

// Skeleton pour carte
export function CardSkeleton({ rows = 3 }) {
  return (
    <div className="bg-gray-900 rounded-xl p-6 space-y-4">
      <Skeleton width="60%" height="24px" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} height="16px" />
      ))}
    </div>
  )
}

// Skeleton pour table
export function TableSkeleton({ rows = 5, columns = 4 }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height="20px" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <div key={rowIdx} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, colIdx) => (
            <Skeleton key={colIdx} height="16px" />
          ))}
        </div>
      ))}
    </div>
  )
}

// Skeleton pour liste d'images
export function ImageGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="aspect-square">
          <Skeleton className="w-full h-full" />
        </div>
      ))}
    </div>
  )
}

// Skeleton pour stats card
export function StatCardSkeleton() {
  return (
    <div className="bg-gray-900 rounded-xl p-6">
      <Skeleton width="40%" height="16px" className="mb-3" />
      <Skeleton width="60%" height="32px" className="mb-2" />
      <Skeleton width="50%" height="14px" />
    </div>
  )
}

// Skeleton pour profil utilisateur
export function UserProfileSkeleton() {
  return (
    <div className="flex items-center gap-4 p-4">
      <Skeleton variant="circular" width="64px" height="64px" />
      <div className="flex-1 space-y-2">
        <Skeleton width="40%" height="20px" />
        <Skeleton width="60%" height="16px" />
      </div>
    </div>
  )
}

// Skeleton pour ligne de texte
export function TextSkeleton({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          variant="text" 
          width={i === lines - 1 ? '70%' : '100%'} 
        />
      ))}
    </div>
  )
}
