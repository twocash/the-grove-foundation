// src/core/extraction/index.ts
export * from './types';

// Sprint: highlight-extraction-v1
export { EXTRACTION_CONFIG, type ExtractionConfig } from './config';

export {
  detectConcepts,
  getCoreConceptDefinition,
  getAllCoreConcepts,
  type CoreConcept,
  type DetectedConcept,
} from './conceptDetection';

export {
  generateHighlightPrompt,
  generateHighlightPromptsBatch,
  type DocumentContext,
  type HighlightPromptGeneratorOptions,
} from './highlightPromptGenerator';

export {
  mergeHighlightPrompts,
  getOverlappingTriggers,
  findConflictingPrompts,
  type MergeStrategy,
} from './triggerMerge';
