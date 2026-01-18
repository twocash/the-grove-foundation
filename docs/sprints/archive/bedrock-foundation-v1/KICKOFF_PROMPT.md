# Foundation Loop Complete: bedrock-foundation-v1

**Status:** ✅ Planning complete. Ready for execution.

---

## For Claude CLI Execution

Copy the contents of `EXECUTION_PROMPT.md` into Claude CLI:

```bash
# Navigate to project
cd C:\GitHub\the-grove-foundation

# View the execution prompt
cat docs/sprints/bedrock-foundation-v1/EXECUTION_PROMPT.md

# Or copy to clipboard (PowerShell)
Get-Content docs/sprints/bedrock-foundation-v1/EXECUTION_PROMPT.md | Set-Clipboard
```

---

## Sprint Artifacts Generated

| Artifact | Lines | Purpose |
|----------|-------|---------|
| LENS_WORKSHOP_REFERENCE.md | 747 | **Canonical implementation guide** |
| REPO_AUDIT.md | 237 | Current state analysis |
| SPEC.md | 236 | Goals and acceptance criteria |
| ARCHITECTURE.md | 566 | Data model and component specs |
| MIGRATION_MAP.md | 269 | File creation sequence |
| DECISIONS.md | 372 | 10 architectural decisions |
| SPRINTS.md | 755 | 46 stories across 8 epics |
| EXECUTION_PROMPT.md | 321 | **CLI handoff document** |
| INDEX.md | 85 | Sprint navigation |

**Total:** 3,588 lines of planning documentation

---

## Key Documents for Execution

1. **EXECUTION_PROMPT.md** — Copy this to Claude CLI to begin
2. **LENS_WORKSHOP_REFERENCE.md** — Primary implementation guide
3. **ARCHITECTURE.md** — Data model and flows
4. **SPRINTS.md** — Story-by-story breakdown

---

## Branch

```bash
git checkout bedrock
# If branch doesn't exist:
git checkout -b bedrock
```

---

## Constraints Reminder

- ❌ NO imports from `src/foundation/`
- ✅ All entities use GroveObject schema
- ✅ Use `--card-*` tokens for styling
- ✅ Test hooks before wiring to UI
- ✅ Follow LENS_WORKSHOP_REFERENCE.md exactly

---

## Success Criteria

- [ ] `/bedrock/lenses` renders Lens Workshop
- [ ] Filter/sort/favorite works
- [ ] CRUD operations work
- [ ] Undo/redo works
- [ ] Copilot generates valid patches
- [ ] All tests pass
- [ ] Zero Foundation imports

---

*Foundation Loop executed December 30, 2024*
