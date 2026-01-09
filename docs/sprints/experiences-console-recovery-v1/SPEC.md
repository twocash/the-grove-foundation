# SPEC: ExperiencesConsole Recovery v1

**Sprint:** experiences-console-recovery-v1  
**Type:** Recovery / Hotfix  
**Estimated Effort:** 30 minutes  
**Risk Level:** Low

---

## 1. Objective

Restore the ExperiencesConsole to its "fantastic shape" working state by:
1. Applying stashed changes that contain route/server wiring
2. Creating a minimal `index.ts` adapted from the orphaned commit
3. Verifying end-to-end system prompt management works

---

## 2. Scope

### In Scope
- Apply `stash@{0}` to restore 28 files of working code
- Create `ExperiencesConsole/index.ts` using console-factory pattern
- Verify build succeeds
- Verify route navigable
- Verify system prompt activation affects /explore

### Out of Scope (Deferred to Future Sprint)
- Route rename (experiences → experience singular)
- Health check integration
- Version history browser
- Status bug in footer
- Versioning workflow (fork/archive)

---

## 3. User Stories

### US-1: Apply Stashed Changes
**As a** developer  
**I want to** apply the stashed work-in-progress  
**So that** route wiring, navigation, and server-side support are restored

**Acceptance Criteria:**
- [ ] `git stash pop stash@{0}` succeeds without conflicts
- [ ] Routes file has ExperiencesConsole import and route
- [ ] Navigation file has experiences nav item
- [ ] Server.js has system prompt cache and APIs

### US-2: Create Console Component
**As a** developer  
**I want to** create the missing index.ts  
**So that** the route import resolves and console renders

**Acceptance Criteria:**
- [ ] `ExperiencesConsole/index.ts` exists
- [ ] Uses `createBedrockConsole` factory pattern
- [ ] Imports existing config, editor, and data hook
- [ ] Exports default component
- [ ] Build succeeds

### US-3: Verify End-to-End
**As a** user  
**I want to** manage system prompts via Bedrock  
**So that** I can control AI behavior on /explore

**Acceptance Criteria:**
- [ ] Navigate to `/bedrock/experiences` - loads without error
- [ ] System prompts from Supabase appear in list
- [ ] Can select a prompt and view in inspector
- [ ] Can edit fields and save
- [ ] Can activate a draft prompt
- [ ] /explore uses the active system prompt

---

## 4. Technical Requirements

### TR-1: Console Factory Pattern
The index.ts must follow the established console-factory pattern:

```typescript
import { createBedrockConsole } from '../../patterns/console-factory';
import { experiencesConsoleConfig } from './ExperiencesConsole.config';
import { SystemPromptEditor } from './SystemPromptEditor';
import { useExperienceData } from './useExperienceData';

export const ExperiencesConsole = createBedrockConsole({
  config: experiencesConsoleConfig,
  useData: useExperienceData,
  EditorComponent: SystemPromptEditor,
});

export default ExperiencesConsole;
```

### TR-2: Type Compatibility
The data hook returns `SystemPromptPayload` objects. The editor expects this type. Verify type alignment.

### TR-3: No Health Check Dependencies
The orphaned commit's index.ts imports health check components that don't exist in current branch. These must be commented out or removed.

---

## 5. Dependencies

### Required (Already Exist)
- `src/bedrock/patterns/console-factory.tsx`
- `src/bedrock/consoles/ExperiencesConsole/ExperiencesConsole.config.ts`
- `src/bedrock/consoles/ExperiencesConsole/SystemPromptEditor.tsx`
- `src/bedrock/consoles/ExperiencesConsole/useExperienceData.ts`
- `src/core/schema/system-prompt.ts`
- Supabase `system_prompts` table

### In Stash (Will Be Restored)
- Route entry in `routes.tsx`
- Navigation entry in `navigation.ts`
- Server-side API in `server.js`
- Chat service flag in `chatService.ts`

---

## 6. Verification Plan

### Build Verification
```bash
npm run build
# Must succeed with no errors
```

### Route Verification
1. Start dev server: `npm run dev`
2. Navigate to `/bedrock/experiences`
3. Console should load with system prompts

### Integration Verification
1. Edit a system prompt field
2. Save changes
3. Activate the prompt
4. Navigate to `/explore`
5. Verify AI uses the new system prompt behavior

---

## 7. Rollback Plan

If recovery fails:
```bash
# Undo stash apply
git checkout .

# Return to clean state
git status  # Should show only untracked files
```

The stash is preserved with `git stash pop` failure or can be reapplied with `git stash apply`.
