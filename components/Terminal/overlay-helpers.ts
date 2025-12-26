// components/Terminal/overlay-helpers.ts
// Derived state helpers for overlay system
// Sprint: terminal-overlay-machine-v1

import { TerminalOverlay } from './types';
import { OVERLAY_REGISTRY } from './overlay-registry';

export function shouldShowInput(overlay: TerminalOverlay): boolean {
  if (overlay.type === 'none') return true;
  return !(OVERLAY_REGISTRY[overlay.type]?.hideInput ?? false);
}

export function isOverlayActive(overlay: TerminalOverlay): boolean {
  return overlay.type !== 'none';
}

export function getOverlayAnalytics(overlay: TerminalOverlay): string | undefined {
  if (overlay.type === 'none') return undefined;
  return OVERLAY_REGISTRY[overlay.type]?.analytics;
}
