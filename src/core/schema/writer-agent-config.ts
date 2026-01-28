// src/core/schema/writer-agent-config.ts
// Writer Agent Configuration - SIMPLIFIED (S28-PIPE)
// Sprint: s28-pipeline-architecture-v1
//
// DEX: Declarative Sovereignty
// Writing behavior is controlled via config, not code changes.
//
// SIMPLIFIED APPROACH:
// - Configs are TEXT INSTRUCTIONS (prompt fragments)
// - No enums, no nested objects, no rigid structure
// - Admins write free-form text, experiment to find what works
// - Prompts concatenate in pipeline: writingStyle + resultsFormatting + citationsStyle

import { z } from 'zod';

// =============================================================================
// Schema Definition (SIMPLIFIED)
// =============================================================================

export const WriterAgentConfigPayloadSchema = z.object({
  // === VERSIONING (Sprint: singleton-pattern-v1) ===
  /** Version number (increments on each save-and-activate) */
  version: z.number().min(1).default(1),

  /** ID of previous version (for version history) */
  previousVersionId: z.string().optional(),

  /** Changelog for this version */
  changelog: z.string().optional(),

  // === WRITER PROMPT CONFIGURATION (TEXT ONLY) ===

  /**
   * Free-form instructions for writing style, voice, tone, perspective.
   * This text is inserted into the system prompt.
   *
   * @example "Write professionally but accessibly. Use neutral perspective. Be authoritative."
   */
  writingStyle: z.string().min(1).max(10000),

  /**
   * Free-form instructions for document structure and formatting.
   * This text guides how the output is organized.
   *
   * @example "Open with thesis. Use ## headers for sections. Include limitations."
   */
  resultsFormatting: z.string().min(1).max(10000),

  /**
   * Free-form instructions for citation format and requirements.
   * This text specifies how sources should be cited.
   *
   * @example "Use inline (Author, Year) citations. Sources section at end. Cite all claims."
   */
  citationsStyle: z.string().min(1).max(5000),
});

export type WriterAgentConfigPayload = z.infer<typeof WriterAgentConfigPayloadSchema>;

// =============================================================================
// Defaults (Extracted from server.js:3016-3025, 58-85)
// =============================================================================

export const DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD: WriterAgentConfigPayload = {
  version: 1,

  // Extracted from server.js:3016-3025 (writerSystemPrompt voice section)
  writingStyle: `You are a senior research writer.

Write with:
- Formality: professional
- Perspective: neutral
- Citation style: inline

Your output should be authoritative but accessible. Use clear, direct language while maintaining analytical rigor.`,

  // Extracted from server.js:71-76 (DEFAULT_WRITER_RENDERING_RULES document structure)
  resultsFormatting: `## Document Structure
1. Open with a clear thesis/position (2-3 sentences)
2. Use ## headers to organize analysis into 3-5 logical sections
3. Each section should have substantive content with specific data and evidence
4. Close with a synthesis or forward-looking conclusion
5. Note limitations honestly

## Rendering Rules (ReactMarkdown + GFM)
Your output will be rendered by a markdown engine. Use rich formatting:
- **Section headers**: Use ## for major sections, ### for subsections
- **Bold key terms**: Wrap important concepts in **bold**
- **Bullet lists**: Use - for unordered lists of key findings
- **Numbered lists**: Use 1. 2. 3. for sequential steps or ranked items
- **Tables**: Use GFM markdown tables for comparisons or structured data
- **Blockquotes**: Use > for notable quotes from sources`,

  // Extracted from server.js:69 (DEFAULT_WRITER_RENDERING_RULES citations section)
  citationsStyle: `## Inline Citations
Use <cite index="N">cited claim</cite> HTML tags where N is the 1-based source index.

Example: <cite index="1">GPU inference improved 10x</cite>

Include a Sources section at the end with full references.`,
};

// =============================================================================
// Factory
// =============================================================================

export function createWriterAgentConfigPayload(
  overrides?: Partial<WriterAgentConfigPayload>
): WriterAgentConfigPayload {
  return {
    ...DEFAULT_WRITER_AGENT_CONFIG_PAYLOAD,
    ...overrides,
  };
}
