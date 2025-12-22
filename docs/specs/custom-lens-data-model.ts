// specs/custom-lens-data-model.ts
// ═══════════════════════════════════════════════════════════════════════════
// CUSTOM LENS DATA MODEL
// ═══════════════════════════════════════════════════════════════════════════
//
// This file defines types specific to the Custom Lens creation wizard.
// For core Lens types, see dex-object-model.ts
//
// The Custom Lens feature allows users to create personalized exploration
// perspectives through a guided wizard flow.
//
// Version: 2.0 (Field-Aware)
// Last Updated: December 2024
// ═══════════════════════════════════════════════════════════════════════════

import type { 
  Lens, 
  NarrativeStyle, 
  ArcEmphasis 
} from './dex-object-model';

// ============================================================================
// ARCHETYPE TYPES
// ============================================================================

export type ArchetypeId = 
  | 'academic' 
  | 'engineer' 
  | 'concerned-citizen' 
  | 'geopolitical' 
  | 'big-ai-exec' 
  | 'family-office';

export type OpeningPhase = 'hook' | 'stakes' | 'mechanics';

// ============================================================================
// USER INPUT TYPES (for wizard)
// ============================================================================

export interface UserInputs {
  motivation: 
    | 'worried-about-ai'
    | 'researching-distributed-systems'
    | 'someone-sent-link'
    | 'investment-opportunities'
    | 'just-curious'
    | 'other';
  motivationOther?: string;
  
  concerns?: 
    | 'big-tech-power'
    | 'job-displacement'
    | 'energy-environment'
    | 'privacy'
    | 'harder-to-articulate'
    | 'other';
  concernsOther?: string;
  
  futureOutlook:
    | 'cautiously-optimistic'
    | 'genuinely-worried'
    | 'depends-on-control'
    | 'building-conflicted'
    | 'other';
  futureOutlookOther?: string;
  
  professionalRelationship:
    | 'build-it'
    | 'fund-invest'
    | 'study-regulate'
    | 'use-dont-trust'
    | 'lead-orgs'
    | 'other';
  professionalRelationshipOther?: string;
  
  worldviewStatement?: string;
}

export interface EncryptedUserInputs {
  iv: number[];
  data: number[];
}

// ============================================================================
// CUSTOM LENS EXTENSION
// ============================================================================

/**
 * Custom Lens — User-created perspective via wizard
 * 
 * Extends the base Lens type with wizard-specific fields.
 * Custom Lenses are always scoped to a Field.
 */
export interface CustomLens extends Omit<Lens, 'createdAt' | 'updatedAt'> {
  isCustom: true;
  userInputs: EncryptedUserInputs;
  archetypeMapping: ArchetypeId;
  createdAt: string;  // ISO timestamp
  lastUsedAt?: string;
  journeysCompleted: number;
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
  fieldId: string;  // Target Field for the lens
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
  fieldId: string;  // Target Field for lens creation
  currentStep: WizardStep;
  userInputs: Partial<UserInputs>;
  generatedOptions: LensCandidate[];
  selectedOption: LensCandidate | null;
  isGenerating: boolean;
  error: string | null;
}

// ============================================================================
// STORAGE TYPES
// ============================================================================

export interface StoredCustomLenses {
  version: '2.0';
  fieldId: string;  // Field these lenses belong to
  lenses: CustomLens[];
  lastUpdated: string;
}

// ============================================================================
// HELPER TYPE GUARDS
// ============================================================================

export function isCustomLens(lens: Lens | CustomLens): lens is CustomLens {
  return 'isCustom' in lens && lens.isCustom === true;
}
