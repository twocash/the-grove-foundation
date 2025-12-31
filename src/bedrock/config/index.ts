// src/bedrock/config/index.ts
// Barrel export for Bedrock configuration
// Sprint: bedrock-foundation-v1

export {
  BEDROCK_NAV_ITEMS,
  CONSOLE_METADATA,
  type ConsoleMetadata,
} from './navigation';

export {
  GLOBAL_COPILOT_ACTIONS,
  GARDEN_COPILOT_ACTIONS,
  LENS_COPILOT_ACTIONS,
  COPILOT_ACTIONS_BY_CONSOLE,
  getCopilotActionsForConsole,
} from './copilot-actions';

export {
  SPROUT_MANIFESTS,
  getManifest,
  getSproutTypes,
  validateDraft,
  getDefaultValues,
  type ManifestFieldType,
  type ManifestField,
  type SproutManifest,
} from './sprout-manifests';
