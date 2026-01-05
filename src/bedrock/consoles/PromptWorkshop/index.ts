// src/bedrock/consoles/PromptWorkshop/index.ts
// Prompt Workshop console - built with createBedrockConsole factory
// Sprint: prompt-unification-v1

import { createBedrockConsole } from '../../patterns/console-factory';
import { promptWorkshopConfig } from './PromptWorkshop.config';
import { usePromptData } from './usePromptData';
import { PromptCard } from './PromptCard';
import { PromptEditor } from './PromptEditor';
import type { PromptPayload } from '@core/schema/prompt';

/**
 * Prompt Workshop Console
 *
 * Manages prompts - contextual content with declarative sequence membership.
 * Prompts are the building blocks of journeys, briefings, and other sequences.
 *
 * Built using the Bedrock Console Factory pattern.
 */
export const PromptWorkshop = createBedrockConsole<PromptPayload>({
  config: promptWorkshopConfig,
  useData: usePromptData,
  CardComponent: PromptCard,
  EditorComponent: PromptEditor,
  copilotTitle: 'Prompt Copilot',
  copilotPlaceholder: 'Edit this prompt with AI...',
});

// Re-export configuration and helpers
export {
  promptWorkshopConfig,
  SEQUENCE_TYPE_CONFIG,
  PROMPT_SOURCE_CONFIG,
} from './PromptWorkshop.config';

// Re-export components for custom use cases
export { PromptCard } from './PromptCard';
export { PromptEditor } from './PromptEditor';
export { usePromptData, createDefaultPrompt } from './usePromptData';

// Sprint: kinetic-highlights-v1 - Surface and highlight editors
export { SurfaceSelector } from './SurfaceSelector';
export { HighlightTriggersEditor } from './HighlightTriggersEditor';

// Re-export types
export type { PromptDataResult } from './usePromptData';
export type { PromptPayload } from '@core/schema/prompt';

export default PromptWorkshop;
