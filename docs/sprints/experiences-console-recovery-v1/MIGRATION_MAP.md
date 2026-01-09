# MIGRATION MAP: ExperiencesConsole Recovery v1

**Sprint:** experiences-console-recovery-v1  
**Execution Time:** ~30 minutes

---

## Phase Overview

```
┌─────────────────────────────────────────────────────────────┐
│  Phase 0: Pre-Flight                                        │
│  - Verify clean working directory                           │
│  - Confirm on correct branch                                │
│  - List stash contents                                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 1: Apply Stash                                       │
│  - git stash apply stash@{0}                               │
│  - Verify 28 files modified                                 │
│  - Check for conflicts                                      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 2: Create index.ts                                   │
│  - Extract template from orphaned commit                    │
│  - Adapt for ExperiencesConsole (plural)                   │
│  - Remove health check dependencies                         │
│  - Save to correct location                                 │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 3: Build Verification                                │
│  - npm run build                                            │
│  - Fix any type errors                                      │
│  - Verify no missing imports                                │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 4: Runtime Verification                              │
│  - npm run dev                                              │
│  - Navigate to /bedrock/experiences                         │
│  - Test CRUD operations                                     │
│  - Test activation flow                                     │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  Phase 5: Commit & Cleanup                                  │
│  - Stage all changes                                        │
│  - Commit with descriptive message                          │
│  - Drop stash (optional)                                    │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 0: Pre-Flight Checks

### Commands
```bash
cd C:\github\the-grove-foundation
git branch --show-current
# Expected: hotfix/experiences-console-v1.1

git status --short
# Expected: Only untracked files (docs/hotfixes/*)

git stash list
# Expected: stash@{0}: On hotfix/experiences-console-v1.1: WIP...
```

### Verification
- [ ] On branch `hotfix/experiences-console-v1.1`
- [ ] No uncommitted tracked changes
- [ ] Stash exists at position 0

---

## Phase 1: Apply Stash

### Commands
```bash
git stash apply stash@{0}
# Expected: 28 files changed
```

### Expected Output
```
On branch hotfix/experiences-console-v1.1
Changes not staged for commit:
  modified:   data/default-personas.ts
  modified:   data/narratives-schema.ts
  modified:   server.js
  modified:   services/chatService.ts
  modified:   src/App.tsx
  modified:   src/bedrock/config/navigation.ts
  modified:   src/bedrock/consoles/ExperiencesConsole/SystemPromptEditor.tsx
  ...
```

### Conflict Resolution
If conflicts occur (unlikely):
```bash
git checkout --theirs <file>  # Accept stash version
# OR
git checkout --ours <file>    # Keep current version
```

### Verification
- [ ] No merge conflicts
- [ ] `src/router/routes.tsx` has ExperiencesConsole import
- [ ] `src/bedrock/config/navigation.ts` has experiences entry
- [ ] `server.js` has system prompt APIs (~160 new lines)

---

## Phase 2: Create index.ts

### Source Template
```bash
git show e61877c:src/bedrock/consoles/ExperienceConsole/index.ts
```

### Target File
```
src/bedrock/consoles/ExperiencesConsole/index.ts
```

### Adaptation Requirements
1. Change all `ExperienceConsole` → `ExperiencesConsole`
2. Change `experienceConsoleConfig` → `experiencesConsoleConfig`
3. Remove imports for files that don't exist:
   - `useCombinedExperienceData`
   - `ExperienceCard`
   - `ExperienceEditor`
   - `HealthCheckCard`
   - `HealthCheckEditor`
   - `useHealthCheckData`
4. Remove health check exports
5. Use `useExperienceData` directly (not combined)

### Verification
- [ ] File created at correct path
- [ ] No import errors in IDE
- [ ] Exports `ExperiencesConsole` as default

---

## Phase 3: Build Verification

### Commands
```bash
npm run build
```

### Common Issues & Fixes

**Issue: Missing type export**
```
error TS2305: Module '"./useExperienceData"' has no exported member 'ExperiencePayload'
```
Fix: Check actual exports from useExperienceData, update import

**Issue: Config name mismatch**
```
error TS2339: Property 'experiencesConsoleConfig' does not exist
```
Fix: Check actual export name in config file

**Issue: Factory type mismatch**
```
error TS2345: Argument of type '...' is not assignable
```
Fix: Verify payload type matches between config, data hook, and editor

### Verification
- [ ] Build completes with no errors
- [ ] No TypeScript errors
- [ ] Output bundle includes ExperiencesConsole

---

## Phase 4: Runtime Verification

### Commands
```bash
npm run dev
```

### Manual Testing Checklist

**Navigation**
- [ ] Sidebar shows "Experiences" link
- [ ] Click navigates to `/bedrock/experiences`

**Console Loading**
- [ ] Console renders without error
- [ ] System prompts load from Supabase
- [ ] List shows prompt cards

**Inspector**
- [ ] Click prompt → inspector opens
- [ ] All fields editable
- [ ] Changes show "unsaved" indicator

**CRUD Operations**
- [ ] Edit field → Save → persists
- [ ] Create new prompt → appears in list
- [ ] Delete prompt → removed from list

**Activation**
- [ ] Draft prompt shows "Activate" button
- [ ] Click Activate → status changes to active
- [ ] Previous active → demoted to draft
- [ ] Cache invalidation fires

**Integration**
- [ ] Navigate to `/explore`
- [ ] Send message
- [ ] Response reflects active system prompt behavior

---

## Phase 5: Commit & Cleanup

### Commands
```bash
# Stage all changes
git add -A

# Commit
git commit -m "feat: restore ExperiencesConsole with index.ts and stash recovery

Sprint: experiences-console-recovery-v1

Restored from stash@{0}:
- Route wiring (routes.tsx)
- Navigation entry (navigation.ts)
- Server-side system prompt support (server.js)
- Chat service integration (chatService.ts)
- Enhanced SystemPromptEditor
- 4D prompt wiring improvements

Created new:
- ExperiencesConsole/index.ts (adapted from orphaned e61877c)

Tested:
- Build succeeds
- Console loads at /bedrock/experiences
- System prompt activation works
- /explore uses active prompt"

# Optional: Drop the stash
git stash drop stash@{0}
```

### Verification
- [ ] Commit created
- [ ] All files included
- [ ] Stash dropped (optional)

---

## Rollback Procedure

### If Phase 1 Fails (Stash Apply)
```bash
git checkout .
# Stash preserved, try again
```

### If Phase 2-3 Fails (Build Errors)
```bash
git checkout .
# Start over from Phase 1
```

### If Phase 4 Fails (Runtime Errors)
```bash
git reset HEAD~1  # Undo commit if made
git checkout .
# Debug specific issue
```

### Nuclear Option
```bash
git checkout main
# Abandon recovery, use stable main
```
