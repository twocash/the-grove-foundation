// src/surface/components/KineticStream/Stream/blocks/LensOfferObject.tsx
// Inline lens recommendation card
// Sprint: lens-offer-v1

import React from 'react';
import { motion } from 'framer-motion';
import type { LensOfferStreamItem } from '@core/schema/stream';
import { GlassContainer } from '../motion/GlassContainer';

export interface LensOfferObjectProps {
  item: LensOfferStreamItem;
  onAccept?: (lensId: string) => void;
  onDismiss?: (offerId: string) => void;
}

export const LensOfferObject: React.FC<LensOfferObjectProps> = ({
  item,
  onAccept,
  onDismiss
}) => {
  // Hide dismissed offers
  if (item.status === 'dismissed') {
    return null;
  }

  const handleAccept = () => {
    onAccept?.(item.lensId);
  };

  const handleDismiss = () => {
    onDismiss?.(item.id);
  };

  // Show accepted confirmation state
  if (item.status === 'accepted') {
    return (
      <motion.div
        className="flex flex-col items-start"
        data-testid="lens-offer-object"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ delay: 1.5, duration: 0.5 }}
      >
        <GlassContainer
          intensity="elevated"
          variant="default"
          className="w-full max-w-[85%] px-5 py-4 border-[var(--grove-forest)]/60"
        >
          <div className="flex items-center gap-3">
            <CheckIcon className="w-5 h-5 text-[var(--grove-forest)]" />
            <span className="font-sans text-[13px] font-medium text-[var(--grove-forest)]">
              Switched to {item.lensName}
            </span>
          </div>
        </GlassContainer>
      </motion.div>
    );
  }

  return (
    <div className="flex flex-col items-start" data-testid="lens-offer-object">
      <GlassContainer
        intensity="elevated"
        variant="default"
        className="w-full max-w-[85%] px-5 py-4 border-[var(--grove-forest)]/40"
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Lens badge */}
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold text-emerald-300 border border-emerald-300/60">
                <LensIcon className="w-3 h-3 mr-1" />
                Lens Suggestion
              </span>
            </div>

            {/* Lens name */}
            <h4 className="font-sans text-[14px] font-semibold text-[var(--glass-text-primary)] mb-1">
              {item.lensName}
            </h4>

            {/* Reason */}
            {item.reason && (
              <p className="font-sans text-[12px] text-[var(--glass-text-subtle)] mb-2">
                {item.reason}
              </p>
            )}

            {/* Preview text */}
            {item.previewText && (
              <p className="font-sans text-[13px] text-[var(--glass-text-body)] italic leading-relaxed">
                "{item.previewText}"
              </p>
            )}
          </div>

          {/* Dismiss button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-md hover:bg-[var(--glass-surface)] transition-colors text-[var(--glass-text-subtle)] hover:text-[var(--glass-text-primary)]"
            aria-label="Dismiss suggestion"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Action button */}
        <motion.button
          onClick={handleAccept}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-4 w-full px-4 py-2 rounded-lg font-sans text-[13px] font-medium
            bg-[var(--grove-forest)]/90 text-white
            hover:bg-[var(--grove-forest)] transition-colors
            border border-[var(--grove-forest)]/50"
        >
          Explore with {item.lensName}
        </motion.button>
      </GlassContainer>
    </div>
  );
};

const LensIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="4" />
    <line x1="12" y1="2" x2="12" y2="6" />
    <line x1="12" y1="18" x2="12" y2="22" />
    <line x1="2" y1="12" x2="6" y2="12" />
    <line x1="18" y1="12" x2="22" y2="12" />
  </svg>
);

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

export default LensOfferObject;
