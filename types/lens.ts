// types/lens.ts - Backward compatibility shim
// Re-exports from @core/schema for existing imports
// Per ADR-008: Shim-based migration strategy

export {
  type ArchetypeId,
  type NarrativePhase,
  type PersonaColor,
  type NarrativeStyle,
  type ArcEmphasis,
  type OpeningPhase,
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
} from '../src/core/schema';

// Re-export defaults from config
export {
  DEFAULT_REVEAL_STATE,
  DEFAULT_EXTENDED_SESSION,
  DEFAULT_WIZARD_STATE
} from '../src/core/config';
