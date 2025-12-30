// src/surface/components/KineticStream/Capture/components/MagneticPill.tsx
// Magnetic pill for sprout capture activation
// Sprint: kinetic-cultivation-v1, sprout-declarative-v1

import React, { useState, useEffect, useCallback } from 'react';
import { motion, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { SPROUT_CAPTURE_CONFIG } from '../config/sprout-capture.config';
import { ActionMenu } from './ActionMenu';
import type { SelectionAction } from '../hooks/useSelectionActions';

interface MagneticPillProps {
  position: { x: number; y: number };
  /** @deprecated Use onActionSelect for multi-action support */
  onActivate?: () => void;
  /** Called when an action is selected (sprout-declarative-v1) */
  onActionSelect?: (actionId: string) => void;
  /** Available capture actions (sprout-declarative-v1) */
  actions?: SelectionAction[];
  layoutId: string;
}

export const MagneticPill: React.FC<MagneticPillProps> = ({
  position,
  onActivate,
  onActionSelect,
  actions,
  layoutId
}) => {
  const { magneticScale, magneticDistance } = SPROUT_CAPTURE_CONFIG.ui.pill;
  const { pillSpring } = SPROUT_CAPTURE_CONFIG.animation;

  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Determine if we should show multi-action menu
  const hasMultipleActions = actions && actions.length > 1;
  const defaultAction = actions?.[0];
  const displayIcon = defaultAction?.icon ?? SPROUT_CAPTURE_CONFIG.defaultAction.icon;

  // Scale based on proximity (sprout-declarative-v1: fixed inversion bug)
  // Scale increases as cursor approaches, decreases as cursor moves away
  const scaleValue = useMotionValue(1);
  const scale = useSpring(scaleValue, pillSpring);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - position.x;
      const dy = e.clientY - position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Proximity: 1 when at pill, 0 when at or beyond magneticDistance
      const proximity = Math.max(0, 1 - (dist / magneticDistance));
      // Scale: 1.0 at edge, magneticScale when touching
      const newScale = 1 + proximity * (magneticScale - 1);
      scaleValue.set(newScale);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [position.x, position.y, magneticDistance, magneticScale, scaleValue]);

  // Handle pill click
  const handleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();

    if (hasMultipleActions) {
      // Show action menu for multi-action
      setShowMenu(true);
    } else if (onActionSelect && defaultAction) {
      // Single action with new handler
      onActionSelect(defaultAction.id);
    } else if (onActivate) {
      // Legacy single action handler
      onActivate();
    }
  }, [hasMultipleActions, onActionSelect, defaultAction, onActivate]);

  // Handle action selection from menu
  const handleActionSelect = useCallback((actionId: string) => {
    setShowMenu(false);
    onActionSelect?.(actionId);
  }, [onActionSelect]);

  // Handle menu close
  const handleMenuClose = useCallback(() => {
    setShowMenu(false);
  }, []);

  // Clamp to viewport
  const clampedX = Math.min(Math.max(position.x, 30), window.innerWidth - 30);
  const clampedY = Math.min(Math.max(position.y, 30), window.innerHeight - 30);

  return (
    <>
      <motion.button
        layoutId={layoutId}
        data-capture-ui="pill"
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
        onMouseDown={(e) => e.preventDefault()}
        onClick={handleClick}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        aria-label={hasMultipleActions ? 'Choose capture action' : 'Capture as Sprout'}
        aria-haspopup={hasMultipleActions ? 'menu' : undefined}
        aria-expanded={hasMultipleActions ? showMenu : undefined}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.5 }}
        whileTap={{ scale: 0.9 }}
      >
        <span className="text-sm" role="img" aria-hidden="true">
          {displayIcon}
        </span>
        {/* Multi-action indicator */}
        {hasMultipleActions && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full
                          bg-[var(--neon-cyan)] border border-[var(--glass-solid)]" />
        )}
      </motion.button>

      {/* Action menu (sprout-declarative-v1) */}
      <AnimatePresence>
        {showMenu && actions && (
          <ActionMenu
            actions={actions}
            position={{ x: clampedX + 20, y: clampedY }}
            onSelect={handleActionSelect}
            onClose={handleMenuClose}
          />
        )}
      </AnimatePresence>
    </>
  );
};

export default MagneticPill;
