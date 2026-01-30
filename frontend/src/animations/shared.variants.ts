import type { Variants } from 'framer-motion';

// ============================================
// BUTTON ANIMATIONS
// ============================================

export const buttonTapVariants: Variants = {
  tap: {
    scale: 0.98,
    transition: {
      duration: 0.1,
    },
  },
};

export const buttonHoverVariants: Variants = {
  hover: {
    scale: 1.02,
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
};

// ============================================
// ICON ANIMATIONS
// ============================================

export const iconSpinVariants: Variants = {
  animate: {
    rotate: 360,
    transition: {
      duration: 1,
      ease: 'linear',
      repeat: Infinity,
    },
  },
};

export const iconPulseVariants: Variants = {
  animate: {
    scale: [1, 1.1, 1],
    transition: {
      duration: 1.5,
      ease: 'easeInOut',
      repeat: Infinity,
    },
  },
};

export const iconBounceVariants: Variants = {
  animate: {
    y: [0, -5, 0],
    transition: {
      duration: 0.6,
      ease: 'easeInOut',
      repeat: Infinity,
    },
  },
};

// ============================================
// COLLAPSE/EXPAND ANIMATIONS
// ============================================

export const collapseVariants: Variants = {
  initial: {
    height: 0,
    opacity: 0,
  },
  animate: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: {
        duration: 0.3,
        ease: 'easeOut',
      },
      opacity: {
        duration: 0.2,
        delay: 0.1,
      },
    },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: {
      height: {
        duration: 0.25,
        ease: 'easeIn',
      },
      opacity: {
        duration: 0.15,
      },
    },
  },
};

// ============================================
// SIDEBAR ANIMATIONS
// ============================================

export const sidebarVariants: Variants = {
  expanded: {
    width: 260,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  collapsed: {
    width: 72,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

export const sidebarItemTextVariants: Variants = {
  expanded: {
    opacity: 1,
    x: 0,
    display: 'block',
    transition: {
      duration: 0.2,
      delay: 0.1,
    },
  },
  collapsed: {
    opacity: 0,
    x: -10,
    transitionEnd: {
      display: 'none',
    },
    transition: {
      duration: 0.15,
    },
  },
};

// ============================================
// NOTIFICATION BADGE
// ============================================

export const badgeVariants: Variants = {
  initial: {
    scale: 0,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 15,
      stiffness: 400,
    },
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: {
      duration: 0.15,
    },
  },
};

// ============================================
// CHECKBOX/SWITCH ANIMATIONS
// ============================================

export const checkmarkVariants: Variants = {
  initial: {
    pathLength: 0,
    opacity: 0,
  },
  animate: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        duration: 0.25,
        ease: 'easeOut',
      },
      opacity: {
        duration: 0.1,
      },
    },
  },
};

export const switchKnobVariants: Variants = {
  off: {
    x: 2,
  },
  on: {
    x: 22,
    transition: {
      type: 'spring',
      damping: 20,
      stiffness: 300,
    },
  },
};

// ============================================
// PROGRESS ANIMATIONS
// ============================================

export const progressBarVariants: Variants = {
  initial: {
    width: '0%',
  },
  animate: (progress: number) => ({
    width: `${progress}%`,
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  }),
};

// ============================================
// SHAKE ANIMATION (for errors)
// ============================================

export const shakeVariants: Variants = {
  shake: {
    x: [0, -10, 10, -10, 10, 0],
    transition: {
      duration: 0.4,
    },
  },
};

// ============================================
// SKELETON LOADER
// ============================================

export const skeletonVariants: Variants = {
  animate: {
    opacity: [0.5, 1, 0.5],
    transition: {
      duration: 1.5,
      ease: 'easeInOut',
      repeat: Infinity,
    },
  },
};

// ============================================
// TAB INDICATOR
// ============================================

export const tabIndicatorVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.2,
    },
  },
};

// ============================================
// CARD HOVER EFFECTS
// ============================================

export const cardHoverVariants: Variants = {
  initial: {
    y: 0,
    boxShadow: 'var(--shadow-sm)',
  },
  hover: {
    y: -4,
    boxShadow: 'var(--shadow-lg)',
    transition: {
      duration: 0.2,
      ease: 'easeOut',
    },
  },
};

// ============================================
// FAB (Floating Action Button)
// ============================================

export const fabVariants: Variants = {
  initial: {
    scale: 0,
    opacity: 0,
  },
  animate: {
    scale: 1,
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 15,
      stiffness: 300,
      delay: 0.2,
    },
  },
  exit: {
    scale: 0,
    opacity: 0,
    transition: {
      duration: 0.15,
    },
  },
  tap: {
    scale: 0.9,
  },
};
