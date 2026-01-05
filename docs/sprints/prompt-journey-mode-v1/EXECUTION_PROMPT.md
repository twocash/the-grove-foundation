# Execution Prompt: prompt-journey-mode-v1

## Instant Orientation

**Project:** C:\GitHub\the-grove-foundation
**Sprint:** prompt-journey-mode-v1
**Task:** Add Journey Mode toggle + fix executionPrompt display bug
**Duration:** ~2-3 hours
**Status:** Ready for execution

---

## Attention Anchoring Protocol

**Before any major decision, re-read:**
1. This section (Attention Anchor)
2. The Acceptance Criteria below

**After every 10 tool calls:**
- Am I still pursuing the stated goals?
- If uncertain: Re-read this prompt

**Before committing:**
- Does this satisfy all Acceptance Criteria?

---

## What We're Building

**Primary Goal:** A toggle that lets users switch between:
- **Path Mode (OFF):** LLM generates navigation blocks (current behavior)
- **Journey Mode (ON):** LLM ends with questions, 4D prompts appear below

**Bug Fix:** When clicking a 4D prompt, display the short `label` in chat, but send the long `executionPrompt` to the LLM.

---

## Acceptance Criteria (Verify Each)

- [ ] **AC1:** JOURNEY toggle pill appears in KineticHeader
- [ ] **AC2:** Toggle persists via localStorage (`grove-journey-mode`)
- [ ] **AC3:** Journey ON → LLM responses end with questions, no nav tags
- [ ] **AC4:** Journey OFF → LLM has navigation blocks (current behavior)
- [ ] **AC5:** Clicking prompt shows `label` in chat, sends `executionPrompt` to LLM
- [ ] **AC6:** Feature flag `journey-mode` gates the toggle

---

## Pre-Execution Verification

```bash
cd C:\GitHub\the-grove-foundation

# 1. Verify clean state
git status

# 2. Run build to confirm baseline
npm run build

# 3. Run tests
npm test
```

---

## Epic 1: Schema & Bug Fix

### Story 1.1: Extend QueryStreamItem

**File:** `src/core/schema/stream.ts`

Find `QueryStreamItem` interface (around line 103-110) and add `executionPrompt`:

```typescript
export interface QueryStreamItem extends BaseStreamItem {
  type: 'query';
  content: string;              // Display text (what user sees in chat)
  executionPrompt?: string;     // NEW: If present, send this to LLM instead of content
  intent?: string;
  pivot?: PivotContext;
  role: 'user';
  createdBy: 'user';
}
```

### Story 1.2: Modify submit() in useKineticStream

**File:** `src/surface/components/KineticStream/hooks/useKineticStream.ts`

**Step 1:** Find `SubmitOptions` interface (around line 20) and add:
```typescript
interface SubmitOptions {
  pivot?: PivotContext;
  lensId?: string;
  personaBehaviors?: PersonaBehaviors;
  executionPrompt?: string;  // NEW
}
```

**Step 2:** Find `submit` function (around line 63). Modify:

1. Destructure `executionPrompt` from options:
```typescript
const submit = useCallback(async (query: string, submitOptions: SubmitOptions = {}) => {
  const { pivot, lensId, personaBehaviors: submitBehaviors, executionPrompt } = submitOptions;
```

2. Create QueryStreamItem with both fields:
```typescript
const queryItem: QueryStreamItem = {
  id: `query-${Date.now()}`,
  type: 'query',
  timestamp: Date.now(),
  content: query,  // Display text
  executionPrompt: executionPrompt && executionPrompt !== query ? executionPrompt : undefined,
  role: 'user',
  createdBy: 'user',
  pivot
};
```

3. Use executionPrompt when calling sendMessageStream:
```typescript
// Send to LLM - use executionPrompt if different from display text
const promptToSend = executionPrompt ?? query;
const chatResponse = await sendMessageStream(
  promptToSend,  // ← This is what LLM receives
  // ...rest unchanged
```

### Story 1.3: Fix ResponseObject Fork Selection

**File:** `src/surface/components/KineticStream/Stream/blocks/ResponseObject.tsx`

**Step 1:** Update props interface (around line 17):
```typescript
export interface ResponseObjectProps {
  item: ResponseStreamItem;
  onConceptClick?: (span: RhetoricalSpan) => void;
  onForkSelect?: (fork: JourneyFork) => void;
  onPromptSubmit?: (displayText: string, executionPrompt?: string) => void;  // CHANGED
}
```

**Step 2:** Fix handleForkSelect (around line 44):
```typescript
const handleForkSelect = useCallback((fork: JourneyFork) => {
  emit.forkSelected(fork.id, fork.type, fork.label, item.id);
  
  // Sprint: prompt-journey-mode-v1 - BUG FIX
  // Display label in chat, send queryPayload to LLM
  const displayText = fork.label;
  const executionPrompt = fork.queryPayload || fork.label;
  
  onPromptSubmit?.(displayText, executionPrompt);
  onForkSelect?.(fork);
}, [emit, item.id, onPromptSubmit, onForkSelect]);
```

### Story 1.4: Wire Through ExploreShell

**File:** `src/surface/components/KineticStream/ExploreShell.tsx`

**Step 1:** Find `handleSubmit` (around line 440) and update:
```typescript
const handleSubmit = useCallback((displayText: string, executionPrompt?: string) => {
  scrollToBottom(false);
  submit(displayText, { 
    personaBehaviors,
    executionPrompt
  });
}, [submit, scrollToBottom, personaBehaviors]);
```

**Step 2:** Find `handleForkSelect` (around line 424) and update:
```typescript
const handleForkSelect = useCallback((fork: JourneyFork) => {
  actor.send({
    type: 'USER.SELECT_FORK',
    fork,
    responseId: ''
  });

  // Sprint: prompt-journey-mode-v1 - Pass separate display/execution
  const displayText = fork.label;
  const executionPrompt = fork.queryPayload || fork.label;
  
  submit(displayText, { 
    personaBehaviors,
    executionPrompt
  });
}, [actor, submit, personaBehaviors]);
```

### Build Gate - Epic 1
```bash
npm run build
npm run typecheck
```

---

## Epic 2: Journey Mode Toggle UI

### Story 2.1: Add Feature Flag

**File:** `data/infrastructure/feature-flags.json`

Add to the array:
```json
{
  "id": "journey-mode",
  "name": "Journey Mode Toggle",
  "description": "Toggle between LLM-driven navigation and 4D library prompt journeys",
  "enabled": true,
  "rolloutPercentage": 100
}
```

### Story 2.2: Add Journey Mode State

**File:** `src/surface/components/KineticStream/ExploreShell.tsx`

**Step 1:** Add imports if needed (at top):
```typescript
import { useFeatureFlag } from '../../../hooks/useFeatureFlags';
```

**Step 2:** Add state (after other useState calls, around line 50-70):
```typescript
// Sprint: prompt-journey-mode-v1 - Journey mode toggle
const isJourneyModeEnabled = useFeatureFlag('journey-mode');
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

**Step 3:** Add behavior override (after personaBehaviors useMemo, around line 150):
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

**Step 4:** Update all submit calls to use `effectivePersonaBehaviors`:
- `handleSubmit`: change `personaBehaviors` → `effectivePersonaBehaviors`
- `handleForkSelect`: change `personaBehaviors` → `effectivePersonaBehaviors`
- `handleConceptClick`: change `personaBehaviors` → `effectivePersonaBehaviors`

**Step 5:** Pass to KineticHeader (find the JSX, around line 550):
```tsx
<KineticHeader
  // ...existing props
  journeyMode={isJourneyModeEnabled ? journeyMode : undefined}
  onJourneyModeToggle={isJourneyModeEnabled ? handleJourneyModeToggle : undefined}
/>
```

### Story 2.3: Add Toggle UI

**File:** `src/surface/components/KineticStream/KineticHeader.tsx`

**Step 1:** Add props to interface:
```typescript
interface KineticHeaderProps {
  // ...existing
  journeyMode?: boolean;
  onJourneyModeToggle?: () => void;
}
```

**Step 2:** Destructure in component:
```typescript
export const KineticHeader: React.FC<KineticHeaderProps> = ({
  // ...existing
  journeyMode,
  onJourneyModeToggle
}) => {
```

**Step 3:** Add toggle button (after RAG toggle, in the controls area):
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

### Build Gate - Epic 2
```bash
npm run build
npm run dev
# Test: Toggle appears, persists on refresh
```

---

## Epic 3: Verify End-to-End

### Story 3.1: Manual Testing

```bash
npm run dev
```

**Test Sequence:**

1. **Toggle Visibility:**
   - [ ] JOURNEY pill appears in header
   - [ ] Initially shows "OFF"

2. **Toggle Persistence:**
   - [ ] Click toggle → shows "ON"
   - [ ] Refresh page → still shows "ON"
   - [ ] Click toggle → shows "OFF"
   - [ ] Refresh page → still shows "OFF"

3. **Journey Mode ON Behavior:**
   - [ ] Enable journey mode
   - [ ] Send a message
   - [ ] Response ends with a question (no navigation blocks)
   - [ ] 4D prompts appear below response

4. **Bug Fix Verification:**
   - [ ] With journey mode ON, click a 4D prompt
   - [ ] Chat shows the SHORT label (e.g., "What is The Grove?")
   - [ ] NOT the long executionPrompt (e.g., "Explain what The Grove is in a way that captures...")

5. **Journey Mode OFF Behavior:**
   - [ ] Disable journey mode
   - [ ] Send a message
   - [ ] Response has navigation blocks with forks

### Build Gate - Final
```bash
npm run build
npm test
```

---

## Commit Sequence

```bash
# After Epic 1
git add -A
git commit -m "fix: separate display text from execution prompt in chat stream

Sprint: prompt-journey-mode-v1
- Add executionPrompt field to QueryStreamItem schema
- Modify submit() to accept separate display/execution prompts
- Fix ResponseObject to show label, send queryPayload to LLM"

# After Epic 2
git add -A
git commit -m "feat: add journey mode toggle to kinetic header

Sprint: prompt-journey-mode-v1
- Add journey-mode feature flag
- Add journey mode state with localStorage persistence
- Override persona behaviors when journey mode active
- Add JOURNEY toggle pill UI to KineticHeader"

# After Epic 3 (if any fixes needed)
git add -A
git commit -m "test: verify journey mode end-to-end

Sprint: prompt-journey-mode-v1
- Manual testing complete
- All acceptance criteria verified"
```

---

## Troubleshooting

**Build fails on QueryStreamItem type:**
- Check that `executionPrompt?: string` is properly optional
- Verify no other files expect different type

**Toggle doesn't appear:**
- Check feature flag is enabled in `feature-flags.json`
- Verify `isJourneyModeEnabled` check in ExploreShell

**LLM still generates nav blocks with journey mode ON:**
- Verify `effectivePersonaBehaviors` is passed to submit, not `personaBehaviors`
- Check server.js respects `closingBehavior: 'question'`

**Prompt label not showing correctly:**
- Verify `handleForkSelect` passes `fork.label` as first arg
- Check `onPromptSubmit` signature matches new two-arg form

---

## Success Verification

When complete, verify:

1. ✅ `npm run build` passes
2. ✅ `npm test` passes  
3. ✅ Toggle appears and persists
4. ✅ Journey ON: questions, no nav blocks, 4D prompts
5. ✅ Journey OFF: nav blocks (current behavior)
6. ✅ Clicking prompt shows label, sends executionPrompt

**Sprint complete when all Acceptance Criteria checked.**
