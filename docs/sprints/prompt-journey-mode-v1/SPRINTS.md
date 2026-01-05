# Sprint Breakdown: prompt-journey-mode-v1

## Overview

**Tier:** Feature (1-4 hours)
**Epics:** 3
**Stories:** 9

---

## Epic 1: Schema & Data Flow Fix (Bug Fix)

### Attention Checkpoint
Before starting this epic:
- [ ] SPEC.md Live Status shows correct phase
- [ ] Goal alignment confirmed: Fix executionPrompt display bug

### Story 1.1: Extend QueryStreamItem Schema

**Task:** Add optional `executionPrompt` field to QueryStreamItem

**File:** `src/core/schema/stream.ts`

**Change:**
```typescript
export interface QueryStreamItem extends BaseStreamItem {
  type: 'query';
  content: string;              // Display text (what user sees)
  executionPrompt?: string;     // LLM prompt (sent to API if present)
  intent?: string;
  pivot?: PivotContext;
  role: 'user';
  createdBy: 'user';
}
```

**Tests:** Type check via build

---

### Story 1.2: Modify submit() to Accept Separate Display/Execution

**Task:** Extend SubmitOptions to support display/execution separation

**File:** `src/surface/components/KineticStream/hooks/useKineticStream.ts`

**Changes:**
1. Add to SubmitOptions interface:
```typescript
interface SubmitOptions {
  pivot?: PivotContext;
  lensId?: string;
  personaBehaviors?: PersonaBehaviors;
  executionPrompt?: string;  // NEW: If present, send this to LLM instead of query
}
```

2. Modify submit() function:
```typescript
const submit = useCallback(async (query: string, submitOptions: SubmitOptions = {}) => {
  const { pivot, lensId, personaBehaviors: submitBehaviors, executionPrompt } = submitOptions;
  // ...existing setup...

  // Create query item - display text in content, optional execution prompt
  const queryItem: QueryStreamItem = {
    id: `query-${Date.now()}`,
    type: 'query',
    timestamp: Date.now(),
    content: query,  // Display text
    executionPrompt: executionPrompt !== query ? executionPrompt : undefined,  // Only store if different
    role: 'user',
    createdBy: 'user',
    pivot
  };

  // ...add to items...

  // Send to LLM - use executionPrompt if provided, otherwise query
  const promptToSend = executionPrompt ?? query;
  const chatResponse = await sendMessageStream(
    promptToSend,  // ← This goes to LLM
    // ...rest unchanged
  );
```

**Tests:** Manual verification: clicking prompt shows label, LLM receives executionPrompt

---

### Story 1.3: Fix Fork Selection in ResponseObject

**Task:** Pass label as display, queryPayload as execution

**File:** `src/surface/components/KineticStream/Stream/blocks/ResponseObject.tsx`

**Change handleForkSelect:**
```typescript
const handleForkSelect = useCallback((fork: JourneyFork) => {
  emit.forkSelected(fork.id, fork.type, fork.label, item.id);
  
  // BUG FIX: Show label in chat, send queryPayload to LLM
  const displayText = fork.label;
  const executionPrompt = fork.queryPayload || fork.label;
  
  onPromptSubmit?.(displayText, executionPrompt);  // Pass both
  onForkSelect?.(fork);
}, [emit, item.id, onPromptSubmit, onForkSelect]);
```

**Also update** `ResponseObjectProps.onPromptSubmit`:
```typescript
onPromptSubmit?: (displayText: string, executionPrompt?: string) => void;
```

---

### Story 1.4: Wire Through ExploreShell

**Task:** Update handleSubmit and handleForkSelect in ExploreShell

**File:** `src/surface/components/KineticStream/ExploreShell.tsx`

**Changes:**

1. Update handleForkSelect:
```typescript
const handleForkSelect = useCallback((fork: JourneyFork) => {
  actor.send({
    type: 'USER.SELECT_FORK',
    fork,
    responseId: ''
  });

  // Submit with separate display/execution
  const displayText = fork.label;
  const executionPrompt = fork.queryPayload || fork.label;
  
  submit(displayText, { 
    personaBehaviors,
    executionPrompt  // NEW: Pass execution prompt separately
  });
}, [actor, submit, personaBehaviors]);
```

2. Update handleSubmit signature if needed (ResponseObject calls it differently now):
```typescript
const handleSubmit = useCallback((displayText: string, executionPrompt?: string) => {
  scrollToBottom(false);
  submit(displayText, { 
    personaBehaviors,
    executionPrompt  // Pass through
  });
}, [submit, scrollToBottom, personaBehaviors]);
```

### Build Gate
```bash
npm run build && npm run typecheck
```

---

## Epic 2: Journey Mode Toggle UI

### Attention Checkpoint
Before starting this epic:
- [ ] Epic 1 complete (bug fix verified)
- [ ] SPEC.md Live Status updated
- [ ] Goal alignment: Add toggle that controls navigation mode

### Story 2.1: Add Feature Flag

**Task:** Add `journey-mode` feature flag

**File:** `data/infrastructure/feature-flags.json`

**Add:**
```json
{
  "id": "journey-mode",
  "name": "Journey Mode Toggle",
  "description": "Toggle between LLM-driven navigation and 4D library prompt journeys",
  "enabled": true,
  "rolloutPercentage": 100
}
```

---

### Story 2.2: Add Journey Mode State to ExploreShell

**Task:** Add state management for journey mode toggle

**File:** `src/surface/components/KineticStream/ExploreShell.tsx`

**Add state and toggle handler:**
```typescript
// Journey mode state (Sprint: prompt-journey-mode-v1)
const [journeyMode, setJourneyMode] = useState(() => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('grove-journey-mode') === 'true';
  }
  return false;
});

const handleJourneyModeToggle = useCallback(() => {
  setJourneyMode(prev => {
    const next = !prev;
    localStorage.setItem('grove-journey-mode', String(next));
    console.log('[ExploreShell] Journey mode:', next ? 'ON' : 'OFF');
    return next;
  });
}, []);
```

**Add behavior override when journey mode is ON:**
```typescript
// Sprint: prompt-journey-mode-v1 - Override behaviors when journey mode active
const effectivePersonaBehaviors = useMemo(() => {
  if (!journeyMode) {
    return personaBehaviors;
  }
  // Journey mode overrides - match Wayne Turner pattern
  return {
    ...personaBehaviors,
    closingBehavior: 'question' as const,
    useBreadcrumbTags: false,
    useTopicTags: false,
    useNavigationBlocks: false
  };
}, [personaBehaviors, journeyMode]);
```

**Pass to KineticHeader and handlers:**
```tsx
<KineticHeader
  // ...existing props
  journeyMode={journeyMode}
  onJourneyModeToggle={handleJourneyModeToggle}
/>
```

---

### Story 2.3: Add Toggle UI to KineticHeader

**Task:** Add JOURNEY pill toggle (styled like RAG toggle)

**File:** `src/surface/components/KineticStream/KineticHeader.tsx`

**Add props:**
```typescript
interface KineticHeaderProps {
  // ...existing
  journeyMode?: boolean;
  onJourneyModeToggle?: () => void;
}
```

**Add toggle UI (after RAG toggle):**
```tsx
{/* Sprint: prompt-journey-mode-v1 - Journey mode toggle */}
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

### Build Gate
```bash
npm run build && npm run dev
# Manually verify: Toggle appears, state persists on refresh
```

---

## Epic 3: Wire Through to Server

### Attention Checkpoint
Before starting this epic:
- [ ] Epic 2 complete (toggle works locally)
- [ ] SPEC.md Live Status updated
- [ ] Goal alignment: LLM behavior changes based on toggle

### Story 3.1: Pass effectivePersonaBehaviors Through Submit Chain

**Task:** Ensure journey mode overrides flow to server

**File:** `src/surface/components/KineticStream/ExploreShell.tsx`

**Update all submit calls to use effectivePersonaBehaviors:**
```typescript
// In handleSubmit
submit(displayText, { 
  personaBehaviors: effectivePersonaBehaviors,  // ← Use effective, not raw
  executionPrompt
});

// In handleForkSelect  
submit(displayText, { 
  personaBehaviors: effectivePersonaBehaviors,  // ← Use effective, not raw
  executionPrompt
});

// In handleConceptClick
submit(span.text, { 
  pivot: pivotContext, 
  personaBehaviors: effectivePersonaBehaviors  // ← Use effective, not raw
});
```

---

### Story 3.2: Verify Server Respects PersonaBehaviors

**Task:** Confirm server.js already handles closingBehavior, useBreadcrumbTags, etc.

**File:** `server.js` (read-only verification)

**Verify in buildSystemPrompt():**
- `closingBehavior: 'question'` → adds CLOSING_BEHAVIORS.question (ends with question, no tags)
- `useBreadcrumbTags: false` → skips breadcrumb instructions
- `useNavigationBlocks: false` → skips navigation block instructions

**No changes needed if already implemented** (from persona-behaviors-v1 sprint)

### Build Gate
```bash
npm run build && npm run dev
# Test: Toggle Journey ON → Send message → Response ends with question, no navigation tags
# Test: Toggle Journey OFF → Send message → Response has navigation blocks
```

---

## Final Verification

### All Acceptance Criteria

- [ ] **AC1:** JOURNEY toggle visible in header
- [ ] **AC2:** Toggle persists via localStorage  
- [ ] **AC3:** Journey ON: LLM ends with questions, no nav tags, 4D prompts appear
- [ ] **AC4:** Journey OFF: LLM has nav blocks (current behavior)
- [ ] **AC5:** BUG FIX: Clicking prompt shows label, sends executionPrompt to LLM
- [ ] **AC6:** Feature flag gated

### Test Commands
```bash
# Full build
npm run build

# Type check
npm run typecheck

# Unit tests
npm test

# Manual E2E
npm run dev
# 1. Toggle Journey ON
# 2. Refresh → toggle still ON
# 3. Send message → response ends with question
# 4. Click 4D prompt → chat shows label, not long executionPrompt
# 5. Toggle Journey OFF → nav blocks return
```

---

## DEVLOG Template

After each story, update `DEVLOG.md`:

```markdown
## Story X.Y: {Title}

**Started:** {timestamp}
**Status:** ✅ Complete

### Changes Made
- {file}: {description}

### Verification
- [ ] Build passes
- [ ] Manual test passed

### Notes
{Any surprises or follow-up items}
```
