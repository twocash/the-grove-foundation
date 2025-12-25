# Terminal Polish v1 — Sprint Index

**Sprint:** terminal-polish-v1  
**Status:** Ready for Execution  
**Created:** 2024-12-25

---

## Vision

Implement the missing `--card-*` tokens from Sprint 6 and replace fake Inspector UI with actual object JSON display. This fixes broken visual states and enables developer/admin inspection of GroveObjects.

---

## Artifacts

| Document | Purpose | Status |
|----------|---------|--------|
| [REPO_AUDIT.md](./REPO_AUDIT.md) | Repository analysis, gap discovery | ✅ |
| [SPEC.md](./SPEC.md) | Requirements with Phase 0 Pattern Check | ✅ |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, DEX compliance | ✅ |
| [DECISIONS.md](./DECISIONS.md) | ADRs with rationale | ✅ |
| [SPRINTS.md](./SPRINTS.md) | Epic/story breakdown | ✅ |
| [MIGRATION_MAP.md](./MIGRATION_MAP.md) | Exact code changes | ✅ |
| [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md) | CLI handoff instructions | ✅ |
| [DEVLOG.md](./DEVLOG.md) | Execution tracking | ✅ |

---

## Key Discovery

**Sprint 6 documented `--card-*` tokens but they were never added to globals.css.** CardShell.tsx references undefined CSS variables, causing broken visual states.

This sprint implements the missing tokens and adds ObjectInspector for JSON display.

---

## Scope

### In Scope
- Implement `--card-*` tokens (~35 lines CSS)
- Create ObjectInspector component (~140 lines)
- Replace LensInspector fake UI (~60 lines)
- Replace JourneyInspector fake UI (~60 lines)

### Out of Scope
- Card grid layout changes (tokens will auto-fix)
- Grove Glass aesthetic (deferred to v1.1)
- Inline JSON editing (future enhancement)
- Navigation redesign

---

## Patterns Extended

| Pattern | Extension |
|---------|-----------|
| Pattern 4: Token Namespaces | Implement documented `--card-*` tokens |
| Pattern 7: Object Model | ObjectInspector consumes GroveObject interface |

**No new patterns created.**

---

## Files Changed

| File | Action | Lines |
|------|--------|-------|
| `styles/globals.css` | ADD tokens | +35 |
| `src/shared/inspector/ObjectInspector.tsx` | CREATE | ~140 |
| `src/shared/inspector/index.ts` | CREATE | ~5 |
| `src/explore/LensInspector.tsx` | REPLACE | ~60 |
| `src/explore/JourneyInspector.tsx` | REPLACE | ~60 |

**Total: ~300 lines**

---

## Success Criteria

- [ ] `--card-*` tokens defined in globals.css
- [ ] CardShell visual states work (default/active/inspected)
- [ ] ObjectInspector renders GroveObject as collapsible JSON
- [ ] LensInspector shows Persona data
- [ ] JourneyInspector shows Journey data
- [ ] Copy JSON button works
- [ ] Build passes
- [ ] 161/161 tests pass
- [ ] Marketing demo unchanged

---

## References

- [PROJECT_PATTERNS.md](../../../PROJECT_PATTERNS.md) — Pattern catalog
- [docs/design-system/DESIGN_SYSTEM.md](../../design-system/DESIGN_SYSTEM.md) — Design tokens
- [Sprint 6: card-system-unification-v1](../card-system-unification-v1/) — Original token documentation

---

*Foundation Loop complete. Ready for CLI execution.*
