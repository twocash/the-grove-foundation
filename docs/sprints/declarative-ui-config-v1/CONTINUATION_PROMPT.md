# Continuation Prompt: Declarative UI Config v1

**Last Updated:** 2024-12-24
**Status:** 📋 Ready for Execution
**Project:** The Grove Foundation
**Path:** `C:\GitHub\the-grove-foundation`

---

## Quick Context

This sprint extends the existing Quantum Interface to make more UI touchpoints lens-reactive. **No new infrastructure**—just adding fields to existing types and wiring more components.

The persona/lens system already works. We're expanding what it controls.

---

## User Story

**As a** Grove operator  
**I want** more UI elements to respond to lens/persona selection  
**So that** CTA labels, placeholders, and nav labels adapt automatically

---

## What We're Doing

| Task | Location | Est. |
|------|----------|------|
| Extend LensReality type | `src/core/schema/narrative.ts` | 15 min |
| Update SUPERPOSITION_MAP | `src/data/quantum-content.ts` | 30 min |
| Wire HeroHook CTA | `src/surface/components/genesis/HeroHook.tsx` | 15 min |
| Wire Terminal placeholder | `components/Terminal/CommandInput/*` | 15 min |
| Wire Foundation nav (optional) | sidebar component | 20 min |
| Test & commit | — | 15 min |
| **Total** | | **~2 hours** |

---

## What We're NOT Doing

- ~~New useAudienceConfig hook~~ — use existing useQuantumInterface
- ~~New JSON config files~~ — use existing SUPERPOSITION_MAP
- ~~New persona types~~ — extend existing personas

---

## Execution

### For Claude Code CLI

```bash
cd C:\GitHub\the-grove-foundation
cat docs/sprints/declarative-ui-config-v1/EXECUTION_PROMPT.md
```

---

## Success Criteria

- [ ] LensReality type has `navigation`, `foundation` fields
- [ ] 3+ personas updated with new fields
- [ ] CTA label changes when lens changes
- [ ] Terminal placeholder changes when lens changes
- [ ] `npm run build` succeeds
- [ ] Existing lens functionality preserved

---

## Files to Modify

| File | Change |
|------|--------|
| `src/core/schema/narrative.ts` | Add optional fields to LensReality |
| `src/data/quantum-content.ts` | Add navigation/foundation to personas |
| `src/surface/components/genesis/HeroHook.tsx` | Read CTA from reality |
| `components/Terminal/CommandInput/*` | Read placeholder from reality |

---

## Handoff for Claude Code

```
Read C:\GitHub\the-grove-foundation\docs\sprints\declarative-ui-config-v1\EXECUTION_PROMPT.md

Execute the sprint following the phases. This is a schema extension + wiring sprint—no new systems, just extending the existing Quantum Interface pattern.
```
