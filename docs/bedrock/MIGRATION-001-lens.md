# MIGRATION-001: Lens (Persona) Object

**Object Type:** Lens  
**Legacy Type:** `Persona` from `data/narratives-schema.ts`  
**Status:** In Progress  
**Sprint:** hotfix/lens-migration

---

## Phase 1: Legacy Object Analysis

### 1.1 Source of Truth

| Artifact | Location |
|----------|----------|
| TypeScript Interface | `data/narratives-schema.ts` → `Persona` |
| Runtime Data | `data/default-personas.ts` → `DEFAULT_PERSONAS` |
| UI Usage | `src/explore/LensInspector.tsx`, `src/explore/LensPicker.tsx` |
| Engine Usage | Injected into LLM prompts via `toneGuidance` field |
| Presentation Data | `data/presentation/lenses.json` → `lensRealities` (Genesis landing content) |

### 1.2 Functional Purpose

**What problem does a Lens solve?**

1. **User-facing function:** 
   - Allows users to select a "perspective" that tailors AI responses to their background
   - Controls vocabulary level, emotional register, and narrative emphasis
   - Shown in Terminal lens picker as selectable options

2. **System function:**
   - The `toneGuidance` field is **injected directly into the LLM system prompt**
   - Controls how Claude/GPT responds: vocabulary, metaphors, emphasis
   - `arcEmphasis` weights control which narrative phases get more attention
   - Binds to journeys via `entryPoints` and `suggestedThread`

**This is fundamentally a prompt engineering object.** The `toneGuidance` is the core field—everything else modifies how that guidance is applied.

### 1.3 Field Inventory

| Field | Type | Purpose | UI Control | Validation |
|-------|------|---------|------------|------------|
| `id` | string | Unique identifier | readonly | required, unique |
| `publicLabel` | string | User-facing name in picker | text input | required, max 50 |
| `description` | string | One-liner shown in picker | text input | required, max 150 |
| `icon` | string | Lucide icon name | icon picker | required |
| `color` | PersonaColor | Theme color | color picker | required, enum |
| `enabled` | boolean | Show in lens picker | toggle | required |
| **`toneGuidance`** | string | **THE MAIN FIELD - injected into LLM** | large textarea | required, 50-2000 chars |
| `narrativeStyle` | NarrativeStyle | High-level style preset | dropdown | required, enum |
| `arcEmphasis` | ArcEmphasis | Weights for narrative phases | 5 sliders (1-4) | required |
| `openingPhase` | OpeningPhase | Which phase to start with | dropdown | required, enum |
| `defaultThreadLength` | number | Cards per journey | slider | 3-10 |
| `systemPrompt` | string? | Optional system prompt override | textarea | max 4000 |
| `openingTemplate` | string? | Custom session start | textarea | max 500 |
| `vocabularyLevel` | VocabularyLevel? | accessible/technical/academic/executive | dropdown | enum |
| `emotionalRegister` | EmotionalRegister? | warm/neutral/urgent/measured | dropdown | enum |
| `entryPoints` | string[] | Card IDs for journey start | multi-select | card IDs |
| `suggestedThread` | string[] | Curated card sequence | sortable list | card IDs |

### 1.4 Relationships

| Relationship | Type | Description |
|--------------|------|-------------|
| Cards | Many-to-Many | Cards have `personas` field listing which lenses see them |
| Journeys | Indirect | Lenses define `entryPoints` that may correspond to journey entry nodes |
| LensRealities | 1:1 | `lenses.json` has presentation content keyed by persona ID |
| TerminalSession | Runtime | `activeLens` field stores current persona ID |

### 1.5 Operations

| Operation | Behavior | Side Effects |
|-----------|----------|--------------|
| Create | Generate new persona with defaults | None |
| Update | Modify any field | If `toneGuidance` changes, affects all future AI responses |
| Delete | Remove persona | Cards with this persona in `personas[]` become orphaned |
| Duplicate | Copy with "(Copy)" suffix | None |
| Enable/Disable | Toggle `enabled` | Shows/hides in Terminal lens picker |

---

## Phase 2: Schema Migration

### 2.1 Map to GroveObject

```
Persona Field        → GroveObject Location
─────────────────────────────────────────────
id                   → meta.id
publicLabel          → meta.title
description          → meta.description
icon                 → meta.icon
enabled              → meta.status ('active' | 'draft')
createdAt (new)      → meta.createdAt
updatedAt (new)      → meta.updatedAt

color                → payload.color
toneGuidance         → payload.toneGuidance
narrativeStyle       → payload.narrativeStyle
arcEmphasis          → payload.arcEmphasis
openingPhase         → payload.openingPhase
defaultThreadLength  → payload.defaultThreadLength
systemPrompt         → payload.systemPrompt
openingTemplate      → payload.openingTemplate
vocabularyLevel      → payload.vocabularyLevel
emotionalRegister    → payload.emotionalRegister
entryPoints          → payload.entryPoints
suggestedThread      → payload.suggestedThread
```

### 2.2 LensPayload Type Definition

```typescript
// src/bedrock/types/lens.ts

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

// Re-export enums for convenience
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
  'forest', 'moss', 'amber', 'clay', 'slate', 'fig', 'stone'
];

export const NARRATIVE_STYLES: NarrativeStyle[] = [
  'evidence-first', 'stakes-heavy', 'mechanics-deep', 'resolution-oriented', 'balanced'
];

export const OPENING_PHASES: OpeningPhase[] = ['hook', 'stakes', 'mechanics'];

export const VOCABULARY_LEVELS: VocabularyLevel[] = [
  'accessible', 'technical', 'academic', 'executive'
];

export const EMOTIONAL_REGISTERS: EmotionalRegister[] = [
  'warm', 'neutral', 'urgent', 'measured'
];

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

### 2.3 Transformation Functions

```typescript
// src/bedrock/consoles/LensWorkshop/lens-transforms.ts

import type { Persona } from '../../../data/narratives-schema';
import type { GroveObject } from '../../core/schema/grove-object';
import type { LensPayload } from '../../types/lens';

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
      arcEmphasis: persona.arcEmphasis,
      openingPhase: persona.openingPhase,
      vocabularyLevel: persona.vocabularyLevel ?? 'accessible',
      emotionalRegister: persona.emotionalRegister ?? 'warm',
      defaultThreadLength: persona.defaultThreadLength,
      entryPoints: persona.entryPoints,
      suggestedThread: persona.suggestedThread,
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
    arcEmphasis: lens.payload.arcEmphasis,
    openingPhase: lens.payload.openingPhase,
    vocabularyLevel: lens.payload.vocabularyLevel,
    emotionalRegister: lens.payload.emotionalRegister,
    defaultThreadLength: lens.payload.defaultThreadLength,
    entryPoints: lens.payload.entryPoints,
    suggestedThread: lens.payload.suggestedThread,
  };
}
```

---

## Phase 3: Data Hook

### 3.1 Data Source Strategy

| Source | Purpose |
|--------|---------|
| `DEFAULT_PERSONAS` | Initial seed data (8 built-in lenses) |
| `localStorage` | User modifications persist across refresh |
| Future: API | Full CRUD with backend persistence |

### 3.2 Implementation

See `src/bedrock/consoles/LensWorkshop/useLensData.ts` (to be updated)

Key changes:
- Import `DEFAULT_PERSONAS` from `data/default-personas.ts`
- Transform using `personaToLens()` on load
- Store as `GroveObject<LensPayload>[]` in localStorage

---

## Phase 4: UI Components

### 4.1 LensCard Design

**Shows:**
- Icon (from meta.icon, rendered as Lucide)
- Title (meta.title / publicLabel)
- Color bar (payload.color)
- Status badge (Active/Draft based on meta.status)
- Narrative style badge
- Favorite star

**Quick info:**
- Entry points count
- Thread length

### 4.2 LensEditor Design (Inspector Sections)

```
┌─────────────────────────────────────────────┐
│ IDENTITY                                     │
│ ├── Name (text input)                       │
│ ├── Description (textarea, 1-2 lines)       │
│ ├── Icon (Lucide picker)                    │
│ ├── Color (earthy palette picker)           │
│ └── Enabled (toggle)                        │
├─────────────────────────────────────────────┤
│ VOICE PROMPT (the main event)               │
│ └── toneGuidance (large textarea, ~10 rows) │
│     Placeholder: "[PERSONA: Name]..."       │
│     Helper: "Injected into LLM prompt"      │
├─────────────────────────────────────────────┤
│ SYSTEM OVERRIDE (collapsible)               │
│ └── systemPrompt (textarea, optional)       │
│     Helper: "Replaces default system prompt"│
├─────────────────────────────────────────────┤
│ VOICE MODIFIERS                             │
│ ├── vocabularyLevel (dropdown)              │
│ ├── emotionalRegister (dropdown)            │
│ └── openingTemplate (textarea, optional)    │
├─────────────────────────────────────────────┤
│ NARRATIVE CONTROL                           │
│ ├── narrativeStyle (dropdown)               │
│ ├── openingPhase (dropdown)                 │
│ └── arcEmphasis (5 sliders: hook/stakes/    │
│     mechanics/evidence/resolution, 1-4)     │
├─────────────────────────────────────────────┤
│ JOURNEY BINDING (collapsible)               │
│ ├── defaultThreadLength (slider 3-10)       │
│ ├── entryPoints (multi-select cards)        │
│ └── suggestedThread (sortable card list)    │
├─────────────────────────────────────────────┤
│ METADATA (readonly)                         │
│ ├── Created: [date]                         │
│ ├── Updated: [date]                         │
│ └── ID: [id]                                │
└─────────────────────────────────────────────┘
```

### 4.3 Copilot Actions

| Action | Prompt | Generates |
|--------|--------|-----------|
| `generate-tone` | "Write toneGuidance for [audience] focusing on [topic]" | toneGuidance text |
| `refine-tone` | "Make this more [accessible/technical/urgent]" | Refined toneGuidance |
| `suggest-arc` | "Suggest arcEmphasis weights for [persona type]" | arcEmphasis values |
| `validate` | "Check this persona for issues" | Validation report |

---

## Phase 5: Console Configuration

```typescript
// src/bedrock/consoles/LensWorkshop/LensWorkshop.config.ts

export const lensWorkshopConfig: ConsoleConfig = {
  id: 'lenses',
  title: 'Lenses',
  description: 'Prompt engineering personas that control AI voice',
  
  metrics: [
    { id: 'total', label: 'Total Lenses', icon: 'filter_alt', query: 'count(*)' },
    { id: 'active', label: 'Active', icon: 'visibility', query: 'count(where: enabled)' },
    { id: 'draft', label: 'Draft', icon: 'edit_note', query: 'count(where: !enabled)' },
  ],
  
  collectionView: {
    searchFields: ['meta.title', 'meta.description', 'payload.toneGuidance'],
    filterOptions: [
      { 
        field: 'payload.narrativeStyle', 
        label: 'Style', 
        options: ['evidence-first', 'stakes-heavy', 'mechanics-deep', 'resolution-oriented', 'balanced'] 
      },
      {
        field: 'payload.vocabularyLevel',
        label: 'Vocabulary',
        options: ['accessible', 'technical', 'academic', 'executive']
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
```

---

## Phase 6: Implementation Checklist

### Analysis ✅
- [x] Located legacy TypeScript interface (`Persona`)
- [x] Located runtime data source (`DEFAULT_PERSONAS`)
- [x] Documented functional purpose (prompt engineering)
- [x] Created field inventory (15 fields)
- [x] Identified relationships (Cards, Journeys, LensRealities)

### Schema
- [ ] Define `LensPayload` interface in `src/bedrock/types/lens.ts`
- [ ] Create `personaToLens()` transform
- [ ] Create `lensToPersona()` transform

### Data
- [ ] Update `useLensData` to load from `DEFAULT_PERSONAS`
- [ ] Apply `personaToLens()` transform on load
- [ ] Persist with real structure to localStorage

### UI
- [ ] Update `LensCard` with real fields
- [ ] Rewrite `LensEditor` with proper sections
- [ ] Add arcEmphasis sliders component
- [ ] Add Lucide icon picker component

### Console
- [ ] Update `lensWorkshopConfig` with real filters
- [ ] Verify factory wiring
- [ ] Test full workflow

### Validation
- [ ] Legacy personas load correctly
- [ ] CRUD operations work
- [ ] Changes persist across refresh
- [ ] No regressions in Terminal lens picker

---

## Files to Create/Modify

| File | Action |
|------|--------|
| `src/bedrock/types/lens.ts` | **Replace** with real LensPayload |
| `src/bedrock/consoles/LensWorkshop/lens-transforms.ts` | **Create** transform functions |
| `src/bedrock/consoles/LensWorkshop/useLensData.ts` | **Update** to use DEFAULT_PERSONAS |
| `src/bedrock/consoles/LensWorkshop/LensCard.tsx` | **Update** to real fields |
| `src/bedrock/consoles/LensWorkshop/LensEditor.tsx` | **Rewrite** with proper sections |
| `src/bedrock/consoles/LensWorkshop/LensWorkshop.config.ts` | **Update** filters |
| `src/bedrock/consoles/LensWorkshop/components/ArcEmphasisEditor.tsx` | **Create** slider component |
| `src/bedrock/consoles/LensWorkshop/components/IconPicker.tsx` | **Create** Lucide picker |
