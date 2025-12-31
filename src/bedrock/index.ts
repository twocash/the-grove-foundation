// src/bedrock/index.ts
// Main barrel export for Bedrock module
// Sprint: bedrock-foundation-v1

// Main workspace
export { BedrockWorkspace } from './BedrockWorkspace';

// Context providers
export {
  BedrockUIProvider,
  useBedrockUI,
  type SelectedItem,
} from './context/BedrockUIContext';

export {
  BedrockCopilotProvider,
  useBedrockCopilot,
  type CopilotMessage,
  type CopilotAction,
} from './context/BedrockCopilotContext';

// Primitives
export {
  BedrockLayout,
  BedrockNav,
  BedrockInspector,
  BedrockCopilot,
  InspectorSection,
  InspectorDivider,
  MetadataSection,
  ActionsSection,
  type NavItem,
} from './primitives';

// Components
export {
  StatCard,
  MetricsRow,
} from './components';

// Config
export {
  BEDROCK_NAV_ITEMS,
  CONSOLE_METADATA,
  GLOBAL_COPILOT_ACTIONS,
  GARDEN_COPILOT_ACTIONS,
  LENS_COPILOT_ACTIONS,
  getCopilotActionsForConsole,
  type ConsoleMetadata,
} from './config';
