# Kinetic Suggested Prompts v1 — Requirements & Vision

**Sprint Name:** `kinetic-suggested-prompts-v1`  
**Created:** 2025-01-04  
**Author:** Jim Calhoun  
**Status:** Ready for Foundation Loop execution

---

## Executive Summary

Transform the suggested prompts experience from a disconnected floating widget into contextually-aware inline navigation that feels like a natural continuation of exploration. Leverage the existing 4D Context Fields system to surface the right prompts at the right time, rendered as DEX NavigationBlock objects at the end of responses.

**Core Insight:** The inline "Path A / Path B" buttons already visible in responses are the right UX pattern—they just need to be 4D-aware and auto-submit on click. The floating "Suggestion" widget feels forced and should be deprecated.

---

## Problem Statement

### Current State (What's Wrong)

1. **Disconnected Widget Experience**
   - Floating "Suggestion" card appears below the conversation
   - Generic prompts not tied to conversation context
   - Feels like an interruptive popup, not part of the flow
   - Requires copy/paste or manual entry (no auto-submit)

2. **4D Context System Exists But Isn't Wired**
   - Rich `ContextState` tracking: stage, entropy, lens, moments
   - Sophisticated `PromptObject` schema with targeting metadata
   - `scorePrompt()` and `selectPrompts()` functions ready
   - None of this is connected to the actual prompt display

3. **Journey System Feels Forced**
   - Lens-specific prompts (dr-chiang, wayne-turner) were prototypes
   - "Show me a journey" button is a dead-end UX
   - Users don't want to be "shown" anything—they want to explore

4. **Inline Buttons Are Hardcoded**
   - Response-end navigation (Path A, Path B) is manually written
   - Not driven by DEX objects or 4D context
   - Labels aren't dynamically generated based on conversation state

### Target State (What We Want)

**A suggested prompt system that:**
- Surfaces inline at the end of responses as natural next steps
- Uses 4D context (stage, entropy, lens, moments) to select relevant prompts
- Auto-submits on click—no friction
- Feels like the AI is offering relevant paths, not showing generic suggestions
- Deprecates the floating widget entirely

---

## The 4D Context Fields System

### The Four Dimensions

| Dimension | Type | Description | Example Values |
|-----------|------|-------------|----------------|
| **Stage** | enum | User lifecycle position | `genesis`, `exploration`, `synthesis`, `advocacy` |
| **Entropy** | 0.0-1.0 | Conversation complexity/divergence | 0.3 = focused, 0.8 = scattered |
| **Lens** | string | Active persona/perspective | `base`, `academic`, `dr-chiang`, `wayne-turner` |
| **Moments** | string[] | Active trigger conditions | `high_entropy`, `off_topic`, `first_visit` |

### ContextState Interface (Already Exists)

```typescript
// src/core/context-fields/types.ts
interface ContextState {
  stage: Stage;
  entropy: number;
  activeLensId: string | null;
  activeMoments: string[];
  interactionCount: number;
  topicsExplored: string[];
  sproutsCaptured: number;
  offTopicCount: number;
}
```

### PromptObject Structure (Key Fields)

```typescript
interface PromptObject {
  id: string;
  
  // Display (what user sees)
  label: string;              // Short button text: "Impact of local AI on privacy"
  description?: string;       // Tooltip/subtitle
  icon?: string;              // Optional emoji/icon
  variant?: 'default' | 'glow' | 'subtle' | 'urgent';
  
  // Execution (what gets submitted)
  executionPrompt: string;    // Full contextual prompt sent to LLM
  systemContext?: string;     // Additional system prompt injection
  
  // Targeting (when to show)
  targeting: {
    stages?: Stage[];
    excludeStages?: Stage[];
    entropyWindow?: { min?: number; max?: number };
    lensIds?: string[];
    excludeLenses?: string[];
    momentTriggers?: string[];
    requireMoment?: boolean;
    minInteractions?: number;
    afterPromptIds?: string[];
    topicClusters?: string[];
  };
  
  // Affinities (weighted relevance)
  topicAffinities: { topicId: string; weight: number }[];
  lensAffinities: { lensId: string; weight: number; customLabel?: string }[];
  
  baseWeight?: number;  // 0-100, higher = more likely to surface
}
```

**Critical Distinction:**
- `label` = What the user sees on the button ("Impact of local AI on privacy")
- `executionPrompt` = What gets submitted ("Explore how the Ratchet Effect's capability propagation to local hardware affects data privacy guarantees. Consider: What computations can stay entirely local? How does this change the privacy calculus compared to cloud-dependent AI? What are the implications for censorship resistance?")

---

## User Experience Vision

### The Inline NavigationBlock

At the end of each response, surface 2-4 contextually-relevant prompts as clickable pills:

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  [Response content...]                                      │
│                                                             │
│  ─────────────────────────────────────────────────────────  │
│                                                             │
│  ↓ Impact of local AI on privacy          (orange/primary)  │
│  → Cloud business strategies against Ratchet  (gray/secondary) │
│  ✨ Surprise me with a connection          (subtle)          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Navigation Types (Journey Forks)

| Type | Icon | Purpose | When to Show |
|------|------|---------|--------------|
| **Deep Dive** | ↓ | Go deeper on current topic | Always show 1 |
| **Pivot** | → | Connect to adjacent topic | When 2+ topics explored |
| **Apply** | ✨ | Practical application or synthesis | When entropy > 0.5 |
| **Stabilize** | ○ | Focus/synthesize when scattered | When entropy > 0.7 |

### Interaction Flow

1. User asks question
2. LLM generates response
3. **System selects 2-4 prompts** using 4D context + scoring
4. **NavigationBlock renders** inline at response end
5. User **clicks** a prompt pill
6. **Auto-submit**: `executionPrompt` fires immediately (no Enter needed)
7. Conversation continues naturally

### What Gets Deprecated

- **Floating "Suggestion" widget** — Hidden/removed
- **"Show me a journey" modal** — Removed
- **Lens toggle (maybe)** — Keep but de-emphasize; 4D system handles lens-awareness automatically
- **Manual journey navigation** — Replaced by organic inline forks

---

## Technical Architecture

### Component Hierarchy

```
ExploreChat
├── MessageList
│   └── ResponseBlock
│       ├── ResponseContent (markdown/text)
│       └── NavigationBlock (NEW - inline prompts)
│           └── PromptPill × N
└── InputArea (unchanged)
```

### Data Flow

```
┌──────────────────┐     ┌─────────────────┐     ┌──────────────────┐
│  ContextState    │────▶│  selectPrompts  │────▶│ NavigationBlock  │
│  (4D aggregated) │     │  (scoring.ts)   │     │  (renders pills) │
└──────────────────┘     └─────────────────┘     └──────────────────┘
        │                                                  │
        │                                                  ▼
        │                                         ┌──────────────┐
        │                                         │  PromptPill  │
        │                                         │  onClick()   │
        │                                         └──────────────┘
        │                                                  │
        ▼                                                  ▼
┌──────────────────┐                              ┌──────────────────┐
│ Engagement       │                              │ handleSubmit()   │
│ Machine (XState) │◀─────────────────────────────│ executionPrompt  │
└──────────────────┘                              └──────────────────┘
```

### Key Integration Points

1. **ContextState Aggregation** (`src/core/context-fields/`)
   - Already exists
   - May need wiring to actually populate from engagement machine state

2. **Prompt Selection** (`src/core/context-fields/scoring.ts`)
   - `selectPrompts(prompts, context, { maxPrompts: 3 })`
   - Returns ranked PromptObjects

3. **Prompt Library** (`src/data/prompts/`)
   - `base.prompts.json` — Universal prompts
   - Lens-specific files — Already exist for dr-chiang, wayne-turner
   - Need to ensure all use PromptObject schema

4. **NavigationBlock Component** (NEW)
   - Receives `PromptObject[]` from selection
   - Renders as flex-wrap cluster of PromptPill buttons
   - Handles click → auto-submit

5. **Auto-Submit Handler**
   - On pill click: extract `executionPrompt`
   - Call existing chat submit function
   - No user interaction required

---

## Prompt Library Strategy

### Base Prompts (Always Available)

These surface when no lens-specific prompts match:

```json
{
  "id": "explore-implications",
  "label": "What are the implications?",
  "executionPrompt": "Based on what we've discussed, explore the broader implications. What second-order effects should I be thinking about?",
  "targeting": {
    "stages": ["exploration", "synthesis"],
    "minInteractions": 2
  },
  "baseWeight": 70
}
```

### Entropy-Reactive Prompts

Surface when conversation gets scattered:

```json
{
  "id": "stabilize-high-entropy",
  "label": "Let's focus",
  "executionPrompt": "We've explored several directions. Help me identify the most important thread and synthesize what we've learned.",
  "variant": "subtle",
  "targeting": {
    "entropyWindow": { "min": 0.7 },
    "momentTriggers": ["high_entropy"]
  },
  "baseWeight": 85
}
```

### Topic-Aware Prompts

Surface based on what's been discussed:

```json
{
  "id": "ratchet-deep-dive",
  "label": "Go deeper on the Ratchet",
  "executionPrompt": "Take me deeper into the Ratchet Effect. What are the edge cases, counterarguments, and implications I should understand?",
  "targeting": {
    "stages": ["exploration", "synthesis"]
  },
  "topicAffinities": [
    { "topicId": "ratchet-effect", "weight": 1.0 }
  ],
  "baseWeight": 80
}
```

### Lens-Specific Prompts

Only surface for specific lenses:

```json
{
  "id": "chiang-network-topology",
  "label": "Show me the network design",
  "executionPrompt": "Walk me through the network topology. What runs locally, what's in the cloud, how do nodes discover each other?",
  "targeting": {
    "lensIds": ["dr-chiang"],
    "stages": ["exploration", "synthesis"]
  },
  "lensAffinities": [
    { "lensId": "dr-chiang", "weight": 1.0 }
  ],
  "baseWeight": 90
}
```

---

## Acceptance Criteria

### Must Have (P0)

- [ ] **NavigationBlock component** renders 2-4 prompts at end of responses
- [ ] **4D context wired** — Stage, entropy, lens, moments flow to selector
- [ ] **selectPrompts() integrated** — Uses existing scoring algorithm
- [ ] **Auto-submit on click** — executionPrompt fires immediately
- [ ] **Floating widget hidden** — Suggestion card deprecated
- [ ] **Base prompts work** — Generic prompts surface without lens

### Should Have (P1)

- [ ] **Visual hierarchy** — Primary (orange) vs secondary (gray) styling
- [ ] **Prompt variants** — `glow`, `subtle`, `urgent` render differently
- [ ] **Entropy stabilization** — High entropy triggers focus prompts
- [ ] **Topic awareness** — Prompts reference explored topics

### Nice to Have (P2)

- [ ] **Generated prompts** — PromptGenerator creates dynamic suggestions
- [ ] **Prompt analytics** — Track impressions, selections, completions
- [ ] **Cooldown support** — Don't show same prompt repeatedly
- [ ] **Lens Peek hover** — Tooltip showing why prompt was selected

---

## Non-Goals (Explicit Scope Exclusions)

- **LLM-generated fork labels** — Use library prompts, not runtime generation (Phase 2)
- **Active Rhetoric highlights** — Orange clickable terms in response body (separate sprint)
- **Cognitive state streaming** — "thinking...", "connecting..." indicators (separate sprint)
- **Full Kinetic Stream rewrite** — This is incremental improvement, not architecture overhaul
- **Journey system enhancement** — We're deprecating it, not improving it

---

## File Inventory

### Files to Create

| File | Purpose |
|------|---------|
| `src/explore/components/NavigationBlock.tsx` | Inline prompt container |
| `src/explore/components/PromptPill.tsx` | Individual clickable prompt |
| `src/explore/hooks/useNavigationPrompts.ts` | 4D-aware prompt selection hook |

### Files to Modify

| File | Changes |
|------|---------|
| `src/explore/ExploreChat.tsx` | Wire NavigationBlock into response rendering |
| `src/explore/components/ResponseBlock.tsx` | Render NavigationBlock after content |
| `src/core/context-fields/scoring.ts` | May need minor adjustments |
| `src/data/prompts/base.prompts.json` | Ensure all prompts have proper executionPrompt |

### Files to Deprecate/Hide

| File | Action |
|------|--------|
| Floating suggestion widget | Hide via feature flag or remove |
| Journey modal components | Remove or hide |
| `src/explore/components/SuggestedPrompts.tsx` | Likely deprecated |

---

## Testing Strategy

### Unit Tests

- `selectPrompts()` returns correct prompts for various ContextState inputs
- Hard filters work (lens exclusion, stage mismatch, minInteractions)
- Scoring weights produce expected ranking

### Integration Tests

- NavigationBlock renders after response
- Click triggers handleSubmit with executionPrompt
- 4D context flows from engagement machine to prompt selection

### Manual Verification

- Start fresh session → see genesis-stage prompts
- Explore a topic → see deepening prompts
- High entropy conversation → see stabilization prompt
- Activate dr-chiang lens → see lens-specific prompts

---

## Migration Notes

### From Legacy to Kinetic

1. **Phase 1:** Add NavigationBlock alongside existing widget (feature flagged)
2. **Phase 2:** Validate prompts surface correctly, auto-submit works
3. **Phase 3:** Hide floating widget (keep code for rollback)
4. **Phase 4:** Remove floating widget code after 1 week stability

### Rollback Plan

If issues arise:
- Re-enable floating widget via feature flag
- NavigationBlock can be hidden without code changes
- No destructive migrations in this sprint

---

## Open Questions

1. **How many prompts?** — Spec says 2-4, but should it adapt to response length?
2. **Prompt generation timing?** — Pre-compute on response complete, or lazy on render?
3. **Mobile UX?** — Pills may need different layout on narrow screens
4. **Analytics baseline?** — Should we track current widget engagement before deprecating?

---

## References

### Key Source Files

- `src/core/context-fields/types.ts` — ContextState, PromptObject schemas
- `src/core/context-fields/scoring.ts` — selectPrompts, rankPrompts
- `src/core/context-fields/generator.ts` — PromptGenerator (rule-based)
- `src/data/prompts/base.prompts.json` — Base prompt library
- `src/data/prompts/dr-chiang.prompts.json` — Example lens-specific prompts
- `src/explore/hooks/usePromptSuggestions.ts` — Existing hook (may adapt)
- `src/explore/utils/scorePrompt.ts` — Alternative scoring (reconcile with context-fields)

### Architecture Documents

- `KINETIC_STREAM_RESET_VISION_v2.md` — Full kinetic vision
- `TERMINAL_LEGACY_ANALYSIS.md` — Current vs target architecture
- `Refactored_Chat.pdf` — Stream component specs

### Research Session

- Transcript: `/mnt/transcripts/2026-01-04-20-00-12-kinetic-prompts-lens-staging-research.txt`

---

## Success Metrics

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Prompt click-through rate | ~5%? | 25%+ | Analytics |
| Session depth (avg turns) | ~3 | 5+ | Analytics |
| Time to first prompt click | N/A | <30s | Analytics |
| User qualitative feedback | "feels pushy" | "helpful suggestions" | Interviews |

---

*This document provides the vision and requirements. Execute Foundation Loop in a new context window to generate REPO_AUDIT, SPEC, ARCHITECTURE, MIGRATION_MAP, DECISIONS, SPRINTS, and EXECUTION_PROMPT artifacts.*
