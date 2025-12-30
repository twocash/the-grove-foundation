# Architecture — Kinetic Cultivation v1

**Sprint:** `kinetic-cultivation-v1`  
**Date:** 2024-12-29

---

## Component Hierarchy

```
KineticShell (existing)
├── useKineticShortcuts()              ← NEW: Global keyboard listener
│   └── useShortcutFeedback()          ← NEW: Visual feedback system
├── KineticHeader (existing)
│   └── Icon pulse targets for shortcut feedback
├── KineticStream (existing)
│   ├── StreamMessage (existing)
│   │   └── [data-message-id] attribute ← REQUIRED for provenance
│   ├── useTextSelection(streamRef)    ← NEW: Selection detection
│   ├── MagneticPill                   ← NEW: Selection action trigger
│   │   └── layoutId="sprout-capture"
│   └── SproutCaptureCard              ← NEW: Capture form
│       └── layoutId="sprout-capture"
├── SproutTray                         ← NEW: Right-edge drawer
│   ├── TrayHandle (collapsed state)
│   │   └── Counter badge with spring
│   ├── TrayContent (expanded state)
│   │   └── SproutCard[]
│   └── TrayEmptyState
└── KeyboardHUD                        ← NEW: Shortcut reference overlay
```

---

## Data Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                         CAPTURE FLOW                                 │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  User selects text in StreamMessage                                  │
│       ↓                                                              │
│  useTextSelection detects selection                                  │
│       ↓                                                              │
│  MagneticPill renders at selection end                               │
│       ↓                                                              │
│  User clicks pill (or Cmd+S)                                         │
│       ↓                                                              │
│  SproutCaptureCard expands (layoutId transition)                     │
│       │                                                              │
│       ├── Reads activeLens from useQuantumInterface                  │
│       ├── Reads activeJourney from useEngagement                     │
│       └── Extracts messageId from DOM (closest [data-message-id])    │
│       ↓                                                              │
│  User adds tags, clicks "Plant Sprout"                               │
│       ↓                                                              │
│  useSproutCapture.capture(sproutData)                                │
│       ↓                                                              │
│  sproutStore.addSprout(sprout)                                       │
│       ↓                                                              │
│  Flight animation triggers                                           │
│       ↓                                                              │
│  SproutTray receives sprout                                          │
│       ├── Counter badge springs                                      │
│       └── SproutCard fades in at top                                 │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Schema Design

### SproutProvenance (New)

```typescript
// src/core/schema/sprout.ts

export interface SproutProvenance {
  // Source identification
  sourceId: string;                    // Message ID, node ID, or content hash
  sourceType: 'message' | 'journey_node' | 'static_content';
  
  // Context for "go back to source"
  contextSpan: string;                 // Surrounding paragraph
  selectionRange?: {
    start: number;
    end: number;
  };
  
  // Lens/Journey context at capture time
  lensId?: string;                     // Active lens
  journeyId?: string;                  // Active journey (if any)
  nodeId?: string;                     // Active node (if in journey)
}
```

### Sprout (Extended)

```typescript
export interface Sprout {
  id: string;
  type: 'sprout';                      // For GroveObjectMeta compatibility
  
  // Core content
  content: string;                     // Selected text (verbatim)
  provenance: SproutProvenance;        // NEW: Nested attribution
  
  // Classification
  tags: string[];
  stage: GrowthStage;
  
  // Timestamps
  createdAt: number;                   // Unix timestamp
  modifiedAt?: number;
  
  // Session tracking
  sessionId: string;
  
  // Future: Attribution chain
  derivedFrom?: string;
  derivatives?: string[];
  
  // DEPRECATED: Flat fields for backward compatibility
  // Remove after Terminal migration
  query?: string;                      // → provenance.contextSpan
  personaId?: string;                  // → provenance.lensId
  journeyId?: string;                  // → provenance.journeyId
  hubId?: string;                      // Deprecated
  nodeId?: string;                     // → provenance.nodeId
  contextLoaded?: string[];            // Deprecated
}
```

### Adapter Functions

```typescript
// src/features/kinetic/utils/sproutAdapter.ts

// Convert new nested format to old flat format (for Terminal compat)
export function flattenSprout(sprout: Sprout): LegacySprout {
  return {
    ...sprout,
    personaId: sprout.provenance?.lensId ?? '',
    journeyId: sprout.provenance?.journeyId,
    nodeId: sprout.provenance?.nodeId,
    query: sprout.provenance?.contextSpan ?? '',
  };
}

// Convert old flat format to new nested format
export function nestSprout(legacy: LegacySprout): Sprout {
  return {
    ...legacy,
    type: 'sprout',
    provenance: {
      sourceId: legacy.id,
      sourceType: 'message',
      contextSpan: legacy.query ?? '',
      lensId: legacy.personaId,
      journeyId: legacy.journeyId,
      nodeId: legacy.nodeId,
    },
  };
}
```

---

## State Management

### SproutStore (Zustand)

```typescript
// src/features/kinetic/store/sproutStore.ts

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SproutStore {
  // State
  sprouts: Sprout[];
  
  // Actions
  addSprout: (data: Omit<Sprout, 'id' | 'createdAt'>) => string;
  removeSprout: (id: string) => void;
  updateSprout: (id: string, updates: Partial<Sprout>) => void;
  
  // Selectors
  getSproutsBySession: (sessionId: string) => Sprout[];
  getSproutsByStage: (stage: GrowthStage) => Sprout[];
}

export const useSproutStore = create<SproutStore>()(
  persist(
    (set, get) => ({
      sprouts: [],
      
      addSprout: (data) => {
        const id = crypto.randomUUID();
        const sprout: Sprout = {
          ...data,
          id,
          createdAt: Date.now(),
        };
        set((state) => ({ 
          sprouts: [sprout, ...state.sprouts] 
        }));
        return id;
      },
      
      removeSprout: (id) => {
        set((state) => ({
          sprouts: state.sprouts.filter((s) => s.id !== id),
        }));
      },
      
      updateSprout: (id, updates) => {
        set((state) => ({
          sprouts: state.sprouts.map((s) =>
            s.id === id ? { ...s, ...updates, modifiedAt: Date.now() } : s
          ),
        }));
      },
      
      getSproutsBySession: (sessionId) => {
        return get().sprouts.filter((s) => s.sessionId === sessionId);
      },
      
      getSproutsByStage: (stage) => {
        return get().sprouts.filter((s) => s.stage === stage);
      },
    }),
    {
      name: 'grove-sprouts',
      version: 1,
    }
  )
);
```

---

## Declarative Config (Extraction-Ready)

### Sprout Capture Config

```typescript
// src/features/kinetic/config/sprout-capture.config.ts

/**
 * TEMPORARY: This config is structured for future JSON extraction.
 * When we need multiple selection actions or non-engineer modifications,
 * extract to: data/sprout-actions.json
 * 
 * See: SPEC.md → Declarative Extraction Roadmap
 */

export const SPROUT_CAPTURE_CONFIG = {
  // Selection action definition
  defaultAction: {
    id: 'sprout',
    label: 'Plant Sprout',
    icon: '🌱',
    defaultStage: 'tender' as const,
  },
  
  // Capture requirements
  captureFields: {
    required: ['content', 'provenance.sourceId', 'provenance.sourceType'],
    optional: ['tags', 'notes', 'provenance.lensId', 'provenance.journeyId'],
  },
  
  // UI configuration
  ui: {
    pill: {
      magneticScale: 1.15,
      magneticDistance: 50, // px
    },
    card: {
      maxPreviewLength: 100,
      maxTags: 10,
    },
    tray: {
      collapsedWidth: 48,
      expandedWidth: 240,
    },
  },
  
  // Animation timing
  animation: {
    pillSpring: { stiffness: 400, damping: 30 },
    cardExpand: { duration: 0.2 },
    flight: { duration: 0.5 },
    counterSpring: { stiffness: 500, damping: 15 },
  },
} as const;

export type SproutCaptureConfig = typeof SPROUT_CAPTURE_CONFIG;
```

### Future: JSON Schema (Reference)

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SproutActionConfig",
  "description": "Declarative selection action configuration",
  "type": "object",
  "properties": {
    "selectionActions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "id": { "type": "string" },
          "label": { "type": "string" },
          "icon": { "type": "string" },
          "condition": { "type": "string" },
          "defaultStage": { "type": "string" },
          "defaultTags": { "type": "array", "items": { "type": "string" } }
        },
        "required": ["id", "label", "icon"]
      }
    }
  }
}
```

---

## Hook Specifications

### useTextSelection

```typescript
// src/features/kinetic/hooks/useTextSelection.ts

interface SelectionState {
  text: string;
  rect: DOMRect;              // For pill positioning
  messageId: string | null;   // For provenance
  contextSpan: string;        // Surrounding paragraph
}

interface UseTextSelectionOptions {
  minLength?: number;         // Minimum selection length
  debounceMs?: number;        // Debounce rapid changes
}

function useTextSelection(
  containerRef: RefObject<HTMLElement>,
  options?: UseTextSelectionOptions
): SelectionState | null;
```

**Implementation Notes:**
- Use `useLayoutEffect` to prevent position flash
- Filter: only selections inside containerRef
- Extract messageId from closest `[data-message-id]` ancestor
- Debounce with 50ms default

### useKineticShortcuts

```typescript
// src/features/kinetic/hooks/useKineticShortcuts.ts

interface ShortcutConfig {
  key: string;
  modifiers: ('cmd' | 'ctrl' | 'shift' | 'alt')[];
  action: () => void;
  preventDefault?: boolean;
}

function useKineticShortcuts(shortcuts: ShortcutConfig[]): void;
```

**Default Shortcuts:**
| Key | Modifiers | Action |
|-----|-----------|--------|
| `l` | cmd/ctrl | Open LensPicker |
| `j` | cmd/ctrl | Open JourneyBrowser |
| `s` | cmd/ctrl | Capture selection (or toast if none) |
| `/` | cmd/ctrl | Show KeyboardHUD |

### useSproutCapture

```typescript
// src/features/kinetic/hooks/useSproutCapture.ts

interface CaptureState {
  isCapturing: boolean;
  selection: SelectionState | null;
  error: string | null;
}

interface UseSproutCaptureReturn {
  state: CaptureState;
  startCapture: (selection: SelectionState) => void;
  confirmCapture: (tags: string[]) => Promise<string>;
  cancelCapture: () => void;
}

function useSproutCapture(): UseSproutCaptureReturn;
```

---

## Component Specifications

### MagneticPill

```typescript
interface MagneticPillProps {
  position: { x: number; y: number };
  onActivate: () => void;
  layoutId: string;
}
```

**Behavior:**
- Renders at `position` (selection end)
- Scales up when mouse within 50px (magnetic effect)
- Click triggers `onActivate`
- Shares `layoutId` with SproutCaptureCard for transition

### SproutCaptureCard

```typescript
interface SproutCaptureCardProps {
  selection: SelectionState;
  onCapture: (tags: string[]) => void;
  onCancel: () => void;
  layoutId: string;
}
```

**Behavior:**
- Expands from pill via `layoutId` transition
- Auto-captures lens, journey from hooks
- Tag input with comma/Enter handling
- ESC cancels, returns to pill state

### SproutTray

```typescript
interface SproutTrayProps {
  sprouts: Sprout[];
  onDelete: (id: string) => void;
  className?: string;
}
```

**Behavior:**
- 48px collapsed, 240px expanded
- Hover or click to expand
- Counter badge with spring on increment
- Most recent sprout at top

---

## Animation Specifications

### Flight Animation

```typescript
// src/features/kinetic/animations/sproutFlight.ts

interface FlightAnimationConfig {
  startRect: DOMRect;       // SproutCaptureCard position
  endRect: DOMRect;         // SproutTray position
  duration: number;         // ~500ms
  onComplete: () => void;
}

// Animation sequence:
// 1. Card shrinks to 24x24 orb (100ms)
// 2. Orb flies on bezier curve to tray (350ms)
// 3. Orb fades out, SproutCard fades in (50ms)
// 4. Counter badge springs
```

**Bezier Curve:**
- Control point 1: 30% up from start, 20% toward end
- Control point 2: 70% toward end, 30% up from end
- Creates natural "toss" arc

### Counter Spring

```typescript
// When sprout count increments:
<motion.span
  key={count}
  initial={{ scale: 1.5 }}
  animate={{ scale: 1 }}
  transition={{ type: 'spring', stiffness: 500, damping: 15 }}
>
  {count}
</motion.span>
```

---

## Token Additions

```css
/* src/app/globals.css */

:root {
  /* Tray namespace */
  --tray-width-collapsed: 48px;
  --tray-width-expanded: 240px;
  --tray-bg: rgba(0, 0, 0, 0.6);
  --tray-bg-hover: rgba(0, 0, 0, 0.7);
  --tray-border: rgba(255, 255, 255, 0.1);
  --tray-border-hover: rgba(255, 255, 255, 0.15);
  
  /* Badge */
  --tray-badge-bg: var(--grove-accent, #10b981);
  --tray-badge-text: white;
  
  /* Glass effects */
  --tray-backdrop-blur: 12px;
  --tray-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
  
  /* Pill (selection action) */
  --pill-bg: rgba(16, 185, 129, 0.9);
  --pill-bg-hover: rgba(16, 185, 129, 1);
  --pill-text: white;
  --pill-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);
}
```

---

## DEX Compliance

| Pillar | Implementation |
|--------|----------------|
| **Declarative Sovereignty** | Capture config in `sprout-capture.config.ts`, structured for JSON extraction |
| **Capability Agnosticism** | Works regardless of what model generated message content |
| **Provenance** | Full attribution: sourceId, sourceType, lensId, journeyId, contextSpan |
| **Organic Scalability** | Tray scales with sprout count; schema supports full lifecycle |

---

## Testing Strategy

### Unit Tests

| Component | Test Focus |
|-----------|------------|
| `useTextSelection` | Selection detection, filtering, positioning |
| `useSproutStore` | CRUD operations, persistence |
| `sproutAdapter` | Flat ↔ nested conversion |

### Integration Tests

| Flow | Test Focus |
|------|------------|
| Selection → Pill | Pill appears, positioned correctly |
| Pill → Card | Transition smooth, context captured |
| Card → Tray | Flight animation, store updated |

### E2E Tests

| Scenario | Test Focus |
|----------|------------|
| Full capture flow | Select → capture → appears in tray |
| Keyboard shortcuts | All shortcuts work, no conflicts |
| Persistence | Sprouts survive refresh |

---

*Architecture complete. See DECISIONS.md for ADRs.*
