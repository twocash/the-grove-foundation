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
  routeToJourney,
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

// Entropy Detector (Cognitive Bridge)
export {
  type EntropyResult,
  type ChatMessage as EntropyMessage,
  type EntropyState,
  TOPIC_CLUSTERS,
  CLUSTER_JOURNEY_MAP,
  ENTROPY_THRESHOLDS,
  ENTROPY_LIMITS,
  DEFAULT_ENTROPY_STATE,
  calculateEntropy,
  shouldInject,
  getJourneyForCluster,
  updateEntropyState,
  dismissEntropy
} from './entropyDetector';
