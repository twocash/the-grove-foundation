// src/bedrock/context/index.ts
// Barrel export for Bedrock contexts
// Sprint: bedrock-foundation-v1

export {
  BedrockUIProvider,
  useBedrockUI,
  useSkin,
  THEME_REGISTRY,
  type BedrockUIState,
  type BedrockUIActions,
  type BedrockUIContextValue,
  type GroveSkin,
} from './BedrockUIContext';

export {
  BedrockCopilotProvider,
  useBedrockCopilot,
  type CopilotMessage,
  type CopilotContext,
  type CopilotAction,
  type BedrockCopilotState,
} from './BedrockCopilotContext';
