// src/core/schema/lens.ts
// Custom Lens System types - no React dependencies

import {
  PersonaColor,
  NarrativeStyle,
  ArcEmphasis,
  OpeningPhase,
  Persona
} from './narrative';
import { RevealType } from './engagement';

// ============================================================================
// CORE TYPES
// ============================================================================

export type ArchetypeId =
  | 'academic'
  | 'engineer'
  | 'concerned-citizen'
  | 'geopolitical'
  | 'big-ai-exec'
  | 'family-office';

export type NarrativePhase = 'hook' | 'stakes' | 'mechanics' | 'evidence' | 'resolution';

// Re-export from narrative for convenience
export type { PersonaColor, NarrativeStyle, ArcEmphasis, OpeningPhase };

// ============================================================================
// CUSTOM LENS TYPES
// ============================================================================

export interface BasePersona {
  id: string;
  publicLabel: string;
  description: string;
  icon: string;
  color: PersonaColor | 'purple';
  enabled: boolean;

  // Narrative configuration
  toneGuidance: string;
  narrativeStyle: NarrativeStyle;
  arcEmphasis: ArcEmphasis;
  openingPhase: OpeningPhase;
  defaultThreadLength: number;

  // Journey configuration
  entryPoints: string[];
  suggestedThread: string[];
}

export interface ArchetypalPersona extends BasePersona {
  isCustom: false;
  conversionPath: ConversionPath;
}

export interface CustomLens extends BasePersona {
  isCustom: true;
  userInputs: EncryptedUserInputs;
  archetypeMapping: ArchetypeId;
  createdAt: string;
  lastUsedAt?: string;
  journeysCompleted: number;
}

export type PersonaOrLens = ArchetypalPersona | CustomLens;

// ============================================================================
// USER INPUT TYPES (for wizard)
// ============================================================================

export interface UserInputs {
  motivation: MotivationType;
  motivationOther?: string;
  concerns?: ConcernType;
  concernsOther?: string;
  futureOutlook: FutureOutlookType;
  futureOutlookOther?: string;
  professionalRelationship: ProfessionalRelationshipType;
  professionalRelationshipOther?: string;
  worldviewStatement?: string;
}

export type MotivationType =
  | 'worried-about-ai'
  | 'researching-distributed-systems'
  | 'someone-sent-link'
  | 'investment-opportunities'
  | 'just-curious'
  | 'other';

export type ConcernType =
  | 'big-tech-power'
  | 'job-displacement'
  | 'energy-environment'
  | 'privacy'
  | 'harder-to-articulate'
  | 'other';

export type FutureOutlookType =
  | 'cautiously-optimistic'
  | 'genuinely-worried'
  | 'depends-on-control'
  | 'building-conflicted'
  | 'other';

export type ProfessionalRelationshipType =
  | 'build-it'
  | 'fund-invest'
  | 'study-regulate'
  | 'use-dont-trust'
  | 'lead-orgs'
  | 'other';

// ============================================================================
// ENCRYPTED DATA TYPES
// ============================================================================

export interface EncryptedUserInputs {
  iv: number[];
  data: number[];
}

// ============================================================================
// LENS GENERATION TYPES
// ============================================================================

export interface LensCandidate {
  publicLabel: string;
  description: string;
  toneGuidance: string;
  narrativeStyle: NarrativeStyle;
  arcEmphasis: ArcEmphasis;
  openingPhase: OpeningPhase;
  archetypeMapping: ArchetypeId;
}

export interface GenerateLensRequest {
  userInputs: UserInputs;
}

export interface GenerateLensResponse {
  lensOptions: LensCandidate[];
}

// ============================================================================
// CONVERSION PATH TYPES
// ============================================================================

export interface ConversionCTA {
  id: string;
  label: string;
  description: string;
  action: CTAAction;
  priority: 'primary' | 'secondary' | 'tertiary';
}

export type CTAAction =
  | { type: 'modal'; modalId: string }
  | { type: 'link'; url: string; external?: boolean }
  | { type: 'email'; template: string }
  | { type: 'calendly'; url: string }
  | { type: 'form'; formId: string };

export interface ConversionPath {
  archetypeId: ArchetypeId;
  headline: string;
  subheadline: string;
  ctas: ConversionCTA[];
}

// ============================================================================
// REVEAL STATE TYPES
// ============================================================================

export interface RevealState {
  simulationRevealShown: boolean;
  simulationRevealAcknowledged: boolean;
  customLensOfferShown: boolean;
  terminatorModeUnlocked: boolean;
  terminatorModeActive: boolean;
  founderStoryShown: boolean;
  ctaViewed: boolean;
}

// ============================================================================
// EXTENDED SESSION TYPES
// ============================================================================

export interface ExtendedTerminalSession {
  sessionId: string;
  activeLens: string | null;
  isCustomLens: boolean;
  scholarMode: boolean;

  // Journey tracking
  currentThread: string[];
  currentPosition: number;
  visitedCards: string[];
  journeysCompleted: number;
  topicsExplored: number;
  exchangeCount: number;

  // Time tracking
  startedAt: string;
  lastActivityAt: string;
  minutesActive: number;

  // Reveal tracking
  revealState: RevealState;
}

// ============================================================================
// WIZARD STATE TYPES
// ============================================================================

export type WizardStep =
  | 'privacy'
  | 'input-motivation'
  | 'input-concerns'
  | 'input-outlook'
  | 'input-professional'
  | 'input-worldview'
  | 'generating'
  | 'select'
  | 'confirm';

export interface WizardState {
  currentStep: WizardStep;
  userInputs: Partial<UserInputs>;
  generatedOptions: LensCandidate[];
  selectedOption: LensCandidate | null;
  isGenerating: boolean;
  error: string | null;
}

// ============================================================================
// ANALYTICS TYPES
// ============================================================================

export type FunnelEventType =
  | 'session_started'
  | 'lens_picker_viewed'
  | 'archetypal_lens_selected'
  | 'journey_started'
  | 'card_viewed'
  | 'journey_completed'
  | 'simulation_reveal_reached'
  | 'simulation_reveal_clicked'
  | 'custom_lens_wizard_started'
  | 'custom_lens_step_completed'
  | 'custom_lens_created'
  | 'terminator_mode_activated'
  | 'founder_story_viewed'
  | 'cta_viewed'
  | 'cta_clicked'
  | 'invitation_sent'
  | 'lens_shared'
  // Cognitive Bridge events
  | 'cognitive_bridge_shown'
  | 'cognitive_bridge_accepted'
  | 'cognitive_bridge_dismissed'
  | 'entropy_high_detected'
  // Landing page events
  | 'prompt_hook_clicked';

export interface FunnelEvent {
  eventType: FunnelEventType;
  sessionId: string;
  timestamp: string;
  archetypeId?: ArchetypeId;
  customLensId?: string;
  cardId?: string;
  journeyIndex?: number;
  ctaId?: string;
  stepNumber?: number;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// STORAGE TYPES
// ============================================================================

export interface StoredCustomLenses {
  version: '1.0';
  lenses: CustomLens[];
  lastUpdated: string;
}

export interface StoredSession {
  version: '1.0';
  session: ExtendedTerminalSession;
}

// ============================================================================
// TYPE GUARDS
// ============================================================================

export function isCustomLens(persona: PersonaOrLens | Persona | null): persona is CustomLens {
  if (!persona) return false;
  return 'isCustom' in persona && persona.isCustom === true;
}

export function isArchetypalPersona(persona: PersonaOrLens | Persona | null): persona is ArchetypalPersona {
  if (!persona) return false;
  return 'isCustom' in persona && persona.isCustom === false;
}

export function hasConversionPath(persona: unknown): persona is { conversionPath: ConversionPath } {
  return typeof persona === 'object' &&
         persona !== null &&
         'conversionPath' in persona;
}

// ============================================================================
// ARCHETYPE MAPPING HELPERS
// ============================================================================

export const PERSONA_TO_ARCHETYPE: Record<string, ArchetypeId> = {
  'concerned-citizen': 'concerned-citizen',
  'academic': 'academic',
  'engineer': 'engineer',
  'geopolitical': 'geopolitical',
  'big-ai-exec': 'big-ai-exec',
  'family-office': 'family-office'
};

export function getArchetypeForPersona(persona: PersonaOrLens | Persona | null): ArchetypeId | null {
  if (!persona) return null;

  if (isCustomLens(persona)) {
    return persona.archetypeMapping;
  }

  return PERSONA_TO_ARCHETYPE[persona.id] || null;
}
