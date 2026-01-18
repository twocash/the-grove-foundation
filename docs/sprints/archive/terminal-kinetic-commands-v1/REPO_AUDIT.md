# Repository Audit: Terminal Command System

**Sprint:** terminal-kinetic-commands-v1  
**Date:** 2024-12-25  
**Auditor:** Claude (Planning Agent)

---

## Current State Summary

The Terminal currently has **no command processing infrastructure**. All user input flows directly to the chat API without interception. Command-like features exist but are scattered and inaccessible from the primary chat interface.

---

## Input Flow Analysis

### Current Implementation (Terminal.tsx)

```typescript
// Line ~670 - handleSend function
const handleSend = async (manualQuery?: string, manualDisplay?: string, nodeId?: string) => {
  const textToSend = manualQuery !== undefined ? manualQuery : input;
  if (!textToSend.trim()) return;
  
  // ... directly sends to chat API
  // NO command detection
  // NO "/" prefix handling
  // NO routing logic
}
```

**Problem:** No interception point for commands. Everything goes to AI.

---

## Existing Command-Adjacent Features

### 1. Journey System (Exists but not accessible from chat)

**Location:** `data/narratives-schema.ts`, `components/JourneyList.tsx`

```typescript
// Journey data structure exists
interface Journey {
  id: string;
  title: string;
  entryNode: string;
  // ...
}
```

**Current Access:** Only via JourneyList overlay, not via `/journey` command.

### 2. Lens Switching (Works but requires overlay)

**Location:** `components/Terminal/LensPicker.tsx`, `useTerminalState.ts`

```typescript
// Lens switching action exists
setActiveLens: (lensId: string | null) => void
```

**Current Access:** Only via LensPicker overlay or welcome interstitial.

### 3. Session Statistics (Partially implemented)

**Location:** `hooks/useSessionTelemetry.ts`

```typescript
// Telemetry tracking exists
const session = {
  exchangeCount: number;
  visitedCards: string[];
  journeysCompleted: number;
  // ...
}
```

**Current Access:** No UI to view. Data collected but not exposed.

### 4. Sprout System (Planned but not implemented)

**Location:** Referenced in `Grove_Foundation_Refactor_Spec`

**Current Access:** Not implemented. `/plant` command would be first implementation.

---

## Terminal State Structure

### Current TerminalUIState (types.ts)

```typescript
interface TerminalUIState {
  isOpen: boolean;
  isLoading: boolean;
  messages: Message[];
  input: string;
  dynamicSuggestion: string;
  currentNodeId: string | null;
  currentTopic: string;
  overlay: TerminalOverlay;  // After terminal-overlay-machine-v1 sprint
  // ... more fields
}
```

**Missing:** No command-related state (active command, command history, etc.)

---

## Related Components Inventory

| Component | Purpose | Command Relevance |
|-----------|---------|-------------------|
| `Terminal.tsx` | Main container | Needs command interception in handleSend |
| `TerminalInput.tsx` | Text input | Needs "/" detection, autocomplete |
| `TerminalOverlayRenderer.tsx` | Overlay display | Will render command palette |
| `JourneyList.tsx` | Journey picker | Target of `/journey` with no args |
| `LensPicker.tsx` | Lens picker | Target of `/lens` with no args |
| `useTerminalState.ts` | State management | Needs command actions |
| `useEngagementMachine.ts` | Session tracking | Lens/journey state lives here |

---

## Data Sources for Commands

### Journeys

**Location:** `public/narratives-schema.json` (loaded via SchemaContext)

```typescript
// Access pattern
const { schema } = useSchemaContext();
const journeys = schema?.journeys; // Record<string, Journey>
```

### Lenses (Personas)

**Location:** `data/narratives-schema.ts` (PERSONAS constant)

```typescript
// Access pattern
import { PERSONAS } from '@/data/narratives-schema';
const lenses = Object.values(PERSONAS);
```

### Custom Lenses

**Location:** `hooks/useCustomLenses.ts` (localStorage)

```typescript
// Access pattern
const { customLenses } = useCustomLenses();
```

---

## Integration Points

### 1. Input Handling

**File:** `Terminal.tsx` → `handleSend()`  
**Change:** Add command detection before API call

### 2. Command Palette Trigger

**File:** `TerminalInput.tsx` (if exists) or `Terminal.tsx`  
**Change:** Detect "/" keystroke, show palette

### 3. State Actions

**File:** `useTerminalState.ts`  
**Change:** Add command-related actions

### 4. Overlay System

**File:** `types.ts` → `TerminalOverlay` type  
**Change:** Add `command-palette` and `stats` overlay types

---

## Technical Debt Identified

1. **No input preprocessing** - All input goes directly to chat
2. **Scattered feature access** - Journeys/lenses only via overlays
3. **No command history** - Can't recall previous commands
4. **No autocomplete infrastructure** - Would need fuzzy search
5. **Session stats not visible** - Data exists, no UI

---

## Dependencies

### External Packages (Already in project)

- `fuse.js` - Fuzzy search (may need to add)
- `lucide-react` - Icons for commands

### Internal Dependencies

- `SchemaContext` - Journey data
- `useEngagementMachine` - Session state
- `useTerminalState` - UI state
- `TerminalOverlayRenderer` - Command palette display

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Breaking existing chat flow | Medium | High | Careful "/" detection, fallback to chat |
| Performance with fuzzy search | Low | Medium | Debounce, limit results |
| State synchronization | Medium | Medium | Single source of truth in registry |
| Journey data not loaded | Low | High | Graceful fallback, loading states |

---

## Audit Conclusion

The Terminal is a **blank slate** for command processing. This is actually good—we can implement the Kinetic Command Architecture without fighting existing patterns. The integration points are clear:

1. **Input interception** in `handleSend()`
2. **Overlay system** for command palette (leveraging sprint 6 work)
3. **Data access** via existing contexts (Schema, Engagement)
4. **State management** via existing hooks pattern

The architecture can be additive, not disruptive.
