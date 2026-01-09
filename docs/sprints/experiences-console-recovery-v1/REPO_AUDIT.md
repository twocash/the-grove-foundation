# REPO_AUDIT: ExperiencesConsole Recovery v1

**Date:** 2026-01-08  
**Sprint:** experiences-console-recovery-v1  
**Branch:** hotfix/experiences-console-v1.1  
**Purpose:** Restore working ExperiencesConsole from stash + orphaned commit

---

## 1. Current State Summary

### Branch: `hotfix/experiences-console-v1.1` @ `762fe16`

**Committed files (exist in working directory):**
```
src/bedrock/consoles/ExperiencesConsole/
├── ExperiencesConsole.config.ts    ✅ 3,821 bytes
├── SystemPromptEditor.tsx          ✅ 19,753 bytes
├── useExperienceData.ts            ✅ 8,119 bytes
└── transforms/
    ├── index.ts                    ✅ exists
    └── system-prompt.transforms.ts ✅ exists
```

**Missing critical file:**
```
src/bedrock/consoles/ExperiencesConsole/index.ts  ❌ MISSING
```

### Stash: `stash@{0}`

Contains 28 modified files with working route/navigation/server-side wiring:

| File | Lines Changed | Purpose |
|------|---------------|---------|
| `src/router/routes.tsx` | +10 | ExperiencesConsole lazy import + route |
| `src/bedrock/config/navigation.ts` | +13 | Nav item + console metadata |
| `server.js` | +227 | System prompt cache, APIs, buildSystemPrompt |
| `services/chatService.ts` | +4 | useSupabaseSystemPrompt flag |
| `src/surface/.../useKineticStream.ts` | +3 | Pass useSupabaseSystemPrompt: true |
| `SystemPromptEditor.tsx` | +80 | Enhanced activation UI |
| Plus 22 other files | ~600 | 4D prompt wiring, telemetry, etc. |

### Orphaned Commit: `e61877c`

Contains complete `ExperienceConsole` (singular) with additional files:

```
src/bedrock/consoles/ExperienceConsole/
├── ExperienceCard.tsx              # Combined card renderer
├── ExperienceConsole.config.ts     # Updated config
├── ExperienceEditor.tsx            # Combined editor
├── HealthCheckCard.tsx             # Read-only health views
├── HealthCheckEditor.tsx           # Read-only health editor
├── SystemPromptCard.tsx            # System prompt card
├── SystemPromptEditor.tsx          # System prompt editor
├── index.ts                        # ⭐ COMPLETE FACTORY CONSOLE
├── transforms/
├── useCombinedExperienceData.ts    # Merged data hook
├── useExperienceData.ts            # System prompt data
└── useHealthCheckData.ts           # Health check data
```

---

## 2. What We're Recovering

### From Stash (Apply Directly)
- Route wiring in `routes.tsx`
- Navigation in `navigation.ts`
- Server-side system prompt support in `server.js`
- Chat service flag in `chatService.ts`
- Kinetic stream integration
- SystemPromptEditor enhancements
- 4D prompt wiring improvements

### From Orphaned Commit (Adapt)
- `index.ts` console component pattern

### Create Fresh
- Minimal `ExperiencesConsole/index.ts` adapted from orphaned version

---

## 3. Files to Reference

### Pattern Source (orphaned commit)
```bash
git show e61877c:src/bedrock/consoles/ExperienceConsole/index.ts
```

### Working Console Examples
- `src/bedrock/consoles/LensWorkshop/index.ts`
- `src/bedrock/consoles/PromptWorkshop/index.ts`

### Existing Infrastructure (current branch)
- `src/bedrock/consoles/ExperiencesConsole/ExperiencesConsole.config.ts`
- `src/bedrock/consoles/ExperiencesConsole/SystemPromptEditor.tsx`
- `src/bedrock/consoles/ExperiencesConsole/useExperienceData.ts`

---

## 4. Git State

```
Current branch: hotfix/experiences-console-v1.1
Commit: 762fe16
Stash: stash@{0} (WIP: experiences-console-v1.1 hotfix work)
Orphan: e61877c (feat: add StatusBug to Bedrock footer)
```

### Stash Contents Preview
```bash
git stash show stash@{0} --stat
# 28 files changed, 813 insertions(+), 167 deletions(-)
```

---

## 5. Risk Assessment

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Stash conflicts on apply | Low | Same branch, clean working dir |
| Missing dependencies in index.ts | Medium | Comment out health check imports |
| Server.js conflicts | Low | Stash is recent, base unchanged |
| Build failure | Medium | Test immediately after apply |

---

## 6. Success Criteria

- [ ] `npm run build` succeeds
- [ ] `/bedrock/experiences` route loads
- [ ] Console displays system prompts from Supabase
- [ ] "Activate" button works and updates /explore behavior
- [ ] No regressions to other Bedrock routes
