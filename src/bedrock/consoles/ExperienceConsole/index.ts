// src/bedrock/consoles/ExperienceConsole/index.ts
// ExperienceConsole - System Prompt Management
// Sprint: bedrock-ia-rename-v1 (formerly ExperienceConsole)
//
// Manages system prompts that control AI behavior on /explore.
// Adapted from orphaned commit e61877c with health check features removed.
// Health check integration deferred to future sprint.

import { createBedrockConsole } from '../../patterns/console-factory';
import { experienceConsoleConfig } from './ExperienceConsole.config';
import { SystemPromptCard } from './SystemPromptCard';
import { SystemPromptEditor } from './SystemPromptEditor';
import { useExperienceData } from './useExperienceData';
import type { SystemPromptPayload } from '@core/schema/system-prompt';

/**
 * Experience Console
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
export const ExperienceConsole = createBedrockConsole<SystemPromptPayload>({
  config: experienceConsoleConfig,
  useData: useExperienceData,
  CardComponent: SystemPromptCard,
  EditorComponent: SystemPromptEditor,
  copilotTitle: 'System Prompt Copilot',
  copilotPlaceholder: 'Edit this system prompt with AI assistance...',
});

// Re-export configuration for external use
export { experienceConsoleConfig } from './ExperienceConsole.config';

// Re-export card and editor components
export { SystemPromptCard } from './SystemPromptCard';
export { SystemPromptEditor } from './SystemPromptEditor';

// Re-export data hook and factory
export { useExperienceData, createDefaultSystemPrompt } from './useExperienceData';
export type { ExperienceDataResult } from './useExperienceData';

// Re-export types for consumers
export type { SystemPromptPayload } from '@core/schema/system-prompt';

export default ExperienceConsole;
