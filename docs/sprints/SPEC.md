# SPEC.md — Grove Main Page Voice Revision
**Generated:** 2025-12-19
**Sprint Count:** 1 (mostly additive, low-risk)

---

## A. GOALS

1. **Rewrite landing page copy** using the Grove Narrator voice (Econ + Architect + Story)
2. **Tighten section headlines** for immediate comprehension
3. **Refine prompt hooks** as Terminal entry points with better display text and richer queries
4. **Add telemetry** for prompt hook clicks to measure page-to-Terminal conversion
5. **Update Terminal initial message** to match Narrator tone

## NON-GOALS

- No structural layout changes (carousel, split-screen, etc. preserved)
- No component refactoring
- No new features (custom lens, journey system untouched)
- No build/deploy changes
- No admin console changes

---

## B. CURRENT STATE INVENTORY

### B.1 Hero Section (`App.tsx:246-282`)

**Current Headline:**
```
The $380 Billion Bet
Against You.
```

**Current Lead:**
> "Microsoft, Google, Amazon, and Meta are spending $380 billion this year to build AI infrastructure designed to be rented, not owned."

**Source:** `App.tsx:257-259`

### B.2 Ratchet Section (`App.tsx:286-327`)

**Current Headline:**
```
They're Building Mainframes.
```

**Current Body:** Four paragraphs explaining the Ratchet thesis.

**Source:** `App.tsx:293-311`

### B.3 What Is Grove Carousel (`components/WhatIsGroveCarousel.tsx:11-228`)

**Current Slides:**
1. "AI communities that live on your computer" (Slide 1, lines 12-37)
2. "Adapt" message from tech leaders (Slide 2, lines 38-65)
3. "Horses don't lead revolutions" (Slide 3, lines 66-86)
4. "Who owns the infrastructure" (Slide 4, lines 87-123)
5. "Capital distribution" three pillars (Slide 5, lines 124-163)
6. "Growing a garden" metaphor (Slide 6, lines 164-196)

### B.4 Section Content (`App.tsx:330-575`)

| Section | Lines | Current Headline |
|---------|-------|------------------|
| Architecture | 330-358 | "Distributed Computing Won Once..." |
| Economics | 361-386 | "A Business Model Designed to Disappear" |
| Differentiation | 389-450 | "Tool vs. Staff" |
| Network | 453-513 | "A Civilization That Learns" |
| Get Involved | 516-575 | "Join the Network" |

### B.5 Prompt Hooks (`constants.ts:28-90`)

**Structure per section:**
```typescript
[SectionId.STAKES]: [
  { text: "Where does $380 billion actually come from?", prompt: "..." },
  { text: "Why is 'rented, not owned' a problem?", prompt: "..." }
]
```

**Current counts:**
- STAKES: 2 hooks
- RATCHET: 2 hooks
- WHAT_IS_GROVE: 2 hooks
- ARCHITECTURE: 2 hooks
- ECONOMICS: 2 hooks
- DIFFERENTIATION: 2 hooks
- NETWORK: 2 hooks
- GET_INVOLVED: 1 hook

### B.6 Terminal Initial Message (`constants.ts:92-102`)

```typescript
export const INITIAL_TERMINAL_MESSAGE = `Welcome to the Terminal.

The Grove's core thesis—distributed AI infrastructure as an alternative to centralized compute—is mapped here. We've indexed the White Paper and Technical Deep Dives.

You might start with:
→ What is the Grove, and what problem does it solve?
→ The Ratchet Effect: why local hardware catches up
→ How agents earn their own cognitive enhancement

Or ask anything. The map will emerge.`;
```

### B.7 Telemetry Gap

**Current:** `handlePromptHook` in `App.tsx:87-90` opens Terminal but fires no analytics.

```typescript
const handlePromptHook = (data: { nodeId?: string; display: string; query: string }) => {
  setTerminalState(prev => ({ ...prev, isOpen: true }));
  setExternalQuery(data);
};
```

**No existing `trackPromptHookClicked` function.**

---

## C. TARGET ARCHITECTURE

No architectural changes. This is a content revision sprint.

**Data Flow (unchanged):**
```
User clicks hook → handlePromptHook() → Terminal opens → externalQuery processed
```

**With telemetry added:**
```
User clicks hook → trackPromptHookClicked() → handlePromptHook() → Terminal opens
```

---

## D. MIGRATION PLAN

### D.1 File Changes

| File | Change Type | Scope |
|------|-------------|-------|
| `App.tsx` | Content edit | Sections 1-8 copy |
| `components/WhatIsGroveCarousel.tsx` | Content edit | 6 slides copy |
| `constants.ts` | Content edit | `SECTION_HOOKS`, `INITIAL_TERMINAL_MESSAGE` |
| `utils/funnelAnalytics.ts` | Addition | New `trackPromptHookClicked` function |

### D.2 New Telemetry Event

**Add to `utils/funnelAnalytics.ts`:**

```typescript
export const trackPromptHookClicked = (data: {
  sectionId: string;
  hookText: string;
  nodeId?: string;
}): void => {
  trackFunnelEvent('prompt_hook_clicked', {
    sectionId: data.sectionId,
    hookText: data.hookText,
    nodeId: data.nodeId || null,
    source: 'landing_page'
  });
};
```

### D.3 Hook Handler Update

**Modify `App.tsx:87-90`:**

```typescript
const handlePromptHook = (data: { nodeId?: string; display: string; query: string }, sectionId?: SectionId) => {
  trackPromptHookClicked({
    sectionId: sectionId || 'unknown',
    hookText: data.display,
    nodeId: data.nodeId
  });
  setTerminalState(prev => ({ ...prev, isOpen: true }));
  setExternalQuery(data);
};
```

---

## E. ACCEPTANCE CRITERIA

### E.1 Functional

| AC# | Requirement | Verification |
|-----|-------------|--------------|
| AC-1 | Hero headline reads "Against Ownership" | Visual inspection |
| AC-2 | All 8 sections updated per revision doc | Visual inspection |
| AC-3 | Carousel 6 slides updated per revision doc | Manual scroll through |
| AC-4 | `SECTION_HOOKS` updated in `constants.ts` | Code review |
| AC-5 | `INITIAL_TERMINAL_MESSAGE` updated | Terminal open check |
| AC-6 | Prompt hook clicks fire telemetry | Console.log in dev mode |
| AC-7 | No TypeScript errors | `npm run build` passes |

### E.2 Visual

| AC# | Requirement | Verification |
|-----|-------------|--------------|
| AC-8 | Paper aesthetic preserved | Visual inspection |
| AC-9 | Font hierarchy unchanged | Visual inspection |
| AC-10 | Carousel transitions work | Manual navigation |

---

## F. TEST PLAN

### F.1 Manual Tests

1. **Page Load Test** — Navigate to `/`, verify hero renders with new headline
2. **Carousel Test** — Click through all 6 slides, verify content
3. **Hook Click Test** — Open DevTools, click hook, verify analytics log
4. **Terminal Initial Test** — Open Terminal, verify new message

### F.2 Build Verification

```bash
npm run build
# Expect: No errors, no TypeScript failures
```

---

## SPEC STATUS: COMPLETE ✓
