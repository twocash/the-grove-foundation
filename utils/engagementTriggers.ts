// utils/engagementTriggers.ts - Backward compatibility shim
// Re-exports from @core for existing imports
// Per ADR-008: Shim-based migration strategy

// Engine functions
export {
  evaluateTriggers,
  getNextReveal,
  shouldShowReveal,
  mergeTriggers,
  validateTrigger
} from '../src/core/engine';

// Default trigger configuration
export { DEFAULT_TRIGGERS } from '../src/core/config';
