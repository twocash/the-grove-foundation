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
