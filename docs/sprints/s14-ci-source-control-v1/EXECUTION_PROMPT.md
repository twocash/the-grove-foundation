# Developer Execution Prompt: S14-CI-SourceControl-v1

## Quick Start

```bash
# Read the execution contract
cat docs/sprints/s14-ci-source-control-v1/GROVE_EXECUTION_CONTRACT.md
```

---

## Sprint Context

**Sprint:** S14-CI-SourceControl-v1
**Domain:** Coordination Infrastructure
**Effort:** Small-Medium (4-6 hours)
**Dependencies:** None

**Goal:** Establish `.agent/skills/` in the repo as source of truth for Claude Code skills, with a sync mechanism to local `~/.claude/skills/`.

---

## What You're Building

### Core Deliverables

1. **Directory Structure**
   - Create `.agent/skills/` in repo
   - Move all skills from `~/.claude/skills/`
   - Add README.md for skill authoring

2. **Sync Script**
   - `scripts/sync-skills.sh`
   - Cross-platform (macOS, Linux, Windows Git Bash)
   - Idempotent (safe to run multiple times)

3. **Documentation**
   - `docs/SKILLS_SYNC.md` - sync process
   - Update `CLAUDE.md` with skills context

---

## Implementation Steps

### Step 1: Create Directory Structure

```bash
mkdir -p .agent/skills
```

### Step 2: Identify Current Skills

```bash
ls -la ~/.claude/skills/
# Note all skill directories
```

### Step 3: Copy Skills to Repo

```bash
# Copy each skill directory
cp -r ~/.claude/skills/developer .agent/skills/
cp -r ~/.claude/skills/sprintmaster .agent/skills/
# ... repeat for all skills
```

### Step 4: Create Sync Script

Create `scripts/sync-skills.sh`:

```bash
#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "$SCRIPT_DIR")"
REPO_SKILLS="$REPO_ROOT/.agent/skills"
LOCAL_SKILLS="$HOME/.claude/skills"

echo "Syncing skills from $REPO_SKILLS to $LOCAL_SKILLS"
mkdir -p "$LOCAL_SKILLS"

for skill_dir in "$REPO_SKILLS"/*/; do
    if [ -d "$skill_dir" ]; then
        skill_name=$(basename "$skill_dir")
        echo "  Syncing: $skill_name"
        mkdir -p "$LOCAL_SKILLS/$skill_name"
        cp -r "$skill_dir"* "$LOCAL_SKILLS/$skill_name/"
    fi
done

echo "Done!"
```

Make executable:
```bash
chmod +x scripts/sync-skills.sh
```

### Step 5: Test Sync

```bash
# Clear local skills (backup first!)
mv ~/.claude/skills ~/.claude/skills.bak

# Run sync
./scripts/sync-skills.sh

# Verify
ls -la ~/.claude/skills/
```

### Step 6: Create Documentation

Create `docs/SKILLS_SYNC.md` with:
- What skills are
- How to sync
- How to add new skills
- How to modify existing skills

### Step 7: Update CLAUDE.md

Add skills context section pointing to `.agent/skills/`.

---

## Acceptance Criteria

```gherkin
Scenario: Skills exist in repo
  Given the repository is cloned
  When I check .agent/skills/ directory
  Then all skills should exist

Scenario: Sync script works
  Given ~/.claude/skills/ is empty
  When I run scripts/sync-skills.sh
  Then all skills are copied to ~/.claude/skills/

Scenario: Fresh clone works
  Given a fresh clone of the repository
  When I run sync-skills.sh
  Then Claude Code has working skills
```

---

## Files to Create

| File | Purpose |
|------|---------|
| `.agent/skills/README.md` | Skill authoring guide |
| `.agent/skills/*/SKILL.md` | Each skill definition |
| `scripts/sync-skills.sh` | Sync script |
| `docs/SKILLS_SYNC.md` | Documentation |

## Files to Modify

| File | Change |
|------|--------|
| `CLAUDE.md` | Add skills context |

---

## What You're NOT Building

- Git hooks for automatic sync (Phase 2)
- Skill validation/linting (Phase 2)
- Multi-project skill sharing (Phase 3)

---

## Reference Documents

| Document | Purpose |
|----------|---------|
| `GROVE_EXECUTION_CONTRACT.md` | Build gates |
| `USER_STORIES.md` | Acceptance criteria |
| `PRODUCT_BRIEF.md` | Business context |

---

**Sprint ID:** S14-CI-SourceControl-v1
**Ready for Execution:** 2026-01-18
