# Source Control Protocol

**Version:** 1.0
**Last Updated:** 2026-01-15
**Applies to:** All agents with code modification capabilities

---

## Branch Strategy

### Branch Naming

| Type | Pattern | Example |
|------|---------|---------|
| Feature sprint | `feat/{sprint-codename}` | `feat/s1-sfr-shell` |
| Bug fix | `fix/{issue-id}` | `fix/modal-focus-trap` |
| Chore/maintenance | `chore/{task}` | `chore/deps-update` |
| Hotfix (production) | `hotfix/{issue}` | `hotfix/api-timeout` |

### Branch Lifecycle

```
main (protected)
  │
  ├── feat/s1-sfr-shell ──► PR ──► Squash merge to main
  │
  ├── fix/modal-focus ──► PR ──► Squash merge to main
  │
  └── hotfix/critical ──► PR ──► Merge to main (fast-track)
```

**Rules:**
- `main` is the default branch and deployment source
- All changes go through Pull Requests
- Feature branches are deleted after merge

---

## Commit Format

### Message Structure

```
{type}({scope}): US-{ID} - {title}

{optional body}

Co-Authored-By: Claude <agent>@anthropic.com
```

### Types

| Type | Use For |
|------|---------|
| `feat` | New feature or enhancement |
| `fix` | Bug fix |
| `refactor` | Code restructuring (no behavior change) |
| `test` | Adding or updating tests |
| `docs` | Documentation only |
| `chore` | Build, deps, config changes |
| `style` | Formatting (no code change) |

### Scope

Use the module or component name:
- `sfr` - Sprout Finishing Room
- `terminal` - Terminal component
- `core` - Core module
- `foundation` - Foundation experience
- `surface` - Surface experience

### Examples

```bash
feat(sfr): US-A001 - Modal container shell
fix(terminal): US-B003 - Focus trap escape key
refactor(core): Extract engagement types to schema
test(sfr): Add E2E tests for three-column layout
```

---

## Atomic Commits

### One Commit Per User Story

Each user story (US-XXXX) gets exactly one commit. This enables:
- Clean git bisect for debugging
- Easy revert of individual features
- Clear changelog generation

### Commit Sequence (Sprint Example)

```bash
# After each story completion
git add .
git commit -m "feat(sfr): US-A001 - Modal container shell

Co-Authored-By: Claude <developer>@anthropic.com"

git commit -m "feat(sfr): US-A002 - Three-column layout

Co-Authored-By: Claude <developer>@anthropic.com"

# Continue for each story...
```

### HEREDOC for Multi-line Messages

Always use HEREDOC for commit messages to ensure proper formatting:

```bash
git commit -m "$(cat <<'EOF'
feat(sfr): US-A001 - Modal container shell

Implements the base modal overlay with backdrop click handling.
Includes isOpen prop control and proper DOM cleanup.

Co-Authored-By: Claude <developer>@anthropic.com
EOF
)"
```

---

## Git Safety Rules

### Never Do

| Action | Risk | Alternative |
|--------|------|-------------|
| `git push --force` to main | Data loss | Create new commit |
| `git reset --hard` on shared branch | Lost work | `git revert` |
| `git commit --amend` after push | History rewrite | New commit |
| Skip hooks (`--no-verify`) | Bypass quality gates | Fix the issue |
| Update git config | Identity issues | Leave as-is |

### Amend Rules

Only use `git commit --amend` when ALL conditions are met:
1. User explicitly requested amend, OR commit succeeded but pre-commit hook auto-modified files
2. HEAD commit was created by you in this conversation
3. Commit has NOT been pushed to remote

**If commit FAILED or was REJECTED by hook:** Never amend. Fix the issue and create a NEW commit.

### Force Push Warning

If user requests force push to main/master:
1. Display warning about data loss risk
2. Ask for explicit confirmation
3. Only proceed if user confirms understanding

---

## Pull Request Workflow

### Creating PRs

Use `gh` CLI for all PR operations:

```bash
# Push branch with upstream tracking
git push -u origin feat/s1-sfr-shell

# Create PR
gh pr create --title "feat(sfr): S1-SFR-Shell Foundation" --body "$(cat <<'EOF'
## Summary
- US-A001: Modal container shell with backdrop
- US-A002: Three-column responsive layout
- US-A003: Close via button/Escape with focus trap
- US-A004: Status bar with metadata display

## Test plan
- [ ] `npm test` passes
- [ ] `npm run build` succeeds
- [ ] Manual verification at 1280px, 1024px, 768px widths
- [ ] Screenshot evidence in sprint folder

Generated with Claude Code
EOF
)"
```

### PR Checklist

Before creating PR, verify:
- [ ] All user stories committed
- [ ] Tests pass (`npm test`)
- [ ] Build succeeds (`npm run build`)
- [ ] No TypeScript errors
- [ ] Screenshots captured (if UI change)
- [ ] Branch is up to date with main

### After Merge

```bash
# Switch back to main
git checkout main
git pull origin main

# Delete local feature branch
git branch -d feat/s1-sfr-shell
```

---

## Worktree Awareness

### Claude Code Worktrees

This project may use Claude Code worktrees:
- **Main repo:** `C:\GitHub\the-grove-foundation`
- **Worktrees:** `C:\Users\jim\.claude-worktrees\the-grove-foundation\<branch>`

### Deployment Rule

**Cloud Build runs from main repo, NOT worktrees.**

After merging PR:
```bash
cd C:\GitHub\the-grove-foundation
git fetch origin && git pull origin main
gcloud builds submit --config cloudbuild.yaml
```

---

## Quick Reference

### Common Commands

```bash
# Start feature branch
git checkout -b feat/{sprint-name}

# Check status before commit
git status

# Stage all changes
git add .

# Commit with story ID
git commit -m "feat({scope}): US-{ID} - {title}"

# Push to remote
git push -u origin feat/{sprint-name}

# Create PR
gh pr create --title "..." --body "..."

# View PR status
gh pr status
```

### Commit Message Template

```
{type}({scope}): US-{ID} - {title}

Co-Authored-By: Claude <{role}>@anthropic.com
```

---

*Source Control Protocol v1.0 — Consistent commits, clean history*
