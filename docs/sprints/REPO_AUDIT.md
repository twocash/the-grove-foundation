# REPO_AUDIT.md — Grove Main Page Voice Revision
**Generated:** 2025-12-19
**Sprint Focus:** Landing page copy revision with Narrator voice + telemetry integration

---

## 1. FRAMEWORK & BUILD

| Aspect | Finding | Citation |
|--------|---------|----------|
| Framework | React 18 with TypeScript | `package.json:1-50` (inferred) |
| Build Tool | Vite | `vite.config.ts` |
| Styling | Tailwind CSS v4 (CSS-based config) | `styles/globals.css:1-6` |
| Routing | Custom admin flag only | `App.tsx:22-27` |
| Entry Point | `index.tsx` → `App.tsx` | `index.tsx`, `App.tsx:1-20` |

---

## 2. SCHEMA / ROSETTA STONE FILES

| File | Purpose | Critical Types |
|------|---------|----------------|
| `src/core/schema/base.ts` | Section IDs, Chat types | `SectionId`, `ChatMessage`, `TerminalState` |
| `src/core/schema/index.ts` | Barrel export for all types | Re-exports from `base`, `narrative`, `engagement`, `lens`, `rag` |
| `types.ts` (root) | Backward compat shim | Re-exports from `src/core/schema` |
| `constants.ts` | Static content, section hooks, initial terminal message | `SECTION_CONFIG`, `SECTION_HOOKS`, `INITIAL_TERMINAL_MESSAGE` |

**SectionId Enum** (`src/core/schema/base.ts:9-18`):
```typescript
export enum SectionId {
  STAKES = 'stakes',
  RATCHET = 'ratchet',
  WHAT_IS_GROVE = 'what_is_grove',
  ARCHITECTURE = 'architecture',
  ECONOMICS = 'economics',
  DIFFERENTIATION = 'differentiation',
  NETWORK = 'network',
  GET_INVOLVED = 'get_involved'
}
```

---

## 3. SURFACE vs ADMIN BOUNDARY

| Concern | Location | Notes |
|---------|----------|-------|
| Admin detection | `App.tsx:22-27` | `?admin=true` query param |
| Admin dashboard | `App.tsx:85-211` | `AdminDashboard` component |
| Surface (public) | `App.tsx:213-652` | Main landing page sections |

**Admin Console Tabs:** Narrative Engine, Flags, Topic Hubs, Audio, RAG, Engagement

---

## 4. KEY COMPONENTS TO MODIFY

| Component | File | Lines | Purpose |
|-----------|------|-------|---------|
| Hero Section | `App.tsx` | 246-282 | Stakes/hero content |
| Ratchet Section | `App.tsx` | 286-327 | The Ratchet thesis |
| WhatIsGroveCarousel | `components/WhatIsGroveCarousel.tsx` | 1-330 | 6-slide carousel |
| Architecture Section | `App.tsx` | 330-358 | Architecture content |
| Economics Section | `App.tsx` | 361-386 | Economics content |
| Differentiation Section | `App.tsx` | 389-450 | Tool vs Staff |
| Network Section | `App.tsx` | 453-513 | Knowledge Commons |
| Get Involved Section | `App.tsx` | 516-575 | CTAs |
| PromptHooks | `components/PromptHooks.tsx` | 1-101 | Entry points to Terminal |
| Terminal Initial | `constants.ts` | 57-68 | Welcome message |

---

## 5. STATIC CONTENT LOCATIONS

### SECTION_CONFIG (`constants.ts:3-26`)
Maps `SectionId` to title and prompt hint. **NOT MODIFIED** in this sprint—used only for section navigation hints.

### SECTION_HOOKS (`constants.ts:28-90`)
**PRIMARY CONTENT TARGET.** Static fallback hooks when no narrative nodes exist.

Structure:
```typescript
export const SECTION_HOOKS = {
  [SectionId.STAKES]: [
    { text: "Display text", prompt: "Full prompt for Terminal" },
    ...
  ],
  ...
};
```

### INITIAL_TERMINAL_MESSAGE (`constants.ts:92-102`)
Welcome message shown when Terminal opens.

---

## 6. TELEMETRY / ANALYTICS SYSTEM

| File | Purpose |
|------|---------|
| `utils/funnelAnalytics.ts` | Event tracking utilities |
| `types/lens.ts` | `FunnelEventType` enum |

**Existing Hook Tracking:** None explicitly for prompt hooks.

**Gap Identified:** `handlePromptHook` in `App.tsx` opens Terminal but doesn't fire telemetry.

**Existing Patterns to Follow:**
- `trackLensActivated(lensId, isCustom)` (`funnelAnalytics.ts:103-105`)
- `trackJourneyCompleted(archetypeId, cardsVisited, minutesActive)` (`funnelAnalytics.ts:155-162`)

---

## 7. DESIGN TOKENS (preserved)

**Surface Tokens** (`styles/globals.css:12-25`):
- `--color-paper: #FBFBF9` — Background
- `--color-ink: #1C1C1C` — Primary text
- `--color-ink-muted: #575757` — Secondary text
- `--color-grove-forest: #2F5C3B` — Accent green
- `--color-grove-clay: #D95D39` — Accent orange

**Fonts** (`styles/globals.css:50-55`):
- `--font-serif: 'Lora'` — Body text
- `--font-display: 'Playfair Display'` — Headlines
- `--font-mono: 'JetBrains Mono'` — Code/labels

---

## 8. MIGRATION HAZARDS

| Hazard | Risk | Mitigation |
|--------|------|------------|
| Carousel content hardcoded in TSX | Medium | Content lives in JSX, not external config. Must edit TSX directly. |
| `SECTION_HOOKS` prompts are long | Low | They're meant to be full prompts for Terminal. Preserve structure. |
| PromptHooks dual-source pattern | Medium | Uses narrative nodes if available, falls back to static. Must preserve both paths. |
| No existing hook telemetry | Low | Adding new events; no breaking change. |

---

## 9. FILES NOT FOUND / SEARCH TERMS

All expected files located. No "not found" items.

---

## 10. DEPENDENCIES

| Package | Purpose | Breaking Risk |
|---------|---------|---------------|
| `tailwindcss` | Styling | None (CSS-in-CSS config) |
| `vite` | Build | None |
| `react` | UI | None |

---

## REPO AUDIT STATUS: COMPLETE ✓
