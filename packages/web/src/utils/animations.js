/**
 * Animations réutilisables avec Framer Motion
 */

// Animations de fade in
export const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 }
}

export const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4, ease: 'easeOut' }
}

export const fadeInDown = {
  initial: { opacity: 0, y: -20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 20 },
  transition: { duration: 0.4, ease: 'easeOut' }
}

export const fadeInLeft = {
  initial: { opacity: 0, x: -20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 20 },
  transition: { duration: 0.4, ease: 'easeOut' }
}

export const fadeInRight = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.4, ease: 'easeOut' }
}

// Animations de scale
export const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { duration: 0.3, ease: 'easeOut' }
}

export const scaleUp = {
  initial: { scale: 0.95 },
  animate: { scale: 1 },
  whileHover: { scale: 1.02 },
  whileTap: { scale: 0.98 },
  transition: { duration: 0.2 }
}

// Animation de slide
export const slideInRight = {
  initial: { x: '100%' },
  animate: { x: 0 },
  exit: { x: '100%' },
  transition: { type: 'spring', damping: 25, stiffness: 300 }
}

export const slideInLeft = {
  initial: { x: '-100%' },
  animate: { x: 0 },
  exit: { x: '-100%' },
  transition: { type: 'spring', damping: 25, stiffness: 300 }
}

export const slideInUp = {
  initial: { y: '100%' },
  animate: { y: 0 },
  exit: { y: '100%' },
  transition: { type: 'spring', damping: 25, stiffness: 300 }
}

export const slideInDown = {
  initial: { y: '-100%' },
  animate: { y: 0 },
  exit: { y: '-100%' },
  transition: { type: 'spring', damping: 25, stiffness: 300 }
}

// Animation de rotation
export const rotate = {
  animate: { rotate: 360 },
  transition: { duration: 2, repeat: Infinity, ease: 'linear' }
}

export const rotateIn = {
  initial: { opacity: 0, rotate: -180 },
  animate: { opacity: 1, rotate: 0 },
  exit: { opacity: 0, rotate: 180 },
  transition: { duration: 0.5, ease: 'easeOut' }
}

// Animation de bounce
export const bounce = {
  animate: { 
    y: [0, -10, 0],
    transition: { 
      duration: 0.6, 
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
}

// Animation de pulse
export const pulse = {
  animate: { 
    scale: [1, 1.05, 1],
    transition: { 
      duration: 2, 
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
}

// Animation de shake
export const shake = {
  animate: { 
    x: [0, -10, 10, -10, 10, 0],
    transition: { 
      duration: 0.4,
      ease: 'easeInOut'
    }
  }
}

// Stagger children (pour listes)
export const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1
    }
  }
}

export const staggerItem = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.4, ease: 'easeOut' }
}

// Animation de card hover
export const cardHover = {
  whileHover: { 
    y: -5,
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
    transition: { duration: 0.2 }
  },
  whileTap: { 
    scale: 0.98 
  }
}

// Animation de bouton
export const buttonHover = {
  whileHover: { 
    scale: 1.05,
    transition: { duration: 0.2 }
  },
  whileTap: { 
    scale: 0.95 
  }
}

// Animation modale
export const modalBackdrop = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.2 }
}

export const modalContent = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.95, y: 20 },
  transition: { duration: 0.3, ease: 'easeOut' }
}

// Animation de progress bar
export const progressBar = (progress) => ({
  initial: { width: 0 },
  animate: { width: `${progress}%` },
  transition: { duration: 0.5, ease: 'easeOut' }
})

// Animation de typing indicator
export const typingDot = (delay = 0) => ({
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 0.6,
      repeat: Infinity,
      delay,
      ease: 'easeInOut'
    }
  }
})

// Animation de notification badge
export const notificationBadge = {
  initial: { scale: 0 },
  animate: { 
    scale: 1,
    transition: { type: 'spring', stiffness: 500, damping: 15 }
  },
  exit: { 
    scale: 0,
    transition: { duration: 0.2 }
  }
}

// Animation de flip
export const flip = {
  initial: { rotateY: 0 },
  animate: { rotateY: 180 },
  transition: { duration: 0.6, ease: 'easeInOut' }
}

// Animation de reveal (pour texte)
export const reveal = {
  initial: { clipPath: 'inset(0 100% 0 0)' },
  animate: { clipPath: 'inset(0 0% 0 0)' },
  transition: { duration: 0.6, ease: 'easeInOut' }
}

// Animation de skeleton loading
export const skeletonPulse = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      repeat: Infinity,
      ease: 'easeInOut'
    }
  }
}

// Variants pour navigation
export const navItemHover = {
  initial: { scale: 1 },
  whileHover: { 
    scale: 1.05,
    color: '#8b5cf6',
    transition: { duration: 0.2 }
  },
  whileTap: { scale: 0.95 }
}

// Animation de success checkmark
export const checkmark = {
  initial: { pathLength: 0, opacity: 0 },
  animate: { 
    pathLength: 1, 
    opacity: 1,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
}
