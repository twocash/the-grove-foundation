# ARCHITECTURE DECISIONS: ExperiencesConsole Recovery v1

**Sprint:** experiences-console-recovery-v1  
**Date:** 2026-01-08

---

## AD-1: Use `git stash pop` vs `git stash apply`

### Decision
Use `git stash apply` (not `pop`) to preserve the stash as backup.

### Rationale
- `apply` keeps the stash in the list even after successful application
- If something goes wrong during subsequent steps, we can `git checkout .` and try again
- After full verification, we can manually `git stash drop stash@{0}`

### Consequences
- Extra manual step to clean up stash after success
- Safer recovery path

---

## AD-2: Adapt Orphaned index.ts vs Write Fresh

### Decision
Adapt the orphaned commit's `index.ts` by removing health check dependencies.

### Rationale
- The orphaned version (`e61877c`) is production-quality code
- It uses the correct factory pattern
- Only needs health check imports removed (those components don't exist yet)
- Writing fresh risks missing subtle patterns or exports

### Implementation
```typescript
// ADAPTED FROM: git show e61877c:src/bedrock/consoles/ExperienceConsole/index.ts
// CHANGES: 
// - Renamed ExperienceConsole → ExperiencesConsole (plural)
// - Removed health check imports (files don't exist yet)
// - Simplified to system-prompt-only functionality
```

### Consequences
- Clear provenance for the code
- Easy to re-add health checks later by uncommenting

---

## AD-3: Keep Folder Name as `ExperiencesConsole` (Plural)

### Decision
Do NOT rename the folder to `ExperienceConsole` (singular) in this sprint.

### Rationale
- The stash references `ExperiencesConsole` in routes
- Renaming requires updating imports across multiple files
- Route rename is a separate concern (deferred to future sprint)
- Minimizes diff and risk

### Consequences
- URL remains `/bedrock/experiences` (plural)
- Future sprint can do atomic rename

---

## AD-4: No Card Component Required

### Decision
The index.ts does NOT need a separate `SystemPromptCard` component.

### Rationale
- Looking at other consoles (LensWorkshop, PromptWorkshop), the `CardComponent` is optional
- The console-factory has a default card renderer
- The `SystemPromptEditor` handles the inspector panel
- Adding a card component is enhancement, not requirement

### Implementation
```typescript
export const ExperiencesConsole = createBedrockConsole({
  config: experiencesConsoleConfig,
  useData: useExperienceData,
  // CardComponent: SystemPromptCard,  // Optional - use default
  EditorComponent: SystemPromptEditor,
});
```

### Consequences
- Simpler initial implementation
- Cards use default rendering
- Can add custom card later for enhanced UX

---

## AD-5: Server-Side Changes Are Safe

### Decision
Accept server.js changes from stash without modification.

### Rationale
- The stash contains working server-side system prompt support
- Includes: cache, `getActiveSystemPrompt()`, cache invalidation API, debug endpoint
- These changes were tested and working before the failed sprint
- No conflicts expected (server.js unchanged since stash created)

### Verification
After apply, verify endpoints:
- `POST /api/cache/invalidate` - clears system prompt cache
- `GET /api/debug/system-prompt` - shows active prompt

---

## AD-6: Preserve All 4D Prompt Wiring

### Decision
Accept all 4D prompt wiring changes from stash (HOTFIX-002, HOTFIX-005, etc.)

### Rationale
- These improvements were part of the "fantastic shape" state
- Include: lens topic bridging, cross-lens fallback, telemetry integration
- Reverting them would degrade /explore functionality
- They're independent of the ExperiencesConsole feature

### Files Affected
- `src/core/context-fields/scoring.ts`
- `src/core/context-fields/adapters.ts`
- `src/explore/hooks/useNavigationPrompts.ts`
- `src/surface/components/KineticStream/*`
- `data/default-personas.ts` (topicInterests)

---

## Summary

| Decision | Choice | Risk |
|----------|--------|------|
| AD-1 | `git stash apply` | Low |
| AD-2 | Adapt orphaned index.ts | Low |
| AD-3 | Keep plural folder name | None |
| AD-4 | Skip CardComponent | Low |
| AD-5 | Accept server.js as-is | Low |
| AD-6 | Keep 4D wiring | None |
