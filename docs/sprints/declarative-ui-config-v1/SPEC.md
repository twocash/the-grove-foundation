# SPEC: Declarative UI Config v1

**Sprint:** Declarative UI Config v1
**Status:** 📋 Ready for Execution
**Estimated Time:** 2 hours
**Created:** 2024-12-24

---

## User Story

**As a** Grove operator configuring experiences for different audiences
**I want** more UI touchpoints to respond to lens/persona selection
**So that** the entire experience adapts declaratively without code changes

**Examples:**
- Lens selection already changes headline, subhead (works today)
- **NEW:** Lens selection also changes CTA labels, nav labels, placeholders

---

## Problem Statement

The Quantum Interface (`useQuantumInterface`, `LensReality`, `SUPERPOSITION_MAP`) already handles lens-reactive content for hero and problem sections. However:

1. **Limited touchpoints** — Only hero, problem, and terminal sections respond to lens
2. **Hardcoded elsewhere** — CTA buttons, nav labels, placeholders are static

---

## Solution: Extend Existing Pattern

**Don't create new infrastructure.** Extend what exists:

1. Add optional fields to `LensReality` type
2. Update `SUPERPOSITION_MAP` entries with new fields
3. Wire more components to read from `useQuantumInterface`

---

## Scope

### In Scope

1. **Extend LensReality type** — Add `navigation`, `foundation` fields
2. **Update SUPERPOSITION_MAP** — Add new fields to existing personas
3. **Wire 3-4 new touchpoints** — CTA, placeholder, nav labels

### Out of Scope

- New hooks or providers
- New JSON config files
- New persona types
- Theme/color tokens

---

## Schema Extension

### Current LensReality

```typescript
interface LensReality {
  hero: HeroContent;
  problem: TensionContent;
  terminal?: TerminalWelcome;
}
```

### Extended LensReality

```typescript
interface LensReality {
  // EXISTING - preserve
  hero: HeroContent;
  problem: TensionContent;
  terminal?: TerminalWelcome;
  
  // NEW - all optional for backward compat
  navigation?: {
    ctaLabel?: string;      // "Begin" | "Access Research" | "Start Building"
    ctaSubtext?: string;    // Optional subtext under CTA
    skipLabel?: string;     // "Skip intro" | "Jump to Terminal"
  };
  foundation?: {
    sectionLabels?: {
      explore?: string;     // "Explore" | "Research" | "Architecture"
      cultivate?: string;   // "Cultivate" | "Methodology" | "Implementation"
      grove?: string;       // "Grove Project" | "Infrastructure" | "System"
    };
  };
}
```

---

## Touchpoints to Wire

| Component | Current | Config-Driven |
|-----------|---------|---------------|
| HeroHook headline | ✅ Quantum Interface | Already works |
| HeroHook CTA | Hardcoded "Begin" | `reality.navigation?.ctaLabel` |
| Terminal prompts | ✅ Quantum Interface | Already works |
| Terminal placeholder | Hardcoded | `reality.terminal?.placeholder` |
| Foundation nav labels | Hardcoded | `reality.foundation?.sectionLabels` |

---

## Success Criteria

- [ ] LensReality type extended (backward compatible)
- [ ] At least 3 personas updated with new fields
- [ ] CTA label changes when lens changes
- [ ] Existing lens functionality preserved
- [ ] `npm run build` succeeds

---

## References

- `src/data/quantum-content.ts` — SUPERPOSITION_MAP
- `src/surface/hooks/useQuantumInterface.ts` — Existing hook
- `src/core/schema/narrative.ts` — LensReality type
