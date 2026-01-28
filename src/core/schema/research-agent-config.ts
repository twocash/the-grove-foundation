// src/core/schema/research-agent-config.ts
// Research Agent Configuration - SIMPLIFIED (S28-PIPE)
// Sprint: s28-pipeline-architecture-v1
//
// DEX: Declarative Sovereignty
// Research behavior is controlled via config, not code changes.
//
// SIMPLIFIED APPROACH:
// - Configs are TEXT INSTRUCTIONS (prompt fragments)
// - No enums, no rigid structure
// - Admins write free-form text, experiment to find what works
// - Prompts concatenate in pipeline: searchInstructions + qualityGuidance

import { z } from 'zod';

// =============================================================================
// Schema Definition (SIMPLIFIED)
// =============================================================================

export const ResearchAgentConfigPayloadSchema = z.object({
  // === VERSIONING (Sprint: singleton-pattern-v1) ===
  /** Version number (increments on each save-and-activate) */
  version: z.number().min(1).default(1),

  /** ID of previous version (for version history) */
  previousVersionId: z.string().optional(),

  /** Changelog for this version */
  changelog: z.string().optional(),

  // === RESEARCH PROMPT CONFIGURATION (TEXT ONLY) ===

  /**
   * Free-form instructions for how the research agent should search and gather evidence.
   * This text is inserted into the system prompt.
   *
   * @example "You are a SENIOR RESEARCH ANALYST. Focus on academic sources..."
   */
  searchInstructions: z.string().min(1).max(10000),

  /**
   * Free-form guidance for research quality standards and output formatting.
   * This text is appended to the system prompt.
   *
   * @example "Use markdown formatting. Cite sources with confidence scores..."
   */
  qualityGuidance: z.string().min(1).max(5000),
});

export type ResearchAgentConfigPayload = z.infer<typeof ResearchAgentConfigPayloadSchema>;

// =============================================================================
// Defaults (Extracted from server.js:2560-2575, line 87)
// =============================================================================

export const DEFAULT_RESEARCH_AGENT_CONFIG_PAYLOAD: ResearchAgentConfigPayload = {
  version: 1,

  // Extracted from server.js:2560-2575 (defaultSystemPrompt)
  searchInstructions: `You are a SENIOR RESEARCH ANALYST conducting professional-grade investigation.

Your research must be:
- EXHAUSTIVE: Explore every relevant angle, follow citation chains, verify claims across sources
- RIGOROUS: Distinguish between primary sources, expert analysis, and speculation
- NUANCED: Present conflicting evidence, methodological debates, and uncertainty
- ACTIONABLE: Connect findings to practical implications and next steps

For each major claim:
1. Cite the source with full attribution
2. Assess source credibility (academic, industry, journalistic, etc.)
3. Note corroborating or contradicting evidence
4. Assign confidence level (0.0-1.0) with justification

DO NOT summarize prematurely. DO NOT omit relevant details for brevity.
Your audience expects comprehensive, professional-grade research output.`,

  // Extracted from server.js:87 (DEFAULT_RESEARCH_RENDERING_RULES)
  qualityGuidance: `IMPORTANT: Use rich markdown formatting in all output — ## headers for sections, ### for subsections, bullet lists, numbered lists, tables for comparisons, blockquotes for quotes, **bold** for key terms, and paragraph breaks. Use <cite index="N">claim</cite> HTML tags for inline citations where N matches the source index. Your output will be rendered with a markdown engine.`,
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
