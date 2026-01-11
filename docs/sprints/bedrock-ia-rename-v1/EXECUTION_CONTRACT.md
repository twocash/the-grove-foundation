# Bedrock IA Rename Sprint — Execution Contract

**Codename:** `bedrock-ia-rename-v1`
**Status:** Execution Contract for Claude Code CLI
**Baseline:** `bedrock` branch (verify current commit before starting)
**Date:** January 10, 2026
**Reference:** `docs/architecture/BEDROCK_INFORMATION_ARCHITECTURE.md`

---

## Purpose

Rename Bedrock navigation and routes to align with the Grove metaphor and information architecture:

| Current | New | Rationale |
|---------|-----|-----------|
| Pipeline | **Garden** | Mature corpus that feeds exploration |
| Garden | **Nursery** | Sprouts in cultivation, not yet mature |
| Experiences | **Experience** | Singular — THE configured delivery |

**This document is an execution contract, not a spec.**

---

## Hard Constraints

### Constraint 1: Strangler Fig Compliance

```
┌────────────────────────────────────────────────────────────┐
│  FROZEN ZONE — DO NOT TOUCH                                │
│  ├── /terminal route                                       │
│  ├── /foundation route                                     │
│  ├── /journeys route                                       │
│  ├── /hubs route                                           │
│  ├── src/surface/components/Terminal/*                     │
│  └── src/workspace/*                                       │
├────────────────────────────────────────────────────────────┤
│  ACTIVE BUILD ZONE — This Sprint                           │
│  ├── /bedrock route                                        │
│  ├── src/bedrock/*                                         │
│  └── src/router/routes.tsx (bedrock routes only)           │
└────────────────────────────────────────────────────────────┘
```

**Any file edit in FROZEN ZONE = sprint failure.**

### Constraint 2: Test Routes

```
✅ localhost:3000/bedrock           ← Dashboard
✅ localhost:3000/bedrock/nursery   ← NEW (was /garden)
✅ localhost:3000/bedrock/garden    ← NEW (was /pipeline)
✅ localhost:3000/bedrock/experience ← NEW (was /experiences)

❌ localhost:3000/                   ← DO NOT TEST HERE
❌ localhost:3000/terminal           ← DO NOT TEST HERE
❌ localhost:3000/foundation         ← DO NOT TEST HERE
```

### Constraint 3: Rename Strategy

This is a **rename sprint**, not a rebuild. The approach:

1. **Rename files** — Change filenames to match new terminology
2. **Update imports** — Fix all import paths
3. **Update routes** — Change URL paths
4. **Update nav config** — Change labels and metadata
5. **Preserve functionality** — No feature changes, just names

**If it worked before, it works after. Only the names change.**

---

## Pre-Flight Checklist

Before starting, Claude Code CLI must verify:

```bash
# 1. Correct branch
git branch --show-current
# Expected: bedrock (or create feature branch from it)

# 2. Clean working tree
git status
# Expected: nothing to commit, working tree clean

# 3. Build passes
npm run build
# Expected: no errors

# 4. Tests pass
npm test
# Expected: all pass

# 5. Dev server works
npm run dev
# Verify: localhost:3000/bedrock loads
```

**Gate:** All 5 checks pass before Phase 1.

---

## Execution Architecture

### Phase 0: Create Sprint Infrastructure
```
0a: Create sprint folder and files
    └── ✓ GATE: docs/sprints/bedrock-ia-rename-v1/ exists with DEVLOG.md

0b: Create feature branch
    └── ✓ GATE: On branch feature/bedrock-ia-rename-v1
```

### Phase 1: Audit Current State
```
1a: Document current file locations
    └── ✓ GATE: DEVLOG lists all files to be renamed

1b: Document current routes
    └── ✓ GATE: DEVLOG lists current route → component mappings

1c: Document current nav config
    └── ✓ GATE: DEVLOG captures BEDROCK_NAV_ITEMS and CONSOLE_METADATA
```

### Phase 2: Rename Pipeline → Garden
```
2a: Rename PipelineMonitor.tsx → GardenConsole.tsx
    └── No UI change yet, just file rename

2b: Update all imports referencing PipelineMonitor
    └── grep for "PipelineMonitor", update each

2c: Update route path /bedrock/pipeline → /bedrock/garden
    └── In routes.tsx and nav config

2d: Update nav config labels and metadata
    └── BEDROCK_NAV_ITEMS, CONSOLE_METADATA

2e: Build gate
    └── ✓ GATE: npm run build passes

2f: Visual verification
    └── ✓ GATE: Screenshot localhost:3000/bedrock/garden working
```

### Phase 3: Rename Garden → Nursery
```
3a: Rename GardenConsole.tsx → NurseryConsole.tsx
    └── The OLD GardenConsole (sprout management), not the new one from Phase 2!
    └── ATTENTION: Verify you're renaming the RIGHT file

3b: Update all imports referencing old GardenConsole
    └── grep carefully — don't confuse with Phase 2's new GardenConsole

3c: Update route path /bedrock/garden → /bedrock/nursery
    └── Wait — this conflicts! The OLD /garden becomes /nursery
    └── But Phase 2 made /pipeline become /garden
    └── Order matters: Phase 2 MUST complete first

3d: Update nav config labels and metadata

3e: Build gate
    └── ✓ GATE: npm run build passes

3f: Visual verification
    └── ✓ GATE: Screenshot localhost:3000/bedrock/nursery working
    └── ✓ GATE: Screenshot localhost:3000/bedrock/garden ALSO working (Phase 2)
```

### Phase 4: Rename Experiences → Experience
```
4a: Rename ExperiencesConsole/ → ExperienceConsole/
    └── Directory rename

4b: Rename internal files if needed
    └── Check for "Experiences" in filenames inside the directory

4c: Update all imports

4d: Update route path /bedrock/experiences → /bedrock/experience
    └── Singular, not plural

4e: Update nav config labels and metadata

4f: Build gate
    └── ✓ GATE: npm run build passes

4g: Visual verification
    └── ✓ GATE: Screenshot localhost:3000/bedrock/experience working
```

### Phase 5: Update Navigation Order & Groupings
```
5a: Reorder BEDROCK_NAV_ITEMS to match IA spec
    └── Dashboard
    └── --- (Knowledge Lifecycle)
    └── Nursery
    └── Garden
    └── --- (Cultivation Tools)
    └── Lenses
    └── Prompts
    └── --- (Delivery Configuration)
    └── Experience

5b: Add section dividers if supported by nav component
    └── If not supported, document as future enhancement

5c: Build gate
    └── ✓ GATE: npm run build passes

5d: Visual verification
    └── ✓ GATE: Screenshot showing new nav order
```

### Phase 6: Cleanup & Documentation
```
6a: Search for any remaining old terminology
    └── grep for "Pipeline", "Experiences" (plural), old "Garden" refs

6b: Update any inline comments or documentation

6c: Final build gate
    └── ✓ GATE: npm run build && npm test passes

6d: Full visual verification
    └── ✓ GATE: Screenshots of all renamed routes working:
        - /bedrock (dashboard)
        - /bedrock/nursery
        - /bedrock/garden
        - /bedrock/experience
        - Navigation showing correct order

6e: Update DEVLOG with completion summary
```

---

## File Rename Map

### Before → After

```
src/bedrock/consoles/
├── PipelineMonitor.tsx      →  GardenConsole.tsx
├── GardenConsole.tsx        →  NurseryConsole.tsx
└── ExperiencesConsole/      →  ExperienceConsole/
    └── (internal files TBD during audit)

src/bedrock/config/navigation.ts
└── Update BEDROCK_NAV_ITEMS labels and paths

src/router/routes.tsx
└── Update bedrock child routes
```

### Route Map

| Old Route | New Route |
|-----------|-----------|
| /bedrock/pipeline | /bedrock/garden |
| /bedrock/garden | /bedrock/nursery |
| /bedrock/experiences | /bedrock/experience |

---

## Build Gates

### After Every Sub-Phase
```bash
npm run build
```

### After Every Phase
```bash
npm run build && npm run lint && npm test
```

### Visual Verification Sequence
```bash
npm run dev

# CRITICAL: Test at correct routes!
# ✅ localhost:3000/bedrock/*
# ❌ NOT localhost:3000/ or /terminal

# Take screenshot/GIF → Save to docs/sprints/bedrock-ia-rename-v1/screenshots/
# Update DEVLOG.md
# Update REVIEW.html
# Then commit
```

### Visual Review Page (REQUIRED)

After each phase with visual verification, update `REVIEW.html` and output:

```
📋 Visual Review Updated
   File: C:\GitHub\the-grove-foundation\docs\sprints\bedrock-ia-rename-v1\REVIEW.html
   Open in browser to review progress.
```

---

## Risk Mitigations

| Risk | Mitigation |
|------|------------|
| Rename wrong GardenConsole | Phase 2 creates NEW GardenConsole, Phase 3 renames OLD one. Audit files first. |
| Import path breaks | grep thoroughly before and after each rename |
| Route conflicts during transition | Complete each phase fully before starting next |
| Miss a reference | Phase 6 does global search for old terminology |
| Test at wrong route | Constraint 2 is explicit — /bedrock/* only |

---

## Session Handoff Protocol

If context fills or session ends:

1. Complete current sub-phase if possible
2. Update DEVLOG.md with:
   - Last completed sub-phase
   - Current state of files
   - Any issues encountered
3. Commit work in progress
4. Create CONTINUATION_PROMPT.md

### CONTINUATION_PROMPT Template

```markdown
# Bedrock IA Rename — Continuation

## Instant Orientation
| Field | Value |
|-------|-------|
| **Sprint** | bedrock-ia-rename-v1 |
| **Last Completed** | Phase {X}{sub} |
| **Next Action** | Phase {Y}{sub} |
| **Status** | {emoji + description} |

## Resume Instructions
1. Read DEVLOG.md last 3 entries
2. Run: npm run build && npm test
3. Continue with Phase {Y}{sub}

## Key Context
- Pipeline → Garden: {done/in-progress/pending}
- Garden → Nursery: {done/in-progress/pending}
- Experiences → Experience: {done/in-progress/pending}
```

---

## Success Criteria

### Sprint Complete When:
- [ ] All routes renamed per map
- [ ] All files renamed per map
- [ ] Navigation order matches IA spec
- [ ] Build passes
- [ ] Tests pass
- [ ] All 4 routes visually verified with screenshots
- [ ] No references to old terminology remain
- [ ] FROZEN ZONE untouched
- [ ] DEVLOG documents complete journey

### Sprint Failed If:
- ❌ Any FROZEN ZONE file modified
- ❌ Any phase without visual verification
- ❌ Build fails and not immediately fixed
- ❌ Old route still works (should 404 or redirect)
- ❌ Functionality changes (this is rename only)

---

## Claude Code CLI Instructions

When you receive this contract:

1. **Read fully** before starting
2. **Run pre-flight checklist** — all 5 must pass
3. **Execute phases in order** — no skipping
4. **Commit after each phase** — not each sub-phase
5. **Screenshot every visual verification**
6. **Stop and ask** if anything is unclear

**Commit message format:**
```
refactor(bedrock): rename Pipeline to Garden

- Rename PipelineMonitor.tsx → GardenConsole.tsx
- Update route /bedrock/pipeline → /bedrock/garden
- Update nav config labels

Part of bedrock-ia-rename-v1 sprint
```

---

## Reference Documents

| Document | Purpose | Location |
|----------|---------|----------|
| IA Specification | What the end state should be | docs/architecture/BEDROCK_INFORMATION_ARCHITECTURE.md |
| Execution Protocol | How sprints work | ~/.claude/skills/grove-execution-protocol/SKILL.md |
| This Contract | What to execute | docs/sprints/bedrock-ia-rename-v1/EXECUTION_CONTRACT.md |

---

*This contract is the execution specification. Deviation requires explicit human approval.*
