# Skills Sync Process

This document explains how to sync Claude Code skills between the repository and your local installation.

## Overview

Claude Code skills are stored in two locations:

| Location | Purpose |
|----------|---------|
| `.agent/skills/` (repo) | **Source of truth** - version controlled |
| `~/.claude/skills/` (local) | **Runtime location** - where Claude Code reads skills |

The sync script copies skills from the repo to your local installation.

## Quick Start

After cloning or pulling the repo:

```bash
# Make the script executable (first time only)
chmod +x scripts/sync-skills.sh

# Sync skills to local
./scripts/sync-skills.sh
```

## Sync Commands

### Default: Repo to Local

```bash
./scripts/sync-skills.sh
```

This copies all skills from `.agent/skills/` to `~/.claude/skills/`. Use this:
- After cloning a fresh repo
- After pulling changes that modified skills
- When you want to reset local skills to repo state

### Reverse: Local to Repo

```bash
./scripts/sync-skills.sh --reverse
```

This copies all skills from `~/.claude/skills/` to `.agent/skills/`. Use this:
- After developing/testing skills locally
- Before committing skill changes to the repo

### Verbose Output

```bash
./scripts/sync-skills.sh --verbose
# or
./scripts/sync-skills.sh -v
```

Shows detailed output of what's being synced.

## Workflow: Adding a New Skill

1. **Create skill in repo:**
   ```bash
   mkdir -p .agent/skills/my-skill
   # Create SKILL.md with skill definition
   ```

2. **Sync to local:**
   ```bash
   ./scripts/sync-skills.sh
   ```

3. **Test in Claude Code:**
   - Start a new conversation
   - Type `/my-skill` to invoke

4. **Iterate:**
   - Edit `.agent/skills/my-skill/SKILL.md`
   - Re-run sync
   - Start new conversation to test

5. **Commit:**
   ```bash
   git add .agent/skills/my-skill/
   git commit -m "feat: add my-skill"
   ```

## Workflow: Modifying an Existing Skill

### Option A: Edit in Repo (Recommended)

1. Edit skill in `.agent/skills/{skill-name}/`
2. Sync: `./scripts/sync-skills.sh`
3. Test in new Claude Code conversation
4. Commit changes

### Option B: Edit Locally First

1. Edit skill in `~/.claude/skills/{skill-name}/`
2. Test in new Claude Code conversation
3. Reverse sync: `./scripts/sync-skills.sh --reverse`
4. Review and commit changes

## Cross-Platform Compatibility

The sync script works on:

| Platform | Shell |
|----------|-------|
| macOS | Terminal, iTerm, Bash, Zsh |
| Linux | Bash, Zsh |
| Windows | Git Bash, WSL, Cygwin |

### Windows Notes

- Use Git Bash (recommended) or WSL
- Path handling is automatic
- If using PowerShell, run through Git Bash:
  ```powershell
  & 'C:\Program Files\Git\bin\bash.exe' -c './scripts/sync-skills.sh'
  ```

## Troubleshooting

### "Permission denied"

```bash
chmod +x scripts/sync-skills.sh
```

### "Source directory does not exist"

The repo skills directory is missing. Check:
```bash
ls -la .agent/skills/
```

### "Skills not working after sync"

1. Verify sync completed:
   ```bash
   ls ~/.claude/skills/
   ```

2. Start a **new** Claude Code conversation (skills load at start)

3. Check skill file format:
   ```bash
   cat ~/.claude/skills/{skill-name}/SKILL.md
   ```

### "Changes not reflected"

Skills are loaded when a conversation starts. You must start a new conversation to see changes.

## Directory Structure

```
Repository (.agent/skills/)
├── README.md                    # Authoring guide
├── developer/
│   └── SKILL.md
├── sprintmaster/
│   ├── SKILL.md
│   ├── sync.md
│   └── references/
├── grove-foundation-loop/
│   └── SKILL.md
└── ...

Local (~/.claude/skills/)
├── developer/
│   └── SKILL.md
├── sprintmaster/
│   ├── SKILL.md
│   ├── sync.md
│   └── references/
└── ...
```

## Best Practices

1. **Always edit in repo** - The repo is the source of truth
2. **Sync after pull** - Run sync after pulling changes
3. **Test before commit** - Always test skills locally before committing
4. **Use verbose for debugging** - `--verbose` shows what's being synced
5. **New conversation to test** - Skills load at conversation start

## Integration with Git Workflow

### Post-Pull Hook (Optional)

Add to `.git/hooks/post-merge`:

```bash
#!/bin/bash
# Auto-sync skills after pull
if [ -d ".agent/skills" ]; then
    echo "Syncing skills..."
    ./scripts/sync-skills.sh
fi
```

Make executable:
```bash
chmod +x .git/hooks/post-merge
```

### Pre-Commit Check (Optional)

Add to `.git/hooks/pre-commit`:

```bash
#!/bin/bash
# Warn if local skills differ from repo
if ! diff -rq ~/.claude/skills/ .agent/skills/ > /dev/null 2>&1; then
    echo "Warning: Local skills differ from repo"
    echo "Run: ./scripts/sync-skills.sh --reverse"
fi
```

---

## See Also

- `.agent/skills/README.md` - Skill authoring guide
- `CLAUDE.md` - Project context including skills reference

---

**Last Updated:** 2026-01-18
