// src/surface/components/KineticStream/Stream/motion/variants.ts
// Framer Motion variants for Kinetic Stream
// Sprint: kinetic-experience-v1

import type { Variants } from 'framer-motion';

export const blockVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.98
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: [0.25, 0.46, 0.45, 0.94]
    }
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: {
      duration: 0.2
    }
  }
};

export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

export const staggerItem: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.2
    }
  }
};

export const reducedMotionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 }
};
