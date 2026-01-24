import { memo } from 'react';
import { motion } from 'framer-motion';

/**
 * Page transition wrapper component
 * Provides smooth fade/slide animations when navigating between pages
 */

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

const fadeVariants = {
  initial: { opacity: 0 },
  animate: {
    opacity: 1,
    transition: { duration: 0.3 }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.2 }
  }
};

const slideVariants = {
  initial: {
    opacity: 0,
    x: 20
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  exit: {
    opacity: 0,
    x: -20,
    transition: {
      duration: 0.2,
      ease: 'easeIn'
    }
  }
};

export const PageTransition = memo(({
  children,
  variant = 'default',
  className = ''
}) => {
  const variants = {
    default: pageVariants,
    fade: fadeVariants,
    slide: slideVariants
  };

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={variants[variant]}
      className={className}
    >
      {children}
    </motion.div>
  );
});

PageTransition.displayName = 'PageTransition';

// Staggered children animation
export const StaggerContainer = memo(({ children, className = '', delay = 0.1 }) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: delay
        }
      }
    }}
    className={className}
  >
    {children}
  </motion.div>
));

export const StaggerItem = memo(({ children, className = '' }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: {
        opacity: 1,
        y: 0,
        transition: { duration: 0.3 }
      }
    }}
    className={className}
  >
    {children}
  </motion.div>
));

StaggerContainer.displayName = 'StaggerContainer';
StaggerItem.displayName = 'StaggerItem';

export default PageTransition;
