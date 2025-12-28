// src/core/transformers/index.ts
// Barrel export for transformers module
// v0.14: Reality Projector
// Sprint: kinetic-stream-schema-v1 - Added RhetoricalParser

export { RHETORICAL_SKELETON, COLLAPSE_SYSTEM_PROMPT } from './RhetoricalSkeleton';
export { RealityCollapser, realityCollapser } from './RealityCollapser';
export {
  parse,
  parseByType,
  hasRhetoricalContent,
  resetSpanIdCounter,
  type ParseResult
} from './RhetoricalParser';
