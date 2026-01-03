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
  type SessionStage,
  type StageThresholds,
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

// Sprout Queue types
export {
  type SproutQueueStatus,
  type SproutCaptureContext,
  type SproutModeration,
  type SproutTargetCommons,
  type QueuedSprout,
  type SproutQueueCounts,
  type SproutQueueFilter
} from './sprout-queue';

// DEX Object Model (Kinetic Architecture)
export {
  type DEXObjectType,
  type DEXVersionEntry,
  type DEXObject,
  type DEXCaptureContext,
  type DEXJourney,
  type DEXNode,
  type DEXHub,
  type DEXLens,
  type DEXCard,
  isDEXJourney,
  isDEXNode,
  isDEXHub,
  isDEXLens,
  isDEXCard
} from './dex';

// Journey Provenance (DEX Pillar III)
export * from './journey-provenance';
export type { JourneyDisplayConfig, WaypointAction } from './journey';

// Kinetic Stream types (Sprint: kinetic-stream-schema-v1)
export {
  type JourneyPath,
  type StreamItemType,
  type RhetoricalSpanType,
  type RhetoricalSpan,
  type StreamItem,
  isQueryItem,
  isResponseItem,
  hasSpans,
  hasPaths,
  fromChatMessage,
  toChatMessage
} from './stream';

// Engagement Moment types (Sprint: engagement-orchestrator-v1)
export {
  type MomentSurface,
  type NumericRange,
  type TriggerStage,
  type TriggerSchedule,
  type MomentTrigger,
  type ButtonVariant,
  type PromptDefinition,
  type MomentContentType,
  type ContentVariant,
  type MomentContent,
  type MomentActionType,
  type MomentAction,
  type MomentPayload,
  type MomentMeta,
  type Moment,
  type MomentObject,
  isMoment,
  isValidSurface,
  createMoment,
  DEFAULT_MOMENT_PRIORITY,
  MOMENT_SURFACES
} from './moment';

// Prompt types (Sprint: prompt-unification-v1, prompt-schema-rationalization-v1)
export {
  type PromptStage,
  type PromptVariant,
  type PromptSource,
  type SequenceType,
  type TopicAffinity,
  type LensAffinity,
  type PromptTargeting,
  type SuccessCriteria,
  type PromptSequence,
  type PromptStats,
  type WizardChoice,
  type InputValidation,
  type ConditionalNext,
  type WizardStepConfig,
  type PromptGenerationContext,
  type PromptPayload,
  type Prompt,
  type SequenceDefinition,
  deriveSequences
} from './prompt';
