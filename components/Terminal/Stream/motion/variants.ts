// components/Terminal/Stream/motion/variants.ts
// Animation variants for stream blocks
// Sprint: kinetic-stream-polish-v1

import type { Variants } from 'framer-motion';

/**
 * Standard block entrance/exit animation.
 * Used as default for all stream blocks.
 */
export const blockVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    transition: { duration: 0.2 }
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  exit: {
    opacity: 0,
    y: -10,
    transition: { duration: 0.2, ease: 'easeIn' }
  }
};

/**
 * Query block animation - slides in from right.
 * Creates visual distinction for user messages.
 */
export const queryVariants: Variants = {
  hidden: {
    opacity: 0,
    x: 20
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  exit: {
    opacity: 0,
    x: 10,
    transition: { duration: 0.2, ease: 'easeIn' }
  }
};

/**
 * Response block animation - slides in from left.
 * Creates visual distinction for AI responses.
 */
export const responseVariants: Variants = {
  hidden: {
    opacity: 0,
    x: -20
  },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.3, ease: 'easeOut' }
  },
  exit: {
    opacity: 0,
    x: -10,
    transition: { duration: 0.2, ease: 'easeIn' }
  }
};

/**
 * System block animation - fade only.
 * Subtle entrance for status messages.
 */
export const systemVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 }
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 }
  }
};

/**
 * Container for staggered children.
 * Apply to parent, use staggerItem on children.
 */
export const staggerContainer: Variants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1
    }
  }
};

/**
 * Individual staggered item.
 * Use inside a staggerContainer parent.
 */
export const staggerItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.2 }
  }
};

/**
 * Reduced motion variants - instant transitions.
 * Used when prefers-reduced-motion is set.
 */
export const reducedMotionVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0 } },
  exit: { opacity: 0, transition: { duration: 0 } }
};
