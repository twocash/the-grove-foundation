// components/Terminal/Stream/motion/GlassPanel.tsx
// Reusable glass effect panel with motion support
// Sprint: kinetic-stream-polish-v1

import React, { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

type GlassIntensity = 'light' | 'medium' | 'heavy';

interface GlassPanelProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  intensity?: GlassIntensity;
  className?: string;
}

const intensityClasses: Record<GlassIntensity, string> = {
  light: 'glass-panel-light',
  medium: 'glass-panel-medium',
  heavy: 'glass-panel-heavy'
};

/**
 * Reusable glass effect panel.
 * Supports three intensity levels and forwards all Framer Motion props.
 */
export function GlassPanel({
  children,
  intensity = 'medium',
  className = '',
  ...motionProps
}: GlassPanelProps) {
  const classes = `glass-panel ${intensityClasses[intensity]} ${className}`.trim();

  return (
    <motion.div className={classes} {...motionProps}>
      {children}
    </motion.div>
  );
}

export default GlassPanel;
