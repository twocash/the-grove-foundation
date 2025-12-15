// types/lens.ts — Complete Data Model for Custom Lens System

// ============================================================
// CORE TYPES
// ============================================================

export type ArchetypeId = 
  | 'academic' 
  | 'engineer' 
  | 'concerned-citizen' 
  | 'geopolitical' 
  | 'big-ai-exec' 
  | 'family-office';

export type NarrativeStyle = 
  | 'evidence-first' 
  | 'stakes-heavy' 
  | 'mechanics-deep' 
  | 'resolution-oriented';

export type OpeningPhase = 'hook' | 'stakes' | 'mechanics';

export type NarrativePhase = 'hook' | 'stakes' | 'mechanics' | 'evidence' | 'resolution';

export interface ArcEmphasis {
  hook: 1 | 2 | 3 | 4;
  stakes: 1 | 2 | 3 | 4;
  mechanics: 1 | 2 | 3 | 4;
  evidence: 1 | 2 | 3 | 4;
  resolution: 1 | 2 | 3 | 4;
}

// ============================================================
// PERSONA / LENS TYPES
// ============================================================

export interface BasePersona {
  id: string;
  publicLabel: string;
  description: string;
  icon: string;
  color: 'emerald' | 'amber' | 'blue' | 'rose' | 'slate' | 'violet' | 'purple';
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
  userInputs: EncryptedUserInputs;      // Encrypted original responses
  archetypeMapping: ArchetypeId;         // Hidden mapping to archetype
  createdAt: string;                     // ISO timestamp
  lastUsedAt?: string;                   // Track engagement
  journeysCompleted: number;             // Track depth
}

export type Persona = ArchetypalPersona | CustomLens;

// ============================================================
// USER INPUT TYPES (for wizard)
// ============================================================

export interface UserInputs {
  // Question 1: What brings them here
  motivation: 
    | 'worried-about-ai'
    | 'researching-distributed-systems'
    | 'someone-sent-link'
    | 'investment-opportunities'
    | 'just-curious'
    | 'other';
  motivationOther?: string;
  
  // Question 2: What concerns them (if worried)
  concerns?: 
    | 'big-tech-power'
    | 'job-displacement'
    | 'energy-environment'
    | 'privacy'
    | 'harder-to-articulate'
    | 'other';
  concernsOther?: string;
  
  // Question 3: Future outlook
  futureOutlook:
    | 'cautiously-optimistic'
    | 'genuinely-worried'
    | 'depends-on-control'
    | 'building-conflicted'
    | 'other';
  futureOutlookOther?: string;
  
  // Question 4: Professional relationship
  professionalRelationship:
    | 'build-it'
    | 'fund-invest'
    | 'study-regulate'
    | 'use-dont-trust'
    | 'lead-orgs'
    | 'other';
  professionalRelationshipOther?: string;
  
  // Question 5: Free-form worldview (optional, enriches generation)
  worldviewStatement?: string;
}

export interface EncryptedUserInputs {
  iv: number[];
  data: number[];
}

// ============================================================
// LENS GENERATION TYPES
// ============================================================

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

// ============================================================
// CONVERSION PATH TYPES
// ============================================================

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
  headline: string;           // "You've seen what distributed AI could mean for [X]"
  subheadline: string;        // Archetype-specific framing
  ctas: ConversionCTA[];
}

// ============================================================
// SESSION & ANALYTICS TYPES
// ============================================================

export interface TerminalSession {
  sessionId: string;
  activeLens: string | null;      // Persona ID or null
  isCustomLens: boolean;
  scholarMode: boolean;
  
  // Journey tracking
  currentThread: string[];
  currentPosition: number;
  visitedCards: string[];
  journeysCompleted: number;
  
  // Reveal tracking
  reachedSimulationReveal: boolean;
  reachedTerminatorMode: boolean;
  reachedFounderStory: boolean;
  
  // Timestamps
  startedAt: string;
  lastActivityAt: string;
}

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
  | 'lens_shared';

export interface FunnelEvent {
  eventType: FunnelEventType;
  sessionId: string;
  timestamp: string;
  
  // Optional context
  archetypeId?: ArchetypeId;
  customLensId?: string;
  cardId?: string;
  journeyIndex?: number;
  ctaId?: string;
  stepNumber?: number;
  metadata?: Record<string, unknown>;
}

// ============================================================
// WIZARD STATE TYPES
// ============================================================

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

// ============================================================
// STORAGE TYPES
// ============================================================

export interface StoredCustomLenses {
  version: '1.0';
  lenses: CustomLens[];
  lastUpdated: string;
}

export interface StoredSession {
  version: '1.0';
  session: TerminalSession;
}

// ============================================================
// HELPER TYPE GUARDS
// ============================================================

export function isCustomLens(persona: Persona): persona is CustomLens {
  return persona.isCustom === true;
}

export function isArchetypalPersona(persona: Persona): persona is ArchetypalPersona {
  return persona.isCustom === false;
}
