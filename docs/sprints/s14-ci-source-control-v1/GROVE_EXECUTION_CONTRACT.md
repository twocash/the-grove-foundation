# Grove Execution Contract: S14-CI-SourceControl-v1

## Handoff Summary

**Sprint:** S14-CI-SourceControl-v1
**Goal:** Establish `.agent/skills/` as source of truth with sync mechanism
**Scope:** Directory structure, sync script, documentation
**Effort:** Small-Medium (4-6 hours)
**Dependencies:** None

**What We're Building:**
- `.agent/skills/` directory with all skills from `~/.claude/skills/`
- `scripts/sync-skills.sh` cross-platform sync script
- `docs/SKILLS_SYNC.md` documentation
- Updated CLAUDE.md context

**What We're NOT Building:**
- Git hooks for automatic sync (Phase 2)
- Skill validation/linting (Phase 2)
- Multi-project skill sharing (Phase 3)

---

## Build Gates

### Phase 1: Directory Structure
**Timeline:** 1 hour

```bash
# Gate 1.1: Create directory
mkdir -p .agent/skills

# Gate 1.2: Verify structure
ls -la .agent/skills/
```

**Success Criteria:**
- `.agent/skills/` directory exists
- Directory is git tracked

---

### Phase 2: Skill Migration
**Timeline:** 1-2 hours

```bash
# Gate 2.1: Copy skills from local
cp -r ~/.claude/skills/* .agent/skills/

# Gate 2.2: Verify all skills copied
ls -la .agent/skills/

# Gate 2.3: Git add
git add .agent/skills/
```

**Success Criteria:**
- All skills from `~/.claude/skills/` exist in `.agent/skills/`
- Each skill has SKILL.md file
- Files are git tracked

---

### Phase 3: Sync Script
**Timeline:** 1 hour

```bash
# Gate 3.1: Script exists
ls -la scripts/sync-skills.sh

# Gate 3.2: Script is executable
chmod +x scripts/sync-skills.sh

# Gate 3.3: Script runs without error
./scripts/sync-skills.sh

# Gate 3.4: Verify sync worked
ls -la ~/.claude/skills/
```

**Success Criteria:**
- Script creates missing directories
- Script copies all skills
- Script works on macOS/Linux/Windows (Git Bash)
- Script is idempotent

---

### Phase 4: Documentation
**Timeline:** 1 hour

```bash
# Gate 4.1: Docs exist
ls -la docs/SKILLS_SYNC.md

# Gate 4.2: CLAUDE.md updated
grep -q ".agent/skills" CLAUDE.md
```

**Success Criteria:**
- `docs/SKILLS_SYNC.md` explains sync process
- `CLAUDE.md` references skills location
- README in `.agent/skills/` explains authoring

---

### Final Verification

```bash
# Fresh clone simulation
rm -rf ~/.claude/skills/*
./scripts/sync-skills.sh
ls -la ~/.claude/skills/

# All skills should be restored
```

---

## QA Gates

### Gate 1: Pre-Development
- [ ] Current skills identified in `~/.claude/skills/`
- [ ] Understand skill file format

### Gate 2: Mid-Sprint
- [ ] Directory structure created
- [ ] Skills migrated
- [ ] Sync script working

### Gate 3: Pre-Merge
- [ ] All 4 user stories verified
- [ ] Cross-platform tested (or documented)
- [ ] Documentation complete

### Gate 4: Sprint Complete
- [ ] Fresh clone + sync works
- [ ] PR review confirms all skills present
- [ ] CLAUDE.md updated

---

## Key Files

### Create
```
.agent/skills/README.md              # Authoring guide
.agent/skills/developer/SKILL.md     # Migrate from ~/.claude
.agent/skills/sprintmaster/SKILL.md  # Migrate from ~/.claude
.agent/skills/[all others]/SKILL.md  # Migrate all
scripts/sync-skills.sh               # Sync script
docs/SKILLS_SYNC.md                  # Documentation
```

### Modify
```
CLAUDE.md                            # Add skills context
```

---

## Sync Script Template

```bash
#!/bin/bash
# scripts/sync-skills.sh
# Syncs skills from repo to local Claude Code installation

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
REPO_SKILLS="$REPO_ROOT/.agent/skills"
LOCAL_SKILLS="$HOME/.claude/skills"

echo "Syncing skills from $REPO_SKILLS to $LOCAL_SKILLS"

# Create local skills directory if needed
mkdir -p "$LOCAL_SKILLS"

# Sync each skill
for skill_dir in "$REPO_SKILLS"/*/; do
    if [ -d "$skill_dir" ]; then
        skill_name=$(basename "$skill_dir")
        echo "  Syncing: $skill_name"
        mkdir -p "$LOCAL_SKILLS/$skill_name"
        cp -r "$skill_dir"* "$LOCAL_SKILLS/$skill_name/"
    fi
done

echo "Done! Skills synced to $LOCAL_SKILLS"
```

---

## Rollback Plan

**Scenario:** Sync script breaks local skills

```bash
# Skills are still in repo, just re-copy manually
cp -r .agent/skills/* ~/.claude/skills/
```

**Recovery Time:** < 5 minutes

---

## Completion Checklist

- [ ] `.agent/skills/` directory exists with all skills
- [ ] `scripts/sync-skills.sh` works cross-platform
- [ ] `docs/SKILLS_SYNC.md` complete
- [ ] `CLAUDE.md` updated
- [ ] Fresh clone + sync verified
- [ ] All 4 user stories pass

---

**Contract Version:** 1.0
**Last Updated:** 2026-01-18
