# Repository Audit: Kinetic Stream Reset v2

**Audit Date:** December 28, 2025
**Auditor:** Claude Code
**Purpose:** Verify actual state of assets claimed in COMPREHENSIVE_REQUIREMENTS.md

---

## Executive Summary

The codebase is **more mature than requirements document suggests**. Previous sprints (`kinetic-stream-schema-v1`, `kinetic-stream-rendering-v1`, `kinetic-stream-polish-v1`) have already implemented significant infrastructure. The delta between current state and requirements is **smaller than anticipated**, making this sprint a refinement rather than a ground-up build.

**Key Finding:** The discriminated union schema proposed in requirements Part III is partially implemented. The existing `StreamItem` uses a single interface with `type` field but lacks proper TypeScript type narrowing via discriminated unions.

---

## File-by-File Audit

### Core Schema

| File | Claimed State | Actual State | Action |
|------|---------------|--------------|--------|
| `src/core/schema/stream.ts` | "basic" | **109 lines, functional** | ENHANCE |

**Actual Contents:**
- `JourneyPath` interface (navigation) - exists
- `StreamItemType` union: `'query' | 'response' | 'navigation' | 'reveal' | 'system'` - exists
- `RhetoricalSpanType` union: `'concept' | 'action' | 'entity'` - exists
- `RhetoricalSpan` interface with `startIndex`, `endIndex`, `confidence` - exists
- `StreamItem` as single interface with optional fields - exists
- Type guards: `isQueryItem`, `isResponseItem`, `hasSpans`, `hasPaths` - exists
- Conversion utilities: `fromChatMessage`, `toChatMessage` - exists

**GAP:** Requirements Part III specifies a proper discriminated union (`QueryItem | ResponseItem | SystemEventItem | LensRevealItem | JourneyForkItem`). Current implementation uses a single `StreamItem` interface with optional fields, reducing type safety.

**GAP:** Missing types from requirements:
- `CognitiveState` type
- `RhetoricalMap` wrapper interface
- `JourneyFork` vs current `JourneyPath`
- `pivot` field on query items
- `cognitiveTrace` on response items

---

### Engagement Machine

| File | Claimed State | Actual State | Action |
|------|---------------|--------------|--------|
| `src/core/engagement/machine.ts` | "working" | **229 lines, functional** | EXTEND |

**Actual Contents:**
- XState v5 setup with proper types
- Session states: `anonymous` → `lensActive` → `journeyActive` → `journeyComplete`
- Terminal states: `closed` ↔ `open`
- Stream actions: `createQueryItem`, `createResponseItem`, `appendToResponse`, `finalizeResponse`
- Stream events: `START_QUERY`, `START_RESPONSE`, `STREAM_CHUNK`, `FINALIZE_RESPONSE`
- Rhetorical parsing integrated via `parse()` import from `RhetoricalParser.ts`

**GAP:** Requirements Part III.2 specifies new events not yet implemented:
- `USER.CLICK_PIVOT` event
- `USER.SELECT_FORK` event
- `SYSTEM.SENTENCE_COMPLETE` event
- `SYSTEM.COGNITIVE_STATE` event
- `SYSTEM.PARSE_NAVIGATION` event

**GAP:** Context lacks:
- `cognitiveState` field
- Separate states for streaming phases (`considering`, `retrieving`, `synthesizing`, `generating`)

---

### Parsers/Transformers

| File | Claimed State | Actual State | Action |
|------|---------------|--------------|--------|
| `src/core/transformers/RhetoricalParser.ts` | N/A | **97 lines, functional** | VERIFY |
| `src/core/transformers/RhetoricalSkeleton.ts` | "exists" | **67 lines, legacy** | CLARIFY ROLE |

**RhetoricalParser.ts (Primary):**
- `parse(content: string): ParseResult` - works
- Extracts bold text (`**text**`) as `concept` spans
- Extracts arrow prompts (`→ text`) as `action` spans
- Sorts by position, returns `{ spans, content }`
- Used by engagement machine's `finalizeResponse` action

**RhetoricalSkeleton.ts (Legacy):**
- Contains `RHETORICAL_SKELETON` config for hero/problem sections
- Contains `COLLAPSE_SYSTEM_PROMPT` for Reality Collapser
- **Not a parser** - this is prompt/config for content generation

**GAP:** Requirements Part V.1 proposes enhanced `RhetoricalSkeleton.ts` with:
- `ParseOptions` interface with `parseUpTo`, `minConfidence`
- `ConceptPattern` with regex, type, confidence extractor
- `findLastSentenceBoundary` for stable hydration
- Deduplication logic for overlapping spans

**ACTION NEEDED:** Create new `RhetoricalParser.ts` extensions or rename to clarify roles. Current `RhetoricalParser.ts` is the active parser; `RhetoricalSkeleton.ts` is config.

**GAP:** Missing `NavigationParser.ts` entirely (Requirements Part V.2)

---

### Rendering Components

| File | Claimed State | Actual State | Action |
|------|---------------|--------------|--------|
| `components/Terminal/Stream/StreamRenderer.tsx` | "partial" | **120 lines, functional** | MINOR UPDATE |

**Actual Contents:**
- Props: `items`, `currentItem`, `onSpanClick`, `onPathClick`, `onPromptSubmit`, `bridgeState`, callbacks
- AnimatePresence with `popLayout` mode
- `useReducedMotion` accessibility support
- Polymorphic `StreamBlock` switch: `query`, `response`, `navigation`, `system`, `reveal`
- CognitiveBridge inline injection support

**Assessment:** This is 90% complete. The polymorphic routing is working. Missing:
- `onForkSelect` prop (currently uses `onPathClick`)
- `activeItemId` prop for streaming indication (uses `currentItem` instead)

---

| File | Claimed State | Actual State | Action |
|------|---------------|--------------|--------|
| `components/Terminal/Stream/blocks/ResponseBlock.tsx` | "basic" | **105 lines, functional** | ENHANCE |

**Actual Contents:**
- Uses `GlassPanel` with intensity
- Conditional rendering: `LoadingIndicator` → `StreamingText` → `MarkdownRenderer`
- `SpanRenderer` integration when `hasSpans(item)` is true
- Inline `SuggestionChip` rendering for `suggestedPaths`
- Framer Motion variants

**GAP:** Requirements Part IV.2 specifies:
- `CognitiveTraceBar` component
- `NavigationBlock` inline mounting at response bottom
- Ring indicator when `isActive`
- Separate handling of `rhetoric` vs `parsedSpans`

---

| File | Claimed State | Actual State | Action |
|------|---------------|--------------|--------|
| `components/Terminal/Stream/blocks/QueryBlock.tsx` | "functional" | **44 lines, complete** | MINOR UPDATE |

**Actual Contents:**
- Simple glass panel with user query
- Strips `--verbose` flag from display
- Uses `queryVariants` for slide-in animation

**GAP:** Requirements Part IV.1 mentions showing pivot context - not currently implemented.

---

| File | Claimed State | Actual State | Action |
|------|---------------|--------------|--------|
| `components/Terminal/Stream/blocks/NavigationBlock.tsx` | "stubbed" | **48 lines, functional** | ENHANCE |

**Actual Contents:**
- Checks `hasPaths(item)`, returns null if no paths
- Renders `SuggestionChip` for each path
- Uses stagger animation

**GAP:** Requirements Part IV.4 specifies:
- `JourneyFork` type with `deep_dive | pivot | apply` distinction
- Visual hierarchy: primary/secondary/tertiary button variants
- `ForkButton` component with icons per type
- Grouping by fork type

---

| File | Claimed State | Actual State | Action |
|------|---------------|--------------|--------|
| `components/Terminal/Stream/SpanRenderer.tsx` | "exists" | **80 lines, complete** | VERIFY |

**Actual Contents:**
- Takes `content`, `spans`, `onSpanClick`
- Sorts spans by `startIndex`
- Builds segments: alternating plain text and interactive spans
- `SPAN_STYLES` config for `concept`, `action`, `entity`
- Buttons for clickable spans, plain spans for entities

**Assessment:** This is well-implemented. Matches requirements Part IV.3 closely.

**Minor GAP:** No `getLastCompleteSentenceIndex` integration for streaming stability. Currently renders all spans regardless of streaming state.

---

| File | Claimed State | Actual State | Action |
|------|---------------|--------------|--------|
| `components/Terminal/Stream/motion/GlassPanel.tsx` | "CSS missing" | **41 lines, functional** | VERIFY CSS |

**Actual Contents:**
- Three intensity levels: `light`, `medium`, `heavy`
- Forwards motion props
- Uses CSS classes: `glass-panel`, `glass-panel-light`, etc.

**CSS Status (from `styles/globals.css`):**
- Lines 627-651: Glass intensity variants defined with `--glass-blur-local` and `--glass-bg-local`
- `@supports (backdrop-filter)` progressive enhancement
- `.streaming-cursor` class defined

**Assessment:** CSS IS present. The "CSS missing" claim is outdated.

---

### Motion System

| File | Claimed State | Actual State | Action |
|------|---------------|--------------|--------|
| `components/Terminal/Stream/motion/variants.ts` | N/A | **123 lines, complete** | NONE |

**Actual Contents:**
- `blockVariants` - standard entrance/exit
- `queryVariants` - slides from right
- `responseVariants` - slides from left
- `systemVariants` - fade only
- `staggerContainer` + `staggerItem` - for children
- `reducedMotionVariants` - accessibility

**Assessment:** Complete. No gaps.

---

| File | Claimed State | Actual State | Action |
|------|---------------|--------------|--------|
| `components/Terminal/Stream/StreamingText.tsx` | N/A | **104 lines, complete** | NONE |

**Actual Contents:**
- Character-by-character reveal with configurable delay and batch size
- `useReducedMotion` support
- Blinking cursor animation
- `onComplete` callback

**Assessment:** Complete. No gaps.

---

### Legacy Components (Deprecation Candidates)

| File | Claimed State | Actual State | Action |
|------|---------------|--------------|--------|
| `components/Terminal/TerminalChat.tsx` | "legacy rendering" | **111 lines, already migrated** | KEEP |

**Assessment:** This component is **not legacy** - it's the integration layer:
- Converts `ChatMessage[]` to `StreamItem[]` via `fromChatMessage`
- Delegates to `StreamRenderer`
- Handles scroll, bridge state, span clicks
- Already uses the kinetic stream architecture

**STATUS:** Migration ALREADY COMPLETE. No deprecation needed.

---

| File | Claimed State | Actual State | Action |
|------|---------------|--------------|--------|
| `components/Terminal/SuggestionChip.tsx` | "to be replaced" | **31 lines, functional** | DEPRECATE AFTER |

**Assessment:** Still in use by `NavigationBlock` and `ResponseBlock`. Should be replaced by `ForkButton` component per requirements, but not until new navigation system is in place.

---

### CSS Tokens

| Token Namespace | Status | Location |
|-----------------|--------|----------|
| `--glass-*` | **Complete** | `globals.css:556-604` |
| `--chat-concept-*` | **Exists** | `globals.css:1195-1206` |
| `--chat-action-*` | **Exists** | `globals.css:1200-1201` |
| `--neon-*` | **Complete** | `globals.css:569-574` |

**GAP:** Requirements Part VII.1 proposes additional tokens:
- `--fork-primary-bg`, `--fork-secondary-bg`, `--fork-tertiary-border`
- `--stream-cursor-color` (exists as `--streaming-cursor-color`)
- `--stream-pulse-color`

---

## Pattern Alignment Check (Phase 0)

Per PROJECT_PATTERNS.md mandatory check:

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Lens-reactive content | Pattern 1: Quantum Interface | StreamItem types honor lens context via existing hooks |
| State transitions | Pattern 2: Engagement Machine | Extend machine with new events (Part III.2) |
| Structured content | Pattern 3: Narrative Schema | StreamItem follows schema conventions in `src/core/schema/` |
| Component styling | Pattern 4: Token Namespaces | Use `--chat-*` and `--glass-*` tokens |
| Interactive spans | N/A (New) | **New pattern needed** for "semantic content hydration" |
| Journey forks | Pattern 3 + Pattern 8 | Extend JourneyPath to JourneyFork, canonical rendering |

**New Pattern Candidate:** The SpanRenderer + RhetoricalParser system represents a new pattern: **"Semantic Content Hydration"** - transforming plain text into interactive semantic elements via declarative patterns. Should be documented in SPEC.md.

---

## Summary: Claimed vs Actual State

| Asset | Requirements Claim | Actual Reality | Delta |
|-------|-------------------|----------------|-------|
| StreamItem schema | "basic" | Functional, needs discriminated union | 30% work |
| Engagement machine | "working" | Working, needs new events | 20% work |
| RhetoricalSkeleton | "exists" | Wrong file - parser is `RhetoricalParser.ts` | Clarify naming |
| StreamRenderer | "partial" | 90% complete | 10% work |
| ResponseBlock | "basic" | 70% complete | 30% work |
| NavigationBlock | "stubbed" | Functional but needs fork types | 50% work |
| SpanRenderer | "exists" | Complete | 0% work |
| GlassPanel | "CSS missing" | CSS present and working | 0% work |
| TerminalChat | "legacy" | Already migrated to StreamRenderer | No deprecation needed |

---

## Critical Path Assessment

**Blocking Items (must complete first):**
1. Enhance `stream.ts` schema with discriminated union (affects everything)
2. Add missing events to engagement machine (blocks interaction)
3. Create `NavigationParser.ts` (blocks fork rendering)

**Non-Blocking Enhancements:**
- Fork type visual hierarchy (cosmetic)
- Cognitive state visibility (optional feature)
- Pivot context display (enhancement)

---

## Recommended Sprint Restructuring

Based on audit findings, the proposed 3-sprint structure should be **compressed**:

| Original | Revised | Rationale |
|----------|---------|-----------|
| Sprint 1: Schema + Machine + Parsers | Sprint 1: Schema Enhancement + Navigation Parser | Machine mostly done |
| Sprint 2: Polymorphic Renderer | Sprint 1 (merged) | Renderer already exists |
| Sprint 3: Glass Experience | Sprint 2: Fork Types + Polish | Most glass work done |

**Estimated Effort:** 1.5 sprints instead of 3.

---

*Audit complete. Proceed to SPEC.md with adjusted scope.*
