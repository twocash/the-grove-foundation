/**
 * Highlight prompt generation using LLM
 * @sprint highlight-extraction-v1
 */
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { DetectedConcept } from './conceptDetection';
import type { PromptObject, PromptProvenance } from '@core/context-fields/types';
import { EXTRACTION_CONFIG } from './config';

const HIGHLIGHT_PROMPT_TEMPLATE = `
You are generating a backing prompt for a clickable concept in educational content about Grove, a distributed AI infrastructure project.

CONCEPT: {{concept}}
DOCUMENT EXCERPT: {{excerpt}}
GROVE DEFINITION: {{definition}}

Generate a prompt that a curious user might think when clicking this term. The prompt should:

1. Express genuine curiosity or confusion about what it means
2. Ask a specific question the document context can answer
3. Use conversational first-person voice
4. Be 2-4 sentences maximum

BAD EXAMPLES (too generic):
- "Tell me about {{concept}}."
- "What is {{concept}}?"
- "Explain {{concept}} to me."

GOOD EXAMPLE:
"I keep seeing '{{concept}}' and it sounds important, but I'm not sure what it actually means in practice. What would this look like for someone like me?"

Respond with valid JSON only (no markdown, no code fences):
{
  "executionPrompt": "The user's curious thought when clicking...",
  "systemContext": "User clicked '{{concept}}' in kinetic text. [Guidance for LLM on how to answer - mention key points to cover, tone to use, common misconceptions to address]"
}
`;

export interface HighlightPromptGeneratorOptions {
  apiKey: string;
}

export interface DocumentContext {
  docId: string;
  docTitle: string;
}

/**
 * Generate a backing prompt for a detected concept
 */
export async function generateHighlightPrompt(
  concept: DetectedConcept,
  documentContext: DocumentContext,
  apiKey: string
): Promise<PromptObject> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: EXTRACTION_CONFIG.highlight.model,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 500,
    },
  });

  const prompt = HIGHLIGHT_PROMPT_TEMPLATE.replace(/{{concept}}/g, concept.term)
    .replace(/{{excerpt}}/g, concept.contextExcerpt)
    .replace(/{{definition}}/g, concept.definition);

  const result = await model.generateContent(prompt);
  const responseText = result.response.text();

  // Parse JSON response, handling potential markdown fences
  const cleanJson = responseText
    .replace(/```json\n?/g, '')
    .replace(/```\n?/g, '')
    .trim();

  const parsed = JSON.parse(cleanJson);

  // Build provenance
  const provenance: PromptProvenance = {
    type: 'extracted',
    reviewStatus: 'pending',
    sourceDocIds: [documentContext.docId],
    sourceDocTitles: [documentContext.docTitle],
    extractedAt: Date.now(),
    extractionModel: EXTRACTION_CONFIG.highlight.model,
    extractionConfidence: concept.confidence,
  };

  // Generate unique ID
  const termSlug = concept.term.toLowerCase().replace(/\s+/g, '-');
  const timestamp = Date.now();

  return {
    id: `highlight-extracted-${termSlug}-${timestamp}`,
    objectType: 'prompt',
    created: timestamp,
    modified: timestamp,
    author: 'system',
    label: `What is ${concept.term}?`,
    description: `Auto-extracted backing prompt for '${concept.term}' from ${documentContext.docTitle}`,
    executionPrompt: parsed.executionPrompt,
    systemContext: parsed.systemContext,
    tags: ['highlight', 'extracted', termSlug],
    topicAffinities: [],
    lensAffinities: [{ lensId: 'base', weight: 1.0 }],
    targeting: { stages: ['exploration', 'synthesis'] },
    baseWeight: 60 + Math.round(concept.confidence * 20),
    stats: {
      impressions: 0,
      selections: 0,
      completions: 0,
      avgEntropyDelta: 0,
      avgDwellAfter: 0,
    },
    status: 'active',
    source: 'generated',
    provenance,
    surfaces: ['highlight', 'suggestion'],
    highlightTriggers: concept.suggestedTriggers,
  };
}

/**
 * Generate highlight prompts for multiple concepts (batch)
 */
export async function generateHighlightPromptsBatch(
  concepts: DetectedConcept[],
  documentContext: DocumentContext,
  apiKey: string,
  options: { delayMs?: number } = {}
): Promise<{ prompts: PromptObject[]; errors: Array<{ term: string; error: string }> }> {
  const prompts: PromptObject[] = [];
  const errors: Array<{ term: string; error: string }> = [];
  const delayMs = options.delayMs ?? 500; // Rate limiting

  for (const concept of concepts) {
    try {
      const prompt = await generateHighlightPrompt(concept, documentContext, apiKey);
      prompts.push(prompt);

      // Rate limiting
      if (delayMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      errors.push({
        term: concept.term,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return { prompts, errors };
}
