# EXECUTION PROMPT: ExperiencesConsole Recovery v1

**Sprint:** experiences-console-recovery-v1  
**Repository:** `C:\github\the-grove-foundation`  
**Branch:** `hotfix/experiences-console-v1.1`

---

## CONTEXT

The ExperiencesConsole was working perfectly before an ambitious refactoring sprint broke things. The working code is split between:
1. **Stash `stash@{0}`** - Contains 28 files with route/navigation/server-side wiring
2. **Orphaned commit `e61877c`** - Contains complete index.ts (but with health check features we need to strip)

Your job is to:
1. Apply the stash to restore the 28 files
2. Create a minimal index.ts adapted from the orphaned commit
3. Verify everything works

**Time estimate:** 30 minutes  
**Risk level:** Low - we're restoring known-working code

---

## PRE-FLIGHT CHECKLIST

Run these commands and verify output before proceeding:

```bash
cd C:\github\the-grove-foundation

# 1. Verify branch
git branch --show-current
# EXPECTED: hotfix/experiences-console-v1.1

# 2. Verify clean working directory
git status --short
# EXPECTED: Only untracked files (docs/hotfixes/*, docs/sprints/*)

# 3. Verify stash exists
git stash list
# EXPECTED: stash@{0}: On hotfix/experiences-console-v1.1: WIP: experiences-console-v1.1 hotfix work

# 4. Preview stash contents
git stash show stash@{0} --stat
# EXPECTED: 28 files changed, 813 insertions(+), 167 deletions(-)
```

**STOP if any verification fails.** Report the issue before proceeding.

---

## PHASE 1: APPLY STASH

### Step 1.1: Apply the stash (preserve original)

```bash
git stash apply stash@{0}
```

**Expected output:**
```
On branch hotfix/experiences-console-v1.1
Changes not staged for commit:
  (use "git add <file>..." to update what will be committed)
  (use "git restore <file>..." to discard changes in working directory)
        modified:   data/default-personas.ts
        modified:   data/narratives-schema.ts
        modified:   server.js
        modified:   services/chatService.ts
        modified:   src/App.tsx
        modified:   src/bedrock/config/navigation.ts
        modified:   src/bedrock/consoles/ExperiencesConsole/SystemPromptEditor.tsx
        modified:   src/bedrock/patterns/useCollectionView.ts
        ... (more files)
```

### Step 1.2: Verify key files restored

```bash
# Check routes.tsx has the import
findstr "ExperiencesConsole" src\router\routes.tsx
# EXPECTED: const ExperiencesConsole = lazy(() => import('../bedrock/consoles/ExperiencesConsole'));

# Check navigation.ts has the entry
findstr "experiences" src\bedrock\config\navigation.ts
# EXPECTED: Multiple matches including id: 'experiences', path: '/bedrock/experiences'

# Check server.js has system prompt cache
findstr "systemPromptCache" server.js
# EXPECTED: let systemPromptCache = { data: null, timestamp: 0 };
```

**If conflicts occurred:** Run `git checkout --theirs <file>` to accept stash version.

---

## PHASE 2: CREATE INDEX.TS

### Step 2.1: View the template from orphaned commit

```bash
git show e61877c:src/bedrock/consoles/ExperienceConsole/index.ts
```

This shows the complete index.ts with health check features. We need a simplified version.

### Step 2.2: Create the simplified index.ts

Create file: `src/bedrock/consoles/ExperiencesConsole/index.ts`

**Content:**

```typescript
// src/bedrock/consoles/ExperiencesConsole/index.ts
// ExperiencesConsole - System Prompt Management
// Sprint: experiences-console-recovery-v1
// 
// Manages system prompts that control AI behavior on /explore.
// Adapted from orphaned commit e61877c with health check features removed.
// Health check integration deferred to future sprint.

import { createBedrockConsole } from '../../patterns/console-factory';
import { experiencesConsoleConfig } from './ExperiencesConsole.config';
import { SystemPromptEditor } from './SystemPromptEditor';
import { useExperienceData } from './useExperienceData';
import type { SystemPromptPayload } from '@core/schema/system-prompt';

/**
 * Experiences Console
 *
 * Manages system prompts that control AI behavior on /explore.
 * Uses the Bedrock Console Factory pattern for consistent UX.
 *
 * Features:
 * - View all system prompts (active, draft, archived)
 * - Edit system prompt content and behaviors
 * - Activate/deactivate prompts
 * - Server-side cache invalidation on activation
 *
 * Future enhancements (see e61877c):
 * - Health check integration (read-only view)
 * - Combined experience object browser
 */
export const ExperiencesConsole = createBedrockConsole<SystemPromptPayload>({
  config: experiencesConsoleConfig,
  useData: useExperienceData,
  EditorComponent: SystemPromptEditor,
  copilotTitle: 'System Prompt Copilot',
  copilotPlaceholder: 'Edit this system prompt with AI assistance...',
});

// Re-export configuration for external use
export { experiencesConsoleConfig } from './ExperiencesConsole.config';

// Re-export editor component
export { SystemPromptEditor } from './SystemPromptEditor';

// Re-export data hook and factory
export { useExperienceData, createDefaultSystemPrompt } from './useExperienceData';
export type { ExperienceDataResult } from './useExperienceData';

// Re-export types for consumers
export type { SystemPromptPayload, SystemPrompt } from '@core/schema/system-prompt';

export default ExperiencesConsole;
```

### Step 2.3: Verify the file was created

```bash
dir src\bedrock\consoles\ExperiencesConsole\
# EXPECTED: index.ts now appears in the listing

type src\bedrock\consoles\ExperiencesConsole\index.ts | findstr "ExperiencesConsole"
# EXPECTED: export const ExperiencesConsole = createBedrockConsole
```

---

## PHASE 3: BUILD VERIFICATION

### Step 3.1: Run the build

```bash
npm run build
```

**Expected:** Build completes successfully with no errors.

### Step 3.2: Handle potential errors

**Error: Missing type export**
```
error TS2305: Module '"./useExperienceData"' has no exported member 'ExperienceDataResult'
```
**Fix:** Check `useExperienceData.ts` for actual export name. May be `UseExperienceDataResult` or similar.

**Error: Config name mismatch**
```
error TS2305: Module '"./ExperiencesConsole.config"' has no exported member 'experiencesConsoleConfig'
```
**Fix:** Check actual export name in config file. May be `ExperiencesConsoleConfig` or `EXPERIENCES_CONSOLE_CONFIG`.

**Error: createDefaultSystemPrompt not exported**
```
error TS2305: Module '"./useExperienceData"' has no exported member 'createDefaultSystemPrompt'
```
**Fix:** Remove that export line from index.ts, or add the export to useExperienceData.ts.

### Step 3.3: Verify build output

```bash
# Check the bundle was created
dir dist\assets\*.js
# EXPECTED: Multiple .js files present
```

---

## PHASE 4: RUNTIME VERIFICATION

### Step 4.1: Start dev server

```bash
npm run dev
```

Wait for: `VITE v5.x.x ready in xxx ms`

### Step 4.2: Test navigation

1. Open browser to `http://localhost:5173/bedrock`
2. Look for "Experiences" in the sidebar navigation
3. Click it - should navigate to `/bedrock/experiences`

**Expected:** Console loads without error, shows list of system prompts.

### Step 4.3: Test console functionality

1. **List view:** System prompts from Supabase should appear
2. **Selection:** Click a prompt card → inspector opens on right
3. **Editing:** Modify a field (e.g., identity text)
4. **Save:** Click Save → changes persist
5. **Activation:** For a draft prompt, click "Activate" button

### Step 4.4: Test integration

1. After activating a prompt, navigate to `/explore`
2. Send a test message
3. Verify the AI response reflects the active system prompt's behavior

**Tip:** Check browser console for:
```
[SystemPrompt] Using Supabase system prompt v{version}
```

---

## PHASE 5: COMMIT & CLEANUP

### Step 5.1: Stage all changes

```bash
git add -A
git status
# Verify all expected files are staged
```

### Step 5.2: Create commit

```bash
git commit -m "feat: restore ExperiencesConsole with stash recovery + index.ts

Sprint: experiences-console-recovery-v1

Restored from stash@{0}:
- Route wiring (routes.tsx)
- Navigation entry (navigation.ts)  
- Server-side system prompt cache and APIs (server.js)
- Chat service useSupabaseSystemPrompt flag (chatService.ts)
- Enhanced SystemPromptEditor with better activation UX
- 4D prompt wiring improvements (HOTFIX-002, HOTFIX-005)
- Kinetic stream integration with useSupabaseSystemPrompt: true

Created new:
- ExperiencesConsole/index.ts using console-factory pattern
- Adapted from orphaned e61877c, health check features deferred

Verified:
- Build succeeds
- Console loads at /bedrock/experiences
- System prompt CRUD operations work
- Activation updates /explore behavior"
```

### Step 5.3: Drop stash (optional)

```bash
git stash drop stash@{0}
```

### Step 5.4: Update devlog

Add completion note to `docs/sprints/experiences-console-recovery-v1/DEVLOG.md`

---

## VERIFICATION CHECKLIST

Before marking complete, verify:

- [ ] `npm run build` succeeds
- [ ] `/bedrock/experiences` loads without error
- [ ] System prompts appear in console list
- [ ] Can select and edit a prompt
- [ ] Can save changes
- [ ] Can activate a draft prompt
- [ ] `/explore` uses the active system prompt
- [ ] Browser console shows no errors
- [ ] Commit created with all changes

---

## IF SOMETHING GOES WRONG

### Build fails with type errors
1. Check the specific error message
2. Compare imports with actual exports in source files
3. Fix mismatches in index.ts

### Console loads but no data
1. Check browser console for Supabase errors
2. Verify `system_prompts` table exists and has data
3. Check network tab for API failures

### Activation doesn't work
1. Check browser console for errors
2. Verify `/api/cache/invalidate` endpoint exists in server.js
3. Check server logs for errors

### Nuclear rollback
```bash
git checkout .
git stash drop stash@{0}  # If you want to abandon
git checkout main
```

---

## HANDOFF NOTES

**What's done:**
- ExperiencesConsole fully functional for system prompt management
- Server-side caching and cache invalidation
- Integration with /explore via useSupabaseSystemPrompt flag
- 4D prompt wiring improvements

**What's deferred:**
- Route rename (experiences → experience singular)
- Health check integration
- Version history browser
- Status bug in footer
- Versioning workflow (fork/archive)

**Known issues:**
- None expected after clean recovery

---

**Sprint artifacts location:** `docs/sprints/experiences-console-recovery-v1/`
