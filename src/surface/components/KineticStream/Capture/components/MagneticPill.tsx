// src/surface/components/KineticStream/Capture/components/MagneticPill.tsx
// Magnetic pill for sprout capture activation
// Sprint: kinetic-cultivation-v1

import React, { useState, useEffect } from 'react';
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { SPROUT_CAPTURE_CONFIG } from '../config/sprout-capture.config';

interface MagneticPillProps {
  position: { x: number; y: number };
  onActivate: () => void;
  layoutId: string;
}

export const MagneticPill: React.FC<MagneticPillProps> = ({
  position,
  onActivate,
  layoutId
}) => {
  const { magneticScale, magneticDistance } = SPROUT_CAPTURE_CONFIG.ui.pill;
  const { pillSpring } = SPROUT_CAPTURE_CONFIG.animation;

  const [isHovered, setIsHovered] = useState(false);

  // Calculate distance from mouse to pill center
  const distance = useMotionValue(magneticDistance + 1);

  // Scale based on proximity
  const scale = useSpring(
    useTransform(distance, [0, magneticDistance], [magneticScale, 1]),
    pillSpring
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - position.x;
      const dy = e.clientY - position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      distance.set(dist);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [position.x, position.y, distance]);

  // Clamp to viewport
  const clampedX = Math.min(Math.max(position.x, 30), window.innerWidth - 30);
  const clampedY = Math.min(Math.max(position.y, 30), window.innerHeight - 30);

  return (
    <motion.button
      layoutId={layoutId}
      className="fixed z-50 flex items-center justify-center w-8 h-8 rounded-full
                 bg-[var(--neon-green)] hover:bg-[var(--neon-cyan)]
                 text-white shadow-lg shadow-[var(--neon-green)]/30
                 backdrop-blur-sm cursor-pointer
                 focus:outline-none focus:ring-2 focus:ring-white/30
                 transition-colors duration-150"
      style={{
        left: clampedX,
        top: clampedY,
        translateX: '-50%',
        translateY: '-50%',
        scale,
      }}
      onClick={(e) => {
        e.stopPropagation();
        onActivate();
      }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      aria-label="Capture as Sprout"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      whileTap={{ scale: 0.9 }}
    >
      <span className="text-sm" role="img" aria-hidden="true">
        {SPROUT_CAPTURE_CONFIG.defaultAction.icon}
      </span>
    </motion.button>
  );
};

export default MagneticPill;
