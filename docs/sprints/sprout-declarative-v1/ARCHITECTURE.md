# Architecture: sprout-declarative-v1

**Sprint:** sprout-declarative-v1  
**Version:** 1.0  
**Author:** Jim Calhoun + Claude  
**Date:** December 30, 2024  

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          DECLARATIVE LAYER                                   │
│  ┌──────────────────┐ ┌──────────────────┐ ┌──────────────────────────────┐ │
│  │ selection-       │ │ sprout-          │ │ research-                    │ │
│  │ actions.json     │ │ stages.json      │ │ purposes.json                │ │
│  │                  │ │                  │ │                              │ │
│  │ • Actions[]      │ │ • Stages[]       │ │ • Purposes[]                 │ │
│  │ • CaptureCards   │ │ • Transitions{}  │ │ • PromptFramings             │ │
│  └────────┬─────────┘ └────────┬─────────┘ └──────────────┬───────────────┘ │
│           │                    │                          │                  │
│           └────────────────────┼──────────────────────────┘                  │
│                                ▼                                             │
│                    ┌───────────────────────┐                                 │
│                    │ useSelectionActions   │ ← Engine reads declarative     │
│                    │ (Declarative Engine)  │   config, renders appropriate  │
│                    └───────────┬───────────┘   components                   │
└────────────────────────────────┼────────────────────────────────────────────┘
                                 │
┌────────────────────────────────┼────────────────────────────────────────────┐
│                          COMPONENT LAYER                                     │
│                                ▼                                             │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                    SelectionCaptureManager                            │   │
│  │  ┌───────────────┐  ┌─────────────────┐  ┌─────────────────────────┐ │   │
│  │  │ MagneticPill  │→ │ ActionMenu      │→ │ [CaptureCard]           │ │   │
│  │  │ (fixed bug)   │  │ (multi-action)  │  │ • SproutCaptureCard     │ │   │
│  │  │               │  │                 │  │ • ResearchManifestCard  │ │   │
│  │  └───────────────┘  └─────────────────┘  └─────────────────────────┘ │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                         SproutTray                                    │   │
│  │  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────┐   │   │
│  │  │ SproutCard      │  │ SproutCard      │  │ SproutCard          │   │   │
│  │  │ stage: tender   │  │ stage: rooting  │  │ stage: branching    │   │   │
│  │  │ [basic display] │  │ [+ manifest]    │  │ [+ prompt ready]    │   │   │
│  │  └─────────────────┘  └─────────────────┘  └─────────────────────┘   │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
                                 │
                                 ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           SCHEMA LAYER                                       │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  src/core/schema/sprout.ts                                            │   │
│  │                                                                        │   │
│  │  interface Sprout {                                                    │   │
│  │    id, capturedAt, response, query, provenance,                        │   │
│  │    stage: SproutStage,            // NEW: 8-stage lifecycle            │   │
│  │    researchManifest?: ResearchManifest,  // NEW: research data         │   │
│  │    tags, notes, sessionId                                              │   │
│  │  }                                                                     │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Component Hierarchy

```
KineticStream/
├── Capture/
│   ├── config/
│   │   └── sprout-capture.config.ts  → References JSON configs
│   ├── hooks/
│   │   ├── useTextSelection.ts       → Existing (unchanged)
│   │   ├── useCaptureState.ts        → Existing (unchanged)
│   │   ├── useSelectionActions.ts    → NEW: Declarative action engine
│   │   └── useKineticShortcuts.ts    → Existing (unchanged)
│   ├── components/
│   │   ├── MagneticPill.tsx          → MODIFIED: Fix bug, multi-action
│   │   ├── ActionMenu.tsx            → NEW: Action selector
│   │   ├── SproutCaptureCard.tsx     → Existing (action: 'sprout')
│   │   ├── ResearchManifestCard.tsx  → NEW: Research capture
│   │   ├── PromptPreviewModal.tsx    → NEW: Generated prompt display
│   │   ├── SproutCard.tsx            → MODIFIED: Stage badges
│   │   └── SproutTray.tsx            → MODIFIED: Stage filtering
│   └── utils/
│       ├── sproutAdapter.ts          → Existing (unchanged)
│       └── promptGenerator.ts        → NEW: Template rendering

data/
├── selection-actions.json            → NEW: Action definitions
├── sprout-stages.json                → NEW: Stage lifecycle
├── research-purposes.json            → NEW: Purpose types
└── research-prompt-template.md       → NEW: Prompt template

src/core/schema/
└── sprout.ts                         → MODIFIED: Add stage, manifest
```

---

## Data Flow

### Selection → Capture Flow

```
1. User selects text in [data-message-id] container
   │
   ▼
2. useTextSelection detects, returns SelectionState
   │
   ▼
3. MagneticPill renders at selection end
   │
   ▼
4. User clicks pill → ActionMenu appears
   │
   ├─► "Plant Sprout" → SproutCaptureCard → Sprout(stage: 'tender')
   │
   └─► "Research Directive" → ResearchManifestCard
       │
       ├─► "Save Draft" → Sprout(stage: 'rooting', manifest: {...})
       │
       └─► "Generate Prompt" → PromptPreviewModal → Copy to clipboard
                              → Sprout(stage: 'branching')
```

### Research Accumulation Flow

```
1. Sprout with stage: 'rooting' exists in tray
   │
   ▼
2. User clicks to expand → ResearchManifestCard (edit mode)
   │
   ├─► Add clue (URL, citation, author, concept, question)
   ├─► Add direction (research question)
   ├─► Change purpose
   │
   ▼
3. "Save" → Updated Sprout persisted
   │
   ▼
4. Days/weeks pass... more clues added
   │
   ▼
5. "Generate Prompt" → stage: 'branching'
```

---

## DEX Compliance

### Declarative Sovereignty

**Config files define behavior:**
- `selection-actions.json` → What actions appear, what card they open
- `sprout-stages.json` → Valid stages and transitions
- `research-purposes.json` → Purpose types and prompt framings

**Test:** Domain expert can add new research purpose by editing JSON. No code change required.

### Capability Agnosticism

**Prompt template works with any LLM:**
- Output is a structured text prompt
- No assumptions about which model executes it
- Claude, GPT-4, or local 7B can all consume the prompt

**Test:** Same generated prompt works in Claude extended search, ChatGPT, or local Ollama.

### Provenance as Infrastructure

**Full attribution chain:**
```
Selection → Sprout {
  provenance: { lens, journey, hub, node, knowledgeFiles },
  researchManifest: {
    purpose: 'thread',
    clues: [{ type: 'citation', value: '...', note: '...' }],
    promptGenerated: { templateId, generatedAt }
  }
}
```

**Test:** Given any sprout, can trace back to exact context of capture.

### Organic Scalability

**Works minimal to maximal:**
- Zero clues → Prompt still generates (just seed + purpose)
- 100 clues → All rendered in prompt
- New purpose types → Add to JSON, immediately available

---

## Schema Extensions

### sprout.ts Changes

```typescript
// BEFORE (kinetic-cultivation-v1)
export type SproutStatus = 'sprout' | 'sapling' | 'tree';

// AFTER (sprout-declarative-v1)
export type SproutStage = 
  | 'tender' | 'rooting' | 'branching' | 'hardened'
  | 'grafted' | 'established' | 'dormant' | 'withered';

export interface ResearchManifest {
  purpose: ResearchPurpose;
  clues: ResearchClue[];
  directions: string[];
  promptGenerated?: {
    templateId: string;
    generatedAt: string;
    rawPrompt: string;
  };
  harvest?: {
    raw: string;
    harvestedAt: string;
    addedToKnowledge?: boolean;
  };
}

export type ResearchPurpose = 'skeleton' | 'thread' | 'challenge' | 'gap' | 'validate';

export interface ResearchClue {
  type: 'url' | 'citation' | 'author' | 'concept' | 'question';
  value: string;
  note?: string;
}

export interface Sprout {
  // ... existing fields ...
  
  /** @deprecated Use stage instead */
  status: SproutStatus;
  
  /** Growth stage in botanical lifecycle */
  stage: SproutStage;
  
  /** Research manifest for research-type sprouts */
  researchManifest?: ResearchManifest;
}
```

### Migration Strategy

```typescript
// Backward compatible: existing sprouts get default stage
function migrateToStage(sprout: LegacySprout): Sprout {
  return {
    ...sprout,
    stage: sprout.stage ?? mapStatusToStage(sprout.status),
    // status preserved for backward compat
  };
}

function mapStatusToStage(status: SproutStatus): SproutStage {
  switch (status) {
    case 'sprout': return 'tender';
    case 'sapling': return 'rooting';
    case 'tree': return 'established';
    default: return 'tender';
  }
}
```

---

## Token Namespaces

### New Tokens (extend --card-*)

```css
/* Research manifest specific */
--card-research-purpose-bg: var(--cyan-500/20);
--card-research-clue-bg: var(--violet-500/10);
--card-research-direction-bg: var(--amber-500/10);

/* Stage badge colors */
--stage-tender: var(--green-300);
--stage-rooting: var(--cyan-400);
--stage-branching: var(--blue-400);
--stage-hardened: var(--violet-400);
--stage-grafted: var(--amber-400);
--stage-established: var(--emerald-500);
--stage-dormant: var(--gray-400);
--stage-withered: var(--stone-500);
```

---

## Testing Strategy

### Unit Tests

| Component | Test Focus |
|-----------|------------|
| `useSelectionActions` | Config loading, action resolution |
| `promptGenerator` | Template rendering, all purpose types |
| Schema migrations | Stage conversion, backward compat |

### E2E Tests (Playwright)

| Flow | Test |
|------|------|
| Plant Sprout | Select → Pill → Menu → Sprout card → Confirm → Tray |
| Research Directive | Select → Pill → Menu → Manifest card → Save → Tray |
| Generate Prompt | Open manifest → Add clue → Generate → Copy |
| Stage display | Verify badges render for each stage |

### Visual Baselines

| Baseline | Protected Surface |
|----------|-------------------|
| `action-menu.png` | ActionMenu component |
| `research-manifest-card.png` | ResearchManifestCard |
| `prompt-preview-modal.png` | PromptPreviewModal |
| `sprout-card-stages.png` | Stage badge variants |

---

## Document History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0 | 2024-12-30 | Jim + Claude | Initial architecture |
