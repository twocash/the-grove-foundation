// src/bedrock/consoles/ExperiencesConsole/index.ts
// ExperiencesConsole - System Prompt Management
// Sprint: experiences-console-recovery-v1
//
// Manages system prompts that control AI behavior on /explore.
// Adapted from orphaned commit e61877c with health check features removed.
// Health check integration deferred to future sprint.

import { createBedrockConsole } from '../../patterns/console-factory';
import { experiencesConsoleConfig } from './ExperiencesConsole.config';
import { SystemPromptCard } from './SystemPromptCard';
import { SystemPromptEditor } from './SystemPromptEditor';
import { useExperienceData } from './useExperienceData';
import type { SystemPromptPayload } from '@core/schema/system-prompt';

/**
 * Experiences Console
 *
 * Manages system prompts that control AI behavior on /explore.
 * Uses the Bedrock Console Factory pattern for consistent UX.
 *
 * Features:
 * - View all system prompts (active, draft, archived)
 * - Edit system prompt content and behaviors
 * - Activate/deactivate prompts
 * - Server-side cache invalidation on activation
 *
 * Future enhancements (see e61877c):
 * - Health check integration (read-only view)
 * - Combined experience object browser
 */
export const ExperiencesConsole = createBedrockConsole<SystemPromptPayload>({
  config: experiencesConsoleConfig,
  useData: useExperienceData,
  CardComponent: SystemPromptCard,
  EditorComponent: SystemPromptEditor,
  copilotTitle: 'System Prompt Copilot',
  copilotPlaceholder: 'Edit this system prompt with AI assistance...',
});

// Re-export configuration for external use
export { experiencesConsoleConfig } from './ExperiencesConsole.config';

// Re-export card and editor components
export { SystemPromptCard } from './SystemPromptCard';
export { SystemPromptEditor } from './SystemPromptEditor';

// Re-export data hook and factory
export { useExperienceData, createDefaultSystemPrompt } from './useExperienceData';
export type { ExperienceDataResult } from './useExperienceData';

// Re-export types for consumers
export type { SystemPromptPayload } from '@core/schema/system-prompt';

export default ExperiencesConsole;
