# Grove Agent Infrastructure: Windows vs WSL Complete Map

> **Purpose:** Document the complete substrate needed to replicate the Grove agent-driven development experience from Windows to WSL.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    GROVE DEVELOPMENT ENVIRONMENT                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    PROJECT LEVEL (Shared)                        │    │
│  │         /mnt/c/GitHub/the-grove-foundation (WSL)                 │    │
│  │         C:\GitHub\the-grove-foundation (Windows)                 │    │
│  │                                                                  │    │
│  │  ├── .claude/                                                    │    │
│  │  │   ├── settings.json          (plugins enabled)               │    │
│  │  │   ├── settings.local.json    (permissions, NO hooks)         │    │
│  │  │   └── notes/                 (project-specific notes)        │    │
│  │  │                                                               │    │
│  │  ├── .agent/                    (Agent coordination system)     │    │
│  │  │   ├── skills/                (19 skill definitions)          │    │
│  │  │   ├── roles/                 (Role definitions)              │    │
│  │  │   ├── protocols/             (Execution protocols)           │    │
│  │  │   ├── config/                (Coordination config)           │    │
│  │  │   └── status/                (Agent status logs)             │    │
│  │  │                                                               │    │
│  │  ├── .mcp.json                  (MCP server definitions)        │    │
│  │  └── CLAUDE.md                  (Project instructions)          │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│                              │                                           │
│                              ▼                                           │
│  ┌──────────────────────┐         ┌──────────────────────┐              │
│  │   WINDOWS USER LEVEL │         │    WSL USER LEVEL    │              │
│  │   C:\Users\jim\.claude\        │   ~/.claude/         │              │
│  └──────────────────────┘         └──────────────────────┘              │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## User-Level Directory Comparison

### `~/.claude/` Structure

| Component | Windows | WSL | Status | Sync Method |
|-----------|---------|-----|--------|-------------|
| **skills/** | 19 skills + references | 20 items | ✅ SYNCED | `sync-skills.sh` |
| **notes/** | 12 notes | 12 notes | ✅ SYNCED | Manual copy |
| **status/** | 1 current entry | 1 current entry | ✅ SYNCED | Manual copy |
| **custom-instructions.md** | Present | Present | ✅ SYNCED | Manual copy |
| **settings.json** | Plugins enabled | Plugins enabled | ✅ SYNCED | Manual copy |
| **plugins/cache/** | Full cache (Notion, Serena, etc.) | **EMPTY** | ❌ GAP | Auto-download on first use |
| **plugins/config.json** | Has repositories | Empty repositories | ❌ GAP | May need manual setup |
| **settings.local.json** | Atlas hooks (DIFFERENT) | N/A | ⚠️ INTENTIONALLY DIFFERENT | Do NOT sync |

---

## Critical Gap: Plugin Cache

**Windows has:**
```
plugins/cache/claude-plugins-official/
├── serena/
├── supabase/
├── agent-sdk-dev/
├── frontend-design/
├── code-simplifier/
├── Notion/
├── figma/
└── vercel/
```

**WSL has:**
```
plugins/
├── install-counts-cache.json
└── installed_plugins.json  (empty: {"version": 2, "plugins": {}})
```

**This is likely why skills aren't loading in WSL** - the plugin system hasn't initialized.

---

## Skills Directory Structure

Each skill in `~/.claude/skills/` should have:

```
skill-name/
├── skill.md           (REQUIRED - main skill definition)
├── SKILL.md           (Alternative naming, also works)
├── references/        (Optional - supporting docs)
└── README.md          (Optional - documentation)
```

**Skills that require `skill.md` (lowercase):**
- agent-dispatch
- chief-of-staff
- developer
- gitfun
- load-persona
- mine-sweeper
- product-manager
- ui-ux-designer
- user-experience-chief

**Skills that use `SKILL.md` (uppercase):**
- dex-master
- grove-execution-protocol
- grove-foundation-loop
- grove-sprint
- sprintmaster
- test-janitor
- user-story-refinery

---

## Project-Level Configuration

### `.claude/settings.json`
```json
{
  "enabledPlugins": {
    "plugin-dev@claude-plugins-official": true
  }
}
```

### `.claude/settings.local.json`
- Contains 200+ permission entries
- Contains Skill() permissions for all skills
- **NO hooks** (unlike Atlas which has SessionStart hooks)

### `.mcp.json`
```json
{
  "mcpServers": {
    "notion": { "type": "http", "url": "https://mcp.notion.com/mcp" },
    "figma": { "type": "http", "url": "https://mcp.figma.com/mcp" },
    "supabase": { "type": "http", "url": "https://mcp.supabase.com/mcp" },
    "stitch": {
      "type": "stdio",
      "command": "npx",
      "args": ["@_davideast/stitch-mcp", "proxy", "--debug"],
      "env": {
        "STITCH_USE_SYSTEM_GCLOUD": "1",
        "PATH": "/home/jim/.stitch-mcp/google-cloud-sdk/bin:..."
      }
    }
  }
}
```

---

## Agent Coordination System (.agent/)

| Directory | Purpose | Synced? |
|-----------|---------|---------|
| `.agent/skills/` | 19 skill definitions (source of truth) | Project-level (shared) |
| `.agent/roles/` | Role definitions | Project-level (shared) |
| `.agent/protocols/` | Execution protocols | Project-level (shared) |
| `.agent/config/` | Coordination config | Project-level (shared) |
| `.agent/status/current/` | Active status entries | Gitignored |
| `.agent/status/archive/` | Historical entries | Git tracked |

---

## WSL Setup Requirements

### 1. Prerequisites
```bash
# Node.js via nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.nvm/nvm.sh
nvm install 24
nvm use 24

# Claude Code CLI
npm install -g @anthropic-ai/claude-code@2.1.6

# Verify
claude --version  # Should match Windows version
```

### 2. Skills Sync
```bash
cd /mnt/c/GitHub/the-grove-foundation
bash scripts/sync-skills.sh
```

### 3. Notes Sync
```bash
cp /mnt/c/Users/jim/.claude/notes/*.md ~/.claude/notes/
```

### 4. Status Sync
```bash
mkdir -p ~/.claude/status/current
cp -r /mnt/c/Users/jim/.claude/status/* ~/.claude/status/
```

### 5. Custom Instructions
```bash
cp /mnt/c/Users/jim/.claude/custom-instructions.md ~/.claude/
```

### 6. Settings (User-Level)
```bash
cp /mnt/c/Users/jim/.claude/settings.json ~/.claude/
# DO NOT copy settings.local.json (contains Atlas hooks)
```

### 7. Plugin Initialization (CRITICAL)
```bash
# Run Claude once to initialize plugins
cd /mnt/c/GitHub/the-grove-foundation
claude

# In Claude, check plugins:
/plugins
```

### 8. Stitch MCP (Optional - WSL Only)
```bash
# Install gcloud SDK
npx @_davideast/stitch-mcp init

# Add to PATH in ~/.bashrc
export PATH="/home/jim/.stitch-mcp/google-cloud-sdk/bin:$PATH"

# Authenticate
gcloud auth application-default login
```

---

## Sync Script (Recommended)

Create `scripts/sync-wsl-grove.sh`:

```bash
#!/bin/bash
# Sync Grove agent infrastructure to WSL

WINDOWS_CLAUDE="/mnt/c/Users/jim/.claude"
WSL_CLAUDE="$HOME/.claude"

echo "Syncing Grove infrastructure to WSL..."

# Create directories
mkdir -p "$WSL_CLAUDE"/{notes,status/current,skills,plugins}

# Sync skills (from project)
echo "Syncing skills..."
cp -r /mnt/c/GitHub/the-grove-foundation/.agent/skills/* "$WSL_CLAUDE/skills/"

# Sync notes
echo "Syncing notes..."
cp "$WINDOWS_CLAUDE"/notes/*.md "$WSL_CLAUDE/notes/" 2>/dev/null

# Sync status
echo "Syncing status..."
cp -r "$WINDOWS_CLAUDE"/status/* "$WSL_CLAUDE/status/" 2>/dev/null

# Sync custom instructions
echo "Syncing custom instructions..."
cp "$WINDOWS_CLAUDE/custom-instructions.md" "$WSL_CLAUDE/" 2>/dev/null

# Sync settings (NOT settings.local.json)
echo "Syncing settings..."
cp "$WINDOWS_CLAUDE/settings.json" "$WSL_CLAUDE/"

echo "Done! Run 'claude' in /mnt/c/GitHub/the-grove-foundation to initialize plugins."
```

---

## Verification Checklist

After setup, verify in WSL Claude (`/mnt/c/GitHub/the-grove-foundation`):

- [ ] `claude --version` matches Windows (2.1.6)
- [ ] `/skills` shows all 19 skills
- [ ] `/mcp` shows notion, figma, supabase (stitch optional)
- [ ] `Read(~/.claude/notes/grove-runbook.md)` works
- [ ] Skills trigger correctly: `/sprintmaster`, `/developer`, etc.

---

## Known Issues

| Issue | Cause | Workaround |
|-------|-------|------------|
| Skills not showing | Plugin system not initialized | Run Claude once, check `/plugins` |
| Stitch MCP fails | Windows spawn incompatible | WSL-only, or skip |
| `npx: command not found` | nvm not loaded | `source ~/.nvm/nvm.sh` |
| I/O errors | WSL filesystem issues | `wsl --shutdown` and restart |
| Different skills in WSL vs Windows | Version mismatch | Match Claude Code versions |

---

## File Ownership Summary

| Location | Owner | Synced How |
|----------|-------|------------|
| Project `.claude/` | Git (shared) | Automatic via mount |
| Project `.agent/` | Git (shared) | Automatic via mount |
| Project `.mcp.json` | Git (shared) | Automatic via mount |
| User `~/.claude/skills/` | Local | `sync-skills.sh` |
| User `~/.claude/notes/` | Local | Manual or script |
| User `~/.claude/status/` | Local | Manual or script |
| User `~/.claude/plugins/` | Local | Auto-download |

---

*Last Updated: 2026-01-22*
