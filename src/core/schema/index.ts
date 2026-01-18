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

// Prompt types (Sprint: prompt-unification-v1, prompt-schema-rationalization-v1, prompt-refinement-v1)
export {
  type PromptStage,
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
  // QA types (Sprint: prompt-refinement-v1)
  type QAIssueType,
  type QAIssueSeverity,
  type QAIssue,
  deriveSequences
} from './prompt';

// Feature Flag types (Sprint: feature-flags-v1)
export {
  type FeatureFlagPayload,
  type FeatureFlagCategory,
  type FlagChangelogEntry,
  isFeatureFlagPayload,
  createFeatureFlagPayload,
  addAvailabilityChange
} from './feature-flag';

// 4D Experience Model types (Sprint: terminology-migration-4d)
export {
  // Canonical 4D types
  type CognitiveDomain,
  type ExperienceSequence,
  type ExperienceMoment,
  // Legacy aliases (deprecated)
  type Hub,
  type Sequence,
  type Moment,
  // Type guards
  isCognitiveDomain,
  isExperienceSequence,
  isExperienceMoment,
  // Utilities
  EXPERIENCE_4D_TERMINOLOGY,
  get4DTerminology
} from './experience-4d';

// Cognitive Routing (4D provenance model)
export {
  type CognitiveRouting,
  buildCognitiveRouting
} from './cognitive-routing';

// Lifecycle Config types (Sprint: S5-SL-LifecycleEngine v1)
export {
  type TierDefinition,
  type StageTierMapping,
  type LifecycleModel,
  type LifecycleConfigPayload,
  DEFAULT_BOTANICAL_MODEL,
  DEFAULT_LIFECYCLE_CONFIG_PAYLOAD,
  FALLBACK_TIER_CONFIG,
  FALLBACK_STAGE_TO_TIER,
  isTierDefinition,
  isLifecycleModel,
  isLifecycleConfigPayload,
  getActiveModel,
  getTierForStageFromModel
} from './lifecycle-config';

// Lifecycle Model types (Sprint: EPIC4-SL-MultiModel v1)
export {
  type LifecycleTier,
  type ValidationRule,
  type ModelTemplate,
  type LifecycleModelPayload,
  type LifecycleModel,
  isLifecycleModelPayload,
  createLifecycleModelPayload,
  getSortedTiers,
  getTierById,
  getNextTier,
  getPreviousTier,
  validateTierRequirements,
  createModelFromTemplate,
  // Default templates
  BOTANICAL_MODEL_TEMPLATE,
  ACADEMIC_MODEL_TEMPLATE,
  RESEARCH_MODEL_TEMPLATE,
  CREATIVE_MODEL_TEMPLATE,
  DEFAULT_MODEL_TEMPLATES,
  getModelTemplate,
  createLifecycleModelFromTemplate
} from './lifecycle-model';

// Sprout Signals types (Sprint: S6-SL-ObservableSignals v1)
// Phase 2 of Observable Knowledge System EPIC
export {
  type SproutEventType,
  type EventProvenance,
  type SproutUsageEventBase,
  type SproutViewedEvent,
  type SproutRetrievedEvent,
  type SproutReferencedEvent,
  type SproutSearchedEvent,
  type SproutRatedEvent,
  type SproutExportedEvent,
  type SproutPromotedEvent,
  type SproutRefinedEvent,
  type SproutUsageEvent,
  type SignalAggregation,
  SPROUT_EVENT_TYPES,
  EventProvenanceSchema,
  SproutUsageEventBaseSchema,
  SproutViewedMetadataSchema,
  SproutRetrievedMetadataSchema,
  SproutReferencedMetadataSchema,
  SproutSearchedMetadataSchema,
  SproutRatedMetadataSchema,
  SproutExportedMetadataSchema,
  SproutPromotedMetadataSchema,
  SproutRefinedMetadataSchema,
  SignalAggregationSchema,
  isSproutUsageEvent,
  isSignalAggregation,
  EMPTY_AGGREGATION,
  createEmptyAggregation
} from './sprout-signals';

// Attribution Economy types (Sprint: S11-SL-Attribution v1)
// Knowledge Economy & Rewards system
export {
  // Reputation Tiers
  type ReputationTier,
  type ReputationTierConfig,
  REPUTATION_TIERS,
  REPUTATION_TIER_CONFIGS,
  // Content Tiers
  type ContentTierLevel,
  BASE_TOKENS,
  TIER_LABELS,
  // Quality Multipliers
  type QualityMultiplierRange,
  QUALITY_MULTIPLIER_RANGES,
  getQualityMultiplier,
  getReputationTier,
  getTierMultiplier,
  // Core Types
  type AttributionEvent,
  type TokenBalance,
  type ReputationScore,
  type NetworkInfluence,
  type EconomicSetting,
  type ChainEvent,
  type AttributionChain,
  // Calculation
  type TokenCalculationInput,
  type TokenCalculationResult,
  calculateTokens,
  // View
  type GroveEconomicSummary,
  // Type Guards
  isAttributionEvent,
  isTokenBalance,
  isReputationScore,
  isNetworkInfluence,
  isAttributionChain,
  // API Types
  type CalculateAttributionRequest,
  type CalculateAttributionResponse,
  type GetEconomicSummaryRequest,
  type GetEconomicSummaryResponse,
  type UpdateReputationRequest,
  type UpdateReputationResponse,
  // Schemas
  AttributionEventSchema,
  TokenBalanceSchema,
  ReputationScoreSchema,
  NetworkInfluenceSchema,
  EconomicSettingSchema,
  ChainEventSchema,
  AttributionChainSchema
} from './attribution';

// Badge System types (Sprint: S11-SL-Attribution v1 - Phase 3)
// Reputation badges and achievement system
export {
  // Categories & Rarity
  type BadgeCategory,
  type BadgeRarity,
  type BadgeRarityConfig,
  BADGE_CATEGORIES,
  BADGE_RARITIES,
  BADGE_RARITY_CONFIGS,
  // Criteria
  type BadgeCriteriaType,
  type BadgeCriteria,
  BadgeCriteriaSchema,
  // Badge Definitions
  type BadgeDefinition,
  BadgeDefinitionSchema,
  BADGE_DEFINITIONS,
  getAllBadgeDefinitions,
  getBadgeDefinition,
  getBadgesByCategory,
  getBadgesByRarity,
  // Earned Badges
  type EarnedBadge,
  EarnedBadgeSchema,
  // Results
  type BadgeAwardResult,
  type BadgeEvaluationResult,
  // Type Guards
  isBadgeDefinition,
  isEarnedBadge
} from './badges';
