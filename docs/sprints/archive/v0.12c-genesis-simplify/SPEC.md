# v0.12c Genesis Simplify — Specification

## Overview
Simplify Genesis screens and Terminal welcome flow for clarity, readability, and narrative coherence. Remove over-engineered animations, add first-time welcome message, and standardize CTA copy.

## Goals
1. **Simplify ProductReveal headline** — Static text, no animation, "YOUR GROVE" in orange
2. **Add Terminal welcome message** — First-time users see contextual intro before LensPicker
3. **Standardize CTA copy** — "Consult the Grove" across all Genesis screens
4. **Reorder Foundation buttons** — Vision → Ratchet → Economics (narrative arc)
5. **Remove non-functional animation code** — Clean up any rain/particle effects
6. **Redesign Lens selector as pill** — [🔎 Lens Name ▾] format, matches Scholar Mode toggle

## Non-Goals
- Adding new features to Terminal
- Changing LensPicker modal functionality
- Modifying the chat API or backend
- Creating new components (except minor refactors)
- Changing color palette or typography

## Current State Inventory

### ProductReveal Headline
- **Location:** `src/surface/components/genesis/ProductReveal.tsx:115-156`
- **Current:** Complex 6-phase animation with blur, opacity, absolute positioning
- **Issue:** Illegible at completion, too fast, over-engineered

### ProductReveal CTA
- **Location:** `src/surface/components/genesis/ProductReveal.tsx:189-196`
- **Current:** "See it in action"
- **Issue:** Vague, doesn't name the product

### AhaDemo CTA
- **Location:** `src/surface/components/genesis/AhaDemo.tsx:78-83`
- **Current:** "Go deeper"
- **Issue:** Vague

### Foundation CTAs
- **Location:** `src/surface/components/genesis/Foundation.tsx:78-107`
- **Current Order:** Ratchet → Economics → Vision
- **Current Main CTA:** "Explore"
- **Issue:** Order doesn't follow narrative arc, main CTA vague

### Terminal Welcome
- **Location:** `components/Terminal.tsx:348-395`
- **Current:** Shows LensPicker immediately
- **Issue:** No context, no explanation of what Grove is

### TerminalControls Lens Selector
- **Location:** `components/Terminal/TerminalControls.tsx:32-48`
- **Current:** Colored dot + label + small arrow (↔)
- **Issue:** Doesn't look clickable, colored dot is cryptic

## Target State

### ProductReveal Headline
- **Desired:** Static headline "STEP INTO YOUR GROVE"
- **Styling:** "STEP INTO " in grove-forest, "YOUR GROVE" in grove-clay (orange)
- **Animation:** None (simple fade-in with section)

### ProductReveal CTA
- **Desired:** "Consult the Grove"

### AhaDemo CTA
- **Desired:** "Consult the Grove"

### Foundation CTAs
- **Desired Order:** Vision → Ratchet → Economics
- **Main CTA:** "Consult the Grove"

### Terminal Welcome
- **Desired:** Before LensPicker, inject welcome message into chat:

```
Welcome to your Grove.

This Terminal is where you interact with your AI village — trained on your data, running on your hardware, owned by you.

Think of it as ChatGPT, but private. Your Grove never leaves your machine. That's intellectual independence: AI that enriches you, not corporate shareholders.

One thing to try: Lenses let you explore the same knowledge from different perspectives — skeptic, enthusiast, or your own custom view.
```

Then show LensPicker card with options:
- [Try an existing Lens]
- [Create your own]

### TerminalControls Lens Selector
- **Desired:** Pill button format: `[🔎 Lens Name ▾]`
- **Styling:** Border pill matching "ENABLE SCHOLAR MODE" toggle
- **Affordance:** Magnifying glass + chevron-down = obviously clickable
- **No colored dot**

## Acceptance Criteria

### Functional
- [ ] AC-1: ProductReveal headline displays "STEP INTO YOUR GROVE" without animation glitches
- [ ] AC-2: "YOUR GROVE" renders in grove-clay orange color
- [ ] AC-3: First-time Terminal shows welcome message before LensPicker
- [ ] AC-4: Welcome only shows once (uses localStorage)
- [ ] AC-5: LensPicker appears after welcome message
- [ ] AC-6: Foundation buttons ordered: Vision, Ratchet, Economics
- [ ] AC-7: Lens selector displays as pill with 🔎 and ▾

### Visual
- [ ] AC-8: Headline is immediately readable (no animation artifacts)
- [ ] AC-9: Orange "YOUR GROVE" matches clickable bold text styling
- [ ] AC-10: Welcome message is properly formatted in chat
- [ ] AC-11: Lens pill has visible border and hover state

### Technical
- [ ] AC-12: Build completes without errors
- [ ] AC-13: No console errors in browser
- [ ] AC-14: No unused animation code in ProductReveal

## Dependencies
- None — all changes are to existing components

## Risks
- **Welcome message timing:** Must appear before LensPicker, not simultaneously
- **localStorage state:** Must not break existing users who have already welcomed
