// src/core/schema/index.ts
// Barrel export for all Core schema types

// Base types
export {
  SectionId,
  type ChatMessage,
  type TerminalState,
  type ArchitectureNode,
  type NarrativeNode,
  type NarrativeGraph,
  type AudioTrack,
  type AudioManifest
} from './base';

// Narrative Engine types
export {
  type PersonaColor,
  type NarrativeStyle,
  type OpeningPhase,
  type NoLensBehavior,
  type ArcEmphasis,
  type Persona,
  type Card,
  type VocabularyLevel,
  type EmotionalRegister,
  type PersonaPromptConfig,
  type PersonaPromptVersion,
  type SystemPromptVersion,
  type TopicHub,
  type HubStatus,
  type Journey,
  type JourneyStatus,
  type JourneyNode,
  type DefaultContext,
  type FeatureFlag,
  type GlobalSettings,
  type NarrativeSchemaV2,
  type TerminalSession,
  type NarrativeNodeV1,
  type NarrativeGraphV1,
  // Quantum Interface (Lens Reality)
  type LensQuote,
  type HeroContent,
  type TensionContent,
  type LensReality,
  isV1Schema,
  isV2Schema,
  nodeToCard
} from './narrative';

// Engagement Bus types
export {
  type EngagementEventType,
  type EngagementEvent,
  type EventPayloads,
  type RevealType,
  type RevealQueueItem,
  type EngagementState,
  type ActiveJourney,
  type ComparisonOperator,
  type ConditionValue,
  type StateKey,
  type SimpleCondition,
  type CompoundCondition,
  type TriggerCondition,
  type TriggerConfig,
  type EngagementEventHandler,
  type StateChangeHandler,
  type RevealQueueHandler,
  type EngagementBusAPI
} from './engagement';

// Custom Lens types
export {
  type ArchetypeId,
  type NarrativePhase,
  type BasePersona,
  type ArchetypalPersona,
  type CustomLens,
  type PersonaOrLens,
  type UserInputs,
  type MotivationType,
  type ConcernType,
  type FutureOutlookType,
  type ProfessionalRelationshipType,
  type EncryptedUserInputs,
  type LensCandidate,
  type GenerateLensRequest,
  type GenerateLensResponse,
  type ConversionCTA,
  type CTAAction,
  type ConversionPath,
  type RevealState,
  type ExtendedTerminalSession,
  type WizardStep,
  type WizardState,
  type FunnelEventType,
  type FunnelEvent,
  type StoredCustomLenses,
  type StoredSession,
  isCustomLens,
  isArchetypalPersona,
  hasConversionPath,
  PERSONA_TO_ARCHETYPE,
  getArchetypeForPersona
} from './lens';

// RAG (Retrieval-Augmented Generation) types
export {
  type HubsManifest,
  type DefaultContextConfig,
  type HubConfig,
  type HubTriggerConditions,
  type ManifestMeta,
  type TieredContextResult,
  type FileLoadResult,
  type TieredContextOptions,
  type ManifestCacheEntry,
  type FileContentCacheEntry,
  isValidHubsManifest,
  isValidHubConfig
} from './rag';

// Sprout System types
export {
  type Sprout,
  type SproutStatus,
  type SproutStorage,
  type SproutCaptureOptions,
  type SproutCaptureContext,
  type SproutStats,
  isSprout,
  isValidSproutStorage,
  SPROUT_STORAGE_KEY,
  MAX_RECENT_SPROUTS
} from './sprout';

// Widget types
export {
  type WidgetMode,
  type InspectorMode,
  type WidgetSession,
  type WidgetState,
  type WidgetActions,
  type WidgetUIContextType,
  type ModeConfig,
  WIDGET_MODE_KEY,
  WIDGET_SESSION_KEY,
  MODE_LABELS,
  MODE_CONFIGS,
  isWidgetMode
} from './widget';

// Foundation Console types
export {
  type FoundationConsole,
  type FoundationInspectorMode,
  type FoundationNavState,
  type FoundationInspectorState,
  type FoundationUIState,
  type FoundationUIActions,
  type FoundationUIContextType,
  FOUNDATION_CONSOLE_KEY,
  FOUNDATION_EXPANDED_KEY
} from './foundation';
