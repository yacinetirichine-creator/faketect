import { memo } from 'react';
import { Search, ShieldCheck } from 'lucide-react';

const Logo = memo(({ size = 'md', animated = true, className = '', showIcon = true }) => {
  const sizes = {
    sm: { text: 'text-xl', icon: 16, spacing: 'gap-1.5' },
    md: { text: 'text-2xl', icon: 20, spacing: 'gap-2' },
    lg: { text: 'text-3xl', icon: 26, spacing: 'gap-2.5' },
    xl: { text: 'text-4xl', icon: 32, spacing: 'gap-3' }
  };

  const { text, icon, spacing } = sizes[size] || sizes.md;

  return (
    <div className={`flex items-center ${spacing} ${className}`}>
      {showIcon && (
        <div className="relative">
          {/* Magnifying glass with glow */}
          <div className={`relative ${animated ? 'animate-pulse' : ''}`}>
            <Search
              size={icon}
              className="text-cyan-400 drop-shadow-[0_0_8px_rgba(34,211,238,0.6)]"
              strokeWidth={2.5}
            />
            {/* Scan beam effect */}
            {animated && (
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-scan opacity-80" />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Text Logo */}
      <div className={`font-bold tracking-wide ${text} flex items-center`}>
        {/* FAKE part with gradient */}
        <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 bg-clip-text text-transparent font-extrabold">
          FAKE
        </span>
        {/* TECT part */}
        <span className="text-white font-extrabold">
          TECT
        </span>
        {/* Checkmark */}
        <ShieldCheck
          size={icon * 0.9}
          className={`ml-0.5 text-emerald-400 drop-shadow-[0_0_6px_rgba(52,211,153,0.5)] ${animated ? 'animate-bounce-subtle' : ''}`}
          strokeWidth={2.5}
        />
      </div>
    </div>
  );
});

Logo.displayName = 'Logo';

export default Logo;
