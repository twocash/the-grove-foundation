// src/core/schema/suggested-prompts.ts
// Suggested prompt types for adaptive engagement
// Sprint: adaptive-engagement-v1
// Sprint: engagement-consolidation-v1 - SessionStage from engagement.ts
//
// ============================================================================
// @deprecated - Use @core/context-fields types instead
// Sprint: genesis-context-fields-v1
//
// MIGRATION:
// - SuggestedPrompt → PromptObject (src/core/context-fields/types.ts)
// - StagePromptConfig → ContextTargeting (declarative JSON)
// - stagePromptsConfig → base.prompts.json, dr-chiang.prompts.json
//
// These types are preserved for backward compatibility.
// ============================================================================

import type { SessionStage } from './engagement';

/**
 * PromptIntent - What the prompt is trying to accomplish
 */
export type PromptIntent =
  | 'orientation'      // Explain what Grove is
  | 'motivation'       // Why should user care
  | 'demonstration'    // Show how it works
  | 'discovery'        // What can I explore
  | 'depth'            // Go deeper on topic
  | 'personalization'  // Tailor to my lens
  | 'synthesis'        // Connect topics
  | 'contribution'     // Capture/share
  | 'reflection'       // Review my insights
  | 'serendipity';     // Surprise me

/**
 * SuggestedPrompt - A clickable prompt with metadata
 */
export interface SuggestedPrompt {
  id: string;
  text: string;
  intent: PromptIntent;

  // Routing
  leadsTo?: string;    // Hub ID or route
  command?: string;    // Terminal command (e.g., "/sprout")
  journeyId?: string;  // Start a journey (renders as journey card)

  // Dynamic
  dynamic?: boolean;
  variables?: string[];

  // Filtering
  lensAffinity?: string[];
  lensExclude?: string[];
  weight?: number;     // Higher = more likely
}

/**
 * StagePromptConfig - Prompts for a specific stage
 */
export interface StagePromptConfig {
  stage: SessionStage;
  prompts: SuggestedPrompt[];
  maxDisplay?: number;
  refreshStrategy?: 'static' | 'engagement' | 'random';
}

/**
 * StagePromptsConfig - Full configuration
 */
export interface StagePromptsConfig {
  defaults: {
    maxDisplay: number;
    refreshStrategy: string;
  };
  stages: Record<SessionStage, StagePromptConfig>;
}
