# Execution Prompt: 4D-Docs Terminology Update

**Sprint:** 4D-Docs: Terminology Documentation Update
**Type:** Documentation cleanup (NO code changes)
**Risk:** Low
**Effort:** Small (2-4 hours)
**Status:** Ready for Execution

---

## Sprint Contract

### Pre-Flight Checklist

Before making any changes:

- [ ] Read this entire document
- [ ] Read the terminology mapping table below
- [ ] Verify you can access all target files

### Execution Rules

1. **Documentation Only** — NO code changes, NO TypeScript files
2. **Preserve Meaning** — Update terms but keep the explanations accurate
3. **Historical Context** — Sprint docs in `docs/sprints/` can keep old terms for historical accuracy
4. **No Scope Creep** — Only update terminology, don't rewrite content

### Definition of Done

- [ ] All 4 target files updated
- [ ] New reference doc created
- [ ] No broken links introduced
- [ ] Commit with message: `docs(4d): Update terminology to 4D Experience Model`

---

## Terminology Mapping

**CRITICAL: Memorize this mapping before editing.**

| Old Term | New Term | Short Label |
|----------|----------|-------------|
| **Hub** | **Experience Path** | Path |
| **Journey** | **Experience Sequence** | Sequence |
| **Node** | **Experience Moment** | Moment |
| **Topic Hub** | **Cognitive Domain** | Domain |
| **hubId** | **pathId** or **domainId** | - |
| **journeyId** | **sequenceId** | - |
| **nodeId** | **momentId** | - |

### Writing Style

```markdown
<!-- OLD (deprecated) -->
The user navigates through **hubs** and **journeys** to reach **nodes**.

<!-- NEW (preferred) -->
The user follows **experience paths** through **cognitive domains**,
encountering **moments** shaped by their active lens.
```

---

## Tasks

### Task 1: Update DESIGN_SYSTEM.md

**File:** `docs/design-system/DESIGN_SYSTEM.md`

**Instructions:**
1. Search for: `hub`, `journey`, `node`, `Hub`, `Journey`, `Node`
2. Replace with appropriate 4D terms per mapping table
3. Preserve any code examples that reference actual variable names (those are code, not docs)

### Task 2: Audit UI_VISION_LIVING_GLASS.md

**File:** `docs/design-system/UI_VISION_LIVING_GLASS.md`

**Instructions:**
1. Search for deprecated terms
2. Update conceptual references to use 4D terminology
3. Keep the design vision intact — only update terminology

### Task 3: Update CLAUDE.md

**File:** `CLAUDE.md` (root of repository)

**Instructions:**
1. Search for deprecated terminology in descriptive text
2. Update to 4D terms
3. **DO NOT** change:
   - Code examples (those reference actual code)
   - File paths
   - Variable names in type definitions
4. Focus on prose descriptions and conceptual explanations

### Task 4: Create 4D Reference Document

**File:** `docs/4D_EXPERIENCE_MODEL.md` (NEW FILE)

**Instructions:**
Create a new reference document with this structure:

```markdown
# 4D Experience Model Reference

> Canonical terminology for Grove Foundation's experience architecture.

## Overview

The 4D Experience Model replaces the MVP terminology (Hub/Journey/Node) with
a more expressive vocabulary that reflects the declarative nature of Grove's
experience architecture.

## Terminology

| Term | Definition | Replaces |
|------|------------|----------|
| **Experience Path** | The declarative route through content | Hub |
| **Experience Sequence** | Ordered collection of experiences | Journey |
| **Experience Moment** | Single interaction point | Node |
| **Cognitive Domain** | Knowledge area for routing | Topic Hub |

## Cognitive Routing

The unified provenance model:

| Field | Description |
|-------|-------------|
| `path` | Experience path taken |
| `prompt` | Active prompt/mode |
| `inspiration` | Triggering context |
| `domain` | Cognitive domain (optional) |

## Usage Guidelines

- Use **full terms** in user-facing documentation
- Use **short labels** (Path, Sequence, Moment, Domain) in code comments
- Use **camelCase** for identifiers: `experiencePath`, `sequenceId`, `momentId`

## Migration Notes

Legacy code may still use old terminology. When displaying provenance:
- Transform `hub` → `domain`
- Transform `journey` → `path` (conceptually, the sequence name)
- Transform `node` → `moment`

---

*4D Experience Model v1.0*
```

---

## Files Already Updated (Do Not Touch)

These files have already been migrated:

- `docs/design-system/SPROUT_FINISHING_ROOM_WIREFRAME.md` ✅
- `docs/design-system/FIGMA_CREATION_GUIDE.md` ✅
- `docs/design-system/prototypes/*.html` ✅

---

## Commit Format

After completing all tasks:

```bash
git add docs/design-system/DESIGN_SYSTEM.md
git add docs/design-system/UI_VISION_LIVING_GLASS.md
git add CLAUDE.md
git add docs/4D_EXPERIENCE_MODEL.md
git commit -m "docs(4d): Update terminology to 4D Experience Model

- Update DESIGN_SYSTEM.md with 4D terminology
- Audit and update UI_VISION_LIVING_GLASS.md
- Update CLAUDE.md descriptive text
- Create 4D_EXPERIENCE_MODEL.md reference doc

Part of terminology-migration-4d initiative."
```

---

## Success Criteria

1. No instances of "Hub" (as a concept) remain in updated files
2. No instances of "Journey" (as a concept) remain in updated files
3. No instances of "Node" (as a concept) remain in updated files
4. New 4D reference document exists and is accurate
5. All changes are terminology only — no functional changes

---

## Reference

- [Full Spec](./SPEC.md) — Complete migration specification
- [Fix Queue Entry](https://www.notion.so/2e9780a78eef8139a2ddd1b4b8c278fd) — Notion tracking

---

*4D-Docs Execution Prompt v1.0*
