// src/surface/components/MomentRenderer/MomentInline.tsx
// Inline component for in-stream moment cards
// Sprint: moment-ui-integration-v1

import React from 'react';
import type { Moment } from '@core/schema/moment';
import { MomentCard } from './MomentCard';
import { GlassContainer } from '../KineticStream/Stream/motion/GlassContainer';

export interface MomentInlineProps {
  moment: Moment;
  onAction: (momentId: string, actionId: string) => void;
  onDismiss: (momentId: string) => void;
  activeLens?: string | null;
}

export function MomentInline({
  moment,
  onAction,
  onDismiss,
  activeLens
}: MomentInlineProps) {
  return (
    <div className="moment-inline my-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <GlassContainer intensity="subtle" className="p-4">
        <MomentCard
          moment={moment}
          onAction={onAction}
          onDismiss={onDismiss}
          activeLens={activeLens}
        />
      </GlassContainer>
    </div>
  );
}

export default MomentInline;
