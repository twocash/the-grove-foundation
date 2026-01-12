# feature-flags-v1 Development Log

Sprint: Feature Flags as GroveObjects
Date: 2026-01-12
Status: Complete

## Summary

Transformed feature flags from static JSON configuration to Supabase-backed GroveObject<FeatureFlagPayload> entities with full Experience Console management.

Key architectural decisions:
- **Instance cardinality**: Multiple flags can be active simultaneously (unlike Singleton pattern used for SystemPrompt)
- **Immutable flagId**: Once set, the flag identifier cannot be changed
- **Changelog tracking**: Only `available` field changes are logged with timestamps and reasons
- **User preferences**: Stored in localStorage with key `grove-feature-flags-prefs`
- **Admin kill switch**: `available: false` disables a flag regardless of user preference

---

## 2026-01-12

### Phase 1: Schema & Types
**Status:** Complete

Created FeatureFlagPayload interface with all required fields:
- `flagId` (string) - Immutable unique identifier
- `available` (boolean) - Admin kill switch
- `defaultEnabled` (boolean) - Default state for new users
- `showInExploreHeader` (boolean) - Header toggle visibility
- `headerLabel` (string | null) - Custom label for header
- `headerOrder` (number) - Sort order in header
- `category` (enum) - experience | research | experimental | internal
- `changelog` (array) - History of availability changes

Files created:
- `src/core/schema/feature-flag.ts`
- Modified `src/core/schema/grove-object.ts` (added 'feature-flag' type)

Build: Passing

### Phase 2: Data Layer
**Status:** Complete

#### 2a: Supabase Migration
Created migration for feature_flags table using JSONB meta+payload pattern (different from flattened columns in other tables).

Files:
- `supabase/migrations/011_feature_flags.sql`

#### 2b: useFeatureFlagsData Hook
Implemented CollectionDataResult interface for console integration with:
- CRUD operations via useGroveData
- `toggleAvailability()` with changelog tracking
- `headerFlags` getter for /explore integration
- `flagsByCategory` for filtered views

Files:
- `src/bedrock/consoles/ExperienceConsole/useFeatureFlagsData.ts`

#### 2c: Transform Functions
Created transforms for wizard integration and legacy migration:
- `createFeatureFlagFromWizard`
- `validateFeatureFlagWizardOutput`
- `migrateLegacyFeatureFlag`
- `migrateLegacyFeatureFlags`

Files:
- `src/bedrock/consoles/ExperienceConsole/transforms/feature-flag.transforms.ts`

#### 2d: Consumer Hook Rewrite
Rewrote `hooks/useFeatureFlags.ts` to:
- Read from Supabase as source of truth
- Fall back to legacy GCS flags for compatibility
- Store user preferences in localStorage
- Respect `available` field as admin kill switch

Files:
- `hooks/useFeatureFlags.ts` (complete rewrite)

Build: Passing

### Phase 3: Experience Console UI
**Status:** Complete

Created full console UI using Bedrock Console Factory pattern:

**FeatureFlagCard.tsx**
- Status bar indicator (green/red)
- Category badge with color coding
- Default enabled state indicator
- Header visibility badge
- Favorite toggle

**FeatureFlagEditor.tsx**
- Availability toggle with instant feedback
- Description textarea (BufferedTextarea)
- Default enabled checkbox
- Header display section with label/order inputs
- Category dropdown
- Changelog history view

**FeatureFlagConsole.config.ts**
- Metrics: Total, Available, Disabled, In Header
- Filters: Availability, Category, Header visibility
- Sort options: Updated, Name, Flag ID, Header Order

**FeatureFlagConsole.tsx**
- Uses `createBedrockConsole<FeatureFlagPayload>`
- Re-exports all components and hooks

Files:
- `src/bedrock/consoles/ExperienceConsole/FeatureFlagCard.tsx`
- `src/bedrock/consoles/ExperienceConsole/FeatureFlagEditor.tsx`
- `src/bedrock/consoles/ExperienceConsole/FeatureFlagConsole.config.ts`
- `src/bedrock/consoles/ExperienceConsole/FeatureFlagConsole.tsx`
- Modified `src/router/routes.tsx` (added /bedrock/feature-flags route)
- Modified `src/bedrock/config/navigation.ts` (added sidebar entry)
- Modified `src/bedrock/types/experience.types.ts` (registered type)

Build: Passing

### Phase 4: Header Integration
**Status:** Complete

Updated KineticHeader to accept dynamic feature flags:
- Added `HeaderFlag` interface
- Added `headerFlags` and `onFlagToggle` props
- Renders toggle buttons for flags with `showInExploreHeader: true`
- Filters out unavailable flags
- Matches existing toggle button styling (RAG, JOURNEY)

Connected ExploreShell to pass flags:
- Uses `useFeatureFlags()` hook
- Builds HeaderFlag array from `getHeaderFlags()`
- Passes `setUserPreference` as toggle handler

Files:
- `src/surface/components/KineticStream/KineticHeader.tsx`
- `src/surface/components/KineticStream/ExploreShell.tsx`
- `src/surface/components/KineticStream/index.ts` (exports)

Build: Passing

### Phase 5: Polish
**Status:** Complete

Final cleanup:
- Added HeaderFlag type export to KineticStream index
- Verified all imports and exports
- Confirmed navigation and routing work
- Build passes cleanly

---

## Visual Verification

Screenshots captured via Playwright:
1. `01-console-view.png` - Feature Flags Console at /bedrock/feature-flags
2. `02-empty-state.png` - Console with no flags (empty state)
3. `03-header-toggles.png` - Header at /explore showing toggles

---

## DEX Compliance

| Principle | Implementation |
|-----------|----------------|
| Declarative Sovereignty | Flag config stored as GroveObjects, not code |
| Capability Agnosticism | No LLM-specific logic in flag system |
| Provenance as Infrastructure | Changelog tracks all availability changes |
| Organic Scalability | New flags added via console, no code changes |

---

## User Stories Completed

- US-D001: Create/edit flags in console
- US-D002: Category filtering
- US-D003: Toggle availability with changelog
- US-D004: Configure header display
- US-D005: Consumer hook reads from Supabase
- US-D006: User preferences in localStorage
- US-D007: Admin kill switch (available: false)
- US-D008: Legacy fallback for GCS flags
- US-D009: Header toggles render dynamically

---

## Notes

- Feature flags table uses JSONB meta+payload pattern (different from other tables)
- Modified supabase-adapter.ts to handle both patterns via `JSONB_META_TYPES` set
- No seed data created - flags are created through console UI
- Test file created at `tests/e2e/feature-flags-v1-screenshots.spec.ts` for visual verification

---

## Post-Sprint Issue Resolution

### Vite Cache Issue (2026-01-12)

**Problem:** After completing Phase 5, the Feature Flags console displayed "Unknown object type: feature-flag" error at runtime, despite the code being correct on disk.

**Root Cause:** Vite's HMR cache was serving stale JavaScript. Error stack trace showed `supabase-adapter.ts:214` but the actual `subscribe()` method was at line 385, confirming browser was executing cached code that predated the `feature-flag` entry in TABLE_MAP.

**Resolution:**
1. Added cache-bust comment to `supabase-adapter.ts`
2. Cleared Vite cache (`rm -rf node_modules/.vite`)
3. Killed all Node processes
4. Restarted dev server
5. Used fresh browser tab for verification

**Verification:**
- Feature Flags Console renders correctly with empty state
- /explore page renders with header toggles (RAG ON, JOURNEY ON)
- Build passes cleanly

**Lesson Learned:** When debugging "code works but runtime fails" issues, check for:
1. Vite cache in `node_modules/.vite`
2. Browser caching (Ctrl+Shift+R may not be enough)
3. Multiple dev servers on different ports
4. Line number mismatches between error and source
