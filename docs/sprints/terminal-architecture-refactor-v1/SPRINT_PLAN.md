# Sprint: Terminal Architecture Refactor v1.0

> **Foundation Loop Sprint Package**
> This document contains the consolidated planning artifacts for the Terminal refactor sprint. 
> Execute Foundation Loop to atomize into the standard 8-artifact structure before execution.

---

## Sprint Overview

**Name:** `terminal-architecture-refactor-v1`  
**Priority:** P0 (Prerequisite for "Active Grove" sprint)  
**Estimated Effort:** 3-4 days  
**Risk Level:** Medium (large component, high usage)

### The Problem

The `Terminal.tsx` component is 1,500+ lines handling:
- UI chrome (header, resize, positioning)
- Message rendering and markdown parsing
- Chat input and command processing  
- Flow states (welcome, lens picker, cognitive bridge)
- Engagement reveals (simulation, founder story, terminator mode)
- Journey navigation
- Entropy detection
- Analytics tracking
- Custom lens management
- Streak tracking
- Sprout capture

This monolith blocks the "Active Grove" sprint, which needs to:
1. Embed Terminal in a split-screen layout
2. Control Terminal focus programmatically
3. Inject system messages on layout transitions
4. Synchronize flow states with page-level state machine

### The Solution

Extract three focused components:
- `TerminalShell.tsx` — Chrome (header, resize, position, minimize/expand)
- `TerminalChat.tsx` — Message rendering, input, suggestions
- `TerminalFlow.tsx` — Interstitials, lens picker, bridges, reveals

Add lens-aware initial messages mirroring the `LensReality` pattern.

---

## 1. Repository Audit (REPO_AUDIT.md)

### Current State

```
components/Terminal.tsx              # 1,487 lines - THE MONOLITH
components/Terminal/
├── CognitiveBridge.tsx              # 180 lines - Entropy-triggered journey offers
├── CommandInput/                    # Command palette system (well-modularized)
│   ├── CommandAutocomplete.tsx
│   ├── CommandInput.tsx
│   ├── CommandRegistry.ts
│   ├── commands/
│   └── useCommandParser.ts
├── ConversionCTA/                   # CTA modals (well-modularized)
├── CustomLensWizard/                # 5-step wizard (well-modularized)
├── index.ts                         # Barrel exports
├── JourneyCard.tsx                  # Card display
├── JourneyCompletion.tsx            # Completion modal
├── JourneyNav.tsx                   # Navigation UI
├── LensBadge.tsx                    # Lens indicator
├── LensGrid.tsx                     # Lens picker grid
├── LoadingIndicator.tsx             # Streaming indicator
├── Modals/                          # Help, Journeys, Stats, Garden
├── Reveals/                         # SimulationReveal, FounderStory, TerminatorMode
├── SuggestionChip.tsx               # Clickable suggestion
├── TerminalControls.tsx             # Bottom control bar
├── TerminalHeader.tsx               # 165 lines - Header chrome
├── TerminalPill.tsx                 # Status pills
└── WelcomeInterstitial.tsx          # First-time user welcome
```

### Technical Debt

1. **State explosion** — 25+ useState hooks in Terminal.tsx
2. **Mixed concerns** — UI, business logic, analytics interleaved
3. **Prop drilling** — Deep prop chains through flow components
4. **No separation between shell and content** — Can't embed just the chat

### Dependencies

- `hooks/useNarrativeEngine.ts` — Lens selection, journey navigation
- `hooks/useEngagementBridge.ts` — Reveal state management
- `hooks/useCustomLens.ts` — Custom lens CRUD
- `hooks/useStreakTracking.ts` — Streak persistence
- `hooks/useSproutCapture.ts` — Insight capture
- `services/chatService.ts` — API communication

### Integration Points

| Consumer | Usage |
|----------|-------|
| `GenesisPage.tsx` | Embedded as overlay, passes `externalQuery` |
| `SurfaceRouter.tsx` | Route component for `/terminal` |
| `GroveWorkspace.tsx` | Full workspace embedding (future) |

---

## 2. Specification (SPEC.md)

### Goals

1. **G1:** Extract `TerminalShell` with programmatic control API
2. **G2:** Extract `TerminalChat` as pure message/input component
3. **G3:** Extract `TerminalFlow` for all interstitial states
4. **G4:** Add lens-aware initial messages (extend `LensReality`)
5. **G5:** Maintain 100% backward compatibility — existing pages work unchanged

### Non-Goals

- **NG1:** Changing Terminal visual design
- **NG2:** Modifying chat API or streaming logic
- **NG3:** Refactoring hooks (useNarrativeEngine, etc.)
- **NG4:** Adding new features

### Acceptance Criteria

| ID | Criterion | Verification |
|----|-----------|--------------|
| AC1 | GenesisPage renders with Terminal overlay | Manual + E2E |
| AC2 | `/terminal` route works identically to pre-refactor | Manual + E2E |
| AC3 | Lens selection triggers headline morph AND terminal welcome | Manual |
| AC4 | URL param `?lens=academic` works | E2E test |
| AC5 | All reveals (simulation, founder, terminator) function | Manual |
| AC6 | Cognitive Bridge triggers correctly | Unit test entropy logic |
| AC7 | No console errors or React warnings | E2E test |
| AC8 | Build succeeds, no TypeScript errors | CI gate |

### Test Requirements

**Unit Tests (Vitest):**
- `TerminalShell` focus management
- `TerminalChat` message parsing
- Lens-aware initial message resolution

**E2E Tests (Playwright):**
- `genesis-terminal-interaction.spec.ts` — Overlay open/close, query injection
- `terminal-lens-flow.spec.ts` — Lens selection, welcome message change

---

## 3. Architecture (ARCHITECTURE.md)

### Target Component Structure

```
components/Terminal/
├── TerminalShell.tsx        # NEW: Chrome wrapper
├── TerminalChat.tsx         # NEW: Chat UI
├── TerminalFlow.tsx         # NEW: Flow state machine
├── Terminal.tsx             # REFACTORED: Composition root
├── types.ts                 # NEW: Shared types
├── useTerminalState.ts      # NEW: Consolidated state hook
└── ... (existing subcomponents unchanged)
```

### Component Responsibilities

#### TerminalShell.tsx (~150 lines)
```typescript
interface TerminalShellProps {
  isOpen: boolean;
  isMinimized: boolean;
  onClose: () => void;
  onMinimize: () => void;
  onExpand: () => void;
  headerProps: TerminalHeaderProps;
  children: React.ReactNode;
  // Programmatic control
  ref?: React.Ref<TerminalShellHandle>;
}

interface TerminalShellHandle {
  focusInput: () => void;
  scrollToBottom: () => void;
  injectSystemMessage: (text: string) => void;
}
```

#### TerminalChat.tsx (~400 lines)
```typescript
interface TerminalChatProps {
  messages: ChatMessage[];
  isLoading: boolean;
  onSend: (query: string, display?: string, nodeId?: string) => void;
  suggestions: string[];
  onSuggestionClick: (hint: string) => void;
  dynamicSuggestion: string;
  activeLensData: Persona | null;
  // Refs for parent control
  inputRef: React.RefObject<HTMLInputElement>;
  messagesEndRef: React.RefObject<HTMLDivElement>;
}
```

#### TerminalFlow.tsx (~300 lines)
```typescript
interface TerminalFlowProps {
  // Flow state
  showWelcome: boolean;
  showLensPicker: boolean;
  showCustomLensWizard: boolean;
  showCognitiveBridge: boolean;
  bridgeState: BridgeState;
  // Reveal states
  showSimulationReveal: boolean;
  showCustomLensOffer: boolean;
  showTerminatorPrompt: boolean;
  showFounderStory: boolean;
  showConversionCTA: boolean;
  showJourneyCompletion: boolean;
  // Handlers (all existing)
  onLensSelect: (id: string | null) => void;
  onWelcomeLensSelect: (id: string | null) => void;
  onCreateCustomLens: () => void;
  // ... remaining handlers
}
```

### Lens-Aware Initial Messages

Extend `LensReality` type in `src/core/schema/narrative.ts`:

```typescript
export interface TerminalWelcome {
  heading: string;           // "The Terminal." → "Your Research Interface."
  thesis: string;            // One-sentence value prop
  prompts: string[];         // Suggested starting questions
  footer?: string;           // Optional closing line
}

export interface LensReality {
  hero: HeroContent;
  problem: TensionContent;
  terminal?: TerminalWelcome;  // NEW
}
```

Add to `quantum-content.ts`:

```typescript
export const DEFAULT_TERMINAL_WELCOME: TerminalWelcome = {
  heading: "The Terminal.",
  thesis: "Everything documented about Grove—the white paper, technical architecture, economic model, advisory council analysis—is indexed here.",
  prompts: [
    "What does \"distributed AI infrastructure\" actually mean?",
    "How does capability propagate from frontier to local?",
    "Why would agents work to improve themselves?"
  ],
  footer: "Or explore freely. The questions lead to each other."
};

// Per-lens overrides in SUPERPOSITION_MAP
'academic': {
  // ...existing hero/problem...
  terminal: {
    heading: "Research Interface.",
    thesis: "Peer-reviewed sources, technical documentation, and advisory council analysis. Academic rigor applied to distributed AI.",
    prompts: [
      "What peer-reviewed research supports the hybrid architecture?",
      "How does Grove address the enclosure of AI research?",
      "What are the methodological limitations?"
    ]
  }
}
```

### State Consolidation

New hook `useTerminalState.ts` consolidates the 25+ useState calls:

```typescript
interface TerminalUIState {
  // Flow states
  flowState: 'idle' | 'welcome' | 'selecting' | 'active';
  showLensPicker: boolean;
  showCustomLensWizard: boolean;
  showCognitiveBridge: boolean;
  bridgeState: BridgeState;
  
  // Reveal states
  reveals: {
    simulation: boolean;
    customLensOffer: boolean;
    terminator: boolean;
    founderStory: boolean;
    conversionCTA: boolean;
    journeyCompletion: boolean;
  };
  
  // Modal states
  modals: {
    help: boolean;
    journeys: boolean;
    stats: boolean;
    garden: boolean;
  };
  
  // Input states
  input: string;
  isVerboseMode: boolean;
  dynamicSuggestion: string;
  currentTopic: string;
}

export function useTerminalState(initialLens?: string): {
  state: TerminalUIState;
  actions: TerminalActions;
}
```


---

## 4. Migration Map (MIGRATION_MAP.md)

### Phase 1: Foundation (No Breaking Changes)

| Order | File | Action | Risk |
|-------|------|--------|------|
| 1.1 | `components/Terminal/types.ts` | CREATE | None |
| 1.2 | `src/core/schema/narrative.ts` | MODIFY — Add `TerminalWelcome` type | Low |
| 1.3 | `src/data/quantum-content.ts` | MODIFY — Add terminal welcome content | Low |
| 1.4 | `constants.ts` | MODIFY — Deprecate `INITIAL_TERMINAL_MESSAGE` | Low |

### Phase 2: Extract Components (Additive)

| Order | File | Action | Risk |
|-------|------|--------|------|
| 2.1 | `components/Terminal/useTerminalState.ts` | CREATE | Low |
| 2.2 | `components/Terminal/TerminalShell.tsx` | CREATE | Low |
| 2.3 | `components/Terminal/TerminalChat.tsx` | CREATE | Medium |
| 2.4 | `components/Terminal/TerminalFlow.tsx` | CREATE | Medium |
| 2.5 | `components/Terminal/index.ts` | MODIFY — Export new components | Low |

### Phase 3: Compose (The Critical Phase)

| Order | File | Action | Risk |
|-------|------|--------|------|
| 3.1 | `components/Terminal.tsx` | MAJOR REFACTOR — Use new components | **High** |
| 3.2 | Manual testing | All flows | - |

### Phase 4: Integration

| Order | File | Action | Risk |
|-------|------|--------|------|
| 4.1 | `src/surface/pages/GenesisPage.tsx` | MODIFY — Use new Shell API | Medium |
| 4.2 | E2E tests | CREATE/UPDATE | - |

### Rollback Plan

Each phase is independently deployable. If Phase 3 fails:
1. Revert `Terminal.tsx` to pre-refactor state
2. Keep new components (they're additive)
3. Phase 2 components become "future use"

---

## 5. Architectural Decisions (DECISIONS.md)

### ADR-001: Component Extraction Strategy

**Status:** Accepted

**Context:**  
Terminal.tsx is 1,500 lines. We need to embed it in a split layout for "Active Grove" sprint.

**Decision:**  
Extract three components (Shell, Chat, Flow) rather than incremental cleanup.

**Alternatives Rejected:**
1. *Incremental refactor* — Too slow, blocks Active Grove indefinitely
2. *Complete rewrite* — Too risky, too much hidden logic
3. *Just add props* — Doesn't solve the embedding problem

**Consequences:**
- 3-4 days of focused refactor work
- Risk of regression in complex flows (mitigated by E2E tests)
- Clean foundation for future work

---

### ADR-002: Lens-Aware Welcome Messages

**Status:** Accepted

**Context:**  
The `INITIAL_TERMINAL_MESSAGE` is static. The hero headline morphs with lens selection, but the terminal greeting doesn't.

**Decision:**  
Extend `LensReality` with `terminal?: TerminalWelcome` property, following the same schema-backed pattern as hero content.

**Alternatives Rejected:**
1. *Separate config file* — Fragments lens definition across files
2. *Inline in Terminal.tsx* — Doesn't scale, not admin-editable
3. *Server-side generation* — Over-engineered for static content

**Consequences:**
- Consistent lens experience across landing + terminal
- Admin can edit via narratives.json
- Requires schema migration (minor)

---

### ADR-003: State Hook Consolidation

**Status:** Accepted

**Context:**  
Terminal.tsx has 25+ useState hooks making state flow hard to trace.

**Decision:**  
Create `useTerminalState` hook that groups related states and provides action dispatchers.

**Alternatives Rejected:**
1. *useReducer* — Good but adds boilerplate we don't need
2. *Zustand/Jotai* — External dependency for local component state
3. *Leave as-is* — Blocks comprehension and testing

**Consequences:**
- Single source of truth for Terminal UI state
- Easier to test state transitions
- Pattern for future complex components

---

## 6. Story Breakdown (SPRINTS.md)

### Epic 1: Type Foundation (Day 1, ~2 hours)

**Story 1.1:** Create Terminal types file
- [ ] Create `components/Terminal/types.ts`
- [ ] Define `TerminalUIState`, `TerminalActions`, `BridgeState`
- [ ] Define `TerminalShellHandle` ref interface
- [ ] Export from barrel

**Story 1.2:** Extend LensReality schema
- [ ] Add `TerminalWelcome` to `narrative.ts`
- [ ] Add `terminal?` to `LensReality` interface
- [ ] Update type guards if needed

**Story 1.3:** Add terminal welcome content
- [ ] Add `DEFAULT_TERMINAL_WELCOME` to `quantum-content.ts`
- [ ] Add terminal content to each lens in `SUPERPOSITION_MAP`
- [ ] Add `terminal` to schema `lensRealities` (for GCS-backed lenses)
- [ ] Deprecate `INITIAL_TERMINAL_MESSAGE` (add JSDoc deprecation)

**Build Gate:**
```bash
npm run build  # No TypeScript errors
npm run test   # Existing tests pass
```

---

### Epic 2: State Hook (Day 1, ~3 hours)

**Story 2.1:** Create useTerminalState hook
- [ ] Create `components/Terminal/useTerminalState.ts`
- [ ] Extract all useState into grouped state object
- [ ] Create action dispatchers (setFlowState, openModal, etc.)
- [ ] Add JSDoc comments

**Story 2.2:** Unit test state hook
- [ ] Create `components/Terminal/__tests__/useTerminalState.test.ts`
- [ ] Test initial state
- [ ] Test flow state transitions
- [ ] Test modal open/close

**Build Gate:**
```bash
npm run build
npm run test
```

---

### Epic 3: Component Extraction (Day 2, ~6 hours)

**Story 3.1:** Extract TerminalShell
- [ ] Create `TerminalShell.tsx`
- [ ] Move header, resize, position logic
- [ ] Implement `forwardRef` with `TerminalShellHandle`
- [ ] Accept children for content injection

**Story 3.2:** Extract TerminalChat
- [ ] Create `TerminalChat.tsx`
- [ ] Move `MarkdownRenderer` (keep internal)
- [ ] Move message list rendering
- [ ] Move input component integration
- [ ] Move suggestion chips

**Story 3.3:** Extract TerminalFlow
- [ ] Create `TerminalFlow.tsx`
- [ ] Move `WelcomeInterstitial` rendering
- [ ] Move `LensPicker` rendering
- [ ] Move `CognitiveBridge` rendering
- [ ] Move all Reveal components rendering
- [ ] Move modal rendering

**Story 3.4:** Update barrel exports
- [ ] Add new components to `index.ts`
- [ ] Maintain backward compatibility exports

**Build Gate:**
```bash
npm run build  # All new components compile
```

---

### Epic 4: Composition (Day 3, ~6 hours)

**Story 4.1:** Refactor Terminal.tsx
- [ ] Import new components
- [ ] Replace inline JSX with component calls
- [ ] Use `useTerminalState` hook
- [ ] Maintain all existing props interface
- [ ] Wire up all event handlers

**Story 4.2:** Manual regression testing
- [ ] Test GenesisPage overlay
- [ ] Test lens selection flow
- [ ] Test cognitive bridge trigger
- [ ] Test all reveals
- [ ] Test command palette
- [ ] Test journey navigation
- [ ] Test custom lens creation

**Story 4.3:** Fix regressions
- [ ] Address any issues from 4.2
- [ ] Verify console is clean

**Build Gate:**
```bash
npm run build
npm run test
npm run dev  # Manual testing
```

---

### Epic 5: Lens-Aware Welcome (Day 3, ~2 hours)

**Story 5.1:** Implement welcome message resolution
- [ ] Create `getTerminalWelcome(lensId)` function
- [ ] Check schema first, fallback to SUPERPOSITION_MAP
- [ ] Final fallback to DEFAULT_TERMINAL_WELCOME

**Story 5.2:** Wire up lens-reactive welcome
- [ ] Subscribe to `session.activeLens` changes
- [ ] Regenerate initial message on lens change
- [ ] Add typing animation for message update

**Story 5.3:** Test lens-aware welcome
- [ ] Unit test resolution function
- [ ] E2E test: `?lens=academic` shows academic welcome

---

### Epic 6: E2E Tests (Day 4, ~3 hours)

**Story 6.1:** Genesis terminal interaction tests
- [ ] Test overlay open on CTA click
- [ ] Test query injection from page
- [ ] Test close behavior

**Story 6.2:** Terminal lens flow tests
- [ ] Test lens picker appears on first visit
- [ ] Test lens selection updates welcome
- [ ] Test URL param lens selection
- [ ] Test custom lens creation flow

**Build Gate:**
```bash
npm run build
npm run test
npx playwright test  # All E2E pass
```


---

## 7. Execution Prompt (EXECUTION_PROMPT.md)

### Context

You are refactoring the Terminal component from a 1,500-line monolith into focused subcomponents. This is a prerequisite for the "Active Grove" sprint which will embed Terminal in a split-screen layout.

**Repository:** `C:\GitHub\the-grove-foundation`  
**Branch:** Create `feature/terminal-refactor-v1`

### Critical Constraints

1. **Zero regressions** — All existing functionality must work identically
2. **Backward compatible** — `Terminal.tsx` props interface unchanged
3. **No new dependencies** — Use only existing libraries
4. **Console clean** — No React warnings, no errors

### Execution Order

Execute epics in order. Each has a build gate — do not proceed if gate fails.

### Key Files to Study First

```
components/Terminal.tsx              # The monolith (read first 500 lines)
components/Terminal/TerminalHeader.tsx  # Example of good extraction
components/Terminal/index.ts         # Barrel pattern
src/core/schema/narrative.ts         # LensReality type
src/data/quantum-content.ts          # Content pattern to extend
```

### Verification Commands

```bash
# After each epic
npm run build
npm run test

# After Epic 4 (manual)
npm run dev
# Visit http://localhost:5173 — test landing overlay
# Visit http://localhost:5173/terminal — test direct route
# Test: lens selection, query, reveals

# After Epic 6
npx playwright test
```

### Content for Lens-Aware Welcome

**Academic:**
```typescript
terminal: {
  heading: "Research Interface.",
  thesis: "Peer-reviewed sources, technical documentation, and advisory council analysis. Academic rigor applied to distributed AI.",
  prompts: [
    "What peer-reviewed research supports the hybrid architecture?",
    "How does Grove address the enclosure of AI research?",
    "What are the methodological limitations?"
  ]
}
```

**Engineer:**
```typescript
terminal: {
  heading: "Technical Documentation.",
  thesis: "Architecture specs, API design, and performance analysis. The hybrid local-cloud system explained.",
  prompts: [
    "How does the cognitive router decide local vs. cloud?",
    "What are the memory system's retrieval mechanics?",
    "Show me the agent cognition loop."
  ]
}
```

**Concerned Citizen:**
```typescript
terminal: {
  heading: "The Terminal.",
  thesis: "Plain-language explanations of how distributed AI works and why it matters for ordinary people.",
  prompts: [
    "Why should I care about who owns AI?",
    "How is this different from ChatGPT?",
    "What can I actually do with this?"
  ]
}
```

**Geopolitical:**
```typescript
terminal: {
  heading: "Strategic Analysis.",
  thesis: "Geopolitical implications of AI infrastructure concentration. Power dynamics, sovereignty, and distributed alternatives.",
  prompts: [
    "How does AI concentration affect national sovereignty?",
    "What is the strategic case for distributed infrastructure?",
    "Who benefits from the current centralized model?"
  ]
}
```

**Family Office / Investor:**
```typescript
terminal: {
  heading: "Investment Thesis.",
  thesis: "Economic analysis, market dynamics, and infrastructure value capture. The case for distributed AI as an asset class.",
  prompts: [
    "What is the efficiency tax model?",
    "How does Grove capture value from capability propagation?",
    "What are the comparable infrastructure investments?"
  ]
}
```

**Big AI Exec:**
```typescript
terminal: {
  heading: "Competitive Analysis.",
  thesis: "Edge economics, hybrid architectures, and the threat/opportunity matrix for established AI providers.",
  prompts: [
    "How does the edge-cloud split affect unit economics?",
    "What capabilities remain cloud-exclusive?",
    "Where does Grove complement vs. compete with APIs?"
  ]
}
```

---

## 8. Testing Requirements

### Unit Tests (Required)

| Test File | Coverage |
|-----------|----------|
| `useTerminalState.test.ts` | State transitions, initial state |
| `getTerminalWelcome.test.ts` | Resolution logic, fallbacks |

### E2E Tests (Required)

| Test File | Scenarios |
|-----------|-----------|
| `genesis-terminal.spec.ts` | Overlay open, query injection, close |
| `terminal-lens-flow.spec.ts` | Lens picker, selection, URL param |

### Manual Testing Checklist

- [ ] GenesisPage: Click "Consult The Grove" → Terminal opens
- [ ] GenesisPage: Terminal close button works
- [ ] `/terminal`: Direct navigation works
- [ ] First-time user: Welcome interstitial appears
- [ ] Lens selection: Welcome message updates
- [ ] `?lens=academic`: Lens pre-selected, academic welcome shown
- [ ] Cognitive Bridge: Triggers after 3+ freestyle exchanges
- [ ] Simulation Reveal: Triggers at correct exchange count
- [ ] Custom lens: Full creation wizard works
- [ ] Command palette: `/help`, `/lens`, `/journey` work
- [ ] Scholar mode: `--verbose` toggle works
- [ ] Journey completion: Modal appears on journey transition

---

## Next Steps

1. **Create feature branch:** `git checkout -b feature/terminal-refactor-v1`

2. **Execute Epic 1** (Type Foundation) and verify build gate

3. **Continue sequentially** through remaining epics

4. **Upon completion:** This sprint unblocks the "Active Grove" sprint which implements the split-screen layout, flow state machine, and lens-triggered transformations.

---

*Sprint package generated by Foundation Loop methodology. Ready for execution.*
