import { memo } from 'react';

/**
 * Skeleton loader component for better UX during loading states
 * Provides visual feedback while content is loading
 */

// Base skeleton with shimmer animation
export const Skeleton = memo(({ className = '', ...props }) => (
  <div
    className={`animate-pulse bg-gradient-to-r from-white/5 via-white/10 to-white/5 bg-[length:200%_100%] rounded-lg ${className}`}
    {...props}
  />
));

// Text line skeleton
export const SkeletonText = memo(({ lines = 1, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <Skeleton
        key={i}
        className={`h-4 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`}
      />
    ))}
  </div>
));

// Avatar/image skeleton
export const SkeletonAvatar = memo(({ size = 'md', className = '' }) => {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };
  return <Skeleton className={`${sizes[size]} rounded-full ${className}`} />;
});

// Card skeleton
export const SkeletonCard = memo(({ className = '' }) => (
  <div className={`card space-y-4 ${className}`}>
    <div className="flex items-center gap-4">
      <SkeletonAvatar size="md" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
    </div>
    <SkeletonText lines={3} />
    <div className="flex gap-2">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-20" />
    </div>
  </div>
));

// Table row skeleton
export const SkeletonTableRow = memo(({ columns = 5 }) => (
  <tr className="border-b border-white/5">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton className="h-4 w-full" />
      </td>
    ))}
  </tr>
));

// Analysis card skeleton
export const SkeletonAnalysisCard = memo(({ className = '' }) => (
  <div className={`card ${className}`}>
    <div className="flex items-start gap-4">
      <Skeleton className="w-16 h-16 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
      </div>
      <Skeleton className="w-20 h-8 rounded-full" />
    </div>
    <div className="mt-4 pt-4 border-t border-white/10">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-4 w-16" />
      </div>
    </div>
  </div>
));

// Stats card skeleton
export const SkeletonStats = memo(({ className = '' }) => (
  <div className={`card text-center ${className}`}>
    <Skeleton className="h-8 w-16 mx-auto mb-2" />
    <Skeleton className="h-4 w-24 mx-auto" />
  </div>
));

// Dashboard skeleton
export const SkeletonDashboard = memo(() => (
  <div className="space-y-6" role="status" aria-label="Chargement du dashboard">
    {/* Stats row */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <SkeletonStats key={i} />
      ))}
    </div>

    {/* Main content */}
    <div className="grid lg:grid-cols-2 gap-6">
      <SkeletonCard />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonAnalysisCard key={i} />
        ))}
      </div>
    </div>
  </div>
));

// Pricing skeleton
export const SkeletonPricing = memo(() => (
  <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-6" role="status" aria-label="Chargement des tarifs">
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="card space-y-4">
        <Skeleton className="h-6 w-2/3 mx-auto" />
        <Skeleton className="h-10 w-1/2 mx-auto" />
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, j) => (
            <Skeleton key={j} className="h-4 w-full" />
          ))}
        </div>
        <Skeleton className="h-12 w-full rounded-xl" />
      </div>
    ))}
  </div>
));

Skeleton.displayName = 'Skeleton';
SkeletonText.displayName = 'SkeletonText';
SkeletonAvatar.displayName = 'SkeletonAvatar';
SkeletonCard.displayName = 'SkeletonCard';
SkeletonTableRow.displayName = 'SkeletonTableRow';
SkeletonAnalysisCard.displayName = 'SkeletonAnalysisCard';
SkeletonStats.displayName = 'SkeletonStats';
SkeletonDashboard.displayName = 'SkeletonDashboard';
SkeletonPricing.displayName = 'SkeletonPricing';

export default Skeleton;
