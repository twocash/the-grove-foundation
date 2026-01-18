# Product Brief: Source Control Coordination

**Version:** 1.0
**Status:** Draft
**Author:** UX Chief
**Date:** 2026-01-18

---

## Executive Summary

Skills currently live only in `~/.claude/skills/` (local to each machine), creating version control blind spots, machine drift, and no review process for updates. This sprint establishes `.agent/skills/` in the repo as source of truth with a sync mechanism.

---

## Problem Statement

### Current Pain Points

1. **No Version Control** - Skills are modified locally with no history
2. **Machine Drift** - Different machines have different skill versions
3. **No Code Review** - Skill updates bypass PR review process
4. **Role Definition Drift** - Skills diverge from role definitions in `.agent/roles/`
5. **No Rollback** - Can't revert to previous skill version easily

### Evidence

```
~/.claude/skills/developer/     <- Local only, no git
~/.claude/skills/sprintmaster/  <- Different on each machine
.agent/roles/                   <- In repo, but skills aren't
```

---

## Proposed Solution

### Source of Truth Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     REPOSITORY                               │
│  .agent/skills/                                              │
│  ├── developer/                                              │
│  │   └── SKILL.md                                           │
│  ├── sprintmaster/                                          │
│  │   └── SKILL.md                                           │
│  └── [other skills]/                                        │
│                                                              │
│  Version controlled, PR reviewed, single source of truth    │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ sync
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  LOCAL MACHINE                               │
│  ~/.claude/skills/                                          │
│  ├── developer/ -> symlink or copy                          │
│  ├── sprintmaster/ -> symlink or copy                       │
│  └── [other skills]/                                        │
│                                                              │
│  Runtime location for Claude Code                           │
└─────────────────────────────────────────────────────────────┘
```

### Sync Mechanisms (Options)

| Option | Pros | Cons |
|--------|------|------|
| **A: Symlinks** | Real-time sync, no copy | Platform issues (Windows) |
| **B: Copy script** | Cross-platform, simple | Manual sync needed |
| **C: Git hook** | Automatic on pull | Adds hook complexity |

**Recommended:** Option B (Copy script) with Option C (Git hook) as enhancement

### Breaking Change Protocol

When a skill changes in a breaking way:
1. Version bump in skill header
2. CHANGELOG entry
3. PR review required
4. Post-merge notification

---

## DEX Pillar Verification

| Pillar | Implementation | Status |
|--------|----------------|--------|
| **Declarative Sovereignty** | Skills defined declaratively in repo | ✅ |
| **Capability Agnosticism** | Works with any model using skills | ✅ |
| **Provenance as Infrastructure** | Git history tracks all changes | ✅ |
| **Organic Scalability** | New skills just add files | ✅ |

---

## Scope

### Phase 1 (This Sprint)

**In Scope:**
- Create `.agent/skills/` directory structure
- Move existing skills from `~/.claude/skills/` to repo
- Create sync script (`scripts/sync-skills.sh`)
- Document sync process in README
- Add to CLAUDE.md context

**Out of Scope:**
- Automatic sync (git hooks) - Phase 2
- Skill validation/linting - Phase 2
- Multi-project skill sharing - Phase 3

### Deliverables

1. `.agent/skills/` directory with all current skills
2. `scripts/sync-skills.sh` - Cross-platform sync script
3. `docs/SKILLS_SYNC.md` - Documentation
4. Updated CLAUDE.md with skills context

---

## User Stories

| ID | Story | Priority |
|----|-------|----------|
| US-001 | As a developer, I want skills version controlled so changes are tracked | P0 |
| US-002 | As a developer, I want to sync skills to local machine with one command | P0 |
| US-003 | As a reviewer, I want skill changes to go through PR review | P0 |
| US-004 | As a multi-machine user, I want consistent skills across machines | P1 |

---

## Technical Approach

### Directory Structure

```
.agent/
├── config/           # Existing coordination config
├── roles/            # Existing role definitions
├── protocols/        # Existing protocols
├── status/           # Existing status logs
└── skills/           # NEW: Source of truth
    ├── README.md     # Skill authoring guide
    ├── developer/
    │   └── SKILL.md
    ├── sprintmaster/
    │   └── SKILL.md
    ├── grove-foundation-loop/
    │   └── SKILL.md
    └── [etc]/
```

### Sync Script

```bash
#!/bin/bash
# scripts/sync-skills.sh

REPO_SKILLS=".agent/skills"
LOCAL_SKILLS="$HOME/.claude/skills"

# Sync from repo to local
for skill_dir in "$REPO_SKILLS"/*/; do
    skill_name=$(basename "$skill_dir")
    mkdir -p "$LOCAL_SKILLS/$skill_name"
    cp -r "$skill_dir"* "$LOCAL_SKILLS/$skill_name/"
    echo "Synced: $skill_name"
done

echo "Skills synced to $LOCAL_SKILLS"
```

---

## Success Criteria

1. All skills exist in `.agent/skills/` and are git tracked
2. `scripts/sync-skills.sh` works on macOS, Linux, Windows (Git Bash)
3. Fresh clone + sync = working skills
4. Skill changes require PR review
5. Documentation complete

---

## Risks & Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Windows path issues | Medium | Use Git Bash compatible paths |
| Sync forgotten | Low | Document in README, consider hook |
| Breaking changes | Medium | Version header + CHANGELOG |

---

## Timeline

**Effort:** 🌿 Medium (1 sprint)
**Estimated Hours:** 4-6 hours

| Phase | Task | Hours |
|-------|------|-------|
| 1 | Create directory structure | 0.5 |
| 2 | Move existing skills | 1 |
| 3 | Create sync script | 1 |
| 4 | Test cross-platform | 1 |
| 5 | Documentation | 1 |
| 6 | Update CLAUDE.md | 0.5 |

---

## References

- Current skills location: `~/.claude/skills/`
- Role definitions: `.agent/roles/`
- Coordination config: `.agent/config/`

---

**Prepared by:** UX Chief
**Next Step:** PM Review
