# Repository Cleanup Prompt

**Purpose:** Resolve uncommitted work and finalize bedrock-event-architecture-v1  
**For:** Claude CLI / Claude Code  
**Date:** January 4, 2026

---

## Context

The `bedrock-event-architecture-v1` sprint just completed successfully (commit c65c916, +9,355 lines, 133 tests passing). However:

1. The branch is 4 commits ahead of origin (needs push)
2. There is uncommitted work from prior sprints (`pipeline-inspector`, `kinetic-suggested-prompts`) in the working directory

## Your Task

Clean up the repository so we can start fresh on `bedrock-event-hooks-v1`.

### Step 1: Assess Uncommitted Files

```bash
cd C:\GitHub\the-grove-foundation
git status
```

For each uncommitted file, determine:
- **What sprint it belongs to** (pipeline-inspector, kinetic-suggested-prompts, or other)
- **Whether it's superseded** by the new event architecture
- **Whether it has value** worth preserving

### Step 2: Triage Decision

Apply this decision tree:

| Condition | Action |
|-----------|--------|
| File is in `src/core/events/` and uncommitted | Should already be committed — investigate |
| File duplicates functionality now in event system | **Discard** — superseded |
| File is stable, tested, and independent | **Commit** as WIP with clear message |
| File is experimental/incomplete but has value | **Stash** with descriptive name |
| File is experimental with no clear path forward | **Discard** after documenting what it attempted |

### Step 3: Execute Cleanup

Based on triage, execute ONE of these patterns:

**Pattern A: All uncommitted work is superseded**
```bash
# Document what's being discarded
git status > docs/sprints/DISCARDED_WIP_2026-01-04.txt
git diff --stat >> docs/sprints/DISCARDED_WIP_2026-01-04.txt

# Clean slate
git checkout -- .
git clean -fd

# Commit the documentation
git add docs/sprints/DISCARDED_WIP_2026-01-04.txt
git commit -m "docs: document discarded WIP superseded by event architecture"
```

**Pattern B: Some work worth preserving**
```bash
# Stash valuable WIP
git stash push -m "WIP: [description of what's preserved]" -- [specific files]

# Discard the rest
git checkout -- .
git clean -fd
```

**Pattern C: Work is stable enough to commit**
```bash
# Stage and commit stable work
git add [specific files]
git commit -m "wip: [sprint-name] - [description]

Note: This is work-in-progress from [sprint-name].
May be superseded by bedrock-event-architecture-v1."

# Clean remaining unstaged files
git checkout -- .
git clean -fd
```

### Step 4: Push to Origin

```bash
# Verify clean state
git status  # Should show "nothing to commit, working tree clean"

# Push completed work
git push origin bedrock

# Verify
git log --oneline -5
```

### Step 5: Report

Provide a summary:

```markdown
## Cleanup Report

**Uncommitted files found:** [count]
**Decision:** [Pattern A/B/C]

### Files Discarded
- [file]: [reason]

### Files Stashed
- [file]: [stash name]

### Files Committed
- [file]: [commit hash]

**Branch status:** Pushed to origin, clean working tree
**Ready for:** bedrock-event-hooks-v1
```

---

## Important Notes

1. **Don't lose the event architecture work** — it's already committed, just not pushed
2. **The kinetic-suggested-prompts sprint** was deferred pending clean event infrastructure — that infrastructure now exists
3. **The pipeline-inspector sprint** may have UI components that are still valid — assess carefully
4. **When in doubt, stash** — we can always recover from stash, not from discard

## Success Criteria

- [ ] `git status` shows clean working tree
- [ ] `git log origin/bedrock..bedrock` shows no unpushed commits
- [ ] All decisions documented
- [ ] Ready to start `bedrock-event-hooks-v1`
