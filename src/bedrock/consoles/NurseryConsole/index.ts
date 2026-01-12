// src/bedrock/consoles/NurseryConsole/index.ts
// Nursery Console - built with createBedrockConsole factory
// Sprint: nursery-v1 (Course Correction)

import { createBedrockConsole } from '../../patterns/console-factory';
import { nurseryConsoleConfig } from './NurseryConsole.config';
import { useNurseryData } from './useNurseryData';
import { SproutCard } from './SproutCard';
import { SproutEditor } from './SproutEditor';
import type { SproutPayload } from './useNurseryData';

/**
 * Nursery Console
 *
 * Manages research sprouts awaiting review - the cultivation queue where
 * sprouts are reviewed, promoted to Garden, or archived with reason.
 *
 * Status mapping:
 * - 'ready' = ResearchSprout.status === 'completed'
 * - 'failed' = ResearchSprout.status === 'blocked'
 * - 'archived' = ResearchSprout.status === 'archived'
 *
 * Built using the Bedrock Console Factory pattern.
 */
export const NurseryConsole = createBedrockConsole<SproutPayload>({
  config: nurseryConsoleConfig,
  useData: useNurseryData,
  CardComponent: SproutCard,
  EditorComponent: SproutEditor,
});

// Re-export configuration
export {
  nurseryConsoleConfig,
  ARCHIVE_REASONS,
  NURSERY_STATUS_CONFIG,
} from './NurseryConsole.config';

// Re-export components for custom use cases
export { SproutCard } from './SproutCard';
export { SproutEditor } from './SproutEditor';
export { useNurseryData } from './useNurseryData';

// Re-export types
export type { SproutPayload, NurseryDataResult } from './useNurseryData';
export type { NurseryDisplayStatus, ArchiveReason } from './NurseryConsole.config';

export default NurseryConsole;
