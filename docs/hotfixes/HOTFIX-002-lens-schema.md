# HOTFIX-002: Lens Schema Migration

**ID:** HOTFIX-002-lens-schema  
**Priority:** High  
**Branch:** `hotfix/lens-schema`  
**Migration Doc:** `docs/bedrock/MIGRATION-001-lens.md`

---

## Problem

The current LensWorkshop uses fabricated lens fields that don't match the actual `Persona` type from `narratives-schema.ts`. Lenses are prompt engineering objects—the `toneGuidance` field is injected directly into LLM system prompts.

## Solution

Replace fake schema with real `Persona` fields, properly mapped to `GroveObject<LensPayload>` structure.

---

## Files to Create/Modify

### 1. Replace `src/bedrock/types/lens.ts`

```typescript
// src/bedrock/types/lens.ts
// Lens (Persona) payload type for Bedrock
// Migration: MIGRATION-001-lens

import type {
  PersonaColor,
  NarrativeStyle,
  ArcEmphasis,
  OpeningPhase,
  VocabularyLevel,
  EmotionalRegister,
} from '../../../data/narratives-schema';

/**
 * Lens (Persona) payload for Bedrock
 *
 * A Lens is fundamentally a prompt engineering object. The toneGuidance
 * field is injected into LLM system prompts to control response style.
 */
export interface LensPayload {
  // === IDENTITY (beyond meta) ===
  /** Theme color from earthy palette */
  color: PersonaColor;

  // === PROMPT ENGINEERING (the core function) ===
  /**
   * THE MAIN FIELD - Injected directly into LLM system prompt.
   * Controls vocabulary, metaphors, emphasis, and tone.
   * Example: "[PERSONA: Engineer] Get technical. Show architecture..."
   */
  toneGuidance: string;

  /** Optional complete system prompt override */
  systemPrompt?: string;

  /** Custom message shown at session start */
  openingTemplate?: string;

  // === NARRATIVE CONTROL ===
  /** High-level style preset */
  narrativeStyle: NarrativeStyle;

  /** Weights for each narrative phase (1-4 scale) */
  arcEmphasis: ArcEmphasis;

  /** Which phase to emphasize at conversation start */
  openingPhase: OpeningPhase;

  // === VOICE MODIFIERS ===
  /** Vocabulary complexity level */
  vocabularyLevel: VocabularyLevel;

  /** Emotional tone of responses */
  emotionalRegister: EmotionalRegister;

  // === JOURNEY BINDING ===
  /** Default number of cards per journey */
  defaultThreadLength: number;

  /** Card IDs shown at journey start */
  entryPoints: string[];

  /** Curated card sequence for guided exploration */
  suggestedThread: string[];
}

// Re-export for convenience
export type {
  PersonaColor,
  NarrativeStyle,
  ArcEmphasis,
  OpeningPhase,
  VocabularyLevel,
  EmotionalRegister,
};

// Enum value arrays for dropdowns
export const PERSONA_COLORS: PersonaColor[] = [
  'forest', 'moss', 'amber', 'clay', 'slate', 'fig', 'stone',
];

export const NARRATIVE_STYLES: { value: NarrativeStyle; label: string }[] = [
  { value: 'balanced', label: 'Balanced' },
  { value: 'evidence-first', label: 'Evidence First' },
  { value: 'stakes-heavy', label: 'Stakes Heavy' },
  { value: 'mechanics-deep', label: 'Mechanics Deep' },
  { value: 'resolution-oriented', label: 'Resolution Oriented' },
];

export const OPENING_PHASES: { value: OpeningPhase; label: string }[] = [
  { value: 'hook', label: 'Hook' },
  { value: 'stakes', label: 'Stakes' },
  { value: 'mechanics', label: 'Mechanics' },
];

export const VOCABULARY_LEVELS: { value: VocabularyLevel; label: string }[] = [
  { value: 'accessible', label: 'Accessible' },
  { value: 'technical', label: 'Technical' },
  { value: 'academic', label: 'Academic' },
  { value: 'executive', label: 'Executive' },
];

export const EMOTIONAL_REGISTERS: { value: EmotionalRegister; label: string }[] = [
  { value: 'warm', label: 'Warm' },
  { value: 'neutral', label: 'Neutral' },
  { value: 'urgent', label: 'Urgent' },
  { value: 'measured', label: 'Measured' },
];

// Color config with hex values for UI
export const LENS_COLOR_CONFIG: Record<PersonaColor, { hex: string; label: string }> = {
  forest: { hex: '#2F5C3B', label: 'Forest' },
  moss: { hex: '#7EA16B', label: 'Moss' },
  amber: { hex: '#E0A83B', label: 'Amber' },
  clay: { hex: '#D95D39', label: 'Clay' },
  slate: { hex: '#526F8A', label: 'Slate' },
  fig: { hex: '#6B4B56', label: 'Fig' },
  stone: { hex: '#9C9285', label: 'Stone' },
};

// Default values for new lens
export const DEFAULT_LENS_PAYLOAD: Omit<LensPayload, 'toneGuidance'> = {
  color: 'slate',
  narrativeStyle: 'balanced',
  arcEmphasis: { hook: 3, stakes: 3, mechanics: 3, evidence: 3, resolution: 3 },
  openingPhase: 'hook',
  vocabularyLevel: 'accessible',
  emotionalRegister: 'warm',
  defaultThreadLength: 5,
  entryPoints: [],
  suggestedThread: [],
};
```

### 2. Create `src/bedrock/consoles/LensWorkshop/lens-transforms.ts`

```typescript
// src/bedrock/consoles/LensWorkshop/lens-transforms.ts
// Transform functions between legacy Persona and GroveObject<LensPayload>
// Migration: MIGRATION-001-lens

import type { Persona } from '../../../../data/narratives-schema';
import type { GroveObject } from '../../../core/schema/grove-object';
import type { LensPayload } from '../../types/lens';
import { DEFAULT_LENS_PAYLOAD } from '../../types/lens';

/**
 * Convert legacy Persona to GroveObject<LensPayload>
 */
export function personaToLens(persona: Persona): GroveObject<LensPayload> {
  return {
    meta: {
      id: persona.id,
      type: 'lens',
      title: persona.publicLabel,
      description: persona.description,
      icon: persona.icon,
      status: persona.enabled ? 'active' : 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    payload: {
      color: persona.color,
      toneGuidance: persona.toneGuidance,
      systemPrompt: persona.systemPrompt,
      openingTemplate: persona.openingTemplate,
      narrativeStyle: persona.narrativeStyle,
      arcEmphasis: { ...persona.arcEmphasis },
      openingPhase: persona.openingPhase,
      vocabularyLevel: persona.vocabularyLevel ?? 'accessible',
      emotionalRegister: persona.emotionalRegister ?? 'warm',
      defaultThreadLength: persona.defaultThreadLength,
      entryPoints: [...persona.entryPoints],
      suggestedThread: [...persona.suggestedThread],
    },
  };
}

/**
 * Convert GroveObject<LensPayload> back to legacy Persona
 * Used for backward compatibility with existing Terminal/Genesis code
 */
export function lensToPersona(lens: GroveObject<LensPayload>): Persona {
  return {
    id: lens.meta.id,
    publicLabel: lens.meta.title,
    description: lens.meta.description ?? '',
    icon: lens.meta.icon ?? 'Compass',
    color: lens.payload.color,
    enabled: lens.meta.status === 'active',
    toneGuidance: lens.payload.toneGuidance,
    systemPrompt: lens.payload.systemPrompt,
    openingTemplate: lens.payload.openingTemplate,
    narrativeStyle: lens.payload.narrativeStyle,
    arcEmphasis: { ...lens.payload.arcEmphasis },
    openingPhase: lens.payload.openingPhase,
    vocabularyLevel: lens.payload.vocabularyLevel,
    emotionalRegister: lens.payload.emotionalRegister,
    defaultThreadLength: lens.payload.defaultThreadLength,
    entryPoints: [...lens.payload.entryPoints],
    suggestedThread: [...lens.payload.suggestedThread],
  };
}

/**
 * Create a new lens with default values
 */
export function createDefaultLens(overrides?: Partial<LensPayload>): GroveObject<LensPayload> {
  const id = `lens-${Date.now()}`;
  return {
    meta: {
      id,
      type: 'lens',
      title: 'New Lens',
      description: 'A new persona lens',
      icon: 'Compass',
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    payload: {
      ...DEFAULT_LENS_PAYLOAD,
      toneGuidance: '[PERSONA: New Lens]\nDescribe the tone and approach for this persona...',
      ...overrides,
    },
  };
}
```

### 3. Replace `src/bedrock/consoles/LensWorkshop/useLensData.ts`

```typescript
// src/bedrock/consoles/LensWorkshop/useLensData.ts
// Data hook for Lens Workshop with real Persona data
// Migration: MIGRATION-001-lens

import { useState, useCallback, useEffect } from 'react';
import { DEFAULT_PERSONAS } from '../../../../data/default-personas';
import type { GroveObject } from '../../../core/schema/grove-object';
import type { LensPayload } from '../../types/lens';
import type { CollectionDataResult } from '../../patterns/console-factory.types';
import type { PatchOperation } from '../../types/copilot.types';
import { personaToLens, createDefaultLens } from './lens-transforms';

// =============================================================================
// Constants
// =============================================================================

const STORAGE_KEY = 'grove-bedrock-lenses-v2';

// =============================================================================
// Storage Helpers
// =============================================================================

function getDefaultLenses(): GroveObject<LensPayload>[] {
  // Transform DEFAULT_PERSONAS to GroveObject format
  return Object.values(DEFAULT_PERSONAS).map(personaToLens);
}

function loadFromStorage(): GroveObject<LensPayload>[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[useLensData] Failed to load from localStorage:', e);
  }
  return getDefaultLenses();
}

function saveToStorage(lenses: GroveObject<LensPayload>[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(lenses));
  } catch (e) {
    console.warn('[useLensData] Failed to save to localStorage:', e);
  }
}

// =============================================================================
// Hook
// =============================================================================

/**
 * Data hook for Lens Workshop
 * Loads real Persona data from DEFAULT_PERSONAS, persists to localStorage
 */
export function useLensData(): CollectionDataResult<LensPayload> & { reset: () => void } {
  const [lenses, setLenses] = useState<GroveObject<LensPayload>[]>(() => loadFromStorage());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Persist to localStorage whenever lenses change
  useEffect(() => {
    saveToStorage(lenses);
  }, [lenses]);

  const refetch = useCallback(() => {
    setLoading(true);
    setTimeout(() => {
      setLenses(loadFromStorage());
      setLoading(false);
    }, 300);
  }, []);

  const create = useCallback(async (defaults?: Partial<LensPayload>) => {
    const newLens = createDefaultLens(defaults);
    setLenses((prev) => [...prev, newLens]);
    return newLens;
  }, []);

  const update = useCallback(async (id: string, operations: PatchOperation[]) => {
    setLenses((prev) =>
      prev.map((lens) => {
        if (lens.meta.id !== id) return lens;

        // Deep clone to avoid mutation
        const updated: GroveObject<LensPayload> = {
          meta: { ...lens.meta, updatedAt: new Date().toISOString() },
          payload: { 
            ...lens.payload,
            arcEmphasis: { ...lens.payload.arcEmphasis },
            entryPoints: [...lens.payload.entryPoints],
            suggestedThread: [...lens.payload.suggestedThread],
          },
        };

        // Apply patch operations
        for (const op of operations) {
          if (op.op === 'replace') {
            if (op.path.startsWith('/payload/arcEmphasis/')) {
              const field = op.path.replace('/payload/arcEmphasis/', '') as keyof typeof updated.payload.arcEmphasis;
              updated.payload.arcEmphasis[field] = op.value as 1 | 2 | 3 | 4;
            } else if (op.path.startsWith('/payload/')) {
              const field = op.path.replace('/payload/', '') as keyof LensPayload;
              (updated.payload as Record<string, unknown>)[field] = op.value;
            } else if (op.path.startsWith('/meta/')) {
              const field = op.path.replace('/meta/', '');
              (updated.meta as Record<string, unknown>)[field] = op.value;
            }
          }
        }

        // Sync title with publicLabel if it exists in payload? No - title IS the name
        return updated;
      })
    );
  }, []);

  const remove = useCallback(async (id: string) => {
    setLenses((prev) => prev.filter((lens) => lens.meta.id !== id));
  }, []);

  const duplicate = useCallback(async (object: GroveObject<LensPayload>) => {
    const duplicated: GroveObject<LensPayload> = {
      meta: {
        id: `lens-${Date.now()}`,
        type: 'lens',
        title: `${object.meta.title} (Copy)`,
        description: object.meta.description,
        icon: object.meta.icon,
        status: 'draft',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      payload: {
        ...object.payload,
        arcEmphasis: { ...object.payload.arcEmphasis },
        entryPoints: [...object.payload.entryPoints],
        suggestedThread: [...object.payload.suggestedThread],
      },
    };
    setLenses((prev) => [...prev, duplicated]);
    return duplicated;
  }, []);

  // Reset to defaults (useful for testing)
  const reset = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setLenses(getDefaultLenses());
  }, []);

  return {
    objects: lenses,
    loading,
    error,
    refetch,
    create,
    update,
    remove,
    duplicate,
    reset,
  };
}

export default useLensData;
```

### 4. Replace `src/bedrock/consoles/LensWorkshop/LensCard.tsx`

```typescript
// src/bedrock/consoles/LensWorkshop/LensCard.tsx
// Lens card component showing real Persona fields
// Migration: MIGRATION-001-lens

import React from 'react';
import type { ObjectCardProps } from '../../patterns/console-factory.types';
import type { LensPayload } from '../../types/lens';
import { LENS_COLOR_CONFIG, NARRATIVE_STYLES } from '../../types/lens';

/**
 * Card component for displaying a lens in grid/list view
 */
export function LensCard({
  object: lens,
  selected,
  isFavorite,
  onClick,
  onFavoriteToggle,
  className = '',
}: ObjectCardProps<LensPayload>) {
  const colorConfig = LENS_COLOR_CONFIG[lens.payload.color] || LENS_COLOR_CONFIG.slate;
  const styleLabel = NARRATIVE_STYLES.find(s => s.value === lens.payload.narrativeStyle)?.label || 'Balanced';
  const isActive = lens.meta.status === 'active';

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-xl border p-4 cursor-pointer transition-all
        ${selected
          ? 'border-[var(--neon-cyan)] bg-[var(--neon-cyan)]/5 ring-1 ring-[var(--neon-cyan)]/50'
          : 'border-[var(--glass-border)] bg-[var(--glass-solid)] hover:border-[var(--glass-border-bright)] hover:bg-[var(--glass-elevated)]'
        }
        ${className}
      `}
      data-testid="lens-card"
    >
      {/* Color bar at top */}
      <div 
        className="absolute top-0 left-0 right-0 h-1 rounded-t-xl"
        style={{ backgroundColor: colorConfig.hex }}
      />

      {/* Favorite button */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onFavoriteToggle();
        }}
        className={`
          absolute top-3 right-3 p-1 rounded-lg transition-colors
          ${isFavorite
            ? 'text-[var(--neon-amber)]'
            : 'text-[var(--glass-text-muted)] hover:text-[var(--glass-text-secondary)]'
          }
        `}
        aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      >
        <span className="material-symbols-outlined text-lg">
          {isFavorite ? 'star' : 'star_outline'}
        </span>
      </button>

      {/* Icon and title */}
      <div className="flex items-start gap-3 mb-3 pr-8 mt-2">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${colorConfig.hex}20` }}
        >
          <span 
            className="material-symbols-outlined text-xl"
            style={{ color: colorConfig.hex }}
          >
            {lens.meta.icon === 'Compass' ? 'explore' :
             lens.meta.icon === 'Home' ? 'home' :
             lens.meta.icon === 'GraduationCap' ? 'school' :
             lens.meta.icon === 'Settings' ? 'settings' :
             lens.meta.icon === 'Globe' ? 'public' :
             lens.meta.icon === 'Building2' ? 'apartment' :
             lens.meta.icon === 'Briefcase' ? 'work' :
             lens.meta.icon === 'Boxes' ? 'inventory_2' :
             'filter_alt'}
          </span>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-[var(--glass-text-primary)] truncate">
            {lens.meta.title}
          </h3>
          <p className="text-xs text-[var(--glass-text-muted)]">
            {colorConfig.label} • {styleLabel}
          </p>
        </div>
      </div>

      {/* Description */}
      {lens.meta.description && (
        <p className="text-sm text-[var(--glass-text-secondary)] line-clamp-2 mb-3">
          {lens.meta.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs">
        <span
          className={`
            px-2 py-0.5 rounded-full
            ${isActive
              ? 'bg-green-500/20 text-green-400'
              : 'bg-amber-500/20 text-amber-400'
            }
          `}
        >
          {isActive ? 'Active' : 'Draft'}
        </span>
        <span className="text-[var(--glass-text-muted)]">
          {lens.payload.vocabularyLevel}
        </span>
      </div>
    </div>
  );
}

export default LensCard;
```

### 5. Replace `src/bedrock/consoles/LensWorkshop/LensEditor.tsx`

```typescript
// src/bedrock/consoles/LensWorkshop/LensEditor.tsx
// Lens editor with real Persona fields organized by function
// Migration: MIGRATION-001-lens

import React, { useState } from 'react';
import type { ObjectEditorProps } from '../../patterns/console-factory.types';
import type { LensPayload, ArcEmphasis } from '../../types/lens';
import type { PatchOperation } from '../../types/copilot.types';
import { 
  LENS_COLOR_CONFIG,
  NARRATIVE_STYLES,
  OPENING_PHASES,
  VOCABULARY_LEVELS,
  EMOTIONAL_REGISTERS,
  PERSONA_COLORS,
} from '../../types/lens';
import { InspectorSection, InspectorDivider } from '../../primitives/BedrockInspector';
import { GlassButton } from '../../primitives/GlassButton';

// =============================================================================
// Arc Emphasis Editor Component
// =============================================================================

interface ArcEmphasisEditorProps {
  value: ArcEmphasis;
  onChange: (emphasis: ArcEmphasis) => void;
  disabled?: boolean;
}

function ArcEmphasisEditor({ value, onChange, disabled }: ArcEmphasisEditorProps) {
  const phases: { key: keyof ArcEmphasis; label: string }[] = [
    { key: 'hook', label: 'Hook' },
    { key: 'stakes', label: 'Stakes' },
    { key: 'mechanics', label: 'Mechanics' },
    { key: 'evidence', label: 'Evidence' },
    { key: 'resolution', label: 'Resolution' },
  ];

  return (
    <div className="space-y-3">
      {phases.map(({ key, label }) => (
        <div key={key} className="flex items-center gap-3">
          <span className="text-xs text-[var(--glass-text-muted)] w-20">{label}</span>
          <input
            type="range"
            min={1}
            max={4}
            value={value[key]}
            onChange={(e) => onChange({ ...value, [key]: parseInt(e.target.value) as 1 | 2 | 3 | 4 })}
            className="flex-1 h-2 bg-[var(--glass-border)] rounded-lg appearance-none cursor-pointer accent-[var(--neon-cyan)]"
            disabled={disabled}
          />
          <span className="text-xs text-[var(--glass-text-secondary)] w-4 text-right">
            {value[key]}
          </span>
        </div>
      ))}
    </div>
  );
}

// =============================================================================
// Main Editor
// =============================================================================

export function LensEditor({
  object: lens,
  onEdit,
  onSave,
  onDelete,
  onDuplicate,
  loading,
  hasChanges,
}: ObjectEditorProps<LensPayload>) {
  const [showSystemPrompt, setShowSystemPrompt] = useState(!!lens.payload.systemPrompt);
  const [showJourneyBinding, setShowJourneyBinding] = useState(false);

  // Helper to create patch operation
  const patchPayload = (field: keyof LensPayload, value: unknown) => {
    const op: PatchOperation = { op: 'replace', path: `/payload/${field}`, value };
    onEdit([op]);
  };

  const patchMeta = (field: string, value: unknown) => {
    const op: PatchOperation = { op: 'replace', path: `/meta/${field}`, value };
    onEdit([op]);
  };

  const patchArcEmphasis = (emphasis: ArcEmphasis) => {
    // Patch each field individually for proper tracking
    const ops: PatchOperation[] = Object.entries(emphasis).map(([key, val]) => ({
      op: 'replace' as const,
      path: `/payload/arcEmphasis/${key}`,
      value: val,
    }));
    onEdit(ops);
  };

  const colorConfig = LENS_COLOR_CONFIG[lens.payload.color] || LENS_COLOR_CONFIG.slate;

  return (
    <div className="flex flex-col h-full">
      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        
        {/* === IDENTITY === */}
        <InspectorSection title="Identity">
          <div className="space-y-4">
            {/* Name */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Name
              </label>
              <input
                type="text"
                value={lens.meta.title}
                onChange={(e) => patchMeta('title', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                disabled={loading}
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Description
              </label>
              <input
                type="text"
                value={lens.meta.description || ''}
                onChange={(e) => patchMeta('description', e.target.value)}
                placeholder="One-liner for lens picker"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                disabled={loading}
              />
            </div>

            {/* Color */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-2">
                Color
              </label>
              <div className="flex flex-wrap gap-2">
                {PERSONA_COLORS.map((color) => {
                  const config = LENS_COLOR_CONFIG[color];
                  return (
                    <button
                      key={color}
                      onClick={() => patchPayload('color', color)}
                      className={`
                        w-8 h-8 rounded-lg transition-all flex items-center justify-center
                        ${lens.payload.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-[var(--glass-solid)]' : ''}
                      `}
                      style={{ backgroundColor: config.hex }}
                      title={config.label}
                      disabled={loading}
                    >
                      {lens.payload.color === color && (
                        <span className="material-symbols-outlined text-white text-sm">check</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Enabled toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--glass-text-secondary)]">Show in Lens Picker</span>
              <button
                onClick={() => patchMeta('status', lens.meta.status === 'active' ? 'draft' : 'active')}
                className={`
                  relative w-11 h-6 rounded-full transition-colors
                  ${lens.meta.status === 'active' ? 'bg-[var(--neon-green)]' : 'bg-[var(--glass-border)]'}
                `}
                disabled={loading}
              >
                <span
                  className={`
                    absolute top-1 w-4 h-4 rounded-full bg-white transition-all
                    ${lens.meta.status === 'active' ? 'left-6' : 'left-1'}
                  `}
                />
              </button>
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === VOICE PROMPT (THE MAIN FIELD) === */}
        <InspectorSection 
          title="Voice Prompt" 
          subtitle="Injected into LLM system prompt"
        >
          <textarea
            value={lens.payload.toneGuidance}
            onChange={(e) => patchPayload('toneGuidance', e.target.value)}
            rows={10}
            placeholder="[PERSONA: Name]&#10;Describe how this lens should speak, what vocabulary to use, what metaphors work, what to emphasize..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 resize-none font-mono"
            disabled={loading}
          />
          <p className="text-xs text-[var(--glass-text-muted)] mt-2">
            {lens.payload.toneGuidance.length} characters
          </p>
        </InspectorSection>

        <InspectorDivider />

        {/* === SYSTEM OVERRIDE (collapsible) === */}
        <InspectorSection 
          title="System Override"
          collapsible
          defaultCollapsed={!showSystemPrompt}
        >
          <p className="text-xs text-[var(--glass-text-muted)] mb-2">
            Optional: Replace the default system prompt entirely
          </p>
          <textarea
            value={lens.payload.systemPrompt || ''}
            onChange={(e) => patchPayload('systemPrompt', e.target.value || undefined)}
            rows={6}
            placeholder="Leave empty to use default system prompt with toneGuidance injected"
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 resize-none font-mono"
            disabled={loading}
          />
        </InspectorSection>

        <InspectorDivider />

        {/* === VOICE MODIFIERS === */}
        <InspectorSection title="Voice Modifiers">
          <div className="space-y-4">
            {/* Vocabulary Level */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Vocabulary Level
              </label>
              <select
                value={lens.payload.vocabularyLevel}
                onChange={(e) => patchPayload('vocabularyLevel', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                disabled={loading}
              >
                {VOCABULARY_LEVELS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Emotional Register */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Emotional Register
              </label>
              <select
                value={lens.payload.emotionalRegister}
                onChange={(e) => patchPayload('emotionalRegister', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                disabled={loading}
              >
                {EMOTIONAL_REGISTERS.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Opening Template */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Opening Message (optional)
              </label>
              <textarea
                value={lens.payload.openingTemplate || ''}
                onChange={(e) => patchPayload('openingTemplate', e.target.value || undefined)}
                rows={2}
                placeholder="Custom message shown when session starts"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50 resize-none"
                disabled={loading}
              />
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === NARRATIVE CONTROL === */}
        <InspectorSection title="Narrative Control">
          <div className="space-y-4">
            {/* Narrative Style */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Narrative Style
              </label>
              <select
                value={lens.payload.narrativeStyle}
                onChange={(e) => patchPayload('narrativeStyle', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                disabled={loading}
              >
                {NARRATIVE_STYLES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Opening Phase */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Opening Phase
              </label>
              <select
                value={lens.payload.openingPhase}
                onChange={(e) => patchPayload('openingPhase', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--glass-border)] bg-[var(--glass-solid)] text-[var(--glass-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]/50"
                disabled={loading}
              >
                {OPENING_PHASES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            {/* Arc Emphasis */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-2">
                Arc Emphasis (1-4)
              </label>
              <ArcEmphasisEditor
                value={lens.payload.arcEmphasis}
                onChange={patchArcEmphasis}
                disabled={loading}
              />
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === JOURNEY BINDING (collapsible) === */}
        <InspectorSection 
          title="Journey Binding"
          collapsible
          defaultCollapsed={true}
        >
          <div className="space-y-4">
            {/* Thread Length */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Default Thread Length: {lens.payload.defaultThreadLength}
              </label>
              <input
                type="range"
                min={3}
                max={10}
                value={lens.payload.defaultThreadLength}
                onChange={(e) => patchPayload('defaultThreadLength', parseInt(e.target.value))}
                className="w-full h-2 bg-[var(--glass-border)] rounded-lg appearance-none cursor-pointer accent-[var(--neon-cyan)]"
                disabled={loading}
              />
              <div className="flex justify-between text-xs text-[var(--glass-text-muted)] mt-1">
                <span>3</span>
                <span>10</span>
              </div>
            </div>

            {/* Entry Points (placeholder for card picker) */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Entry Points
              </label>
              <p className="text-xs text-[var(--glass-text-muted)] italic">
                {lens.payload.entryPoints.length} cards configured
              </p>
            </div>

            {/* Suggested Thread (placeholder for card picker) */}
            <div>
              <label className="block text-xs text-[var(--glass-text-muted)] mb-1">
                Suggested Thread
              </label>
              <p className="text-xs text-[var(--glass-text-muted)] italic">
                {lens.payload.suggestedThread.length} cards in sequence
              </p>
            </div>
          </div>
        </InspectorSection>

        <InspectorDivider />

        {/* === METADATA === */}
        <InspectorSection title="Metadata">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-[var(--glass-text-muted)]">Created</dt>
              <dd className="text-[var(--glass-text-secondary)]">
                {new Date(lens.meta.createdAt).toLocaleDateString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--glass-text-muted)]">Updated</dt>
              <dd className="text-[var(--glass-text-secondary)]">
                {new Date(lens.meta.updatedAt).toLocaleDateString()}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-[var(--glass-text-muted)]">ID</dt>
              <dd className="text-[var(--glass-text-muted)] font-mono text-xs">
                {lens.meta.id}
              </dd>
            </div>
          </dl>
        </InspectorSection>
      </div>

      {/* Fixed footer with actions */}
      <div className="flex-shrink-0 p-4 border-t border-[var(--glass-border)] bg-[var(--glass-panel)]">
        <div className="flex items-center gap-2">
          <GlassButton
            onClick={onSave}
            variant="primary"
            size="sm"
            disabled={loading || !hasChanges}
            className="flex-1"
          >
            {hasChanges ? 'Save Changes' : 'Saved'}
          </GlassButton>
          <GlassButton
            onClick={onDuplicate}
            variant="ghost"
            size="sm"
            disabled={loading}
            title="Duplicate"
          >
            <span className="material-symbols-outlined text-lg">content_copy</span>
          </GlassButton>
          <GlassButton
            onClick={onDelete}
            variant="ghost"
            size="sm"
            disabled={loading}
            className="text-red-400 hover:text-red-300"
            title="Delete"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </GlassButton>
        </div>
      </div>
    </div>
  );
}

export default LensEditor;
```

### 6. Update `src/bedrock/consoles/LensWorkshop/LensWorkshop.config.ts`

```typescript
// src/bedrock/consoles/LensWorkshop/LensWorkshop.config.ts
// Console configuration for Lens Workshop
// Migration: MIGRATION-001-lens

import type { ConsoleConfig } from '../../types/console.types';

export const lensWorkshopConfig: ConsoleConfig = {
  id: 'lenses',
  title: 'Lenses',
  description: 'Prompt engineering personas that control AI voice',

  metrics: [
    { id: 'total', label: 'Total', icon: 'filter_alt', query: 'count(*)' },
    { id: 'active', label: 'Active', icon: 'visibility', query: 'count(where: enabled)' },
    { id: 'draft', label: 'Draft', icon: 'edit_note', query: 'count(where: !enabled)' },
  ],

  collectionView: {
    searchFields: ['meta.title', 'meta.description', 'payload.toneGuidance'],
    filterOptions: [
      {
        field: 'payload.narrativeStyle',
        label: 'Style',
        options: ['balanced', 'evidence-first', 'stakes-heavy', 'mechanics-deep', 'resolution-oriented'],
      },
      {
        field: 'payload.vocabularyLevel',
        label: 'Vocabulary',
        options: ['accessible', 'technical', 'academic', 'executive'],
      },
      {
        field: 'payload.color',
        label: 'Color',
        options: ['forest', 'moss', 'amber', 'clay', 'slate', 'fig', 'stone'],
      },
    ],
    sortOptions: [
      { field: 'meta.title', label: 'Name', direction: 'asc' },
      { field: 'meta.updatedAt', label: 'Recently Updated', direction: 'desc' },
      { field: 'payload.narrativeStyle', label: 'Style', direction: 'asc' },
    ],
    defaultSort: { field: 'meta.title', direction: 'asc' },
    defaultViewMode: 'grid',
    viewModes: ['grid', 'list'],
    favoritesKey: 'grove-lens-favorites',
  },

  primaryAction: { label: 'New Lens', icon: 'add' },
  copilot: { enabled: true },
};

// Legacy exports for backward compatibility (used by old code)
export const LENS_CATEGORY_CONFIG = {
  role: { label: 'Role', icon: 'person' },
  interest: { label: 'Interest', icon: 'interests' },
  context: { label: 'Context', icon: 'schedule' },
  custom: { label: 'Custom', icon: 'tune' },
};

export const DEFAULT_LENS_COLORS = [
  '#2F5C3B', // forest
  '#7EA16B', // moss
  '#E0A83B', // amber
  '#D95D39', // clay
  '#526F8A', // slate
  '#6B4B56', // fig
  '#9C9285', // stone
];

export default lensWorkshopConfig;
```

---

## Testing

### Manual Verification

1. Navigate to `/bedrock/lenses`
2. Should see 8 default lenses (Freestyle, Concerned Citizen, Academic, etc.)
3. Click a lens → inspector shows real fields
4. **Voice Prompt** section shows actual `toneGuidance` text
5. Edit fields → Save → Changes persist on refresh
6. Arc Emphasis sliders work (1-4 scale)
7. Color picker shows earthy palette
8. New Lens creates with proper defaults

### Reset Data

To reset to defaults (browser console):
```javascript
localStorage.removeItem('grove-bedrock-lenses-v2');
location.reload();
```

---

## Definition of Done

- [ ] `LensPayload` type matches real `Persona` fields
- [ ] `personaToLens()` / `lensToPersona()` transforms work
- [ ] `DEFAULT_PERSONAS` loads as default data
- [ ] `toneGuidance` is the hero field in editor
- [ ] Arc Emphasis shows 5 sliders (1-4 scale)
- [ ] Earthy color palette (7 colors)
- [ ] All fields editable and persist
- [ ] TypeScript compiles
- [ ] Build succeeds
