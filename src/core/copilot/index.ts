// src/core/copilot/index.ts
// Public exports for Copilot module

export * from './schema';
export { parseIntent, isSupportedIntent } from './parser';
export { generatePatch, getValueAtPath, getFieldNameFromPath } from './patch-generator';
export { validatePatch } from './validator';
export {
  generateResponseMessage,
  generateValidationErrorMessage,
  generateAppliedMessage,
  simulateDelay
} from './simulator';
export { getSuggestionsForType, getWelcomeMessage } from './suggestions';
