// src/bedrock/consoles/LensWorkshop/index.ts
// Lens Workshop console - built with createBedrockConsole factory
// Sprint: hotfix/console-factory

import { createBedrockConsole } from '../../patterns/console-factory';
import { lensWorkshopConfig } from './LensWorkshop.config';
import { useLensData } from './useLensData';
import { LensCard } from './LensCard';
import { LensEditor } from './LensEditor';
import type { LensPayload } from '../../types/lens';

/**
 * Lens Workshop Console
 *
 * Manages lens configurations - filters that control how content
 * is presented to different audiences.
 *
 * Built using the Bedrock Console Factory pattern.
 */
export const LensWorkshop = createBedrockConsole<LensPayload>({
  config: lensWorkshopConfig,
  useData: useLensData,
  CardComponent: LensCard,
  EditorComponent: LensEditor,
  copilotTitle: 'Lens Copilot',
  copilotPlaceholder: 'Edit this lens with AI...',
});

// Re-export configuration and helpers
export {
  lensWorkshopConfig,
  LENS_CATEGORY_CONFIG,
  DEFAULT_LENS_COLORS,
} from './LensWorkshop.config';

// Re-export components for custom use cases
export { LensCard } from './LensCard';
export { LensEditor } from './LensEditor';
export { useLensData } from './useLensData';

// Copilot actions (preserved for copilot integration)
export {
  handleCopilotAction,
  parseSetCommand,
  validateLens,
  testLens,
  suggestLens,
  suggestFilters,
  type LensCopilotContext,
  type CopilotActionResult,
  type TestResult,
} from './LensCopilotActions';

// Re-export types
export type { LensPayload } from '../../types/lens';

export default LensWorkshop;
