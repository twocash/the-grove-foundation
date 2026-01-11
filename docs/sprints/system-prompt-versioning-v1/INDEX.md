# INDEX: System Prompt Versioning v1

**Sprint:** system-prompt-versioning-v1  
**Status:** Ready for Execution  
**Date:** January 10, 2026

---

## Quick Summary

Implement append-only versioning for active SystemPrompt objects. When editing the active prompt and clicking "Save & Activate," the system creates a NEW record (new UUID) while archiving the previous version. This maintains full provenance history per DEX Pillar III.

---

## Sprint Artifacts

| Document | Purpose | Status |
|----------|---------|--------|
| [REPO_AUDIT.md](./REPO_AUDIT.md) | Current state analysis | ✅ Complete |
| [SPEC.md](./SPEC.md) | Requirements & acceptance criteria | ✅ Complete |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical design | ✅ Complete |
| [DECISIONS.md](./DECISIONS.md) | Key choices documented | ✅ Complete |
| [MIGRATION_MAP.md](./MIGRATION_MAP.md) | Exact code changes | ✅ Complete |
| [SPRINTS.md](./SPRINTS.md) | Task breakdown | ✅ Complete |
| [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md) | Claude CLI handoff | ✅ Complete |

---

## Files Modified

| File | Change |
|------|--------|
| `src/bedrock/consoles/ExperiencesConsole/useExperienceData.ts` | Add `saveAndActivate()` |
| `src/bedrock/consoles/ExperiencesConsole/SystemPromptEditor.tsx` | Wire new handler |
| `src/bedrock/patterns/console-factory.tsx` | Pass prop to editor |

---

## Execution Command

For Claude CLI:

```bash
cd C:\github\the-grove-foundation
# Read the execution prompt
cat docs/sprints/system-prompt-versioning-v1/EXECUTION_PROMPT.md
```

---

## Key Decisions

1. **Append-only for active only** - Drafts still mutate
2. **Create-then-archive order** - Safe failure mode
3. **Pass changes as object** - Not patches
4. **Refetch after create** - Reliable state update
5. **No transaction wrapper** - Simple, recoverable

---

## Success Criteria

- [ ] Build passes
- [ ] "Save & Activate" creates new version
- [ ] Old version gets archived
- [ ] Version number increments
- [ ] Provenance chain links correctly
- [ ] UI updates after save
- [ ] /explore uses new prompt

---

## DEX Compliance

| Pillar | Status |
|--------|--------|
| I. Declarative Sovereignty | ✅ No code changes for behavior |
| II. Capability Agnosticism | ✅ Model-independent |
| III. Provenance as Infrastructure | ✅ **Core improvement** |
| IV. Organic Scalability | ✅ No limits on versions |

---

*Sprint ready for execution.*
