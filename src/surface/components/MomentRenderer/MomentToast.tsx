// src/surface/components/MomentRenderer/MomentToast.tsx
// Toast component for transient moment notifications
// Sprint: moment-ui-integration-v1

import React, { useEffect } from 'react';
import type { Moment } from '@core/schema/moment';
import { GlassContainer } from '../KineticStream/Stream/motion/GlassContainer';

export interface MomentToastProps {
  moment: Moment;
  onAction: (momentId: string, actionId: string) => void;
  onDismiss: (momentId: string) => void;
  autoHideDuration?: number;
}

export function MomentToast({
  moment,
  onAction,
  onDismiss,
  autoHideDuration = 5000
}: MomentToastProps) {
  const { content, actions } = moment.payload;

  useEffect(() => {
    if (autoHideDuration > 0) {
      const timer = setTimeout(() => {
        onDismiss(moment.meta.id);
      }, autoHideDuration);
      return () => clearTimeout(timer);
    }
  }, [moment.meta.id, autoHideDuration, onDismiss]);

  const primaryAction = actions.find(a => a.variant === 'primary') || actions[0];

  return (
    <div className="fixed bottom-24 right-4 z-40 max-w-sm animate-in slide-in-from-right duration-300">
      <GlassContainer intensity="default" className="p-4">
        <div className="flex items-start gap-3">
          {content.icon && (
            <span className="text-xl flex-shrink-0">{content.icon}</span>
          )}
          <div className="flex-1 min-w-0">
            {content.heading && (
              <p className="font-medium text-[var(--glass-text-primary)] text-sm">
                {content.heading}
              </p>
            )}
            {content.body && (
              <p className="text-[var(--glass-text-subtle)] text-xs mt-1 line-clamp-2">
                {content.body}
              </p>
            )}
          </div>
          {primaryAction && (
            <button
              onClick={() => onAction(moment.meta.id, primaryAction.id)}
              className="text-[var(--neon-cyan)] text-sm hover:underline flex-shrink-0"
            >
              {primaryAction.label}
            </button>
          )}
        </div>
      </GlassContainer>
    </div>
  );
}

export default MomentToast;
