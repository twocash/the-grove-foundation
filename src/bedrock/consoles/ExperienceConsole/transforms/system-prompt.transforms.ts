// src/bedrock/consoles/ExperienceConsole/transforms/system-prompt.transforms.ts
// Transform functions for SystemPrompt wizard
// Hotfix: experiences-console-v1.1
//
// DEX Principle: Declarative Sovereignty
// Wizard output is transformed via registered function, not inline logic.

import type {
  SystemPromptPayload,
  ResponseMode,
  ClosingBehavior,
} from '@core/schema/system-prompt';
import { DEFAULT_SYSTEM_PROMPT_PAYLOAD } from '@core/schema/system-prompt';

/**
 * Wizard output shape (what the wizard produces)
 */
export interface SystemPromptWizardOutput {
  identity?: string;
  voiceGuidelines?: string;
  structureRules?: string;
  knowledgeInstructions?: string;
  boundaries?: string;
  responseMode?: string;
  closingBehavior?: string;
  useBreadcrumbTags?: boolean;
  useTopicTags?: boolean;
  useNavigationBlocks?: boolean;
}

/**
 * Transform wizard output to SystemPromptPayload
 *
 * Referenced by system-prompt.wizard.json:
 * ```json
 * "output": {
 *   "type": "SystemPromptPayload",
 *   "transform": "createSystemPromptFromWizard"
 * }
 * ```
 *
 * @param wizardData - Raw output from wizard steps
 * @returns Valid SystemPromptPayload ready for object creation
 */
export function createSystemPromptFromWizard(
  wizardData: SystemPromptWizardOutput
): SystemPromptPayload {
  // Validate response mode
  const responseMode: ResponseMode =
    wizardData.responseMode === 'architect' ||
    wizardData.responseMode === 'librarian' ||
    wizardData.responseMode === 'contemplative'
      ? wizardData.responseMode
      : DEFAULT_SYSTEM_PROMPT_PAYLOAD.responseMode;

  // Validate closing behavior
  const closingBehavior: ClosingBehavior =
    wizardData.closingBehavior === 'navigation' ||
    wizardData.closingBehavior === 'question' ||
    wizardData.closingBehavior === 'open'
      ? wizardData.closingBehavior
      : DEFAULT_SYSTEM_PROMPT_PAYLOAD.closingBehavior;

  return {
    // Content sections (default to empty string if not provided)
    identity: wizardData.identity?.trim() || '',
    voiceGuidelines: wizardData.voiceGuidelines?.trim() || '',
    structureRules: wizardData.structureRules?.trim() || '',
    knowledgeInstructions: wizardData.knowledgeInstructions?.trim() || '',
    boundaries: wizardData.boundaries?.trim() || '',

    // Behavior configuration
    responseMode,
    closingBehavior,

    // Tag toggles (default to true if not explicitly false)
    useBreadcrumbTags: wizardData.useBreadcrumbTags !== false,
    useTopicTags: wizardData.useTopicTags !== false,
    useNavigationBlocks: wizardData.useNavigationBlocks !== false,

    // Versioning (new prompts start at v1)
    version: 1,
    changelog: 'Created via wizard',

    // Provenance (null until auth is wired)
    createdByUserId: null,
    updatedByUserId: null,
  };
}

/**
 * Validate wizard output before transform
 * Returns array of error messages (empty if valid)
 */
export function validateSystemPromptWizardOutput(
  wizardData: SystemPromptWizardOutput
): string[] {
  const errors: string[] = [];

  // Identity is required
  if (!wizardData.identity?.trim()) {
    errors.push('Identity section is required');
  }

  // Voice is required
  if (!wizardData.voiceGuidelines?.trim()) {
    errors.push('Voice Guidelines section is required');
  }

  // At least one content section should be substantial
  const contentLength = [
    wizardData.identity,
    wizardData.voiceGuidelines,
    wizardData.structureRules,
    wizardData.knowledgeInstructions,
    wizardData.boundaries,
  ]
    .filter(Boolean)
    .join('')
    .length;

  if (contentLength < 100) {
    errors.push('System prompt content is too sparse. Add more detail to sections.');
  }

  return errors;
}
