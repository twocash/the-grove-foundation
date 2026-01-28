// src/explore/prompts/writer-system-prompt.ts
// Writer System Prompt - Guides research document generation
// Sprint: writer-agent-v1
//
// DEX: Declarative Sovereignty
// Voice and structure are injected based on config.

import type { WriterAgentConfigPayload } from '@core/schema/writer-agent-config';

// =============================================================================
// Base System Prompt
// =============================================================================

const BASE_SYSTEM_PROMPT = `You are a research writing agent for Grove, a personal knowledge system.

## Your Mission

Transform research evidence into a structured document with:
- A clear position (thesis)
- Supporting analysis
- Properly formatted citations

## Output Format

Return valid JSON:

\`\`\`json
{
  "position": "1-3 sentence thesis summarizing findings",
  "analysis": "Full markdown analysis with ## sections and [n] citations",
  "limitations": "What couldn't be determined or verified (optional)",
  "citations": [
    {
      "index": 1,
      "title": "Source title",
      "url": "https://...",
      "snippet": "Relevant excerpt from source",
      "domain": "example.com"
    }
  ]
}
\`\`\`

## Quality Standards

- Every claim in analysis must have a citation [n]
- Position must be supported by analysis
- Acknowledge uncertainty explicitly
- Prefer depth over breadth
- If sources conflict, present both views
- Never fabricate sources
`;

// =============================================================================
// Voice Modifiers
// =============================================================================

const VOICE_MODIFIERS: Record<string, string> = {
  casual: `
## Voice: Casual
Write in a conversational, accessible tone. Use contractions and everyday language.
Avoid jargon unless explaining it. Make complex topics feel approachable.`,

  professional: `
## Voice: Professional
Write in a clear, business-appropriate tone. Be direct and confident.
Use precise language. Maintain objectivity while being engaging.`,

  academic: `
## Voice: Academic
Write in a scholarly tone suitable for academic audiences. Use formal language.
Be thorough and precise. Include nuance and acknowledge complexity.
Use hedging language where appropriate ("suggests", "indicates").`,

  technical: `
## Voice: Technical
Write for a technical audience. Be precise and specific.
Use domain terminology appropriately. Focus on accuracy and detail.
Include technical specifications when relevant.`,
};

const PERSPECTIVE_MODIFIERS: Record<string, string> = {
  'first-person': 'Use first-person perspective ("I found", "my analysis").',
  'third-person': 'Use third-person perspective ("the research shows", "analysis reveals").',
  'neutral': 'Use neutral, objective language. Avoid personal pronouns.',
};

// =============================================================================
// Structure Modifiers
// =============================================================================

// S28-PIPE: getStructureInstructions DEPRECATED (old nested schema)
// Kept for legacy compatibility but not used with new text-based configs
function getStructureInstructions(config: WriterAgentConfigPayload): string {
  return ''; // No-op for new schema
}

// =============================================================================
// Quality Modifiers
// =============================================================================

// S28-PIPE: getQualityInstructions DEPRECATED (old nested schema)
// Kept for legacy compatibility but not used with new text-based configs
function getQualityInstructions(config: WriterAgentConfigPayload): string {
  return ''; // No-op for new schema
}

// =============================================================================
// Prompt Builder
// =============================================================================

export function buildWriterSystemPrompt(config: WriterAgentConfigPayload): string {
  // S28-PIPE: Simplified schema (text-based, no nested objects)
  // This function is DEPRECATED - document-generator now builds merged finalPrompt
  // Keeping as fallback for backward compatibility

  // Check if new schema (text fields) or old schema (nested objects)
  const hasNewSchema = 'writingStyle' in config && typeof config.writingStyle === 'string';

  if (hasNewSchema) {
    // New schema: Just concatenate text fields
    return [
      config.writingStyle || '',
      config.resultsFormatting || '',
      config.citationsStyle || '',
    ].filter(Boolean).join('\n\n');
  }

  // Old schema: Build from nested objects (legacy support)
  const parts: string[] = [BASE_SYSTEM_PROMPT];

  const oldConfig = config as any;
  if (oldConfig.voice?.formality) {
    parts.push(VOICE_MODIFIERS[oldConfig.voice.formality] || VOICE_MODIFIERS.professional);
  }
  if (oldConfig.voice?.perspective) {
    parts.push(PERSPECTIVE_MODIFIERS[oldConfig.voice.perspective] || PERSPECTIVE_MODIFIERS.neutral);
  }
  if (oldConfig.voice?.personality) {
    parts.push(`\nAdditional personality: ${oldConfig.voice.personality}`);
  }

  // Skip structure/quality instructions for old configs (would crash)

  return parts.join('\n\n');
}

// =============================================================================
// Evidence Prompt Builder
// =============================================================================

export function buildEvidencePrompt(query: string, evidence: string): string {
  return `## Research Query
"${query}"

## Evidence Collected
${evidence}

## Instructions
Transform the above evidence into a structured research document following your guidelines.
Return your response as valid JSON matching the specified format.`;
}
