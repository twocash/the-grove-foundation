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

function getStructureInstructions(config: WriterAgentConfigPayload): string {
  const parts: string[] = ['## Document Structure'];

  if (config.documentStructure.includePosition) {
    parts.push('- Start with a clear position/thesis section');
  }

  if (config.documentStructure.includeLimitations) {
    parts.push('- End with a limitations section noting gaps or uncertainties');
  }

  if (config.documentStructure.citationStyle === 'inline') {
    parts.push('- Use inline citations: [1], [2], etc.');
  } else {
    parts.push('- Place all citations as endnotes at the end');
  }

  if (config.documentStructure.maxLength) {
    parts.push(`- Keep analysis under ${config.documentStructure.maxLength} words`);
  }

  return parts.join('\n');
}

// =============================================================================
// Quality Modifiers
// =============================================================================

function getQualityInstructions(config: WriterAgentConfigPayload): string {
  const parts: string[] = ['## Quality Rules'];

  if (config.qualityRules.requireCitations) {
    parts.push('- Every factual claim MUST have a citation');
  }

  if (config.qualityRules.flagUncertainty) {
    parts.push('- Explicitly flag uncertain or contested claims');
  }

  parts.push(`- Only include evidence with confidence >= ${config.qualityRules.minConfidenceToInclude}`);

  return parts.join('\n');
}

// =============================================================================
// Prompt Builder
// =============================================================================

export function buildWriterSystemPrompt(config: WriterAgentConfigPayload): string {
  const parts: string[] = [BASE_SYSTEM_PROMPT];

  // Add voice modifiers
  parts.push(VOICE_MODIFIERS[config.voice.formality] || VOICE_MODIFIERS.professional);
  parts.push(PERSPECTIVE_MODIFIERS[config.voice.perspective] || PERSPECTIVE_MODIFIERS.neutral);

  if (config.voice.personality) {
    parts.push(`\nAdditional personality: ${config.voice.personality}`);
  }

  // Add structure instructions
  parts.push(getStructureInstructions(config));

  // Add quality instructions
  parts.push(getQualityInstructions(config));

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
