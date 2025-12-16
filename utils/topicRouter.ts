// utils/topicRouter.ts - Backward compatibility shim
// Re-exports from @core for existing imports
// Per ADR-008: Shim-based migration strategy

export {
  type TopicMatchResult,
  routeToHub,
  getMatchDetails,
  buildHubEnhancedPrompt,
  testQueryMatch
} from '../src/core/engine';

// Re-export default
export { routeToHub as default } from '../src/core/engine';
