// src/core/engine/index.ts
// Barrel export for all Core engine modules

// Trigger Evaluator
export {
  evaluateTriggers,
  getNextReveal,
  shouldShowReveal,
  mergeTriggers,
  validateTrigger
} from './triggerEvaluator';

// Topic Router
export {
  type TopicMatchResult,
  routeToHub,
  getMatchDetails,
  buildHubEnhancedPrompt,
  testQueryMatch
} from './topicRouter';

// RAG Loader (Tiered Context)
export {
  buildTieredContext,
  loadManifest,
  invalidateManifestCache,
  invalidateFileCache,
  clearAllCaches,
  fetchRagContextLegacy,
  BUCKET_NAME,
  KNOWLEDGE_PREFIX,
  MANIFEST_PATH
} from './ragLoader';
