// src/core/schema/research-agent-config.ts
// Research Agent Configuration - Experience type variant
// Sprint: evidence-collection-v1
//
// DEX: Declarative Sovereignty
// Research behavior is controlled via config, not code changes.

import { z } from 'zod';

// =============================================================================
// Schema Definition
// =============================================================================

export const ResearchAgentConfigPayloadSchema = z.object({
  // === VERSIONING (Sprint: singleton-pattern-v1) ===
  /** Version number (increments on each save-and-activate) */
  version: z.number().min(1).default(1),

  /** ID of previous version (for version history) */
  previousVersionId: z.string().optional(),

  /** Changelog for this version */
  changelog: z.string().optional(),

  // === RESEARCH SETTINGS ===
  /** Maximum searches per branch (default: 3) */
  searchDepth: z.number().min(1).max(10).default(3),

  /** Preferred source types for research */
  sourcePreferences: z.array(z.enum(['academic', 'practitioner', 'news', 'primary'])).default(['academic', 'practitioner']),

  /** Minimum confidence threshold 0-1 (default: 0.6) */
  confidenceThreshold: z.number().min(0).max(1).default(0.6),

  /** Maximum API calls per execution (budget limit) */
  maxApiCalls: z.number().min(1).max(50).default(10),

  /** Branch processing delay in ms (default: 500) */
  branchDelay: z.number().min(0).max(5000).default(500),
});

export type ResearchAgentConfigPayload = z.infer<typeof ResearchAgentConfigPayloadSchema>;

// =============================================================================
// Defaults
// =============================================================================

export const DEFAULT_RESEARCH_AGENT_CONFIG_PAYLOAD: ResearchAgentConfigPayload = {
  version: 1,
  searchDepth: 3,
  sourcePreferences: ['academic', 'practitioner'],
  confidenceThreshold: 0.6,
  maxApiCalls: 10,
  branchDelay: 500,
};

// =============================================================================
// Factory
// =============================================================================

export function createResearchAgentConfigPayload(
  overrides?: Partial<ResearchAgentConfigPayload>
): ResearchAgentConfigPayload {
  return {
    ...DEFAULT_RESEARCH_AGENT_CONFIG_PAYLOAD,
    ...overrides,
  };
}
