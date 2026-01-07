// src/services/extraction/index.ts
// Sprint: prompt-extraction-pipeline-v1, extraction-pipeline-integration-v1

export { extractPromptsFromDocument, transformToPromptCandidate } from './promptExtractor';
export { buildExtractionPrompt } from './extractionPrompt';
export type {
  ExtractedConcept,
  ExtractionConfig,
  ExtractionResult,
  ExtractionProvenance,
  TopicCategory,
  SalienceDimension,
} from './types';
export { TOPIC_CATEGORIES, SALIENCE_DIMENSIONS } from './types';
