// src/surface/components/KineticStream/Stream/blocks/MomentObject.tsx
// Inline moment card for engagement-triggered content
// Sprint: moment-ui-integration-v1

import React from 'react';
import { motion } from 'framer-motion';
import type { MomentStreamItem } from '@core/schema/stream';
import { GlassContainer } from '../motion/GlassContainer';

export interface MomentObjectProps {
  item: MomentStreamItem;
  onAction?: (momentId: string, actionId: string) => void;
  onDismiss?: (momentId: string) => void;
}

export const MomentObject: React.FC<MomentObjectProps> = ({
  item,
  onAction,
  onDismiss
}) => {
  // Hide dismissed moments
  if (item.status === 'dismissed') {
    return null;
  }

  const handleAction = (actionId: string) => {
    onAction?.(item.momentId, actionId);
  };

  const handleDismiss = () => {
    onDismiss?.(item.momentId);
  };

  // Show actioned confirmation state
  if (item.status === 'actioned') {
    return (
      <motion.div
        className="flex flex-col items-start"
        data-testid="moment-object"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
      >
        <GlassContainer
          intensity="elevated"
          variant="default"
          className="w-full max-w-[85%] px-5 py-4 border-[var(--holo-cyan)]/60"
        >
          <div className="flex items-center gap-3">
            <CheckIcon className="w-5 h-5 text-[var(--holo-cyan)]" />
            <span className="font-sans text-[13px] font-medium text-[var(--holo-cyan)]">
              {item.momentTitle}
            </span>
          </div>
        </GlassContainer>
      </motion.div>
    );
  }

  // Find primary, secondary, and dismiss actions
  const primaryAction = item.actions.find(a => a.variant === 'primary') || item.actions[0];
  const secondaryAction = item.actions.find(a => a.variant === 'secondary');
  const dismissAction = item.actions.find(a => a.type === 'dismiss');

  return (
    <div className="flex flex-col items-start" data-testid="moment-object">
      <GlassContainer
        intensity="elevated"
        variant="default"
        className="w-full max-w-[85%] px-5 py-4 border-[var(--holo-cyan)]/40"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Moment badge */}
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold text-emerald-300 border border-emerald-300/60">
                {item.content.icon && <MomentIcon icon={item.content.icon} className="w-3 h-3 mr-1" />}
                Suggestion
              </span>
            </div>

            {/* Heading */}
            {item.content.heading && (
              <h4 className="font-sans text-[14px] font-semibold text-[var(--glass-text-primary)] mb-1">
                {item.content.heading}
              </h4>
            )}

            {/* Body */}
            {item.content.body && (
              <p className="font-sans text-[13px] text-[var(--glass-text-body)] leading-relaxed">
                {item.content.body}
              </p>
            )}
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-md hover:bg-[var(--glass-surface)] transition-colors text-[var(--glass-text-subtle)] hover:text-[var(--glass-text-primary)]"
            aria-label="Dismiss"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Action buttons */}
        <div className="mt-4 flex gap-2">
          {primaryAction && (
            <motion.button
              onClick={() => handleAction(primaryAction.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-4 py-2 rounded-lg font-sans text-[13px] font-semibold
                bg-[var(--holo-cyan)] text-white
                hover:bg-[var(--holo-cyan)]/80 transition-colors
                shadow-[0_0_12px_rgba(0,255,255,0.3)]"
            >
              {primaryAction.label}
            </motion.button>
          )}
          {secondaryAction && (
            <motion.button
              onClick={() => handleAction(secondaryAction.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 px-4 py-2 rounded-lg font-sans text-[13px] font-medium
                bg-transparent text-[var(--glass-text-primary)]
                hover:bg-[var(--glass-surface)] transition-colors
                border border-[var(--holo-cyan)]/50"
            >
              {secondaryAction.label}
            </motion.button>
          )}
          {dismissAction && (
            <motion.button
              onClick={() => handleAction(dismissAction.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-4 py-2 rounded-lg font-sans text-[13px] font-medium
                bg-transparent text-[var(--glass-text-subtle)]
                hover:bg-[var(--glass-surface)] transition-colors
                border border-[var(--glass-border)]"
            >
              {dismissAction.label}
            </motion.button>
          )}
        </div>
      </GlassContainer>
    </div>
  );
};

// Dynamic icon based on moment content
const MomentIcon: React.FC<{ icon: string; className?: string }> = ({ icon, className }) => {
  switch (icon.toLowerCase()) {
    case 'compass':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
        </svg>
      );
    case 'sparkles':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 3v4m0 10v4M5.636 5.636l2.828 2.828m7.072 7.072l2.828 2.828M3 12h4m10 0h4M5.636 18.364l2.828-2.828m7.072-7.072l2.828-2.828" />
        </svg>
      );
    case 'lightbulb':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M9 18h6M10 22h4M12 2v1M4.22 4.22l.7.7m14.86-.7l-.7.7M3 12h1m17 0h-1M6.34 17.66l-.7.7m12.72-.7l.7.7" />
          <path d="M15 9a3 3 0 0 0-6 0c0 1.5.5 2.5 2 4h2c1.5-1.5 2-2.5 2-4Z" />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4M12 8h.01" />
        </svg>
      );
  }
};

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default MomentObject;
