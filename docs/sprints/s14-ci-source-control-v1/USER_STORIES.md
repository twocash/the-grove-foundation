# User Stories: S14-CI-SourceControl-v1

---

## US-001: Version Controlled Skills

**As a** developer
**I want** skills to be version controlled in the repo
**So that** changes are tracked and reviewable

### Acceptance Criteria

```gherkin
Scenario: Skills exist in repo
  Given the repository is cloned
  When I check .agent/skills/ directory
  Then all skills should exist as SKILL.md files
  And each skill should have a version header

Scenario: Skill changes tracked
  Given a skill file is modified
  When I run git diff
  Then the changes should be visible
  And git blame shows who made changes
```

---

## US-002: One-Command Sync

**As a** developer
**I want** to sync skills with one command
**So that** my local machine has current skills

### Acceptance Criteria

```gherkin
Scenario: Sync script works
  Given the repository is cloned
  When I run scripts/sync-skills.sh
  Then all skills are copied to ~/.claude/skills/
  And each skill directory is created if missing
  And a success message is displayed

Scenario: Sync is idempotent
  Given skills are already synced
  When I run sync-skills.sh again
  Then no errors occur
  And files are updated if changed
```

---

## US-003: PR Review for Skills

**As a** code reviewer
**I want** skill changes to go through PR review
**So that** changes are validated before deployment

### Acceptance Criteria

```gherkin
Scenario: Skill change requires PR
  Given a skill is modified in .agent/skills/
  When the developer pushes changes
  Then a PR is required to merge to main
  And reviewers can see the diff

Scenario: Direct push blocked
  Given branch protection is enabled
  When a developer tries to push directly to main
  Then the push is rejected
```

---

## US-004: Multi-Machine Consistency

**As a** developer with multiple machines
**I want** consistent skills across all machines
**So that** I get the same behavior everywhere

### Acceptance Criteria

```gherkin
Scenario: Fresh machine setup
  Given a new machine with Claude Code installed
  When I clone the repo and run sync-skills.sh
  Then all skills are available in ~/.claude/skills/
  And skill behavior matches other machines

Scenario: Update propagation
  Given skills were updated in the repo
  When I git pull and run sync-skills.sh
  Then my local skills are updated
  And new skills are added if any
```

---

## Test Strategy

### Manual Tests
- Clone repo fresh, run sync, verify skills work
- Modify skill, run sync, verify update
- Test on Windows (Git Bash), macOS, Linux

### Verification Commands
```bash
# Verify skills exist in repo
ls -la .agent/skills/

# Verify sync script exists
ls -la scripts/sync-skills.sh

# Run sync
./scripts/sync-skills.sh

# Verify local skills
ls -la ~/.claude/skills/
```

---

## Summary

| ID | Title | Priority | Complexity |
|----|-------|----------|------------|
| US-001 | Version Controlled Skills | P0 | S |
| US-002 | One-Command Sync | P0 | S |
| US-003 | PR Review for Skills | P0 | S |
| US-004 | Multi-Machine Consistency | P1 | S |

**Total Stories:** 4
**Estimated Effort:** 4-6 hours
