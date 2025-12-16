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
  type TopicHub,
  type FeatureFlag,
  type GlobalSettings,
  type NarrativeSchemaV2,
  type TerminalSession,
  type NarrativeNodeV1,
  type NarrativeGraphV1,
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
