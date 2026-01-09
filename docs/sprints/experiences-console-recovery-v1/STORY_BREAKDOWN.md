# STORY BREAKDOWN: ExperiencesConsole Recovery v1

**Sprint:** experiences-console-recovery-v1  
**Total Points:** 5  
**Estimated Time:** 30 minutes

---

## Stories

### Story 1: Pre-Flight Verification (1 point)

**Description:** Verify repository state before making changes

**Tasks:**
- [ ] Confirm on `hotfix/experiences-console-v1.1` branch
- [ ] Verify clean working directory (no uncommitted tracked changes)
- [ ] Confirm stash@{0} exists and contains expected content
- [ ] Preview stash contents with `git stash show stash@{0} --stat`

**Acceptance Criteria:**
- Branch is correct
- No conflicts expected
- Stash shows ~28 files, ~800+ insertions

---

### Story 2: Apply Stashed Changes (1 point)

**Description:** Restore the 28 files of working code from stash

**Tasks:**
- [ ] Run `git stash apply stash@{0}`
- [ ] Verify no merge conflicts
- [ ] Spot-check key files restored:
  - `src/router/routes.tsx` - has ExperiencesConsole import
  - `src/bedrock/config/navigation.ts` - has experiences entry
  - `server.js` - has system prompt cache (~160 new lines)

**Acceptance Criteria:**
- Stash applied successfully
- All 28 files modified
- No conflicts

---

### Story 3: Create Console Component (2 points)

**Description:** Create the missing index.ts that wires the console together

**Tasks:**
- [ ] Extract template from orphaned commit: `git show e61877c:src/bedrock/consoles/ExperienceConsole/index.ts`
- [ ] Create new file: `src/bedrock/consoles/ExperiencesConsole/index.ts`
- [ ] Adapt naming:
  - `ExperienceConsole` → `ExperiencesConsole`
  - `experienceConsoleConfig` → `experiencesConsoleConfig`
- [ ] Remove health check imports (files don't exist):
  - Remove `useCombinedExperienceData`
  - Remove `ExperienceCard`, `ExperienceEditor`
  - Remove `HealthCheckCard`, `HealthCheckEditor`
  - Remove `useHealthCheckData`
- [ ] Simplify to use `useExperienceData` directly
- [ ] Verify exports are correct

**Acceptance Criteria:**
- File exists at correct path
- No import errors
- Uses console-factory pattern
- Exports default component

**Code Template:**
```typescript
// src/bedrock/consoles/ExperiencesConsole/index.ts
// ExperiencesConsole - System Prompt Management
// Sprint: experiences-console-recovery-v1
// Adapted from: e61877c (health check features commented for future)

import { createBedrockConsole } from '../../patterns/console-factory';
import { experiencesConsoleConfig } from './ExperiencesConsole.config';
import { SystemPromptEditor } from './SystemPromptEditor';
import { useExperienceData } from './useExperienceData';
import type { SystemPromptPayload } from '@core/schema/system-prompt';

/**
 * Experiences Console
 *
 * Manages system prompts that control AI behavior on /explore.
 * Built using the Bedrock Console Factory pattern.
 *
 * Future: Will also manage health checks (see orphaned commit e61877c)
 */
export const ExperiencesConsole = createBedrockConsole<SystemPromptPayload>({
  config: experiencesConsoleConfig,
  useData: useExperienceData,
  EditorComponent: SystemPromptEditor,
  copilotTitle: 'System Prompt Copilot',
  copilotPlaceholder: 'Edit this system prompt with AI assistance...',
});

// Re-export configuration
export { experiencesConsoleConfig } from './ExperiencesConsole.config';

// Re-export components for custom use cases
export { SystemPromptEditor } from './SystemPromptEditor';

// Re-export data hooks
export { useExperienceData, createDefaultSystemPrompt } from './useExperienceData';
export type { ExperienceDataResult } from './useExperienceData';

// Re-export types
export type { SystemPromptPayload, SystemPrompt } from '@core/schema/system-prompt';

export default ExperiencesConsole;
```

---

### Story 4: Build & Runtime Verification (1 point)

**Description:** Verify the recovery works end-to-end

**Tasks:**
- [ ] Run `npm run build` - must succeed
- [ ] Run `npm run dev`
- [ ] Navigate to `/bedrock/experiences`
- [ ] Verify console loads
- [ ] Verify system prompts display
- [ ] Test edit → save flow
- [ ] Test activate flow
- [ ] Verify `/explore` uses active prompt

**Acceptance Criteria:**
- Build passes
- Console functional
- Activation works
- Integration verified

---

### Story 5: Commit & Document (0 points)

**Description:** Finalize the recovery with proper documentation

**Tasks:**
- [ ] Stage all changes: `git add -A`
- [ ] Create descriptive commit
- [ ] Update DEVLOG.md with completion notes
- [ ] Optionally drop stash: `git stash drop stash@{0}`

**Acceptance Criteria:**
- Clean commit history
- Recovery documented
- Stash cleaned up

---

## Execution Order

```
Story 1 (Pre-Flight) → Story 2 (Apply Stash) → Story 3 (Create index.ts)
                                                        ↓
                                              Story 4 (Verify)
                                                        ↓
                                              Story 5 (Commit)
```

---

## Time Estimates

| Story | Points | Time |
|-------|--------|------|
| 1. Pre-Flight | 1 | 2 min |
| 2. Apply Stash | 1 | 3 min |
| 3. Create index.ts | 2 | 10 min |
| 4. Verification | 1 | 10 min |
| 5. Commit | 0 | 5 min |
| **Total** | **5** | **30 min** |
