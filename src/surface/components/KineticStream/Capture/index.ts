// src/surface/components/KineticStream/Capture/index.ts
// Sprout capture module exports
// Sprint: kinetic-cultivation-v1

export { SPROUT_CAPTURE_CONFIG } from './config/sprout-capture.config';
export type { SproutCaptureConfig } from './config/sprout-capture.config';

export { useTextSelection } from './hooks/useTextSelection';
export type { SelectionState, SelectionRect, UseTextSelectionResult } from './hooks/useTextSelection';

export { useCaptureState } from './hooks/useCaptureState';
export type { CaptureState } from './hooks/useCaptureState';

export { useKineticShortcuts, DEFAULT_KINETIC_SHORTCUTS } from './hooks/useKineticShortcuts';
export type { Shortcut } from './hooks/useKineticShortcuts';

// sprout-declarative-v1: Selection actions
export { useSelectionActions } from './hooks/useSelectionActions';
export type { SelectionAction } from './hooks/useSelectionActions';

export { useResearchPurposes } from './hooks/useResearchPurposes';
export type { ResearchPurpose, ClueTypeConfig } from './hooks/useResearchPurposes';

export { MagneticPill } from './components/MagneticPill';
export { ActionMenu } from './components/ActionMenu';
export { SelectionHighlight } from './components/SelectionHighlight';
export { SproutCaptureCard } from './components/SproutCaptureCard';
export { ResearchManifestCard } from './components/ResearchManifestCard';
export { PromptPreviewModal } from './components/PromptPreviewModal';
export { SproutCard } from './components/SproutCard';
export { SproutTray } from './components/SproutTray';
export type { SproutTrayProps } from './components/SproutTray';
export { KeyboardHUD } from './components/KeyboardHUD';

// Utils
export { flattenSprout, nestSprout, hasNestedProvenance, migrateSprout } from './utils/sproutAdapter';
