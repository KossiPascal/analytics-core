import type { Variants, Transition } from 'framer-motion';

// Default transition for page animations
const pageTransition: Transition = {
  type: 'tween',
  ease: 'easeOut',
  duration: 0.3,
};

// Slide from left to right
export const pageSlideVariants: Variants = {
  initial: {
    opacity: 0,
    x: -20,
  },
  animate: {
    opacity: 1,
    x: 0,
    transition: pageTransition,
  },
  exit: {
    opacity: 0,
    x: 20,
    transition: {
      ...pageTransition,
      duration: 0.2,
    },
  },
};

// Fade in/out
export const pageFadeVariants: Variants = {
  initial: {
    opacity: 0,
  },
  animate: {
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.2,
      ease: 'easeIn',
    },
  },
};

// Scale and fade
export const pageScaleVariants: Variants = {
  initial: {
    opacity: 0,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
  exit: {
    opacity: 0,
    scale: 0.98,
    transition: {
      duration: 0.2,
    },
  },
};

// Slide up
export const pageSlideUpVariants: Variants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: pageTransition,
  },
  exit: {
    opacity: 0,
    y: -20,
    transition: {
      ...pageTransition,
      duration: 0.2,
    },
  },
};

// Blur fade (for auth pages)
export const pageBlurFadeVariants: Variants = {
  initial: {
    opacity: 0,
    filter: 'blur(10px)',
  },
  animate: {
    opacity: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.4,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    filter: 'blur(10px)',
    transition: {
      duration: 0.3,
    },
  },
};

// Default page variants (recommended)
export const pageVariants = pageSlideVariants;
