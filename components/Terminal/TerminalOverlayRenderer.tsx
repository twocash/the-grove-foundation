// components/Terminal/TerminalOverlayRenderer.tsx
// Unified overlay renderer using declarative registry
// Sprint: terminal-overlay-machine-v1
// Sprint: terminal-kinetic-commands-v1 - Added command palette handlers

import React from 'react';
import { TerminalOverlay } from './types';
import { OVERLAY_REGISTRY } from './overlay-registry';
import { CommandDefinition } from '@core/commands';

export interface OverlayHandlers {
  onDismiss: () => void;
  onLensSelect: (personaId: string) => void;
  onWelcomeChooseLens: () => void;
  onWizardComplete: (candidate: any, inputs: any) => Promise<void>;
  onWizardCancel: () => void;
  // Command palette handlers (Sprint: terminal-kinetic-commands-v1)
  onCommandSelect?: (command: CommandDefinition, subcommand?: string) => void;
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

  // Wrap in container that ensures proper height and allows internal scaling
  return (
    <div className="h-full w-full overflow-hidden">
      <Component {...props} />
    </div>
  );
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
    case 'command-palette':
      return {
        ...base,
        onSelect: handlers.onCommandSelect ?? (() => {}),
        onDismiss: handlers.onDismiss,
        initialQuery: overlay.initialQuery ?? ''
      };
    case 'stats':
      return { ...base, onDismiss: handlers.onDismiss };
    case 'garden':
      return { ...base, onClose: handlers.onDismiss, onViewFullStats: handlers.onDismiss };
    default:
      return base;
  }
}
