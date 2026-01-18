# Grove Skills Directory

This directory contains Claude Code skills for the Grove Foundation project. Skills are invoked via slash commands (e.g., `/developer`, `/sprintmaster`) and provide specialized agent behaviors.

## Directory Structure

```
.agent/skills/
├── README.md                    # This file
├── {skill-name}/               # Skill directory
│   ├── SKILL.md                # Main skill definition (REQUIRED)
│   └── [additional files]      # Optional references, templates
└── {standalone-file}.md        # Standalone skill files
```

## Skill Anatomy

### Required File: `SKILL.md`

Every skill directory must contain a `SKILL.md` file with:

```markdown
# Skill Name

> Brief description of what the skill does

---

## Invocation

```
/{skill-name}
/{alias}
```

---

## When Invoked

[Describe behavior when the skill is triggered]

---

## Triggers

Keywords that activate this skill:
- "keyword one"
- "keyword two"

---

## Reference Files

- `file.md` - Description
```

### Optional Files

| File | Purpose |
|------|---------|
| `references/` | Reference documents the skill may read |
| `templates/` | Output templates |
| `sync.md` | Sync behavior notes |

## Adding a New Skill

1. **Create directory:**
   ```bash
   mkdir -p .agent/skills/{skill-name}
   ```

2. **Create SKILL.md:**
   ```bash
   # Copy template
   cat > .agent/skills/{skill-name}/SKILL.md << 'EOF'
   # Skill Name

   > Brief description

   ## Invocation
   /{skill-name}

   ## When Invoked
   [Behavior description]

   ## Triggers
   - "trigger phrase"
   EOF
   ```

3. **Sync to local:**
   ```bash
   ./scripts/sync-skills.sh
   ```

4. **Test:**
   ```
   # In Claude Code
   /{skill-name}
   ```

## Modifying Skills

1. **Edit in repo:**
   ```bash
   # Edit the skill file
   vi .agent/skills/{skill-name}/SKILL.md
   ```

2. **Sync to local:**
   ```bash
   ./scripts/sync-skills.sh
   ```

3. **Test changes:**
   - Start a new Claude Code conversation
   - Invoke the skill to verify changes

## Syncing Skills

Skills live in the repo (`.agent/skills/`) and must be synced to your local Claude Code installation (`~/.claude/skills/`).

### Repo to Local (Default)

```bash
# After pulling changes
./scripts/sync-skills.sh
```

### Local to Repo (Development)

```bash
# After developing/testing locally
./scripts/sync-skills.sh --reverse
```

See `docs/SKILLS_SYNC.md` for full documentation.

## Current Skills

| Skill | Triggers | Purpose |
|-------|----------|---------|
| `/developer` | "dev", "execute sprint" | Sprint execution agent |
| `/sprintmaster` | "let's roll", "sprint status" | Session warmup, pipeline dashboard |
| `/grove-foundation-loop` | "plan sprint", "Trellis" | Sprint planning |
| `/grove-execution-protocol` | "implement", "build feature" | Execution contracts |
| `/user-story-refinery` | "user stories", "acceptance criteria" | Generate Gherkin ACs |
| `/dex-master` | post-commit, manual scan | Code review |
| `/mine-sweeper` | "test cleanup", "fix tests" | Test debt cleanup |
| `/product-manager` | "product vision", "draft brief" | Product ownership |
| `/ui-ux-designer` | "wireframe", "mockup" | Interface design |
| `/user-experience-chief` | (with Product Pod) | DEX guardian |
| `/chief-of-staff` | "randy", "infrastructure check" | Infrastructure health |

## Best Practices

1. **One skill per directory** - Keep skills modular
2. **Clear triggers** - Use specific, unambiguous keywords
3. **Self-contained** - Skills should work without external context
4. **Document behavior** - Be explicit about what the skill does
5. **Test after changes** - Always sync and test before committing

## Troubleshooting

### Skill not recognized

1. Check sync: `./scripts/sync-skills.sh`
2. Verify file exists: `ls ~/.claude/skills/{skill-name}/`
3. Check SKILL.md format

### Changes not reflected

1. Sync again: `./scripts/sync-skills.sh`
2. Start a new Claude Code conversation
3. Skills are loaded at conversation start

### Sync script fails

1. Check permissions: `chmod +x scripts/sync-skills.sh`
2. Verify paths exist
3. Run with verbose: `./scripts/sync-skills.sh --verbose`

---

**Last Updated:** 2026-01-18
