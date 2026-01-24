import { memo, useState } from 'react';

const Logo = memo(({ size = 'md', className = '', variant = 'image' }) => {
  const [imageError, setImageError] = useState(false);

  // Tailles pour le logo image
  const imageSizes = {
    sm: 'h-8',
    md: 'h-10',
    lg: 'h-12',
    xl: 'h-16',
    '2xl': 'h-20'
  };

  const imageHeight = imageSizes[size] || imageSizes.md;

  // Si mode image et l'image existe
  if (variant === 'image' && !imageError) {
    return (
      <div className={`flex items-center ${className}`}>
        <img
          src="/images/logo.png"
          alt="FakeTect - Détection de deepfakes IA"
          className={`${imageHeight} w-auto object-contain`}
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Fallback: Logo texte simple
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-purple-600 flex items-center justify-center">
        <svg viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" className="w-5 h-5">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
      </div>
      <span className="text-xl font-bold">
        <span className="bg-gradient-to-r from-purple-500 via-pink-500 to-cyan-400 bg-clip-text text-transparent">FAKE</span>
        <span className="text-white">TECT</span>
      </span>
    </div>
  );
});

Logo.displayName = 'Logo';

export default Logo;
