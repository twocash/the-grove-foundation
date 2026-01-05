# Prompt Journey Mode Specification
## Sprint: `prompt-journey-mode-v1`
## Date: 2026-01-05

---

## Executive Summary

This specification defines a **Prompt Journey Mode** feature that allows users to toggle between two navigation paradigms in the Grove kinetic chat:

1. **Path Mode (OFF)** - LLM generates responses with navigation blocks (`[[BREADCRUMB:...]]`, `[[TOPIC:...]]`, fork suggestions)
2. **Journey Mode (ON)** - LLM generates open-ended responses; 4D Context Fields system surfaces curated prompts from the library

The Wayne Turner lens demonstrates the **Journey Mode** pattern: 20 prompts with 4D targeting that create a natural progression WITHOUT relying on static journey objects.

---

## Problem Statement

Currently, the Grove exploration experience has two competing navigation patterns:

| Pattern | Source | Control | Example |
|---------|--------|---------|---------|
| **LLM-driven** | Server prompt injection | `personaBehaviors.closingBehavior` | Path A/Path B forks in response |
| **Library-driven** | 4D Context Fields | `useNavigationPrompts` hook | Wayne Turner lens prompts |

These patterns coexist but lack user control. Some lenses (like Wayne Turner) are hard-coded to use library prompts, while others use LLM navigation. Users should be able to choose their preferred experience.

---

## Solution Architecture

### Feature Toggle Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        UI Layer                                   │
│  ┌───────────────────┐                                           │
│  │   JOURNEY pill    │ ← Toggle button (like RAG)                │
│  │   [●] ON / OFF    │                                           │
│  └────────┬──────────┘                                           │
│           │                                                       │
│           ▼                                                       │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ ExploreShell State                                         │   │
│  │ journeyMode: boolean (localStorage + Supabase)            │   │
│  └────────┬─────────────────────────────────────────────────┘   │
│           │                                                       │
└───────────┼───────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Chat Service                                  │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ ChatOptions.journeyMode → request body                    │   │
│  │ personaBehaviors override when journeyMode=true:          │   │
│  │   - closingBehavior: 'question'                           │   │
│  │   - useBreadcrumbTags: false                              │   │
│  │   - useTopicTags: false                                   │   │
│  │   - useNavigationBlocks: false                            │   │
│  └────────┬─────────────────────────────────────────────────┘   │
│           │                                                       │
└───────────┼───────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Server (server.js)                           │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ buildSystemPrompt():                                       │   │
│  │ if (journeyMode) {                                        │   │
│  │   closingBehavior = 'question';                           │   │
│  │   useNavigationBlocks = false;                            │   │
│  │   useBreadcrumbTags = false;                              │   │
│  │   useTopicTags = false;                                   │   │
│  │ }                                                          │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
            │
            ▼
┌─────────────────────────────────────────────────────────────────┐
│                Response Rendering                                 │
│  ┌───────────────────────────────────────────────────────────┐   │
│  │ ResponseObject.tsx:                                        │   │
│  │                                                            │   │
│  │ if (journeyMode && !hasNavigation(response)) {            │   │
│  │   // Surface 4D library prompts via useNavigationPrompts  │   │
│  │   const { forks } = useSafeNavigationPrompts();           │   │
│  │   render(<NavigationForks forks={forks} />);              │   │
│  │ } else {                                                   │   │
│  │   // Use LLM-generated navigation                         │   │
│  │   render(<NavigationForks forks={response.navigation} />);│   │
│  │ }                                                          │   │
│  └───────────────────────────────────────────────────────────┘   │
│                                                                   │
└───────────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### 1. Feature Flag (data/infrastructure/feature-flags.json)

```json
{
  "id": "prompt-journey-mode",
  "name": "Prompt Journey Mode",
  "description": "Use 4D context-aware library prompts instead of LLM-generated navigation",
  "enabled": true
}
```

### 2. UI Toggle (KineticHeader.tsx)

Add alongside RAG toggle:

```typescript
// Props interface
interface KineticHeaderProps {
  // ... existing props
  journeyMode?: boolean;
  onJourneyModeToggle?: () => void;
}

// Render (after RAG toggle)
{onJourneyModeToggle && (
  <button
    onClick={onJourneyModeToggle}
    className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium
      border transition-all duration-200
      ${journeyMode
        ? 'bg-[var(--neon-cyan)]/20 border-[var(--neon-cyan)]/50 text-[var(--neon-cyan)]'
        : 'bg-[var(--glass-elevated)] border-[var(--glass-border)] text-[var(--glass-text-muted)]'
      }
      hover:border-[var(--neon-cyan)]/70`}
    title={journeyMode 
      ? 'Journey Mode: Library prompts guide exploration' 
      : 'Path Mode: AI suggests next steps'}
  >
    <span className={`w-1.5 h-1.5 rounded-full ${journeyMode ? 'bg-[var(--neon-cyan)]' : 'bg-[var(--glass-text-subtle)]'}`} />
    <span>JOURNEY</span>
    <span className="text-[9px] opacity-70">{journeyMode ? 'ON' : 'OFF'}</span>
  </button>
)}
```

### 3. State Management (ExploreShell.tsx)

```typescript
// Journey mode state (mirrors RAG toggle pattern)
const [journeyMode, setJourneyMode] = useState(() => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('grove-journey-mode') === 'true';
  }
  return false;
});

// Toggle handler
const handleJourneyModeToggle = useCallback(() => {
  setJourneyMode(prev => {
    const next = !prev;
    localStorage.setItem('grove-journey-mode', String(next));
    console.log('[ExploreShell] Journey mode:', next ? 'ON' : 'OFF');
    
    // Persist to Supabase (if user is authenticated)
    // TODO: Wire to user preferences via engagement system
    
    return next;
  });
}, []);

// Override personaBehaviors when journeyMode is ON
const effectivePersonaBehaviors = useMemo(() => {
  if (!journeyMode) {
    return personaBehaviors; // Use lens defaults
  }
  
  // Journey mode overrides
  return {
    ...personaBehaviors,
    closingBehavior: 'question' as const,
    useBreadcrumbTags: false,
    useTopicTags: false,
    useNavigationBlocks: false
  };
}, [personaBehaviors, journeyMode]);
```

### 4. Chat Service Integration (services/chatService.ts)

```typescript
interface ChatOptions {
  // ... existing
  journeyMode?: boolean;
}

// In sendMessageStream()
const requestBody = {
  // ... existing
  journeyMode: options.journeyMode ?? false
};
```

### 5. Server-side Integration (server.js)

```javascript
// In /api/chat endpoint
const journeyMode = req.body.journeyMode ?? false;

// Apply journey mode overrides
if (journeyMode) {
  personaBehaviors = {
    ...personaBehaviors,
    closingBehavior: 'question',
    useBreadcrumbTags: false,
    useTopicTags: false,
    useNavigationBlocks: false
  };
  console.log('[Chat] Journey mode active - using question closing');
}
```

---

## 4D Prompt Library Requirements

### Current Inventory

| File | Count | Lens Targeting |
|------|-------|----------------|
| `base.prompts.json` | 15 | Generic (excludes wayne-turner, dr-chiang) |
| `dr-chiang.prompts.json` | ~10 | `lensIds: ["dr-chiang"]` |
| `wayne-turner.prompts.json` | 20 | `lensIds: ["wayne-turner"]` |

### Expansion Needed

To support Journey Mode across all lenses, we need prompts for:

1. **Lens-specific journeys** (like Wayne Turner pattern):
   - `academic.prompts.json` - Research-focused progression
   - `engineer.prompts.json` - Technical deep-dive progression
   - `concerned-citizen.prompts.json` - Stakes-focused progression
   - `family-office.prompts.json` - Investment thesis progression

2. **Generic fallback prompts** (base.prompts.json expansion):
   - More exploration-stage prompts (currently sparse)
   - Synthesis prompts that connect topics
   - Advocacy prompts for engaged users

### Prompt Journey Design Pattern

Each lens-specific prompt set should follow the Wayne Turner model:

```
GENESIS (minInteractions: 0)
├── Hook prompts (2-3) - "What's actually at stake?"
└── Framing prompts (2-3) - Connect to lens worldview

EXPLORATION (minInteractions: 2)
├── Deepening prompts (3-4) - "Go deeper on X"
├── Connection prompts (2-3) - "How does X relate to Y?"
└── Evidence prompts (2-3) - "What's the evidence?"

SYNTHESIS (minInteractions: 3-4)
├── Opportunity prompts (2-3) - "What could this mean for..."
├── Limitation prompts (1-2) - "What are the honest limitations?"
└── Economic prompts (2-3) - "How does the model work?"

ADVOCACY (minInteractions: 5+)
├── Action prompts (2-3) - "What could someone do?"
├── Conversation framing (1-2) - "How would you explain this?"
└── Closing reflection (1) - "What's the question worth sitting with?"
```

---

## Supabase Persistence

### Schema Addition (user_preferences table)

```sql
ALTER TABLE user_preferences
ADD COLUMN journey_mode BOOLEAN DEFAULT false;
```

### API Endpoint

```javascript
// GET /api/user/preferences
// Returns: { journeyMode: boolean, ... }

// PATCH /api/user/preferences
// Body: { journeyMode: boolean }
```

### Sync Pattern

```typescript
// On load: Read from localStorage first, then sync with Supabase
// On toggle: Update localStorage immediately, debounce Supabase update
// On auth change: Sync Supabase preference to localStorage
```

---

## Testing Checklist

- [ ] Toggle appears in KineticHeader when feature flag enabled
- [ ] Toggle state persists across page reloads (localStorage)
- [ ] Journey mode OFF: LLM responses include navigation blocks
- [ ] Journey mode ON: LLM responses end with questions, no nav blocks
- [ ] Journey mode ON: 4D prompts surface in ResponseObject
- [ ] Prompt progression works (selected prompts don't resurface)
- [ ] Lens-specific prompts surface when lens is active
- [ ] Generic prompts surface when no lens selected
- [ ] Supabase sync works for authenticated users

---

## Dependencies

| Dependency | Status | Notes |
|------------|--------|-------|
| Feature flag system | ✅ Exists | Add `prompt-journey-mode` flag |
| RAG toggle pattern | ✅ Exists | Copy for journey toggle |
| 4D Context Fields | ✅ Exists | Core scoring/selection |
| `useNavigationPrompts` | ✅ Exists | Hook for prompt surfacing |
| Wayne Turner prompts | ✅ Exists | Model for other lenses |
| Supabase user_preferences | 🟡 Partial | May need schema addition |
| Server personaBehaviors | ✅ Exists | Add journeyMode override |

---

## Open Questions

1. **Default state**: Should Journey Mode be ON or OFF by default for new users?
   - Recommendation: OFF (current behavior) until prompt library is expanded

2. **Lens override**: Should lens-specific `behaviors` override user toggle?
   - Recommendation: User toggle wins, lens provides defaults

3. **Hybrid mode**: Could we surface BOTH LLM navigation AND library prompts?
   - Recommendation: Not for v1, creates confusion

---

## Related Documents

- `src/core/context-fields/types.ts` - 4D Context Field types
- `src/core/context-fields/scoring.ts` - Selection pipeline
- `src/data/prompts/*.json` - Prompt library
- `data/default-personas.ts` - Persona behavior definitions
- `server.js` - Response mode logic (lines 978-1010)
