# Grove v0.11 — User Feedback & Enhancement Backlog

## Session Info
- **Date:** 2024-12-19
- **Source:** Live user feedback session with screenshots
- **Status:** Organizing for sprint planning

---

## Bug Fixes (P0)

### BUG-1: "ASK" vs "ASK THE VILLAGE" Inconsistency
**Location:** Various CTA prompts throughout surface page
**Issue:** Some say "ASK", some say "ASK THE VILLAGE"
**Fix:** Standardize all to **"GO DEEPER"**
**Files:** `App.tsx`, `constants.ts` (SECTION_HOOKS), carousel components

### BUG-2: "WHY DOES OWNERSHIP MATTER" Link Broken
**Location:** Surface page, ownership section
**Issue:** Link not functional
**Fix:** Wire up to appropriate Terminal query or section anchor

### BUG-3: Journey Card Language Awkward
**Location:** Terminal journey prompts
**Current:** "This connects to the The $380 Billion Bet sequence. To fully map this dependency, I can switch to a structured path."
**Issue:** Abrupt, out of character, breaks flow
**Fix:** Rewrite to be conversational, in-flow with Grove voice

### BUG-4: Terminal Cannot Be Minimized
**Location:** Terminal component
**Issue:** Once open, Terminal covers site content with no way to minimize
**Fix:** Add minimize button → collapsed bar at bottom (can re-expand)

### BUG-5: Rendering Issues on Smaller Desktops
**Location:** Various
**Issue:** Layout breaks on smaller desktop screens
**Fix:** Document specific breakpoints, add responsive fixes

---

## Copy Edits (P1)

### COPY-1: Section 1 "The Bet" Language Revision
**Location:** `App.tsx` Section 1 (Ratchet/Bet section)
**Current Issue:** Recursive "bet" language loses the reader
**Proposed:**
> "The smart money is building mainframes, and that's fine. The Grove isn't a bet against AI — it's a bet on the fundamentals of network dynamics. We're betting that **distributed, sovereign AI** will emerge to serve an important function and create a better substrate for augmented cognition when working in concert with frontier models, thanks to the Ratchet. We think the Grove makes frontier AI better, safer, and more focused on developing useful solutions for society at large."

**Styling:** "distributed, sovereign AI" = **orange, bold, italic**

### COPY-2: "AI Communities" Section Enhancement
**Proposed:**
> "AI COMMUNITIES THAT LIVE ON YOUR COMPUTER
> They work around the clock to improve their own systems—getting smarter, more efficient, and more useful for *you*."

### COPY-3: Ownership Framing Fix
**Current:** "You're not a user. You're a tenant."
**Issue:** Wrong metaphor — should be "you're the product"
**Fix:** Revise to clarify actual problem

### COPY-4: Benefits Section Voice
**Proposed:**
> "They solve problems. They learn from each other. They document what they discover. And unlike the AI services you use today, you clearly own your Grove, your personal data, and your own knowledge."

### COPY-5: Garden Metaphor
**Proposed:** "Think of the Grove like cultivating your own knowledge garden."

---

## UX Enhancements (P1)

### UX-1: Clickable AI Response Suggestions
**Current:** "Option A" / "Option B" styled orange/bold but not interactive
**Proposed Flow:**
1. System prompt generates tagged suggestions
2. Terminal renders as clickable chips
3. Click sends concept as next query
4. Telemetry logs: concept, context, session
5. Replace "Continue the Journey" cards with inline clickables
6. End of response shows clickable journey prompts

**Telemetry:** Log questions anonymously, analyze for heatmaps

### UX-2: Move Controls Below Query Input
**Current:** Lens picker/journey stats at top (easy to miss)
**Proposed:**
- Move lens picker below text input
- Move journey stats below text input
- "Start Journey" → dropdown/modal with available journeys
- Feature flag in Reality Tuner

### UX-3: Terminal Minimize
**Behavior:**
- Add minimize button (top-right)
- Minimized = collapsed bar at viewport bottom
- Click to re-expand
- Smooth animation

### UX-4: "How It Works" Experience
**Options:**
1. New route `/how-it-works` with guided walkthrough
2. Carousel takeover (elegant viewport experience)
**Goal:** Package The Grove for consumers cohesively

---

## Structural Changes (P2)

### STRUCT-1: Restructure Main Page Flow
**Current:** Mixed problem/solution in single carousel

**Proposed:**
- **"Building Mainframes" (Problem):** Carousel of stakes, concentration, dependency, the flaw
- **"What is The Grove" (Solution):** Carousel of ownership, benefits, network effects

### STRUCT-2: Grove Landing Page Concept
**Audiences:** Home users, corporations, developers
**Key Messages:**
1. What The Grove IS
2. What Gardeners are
3. Exploration Architecture insight
4. Site built on Grove philosophy
5. Future: sell capacity/services back to grid

---

## Feature Flags

| Flag | Description | Default |
|------|-------------|---------|
| journey_dropdown | Start Journey as dropdown modal | OFF |
| clickable_suggestions | Clickable chips in Terminal | ON (when built) |
| terminal_minimize | Minimize functionality | ON (when built) |

---

## Priority Tiers

**v0.11a (Bug Fixes):**
- BUG-1: GO DEEPER standardization
- BUG-2: Ownership link fix
- BUG-4: Terminal minimize

**v0.11b (Copy & UX):**
- COPY-1: Bet language
- UX-2: Controls placement
- UX-3: Terminal minimize

**v0.12 (Interactive):**
- UX-1: Clickable suggestions
- UX-4: How It Works

**v0.13+ (Structural):**
- STRUCT-1: Page restructure
- STRUCT-2: Landing page
