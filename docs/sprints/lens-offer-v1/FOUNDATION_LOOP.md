# Foundation Loop: lens-offer-v1

**Sprint:** lens-offer-v1
**Started:** December 28, 2025
**Status:** Ready for Execution

---

## Sprint Summary

Implement inline lens offers in the Kinetic Stream—glass-molded recommendation cards that surface analytical perspectives based on content resonance.

---

## Artifacts

| Phase | Artifact | Status |
|-------|----------|--------|
| 0 | Pattern Check | ✅ Complete (in SPEC) |
| 0.5 | Canonical Source Audit | ✅ Complete (in SPEC) |
| 1 | REPO_AUDIT.md | ✅ Complete |
| 2 | SPEC.md | ✅ Complete (at `docs/features/lens-offer-spec-v1.md`) |
| 3 | ARCH_DECISIONS.md | ✅ Complete |
| 4 | MIGRATION_MAP.md | ✅ Complete |
| 5 | TEST_STRATEGY.md | ✅ Complete |
| 6 | SPRINTS.md | ✅ Complete |
| 7 | EXECUTION_PROMPT.md | ✅ Complete |
| 8 | DEVLOG.md | ⏳ Pending (post-execution) |

---

## Files to Create

| File | Lines | Purpose |
|------|-------|---------|
| `src/core/transformers/LensOfferParser.ts` | ~60 | Parser for `<lens_offer>` tags |
| `src/surface/.../blocks/LensOfferObject.tsx` | ~90 | Render component |

---

## Files to Modify

| File | Changes |
|------|---------|
| `src/core/schema/stream.ts` | Add LensOfferStreamItem type |
| `src/core/transformers/index.ts` | Export parser |
| `src/surface/.../blocks/index.ts` | Export component |
| `src/surface/.../Stream/KineticRenderer.tsx` | Add case for lens_offer |
| `src/surface/.../hooks/useKineticStream.ts` | Parse offers, add updateStreamItem |
| `src/surface/.../ExploreShell.tsx` | Wire handlers |

---

## Execution Command

```bash
# Hand off to Claude Code CLI
cd C:\GitHub\the-grove-foundation
# Open EXECUTION_PROMPT.md and execute
```

---

## Post-Execution

After implementation, update `docs/DEVLOG.md` with:
- Files created/modified
- Verification results
- Any deviations from plan

---

*Foundation Loop ready. Execute via EXECUTION_PROMPT.md.*
