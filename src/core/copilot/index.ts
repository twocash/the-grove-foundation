// src/core/copilot/index.ts
// Public exports for Copilot module

export * from './schema';
export { parseIntent, isSupportedIntent } from './parser';
export { generatePatch, getValueAtPath, getFieldNameFromPath, applyPatches } from './patch-generator';
export type { PatchOperation } from './patch-generator';
export { validatePatch } from './validator';
export {
  generateResponseMessage,
  generateValidationErrorMessage,
  generateAppliedMessage,
  simulateDelay
} from './simulator';
export { getSuggestionsForType, getWelcomeMessage } from './suggestions';
export {
  QA_SUGGESTIONS,
  ISSUE_FIX_SUGGESTIONS,
  getSuggestionsForIssues,
  getQAWelcomeMessage,
  generateAutoFixPatch,
} from './PromptQAActions';
