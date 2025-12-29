// src/surface/components/MomentRenderer/MomentOverlay.tsx
// Overlay component for modal moments
// Sprint: moment-ui-integration-v1

import React from 'react';
import type { Moment } from '@core/schema/moment';
import { MomentCard } from './MomentCard';
import { GlassContainer } from '../KineticStream/Stream/motion/GlassContainer';

export interface MomentOverlayProps {
  moment: Moment;
  onAction: (momentId: string, actionId: string) => void;
  onDismiss: (momentId: string) => void;
  activeLens?: string | null;
}

export function MomentOverlay({
  moment,
  onAction,
  onDismiss,
  activeLens
}: MomentOverlayProps) {
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onDismiss(moment.meta.id);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Content */}
      <div className="relative z-10 max-w-lg w-full animate-in fade-in zoom-in-95 duration-200">
        <GlassContainer intensity="elevated" className="p-6">
          <MomentCard
            moment={moment}
            onAction={onAction}
            onDismiss={onDismiss}
            activeLens={activeLens}
          />
        </GlassContainer>
      </div>
    </div>
  );
}

export default MomentOverlay;
