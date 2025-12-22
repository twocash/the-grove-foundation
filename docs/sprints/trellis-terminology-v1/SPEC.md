# Specification — trellis-terminology-v1

## Overview

Complete the terminology migration from "DAIRE" to "Trellis Architecture / DEX Standard" across all project files. This is a documentation and branding sprint—no functional changes to code logic.

## Goals

1. **Eliminate all "DAIRE" references** — Replace with appropriate Trellis/DEX terminology
2. **Create canonical reference docs** — Establish authoritative Trellis Architecture documentation
3. **Update standalone skill package** — Synchronize grove-foundation-loop-skill with new terminology
4. **Verify test terminology** — Ensure tests use correct vocabulary

## Non-Goals

- Functional code changes (this is terminology only)
- Adding new features
- Changing test behavior (only terminology in comments/descriptions)

## Success Criteria

- [ ] `grep -r "DAIRE" .` returns 0 results in codebase
- [ ] `docs/architecture/TRELLIS.md` exists with First Order Directives
- [ ] Standalone skill package updated with Trellis/DEX terminology
- [ ] All tests pass: `npm test`
- [ ] Health check passes: `npm run health`

## Files to Modify

### High Priority (Code)
1. `lib/health-validator.js` — Update header comment
2. `server.js` — Update health section comment
3. `src/foundation/consoles/HealthDashboard.tsx` — Update "DAIRE Alignment" panel

### Medium Priority (Sprint Docs)
4. `docs/sprints/health-dashboard-v1/DEVLOG.md` — Fix mixed terminology
5. `docs/sprints/health-dashboard-v1/MIGRATION_MAP.md` — Update descriptions
6. `docs/sprints/health-dashboard-v1/SPRINTS.md` — Rename section

### Skill Package
7. `C:\GitHub\grove-foundation-loop-skill\SKILL.md` — Full Trellis/DEX update
8. `C:\GitHub\grove-foundation-loop-skill\references\*.md` — Verify/update

### New Files
9. `docs/architecture/TRELLIS.md` — Canonical reference
10. `docs/architecture/DEX-STANDARD.md` — Optional (could be section in TRELLIS.md)

## Dependencies

None — pure documentation/branding work.

## Risks

| Risk | Mitigation |
|------|------------|
| Breaking string literals | Only touch comments, not functional strings |
| Incomplete find/replace | Run grep verification after |
