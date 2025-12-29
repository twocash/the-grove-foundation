// src/surface/components/KineticStream/Stream/motion/GlassContainer.tsx
// Glass effect wrapper component
// Sprint: kinetic-experience-v1

import React from 'react';
import { motion } from 'framer-motion';
import { blockVariants } from './variants';

export interface GlassContainerProps {
  children: React.ReactNode;
  intensity?: 'subtle' | 'medium' | 'elevated';
  variant?: 'default' | 'user' | 'assistant' | 'error';
  className?: string;
}

const intensityClasses = {
  subtle: 'bg-[var(--glass-surface)]/50',
  medium: 'bg-[var(--glass-solid)]/85',
  elevated: 'bg-[var(--glass-elevated)]'
};

const variantClasses = {
  default: 'border-[var(--glass-border)]',
  user: 'border-[var(--neon-cyan)]/30',
  assistant: 'border-[var(--neon-green)]/30',
  error: 'border-red-500/30'
};

export const GlassContainer: React.FC<GlassContainerProps> = ({
  children,
  intensity = 'medium',
  variant = 'default',
  className = ''
}) => {
  return (
    <motion.div
      variants={blockVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`
        ${intensityClasses[intensity]}
        ${variantClasses[variant]}
        border rounded-xl
        backdrop-blur-sm
        shadow-lg
        ${className}
      `}
    >
      {children}
    </motion.div>
  );
};

export default GlassContainer;
