// src/services/extraction/promptExtractor.ts
// Core extraction logic using server-side Claude API proxy
// Sprint: prompt-extraction-pipeline-v1, extraction-pipeline-integration-v1

import type {
  ExtractedConcept,
  ExtractionConfig,
  ExtractionResult,
  TopicCategory,
} from './types';
import type { GroveObject } from '@core/schema/grove-object';
import type { PromptPayload, PromptStage } from '@core/schema/prompt';

// Generate unique IDs
function generateUUID(): string {
  return crypto.randomUUID();
}

/**
 * Map topic category to topic ID for affinities
 * Categories from types.ts map to topic IDs used in the system
 */
function mapTopicCategoryToId(category: TopicCategory): string {
  const mapping: Record<TopicCategory, string> = {
    infrastructure: 'infrastructure-bet',
    architecture: 'technical-arch',
    economics: 'ratchet-effect',
    'ratchet-thesis': 'ratchet-effect',
    vision: 'meta-philosophy',
    community: 'governance',
    philosophy: 'observer-dynamic',
    roles: 'cognitive-split',
    engagement: 'diary-system',
  };
  return mapping[category] || category;
}

/**
 * Map Stage type to PromptStage
 * Ensures type compatibility between extraction and prompt systems
 */
function mapToPromptStages(stages: string[]): PromptStage[] {
  const validStages: PromptStage[] = ['genesis', 'exploration', 'synthesis', 'advocacy'];
  return stages.filter((s): s is PromptStage =>
    validStages.includes(s as PromptStage)
  );
}

/**
 * Extract prompts from a document using Claude via server proxy
 *
 * The server endpoint handles the Anthropic API call to avoid CORS issues.
 * API key is configured server-side via ANTHROPIC_API_KEY env var.
 */
export async function extractPromptsFromDocument(
  document: { content: string; id: string; title: string },
  config: ExtractionConfig,
  _apiKey?: string // Deprecated: API key is now server-side
): Promise<ExtractionResult> {
  // Call server-side extraction endpoint
  const response = await fetch('/api/prompts/extract-claude', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      documentId: document.id,
      title: document.title,
      content: document.content,
      model: config.model,
      confidenceThreshold: config.confidenceThreshold,
      existingTriggers: config.existingTriggers,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.details || errorData.error || `Extraction failed: ${response.status}`);
  }

  const data = await response.json();

  return {
    documentId: data.documentId,
    documentTitle: data.documentTitle,
    concepts: data.concepts,
    extractedAt: data.extractedAt,
    model: data.model,
    batchId: data.batchId,
  };
}

export function transformToPromptCandidate(
  concept: ExtractedConcept,
  source: { id: string; title: string },
  batchId: string,
  model: string
): GroveObject<PromptPayload> {
  const now = new Date().toISOString();

  // Use enhanced fields with fallbacks for backwards compatibility
  const title = concept.label || concept.concept || concept.whyConfusing?.slice(0, 50) || 'Extracted Concept';
  const description = concept.interestingBecause
    ? `${concept.interestingBecause} (from: ${source.title})`
    : source.title
      ? `Extracted from: ${source.title}`
      : 'Extracted prompt';

  // Map targetStages with fallback to legacy behavior
  const stages = concept.targetStages?.length
    ? mapToPromptStages(concept.targetStages)
    : ['exploration', 'synthesis'] as PromptStage[];

  // Map topicCategory to topic affinity
  const topicAffinities = concept.topicCategory
    ? [{ topicId: mapTopicCategoryToId(concept.topicCategory), weight: 1.0 }]
    : [];

  // Use salienceDimensions with fallback to legacy dimensions field
  const salienceDimensions = concept.salienceDimensions || concept.dimensions || [];

  // Build tags from stage and topic info
  const tags = [
    'extracted',
    'pending-review',
    ...(concept.topicCategory ? [`topic:${concept.topicCategory}`] : []),
    ...stages.map(s => `stage:${s}`),
  ];

  console.log('[transformToPromptCandidate] Creating prompt:', {
    concept: concept.concept,
    label: concept.label,
    title,
    targetStages: concept.targetStages,
    topicCategory: concept.topicCategory,
    sourceTitle: source.title,
  });

  return {
    meta: {
      id: generateUUID(), // Pure UUID for Supabase compatibility
      type: 'prompt',
      title,
      description,
      icon: 'auto_awesome',
      status: 'draft', // pending_review maps to draft
      createdAt: now,
      updatedAt: now,
      tags,
    },
    payload: {
      // Use new fields with fallback to legacy
      executionPrompt: concept.executionPrompt || concept.userQuestion || '',
      systemContext: concept.systemContext || concept.systemGuidance,
      source: 'generated', // Using 'generated' as closest match to 'extracted'
      provenance: {
        type: 'extracted',
        reviewStatus: 'pending',
        sourceDocIds: [source.id],
        sourceDocTitles: [source.title],
        extractedAt: Date.now(),
        extractionModel: model,
        extractionConfidence: concept.confidence,
        extractionBatch: batchId,
        // Include stage reasoning for review context
        ...(concept.stageReasoning && { stageReasoning: concept.stageReasoning }),
      },
      salienceDimensions,
      interestingBecause: concept.interestingBecause,
      surfaces: ['highlight', 'suggestion'],
      highlightTriggers: [
        { text: concept.concept, matchMode: 'contains', caseSensitive: false }
      ],
      topicAffinities,
      lensAffinities: [{ lensId: 'base', weight: 1.0 }],
      targeting: { stages },
      baseWeight: 50,
      stats: {
        impressions: 0,
        selections: 0,
        completions: 0,
        avgEntropyDelta: 0,
        avgDwellMs: 0,
      },
    },
  };
}
