# Specification — Kinetic Cultivation v1

**Sprint:** `kinetic-cultivation-v1`  
**Status:** Ready for Execution  
**Duration:** 5 days  
**Date:** 2024-12-29

---

## Executive Summary

Transform the Kinetic Stream from consumption interface to **cultivation interface**. Users capture insights as Sprouts through direct manipulation, watch them materialize as objects, and see them land in a persistent Tray—closing the feedback loop instantly.

**Core Innovation:** The Sprout Tray creates **object permanence**. Users see their insight become a thing and land in a place.

---

## Goals

### Primary
Enable text selection → Sprout capture with full provenance in Kinetic Stream

### Secondary
Provide keyboard shortcuts for power users (Cmd+L, Cmd+J, Cmd+S, Cmd+/)

### Tertiary
Establish Selection Action pattern as foundation for future direct manipulation features

---

## Non-Goals

- Full Garden UI (Tray IS the MVP Garden)
- Sprout lifecycle beyond `tender`/`planted`
- Agent validation of Sprouts
- Cloud sync / server storage
- Mobile selection support
- Sprout connections/linking
- AI-assisted tagging

---

## Acceptance Criteria

| # | Criterion | Verification Method |
|---|-----------|---------------------|
| 1 | User can select text in Kinetic Stream messages | Manual test |
| 2 | Magnetic Pill appears at selection end without position flash | Visual inspection |
| 3 | Pill scales up on mouse proximity (magnetic effect) | Animation inspection |
| 4 | Capture Card expands from pill with smooth layoutId transition | Animation inspection |
| 5 | Active lens auto-captured in Sprout provenance | Check stored data |
| 6 | Active journey auto-captured (if applicable) | Check stored data |
| 7 | Message ID captured for source attribution | Check stored data |
| 8 | Tags can be added via comma or Enter | Manual test |
| 9 | "Plant Sprout" creates Sprout in store | Check Zustand state |
| 10 | Flight animation: card → orb → tray | Visual inspection |
| 11 | Tray counter badge springs on increment | Animation inspection |
| 12 | Sprouts persist across page refresh | localStorage check |
| 13 | Cmd+S triggers capture when selection exists | Keyboard test |
| 14 | Cmd+S shows toast when no selection | Keyboard test |
| 15 | Cmd+L opens LensPicker with visual feedback | Keyboard test |
| 16 | Cmd+J opens JourneyBrowser with visual feedback | Keyboard test |
| 17 | Cmd+/ shows KeyboardHUD overlay | Keyboard test |
| 18 | ESC or any key dismisses KeyboardHUD | Keyboard test |
| 19 | Sprout can be deleted from Tray with undo | Manual test |
| 20 | All animations maintain 60fps | DevTools performance |

---

## Patterns Extended

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Lens context capture | P1: Quantum Interface | Read `activeLens` from `useQuantumInterface` hook |
| Sprout as GroveObject | P7: Object Model | Sprout implements `GroveObjectMeta` interface |
| Sprout card display | P7: Object Model | Add `sprout` type to renderer map |
| Card styling | P4: Token Namespaces | Use `--card-*` tokens for SproutCard |
| Tray styling | P4: Token Namespaces | Add `--tray-*` tokens to namespace |

---

## New Patterns Proposed

### Selection Action Pattern

**Why existing patterns are insufficient:**

No existing pattern handles direct manipulation of rendered content (text selection → action). This is fundamentally different from:
- Quantum Interface (content reactivity, not content capture)
- Engagement Machine (state transitions, not DOM interaction)
- Object Model (object operations, not selection detection)

**DEX Compliance:**

| Pillar | How This Pattern Honors It |
|--------|---------------------------|
| **Declarative Sovereignty** | Selection actions to be defined in config (future sprint) |
| **Capability Agnosticism** | Works regardless of what generated the content |
| **Provenance** | Captured content includes sourceId, sourceType, contextSpan |
| **Organic Scalability** | Pattern works for Sprouts now, extensible to annotations later |

**MVP Implementation:** Single hardcoded "Sprout" action in `sprout-capture.config.ts`, structured for future JSON extraction.

---

## Declarative Extraction Roadmap

### Current State (This Sprint)

| Capability | Implementation | Location |
|------------|----------------|----------|
| Selection actions | Single hardcoded action | `config/sprout-capture.config.ts` |
| Capture schema | TypeScript interface | `src/core/schema/sprout.ts` |
| Growth stages | Type definition | `src/core/schema/sprout.ts` |
| Default values | Inline in config | `config/sprout-capture.config.ts` |

### Target State (Future Sprint: `sprout-declarative-v1`)

| Capability | Implementation | Location |
|------------|----------------|----------|
| Selection actions | JSON config, engine interprets | `data/sprout-actions.json` |
| Capture schema | JSON schema, validator enforces | `data/sprout-schema.json` |
| Growth stages | Config-driven with transitions | `data/sprout-stages.json` |
| Default values | Per-deployment config | `data/sprout-defaults.json` |

### Extraction Triggers

- **2+ selection actions needed** → Extract action config to JSON
- **Non-engineers need to modify stages** → Extract stage config
- **Deploying to different domains** → Full schema extraction
- **A/B testing capture flows** → Config-driven variants

### Files Marked for Extraction

```
TEMPORARY (extract in future sprint):
├── src/features/kinetic/config/sprout-capture.config.ts
│   └── → data/sprout-actions.json
├── src/core/schema/sprout.ts (stage definitions)
│   └── → data/sprout-stages.json
```

---

## Technical Constraints

### Animation Requirements

- All animations must be **interruptible** (per WWDC 2018 Fluid Interfaces)
- Use `useLayoutEffect` for selection positioning (prevent 1-frame flash)
- Spring physics: `stiffness: 400-500, damping: 25-35`
- Flight animation: ~500ms bezier curve
- Counter spring: `stiffness: 500, damping: 15`

### Styling Requirements

- Glass-inspired aesthetic throughout
- Use existing `--card-*` tokens for SproutCard
- New `--tray-*` tokens for drawer
- Tray: 48px collapsed, 240px expanded
- Right edge positioning (no bottom placement)

### Data Requirements

- Sprout provenance must include: sourceId, sourceType, lensId
- Context span: surrounding paragraph for future "go back to source"
- Backward compatibility with existing `/sprout` Terminal command
- localStorage persistence via Zustand persist middleware

---

## Dependencies

| Dependency | Required For | Status |
|------------|--------------|--------|
| Framer Motion | Animations, layoutId | ✓ Installed |
| Zustand | State management | ✓ Installed |
| KineticStream | Selection container | ✓ Exists |
| useQuantumInterface | Lens context | ✓ Exists |
| useEngagement | Journey context | ✓ Exists |

---

## Success Metrics

### Qualitative

- Does the pill feel magnetic (drawn to cursor)?
- Does the flight animation create "I made a thing" feeling?
- Is the Tray discoverable without being intrusive?

### Quantitative

- Capture flow < 3 seconds (selection → sprout in tray)
- Animation budget: 60fps throughout
- Zero 1-frame position flashes
- Zero localStorage errors

---

## Out of Scope (Explicit)

1. **Garden View** — Tray is MVP; full Garden is separate sprint
2. **Stage Progression** — Only `tender`/`planted` for now
3. **Cloud Sync** — localStorage only; sync is future
4. **Mobile** — Desktop selection only; mobile is different UX
5. **AI Tagging** — Manual tags only; AI assist is future
6. **Sprout Linking** — No connections between sprouts yet

---

*Specification complete. See ARCHITECTURE.md for component design.*
