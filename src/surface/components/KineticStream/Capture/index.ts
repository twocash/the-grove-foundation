// src/surface/components/KineticStream/Capture/index.ts
// Sprout capture module exports
// Sprint: kinetic-cultivation-v1

export { SPROUT_CAPTURE_CONFIG } from './config/sprout-capture.config';
export type { SproutCaptureConfig } from './config/sprout-capture.config';

export { useTextSelection } from './hooks/useTextSelection';
export type { SelectionState } from './hooks/useTextSelection';

export { useCaptureState } from './hooks/useCaptureState';
export type { CaptureState } from './hooks/useCaptureState';

export { useKineticShortcuts, DEFAULT_KINETIC_SHORTCUTS } from './hooks/useKineticShortcuts';
export type { Shortcut } from './hooks/useKineticShortcuts';

export { MagneticPill } from './components/MagneticPill';
export { SproutCaptureCard } from './components/SproutCaptureCard';
export { SproutCard } from './components/SproutCard';
export { SproutTray } from './components/SproutTray';
export type { SproutTrayProps } from './components/SproutTray';
export { KeyboardHUD } from './components/KeyboardHUD';

// Utils
export { flattenSprout, nestSprout, hasNestedProvenance, migrateSprout } from './utils/sproutAdapter';
