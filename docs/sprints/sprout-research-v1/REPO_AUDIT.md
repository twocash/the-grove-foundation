# Repository Audit - Sprout Research v1

**Sprint:** `sprout-research-v1`
**Date:** January 10, 2026

---

## Phase 0.25: Route Verification - /explore

> **Goal:** Identify the exact component chain for /explore route to ensure we build into the correct integration point.

### Route Component Chain

| Layer | Component | File Path | Renders |
|-------|-----------|-----------|---------|
| Route | `/explore` | `src/router/routes.tsx:102` | ExploreEventProvider wrapper |
| Provider | `ExploreEventProvider` | `src/router/routes.tsx:104` | Feature-flagged event system |
| Page | `ExplorePage` | `src/surface/pages/ExplorePage.tsx` | EngagementProvider + shell |
| Provider | `EngagementProvider` | `src/core/engagement` | XState engagement context |
| Shell | `ExploreShell` | `src/surface/components/KineticStream/ExploreShell.tsx` | Main container |
| Input | `CommandConsole` | `src/surface/components/KineticStream/CommandConsole/index.tsx` | Text input + submit button |

### Verified Live Path

```
/explore route
  → ExploreEventProvider
    → ExplorePage
      → EngagementProvider
        → ExploreShell
          → CommandConsole (input: data-testid="command-input")
```

### Integration Point for sprout: command

**File:** `src/surface/components/KineticStream/ExploreShell.tsx`
**Function:** `handleSubmit` (lines 509-517)

```typescript
const handleSubmit = useCallback((displayText: string, executionPrompt?: string) => {
  scrollToBottom(false);
  submit(displayText, {
    personaBehaviors: effectivePersonaBehaviors,
    executionPrompt
  });
}, [submit, scrollToBottom, effectivePersonaBehaviors]);
```

**Strategy:** Intercept `displayText` starting with `sprout:` before calling `submit()`. Route to Prompt Architect dialog instead.

### Existing Capture Infrastructure

The codebase already has sprout capture infrastructure:

| Component | File | Purpose |
|-----------|------|---------|
| `SproutCaptureCard` | `KineticStream/Capture/components/SproutCaptureCard.tsx` | Capture form for text selection |
| `ResearchManifestCard` | `KineticStream/Capture/components/ResearchManifestCard.tsx` | Research directive capture |
| `useSproutStorage` | `hooks/useSproutStorage.ts` | localStorage CRUD for sprouts |
| `SproutTray` | `KineticStream/Capture/components/SproutTray.tsx` | Display captured sprouts |
| `ResearchManifest` | `@core/schema/sprout.ts` | Type for research manifests |

**Note:** This existing infrastructure is for *selection-based capture* (text selection → capture card). The new `sprout:` command system is different - it's *command-based research initiation* that creates structured research objects, not inline captures.

---

## Phase 0.5: System Prompt Pattern Audit

> **Goal:** Document the canonical singleton pattern used by System Prompt to ensure PromptArchitectConfig mirrors it exactly.

### Canonical Pattern: System Prompt Object

| Aspect | Location | Implementation |
|--------|----------|----------------|
| Schema | `src/core/schema/system-prompt.ts` | `SystemPromptPayload` interface with version, status |
| Version management | `src/bedrock/consoles/ExperiencesConsole/useExperienceData.ts` | `saveAndActivate()` creates new record, archives old |
| "Only one live" logic | Database constraint | `idx_system_prompts_unique_active` - partial unique index |
| UI components | `src/bedrock/consoles/ExperiencesConsole/SystemPromptEditor.tsx` | Status badges, activate/archive actions |
| Activation mechanism | `useExperienceData.ts:activate()` | Archives current → activates selected → cache invalidate → refetch |

### Singleton Pattern Details (from system-prompt-versioning-v1 sprint)

**Versioning Flow:**
1. User edits active prompt
2. Click "Save & Activate"
3. `saveAndActivate()` creates NEW record with incremented version
4. Old record archived (status: 'archived')
5. New record active (status: 'active')
6. Cache invalidated, UI refetched

**Database Enforcement:**
```sql
-- Only one row can have status='active' at a time
CREATE UNIQUE INDEX idx_system_prompts_unique_active
ON system_prompts (type)
WHERE status = 'active';
```

**Optimistic UI:**
- `pendingActivation` state in data hook for immediate card updates
- `justActivated` state in editor for immediate inspector updates

### Singleton vs Instance Pattern Distinction

#### System Prompt (Singleton Reference) ✅ DOCUMENTED

- [x] Schema location: `src/core/schema/system-prompt.ts`
- [x] How is "only one active" enforced? Database partial unique index + application logic in `activate()`
- [x] Is is_active a boolean flag or status enum? **Status enum**: `'active' | 'draft' | 'archived'`
- [x] What happens when activating a new version? Auto-archives previous active record

#### PromptArchitectConfig (New Singleton - Must Mirror System Prompt)

- [x] Will mirror System Prompt pattern exactly
- [x] One config per grove, multiple versions, one active
- [x] Uniqueness key: `(grove_id)` with `WHERE status = 'active'` partial index
- [x] Same lifecycle: draft → active → archived
- [x] Same `saveAndActivate()` pattern for versioning

#### ResearchSprout (New Instance Pattern - DIFFERENT from System Prompt)

- [x] DIFFERS from System Prompt pattern
- [x] Many sprouts per grove, each independently active
- [x] Multiple sprouts can be active simultaneously
- [x] Uniqueness key: `(sprout_id, version)` - version scoped to individual sprout
- [x] `is_active` scoped to parent `sprout_id`, NOT global to grove
- [x] No "only one active" constraint - many research tasks can run in parallel

### Schema Design Implications

| Object | is_active Scope | Constraint |
|--------|----------------|------------|
| SystemPrompt | Global (one per type) | `UNIQUE WHERE status='active'` on type |
| PromptArchitectConfig | Global (one per grove) | `UNIQUE WHERE status='active'` on grove_id |
| ResearchSprout | Per-sprout (many active) | No global constraint, each sprout tracks own version chain |

---

## Frozen Zone Verification

Files that must NEVER be modified:

```
components/Terminal/*              (entire directory tree) - 77 files
src/foundation/*                   (entire directory tree) - 23 files
```

**Note:** The directive referenced `src/surface/components/Terminal/*` but the actual Terminal is at `components/Terminal/*`.

### Pre-Sprint Frozen Zone Snapshot

| Zone | File Count | Verified |
|------|------------|----------|
| `components/Terminal/` | 77 | ✅ January 10, 2026 |
| `src/foundation/` | 23 | ✅ January 10, 2026 |

**Verification command for end of sprint:**
```bash
# Must match pre-sprint counts
find components/Terminal -type f | wc -l   # Expected: 77
find src/foundation -type f | wc -l        # Expected: 23
```

---

## Gate Status

- [x] **Phase 0.25 COMPLETE:** Route verification documented
- [x] **Phase 0.5 COMPLETE:** System Prompt pattern documented
- [ ] **Human Review:** Confirm integration point and pattern documentation before Phase 1
