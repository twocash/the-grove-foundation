// components/Terminal/TerminalOverlayRenderer.tsx
// Unified overlay renderer using declarative registry
// Sprint: terminal-overlay-machine-v1

import React from 'react';
import { TerminalOverlay } from './types';
import { OVERLAY_REGISTRY } from './overlay-registry';

export interface OverlayHandlers {
  onDismiss: () => void;
  onLensSelect: (personaId: string) => void;
  onWelcomeChooseLens: () => void;
  onWizardComplete: (candidate: any, inputs: any) => Promise<void>;
  onWizardCancel: () => void;
}

interface Props {
  overlay: TerminalOverlay;
  handlers: OverlayHandlers;
}

export function TerminalOverlayRenderer({ overlay, handlers }: Props) {
  if (overlay.type === 'none') return null;

  const config = OVERLAY_REGISTRY[overlay.type];
  if (!config) return null;

  const Component = config.component;
  const props = getPropsForOverlay(overlay, handlers, config.props);

  return <Component {...props} />;
}

function getPropsForOverlay(
  overlay: TerminalOverlay,
  handlers: OverlayHandlers,
  staticProps?: Record<string, unknown>
): Record<string, unknown> {
  const base = { ...staticProps };

  switch (overlay.type) {
    case 'welcome':
      return { ...base, onChooseLens: handlers.onWelcomeChooseLens };
    case 'lens-picker':
      return { ...base, onBack: handlers.onDismiss, onAfterSelect: handlers.onLensSelect };
    case 'journey-picker':
      return { ...base, onBack: handlers.onDismiss };
    case 'wizard':
      return { ...base, onComplete: handlers.onWizardComplete, onCancel: handlers.onWizardCancel };
    default:
      return base;
  }
}
