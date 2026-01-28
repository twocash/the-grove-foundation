# S26-NUR Development Log

## Phase 1a: nurseryToSprout Adapter
**Started:** 2026-01-27
**Status:** complete

### Sub-phase 1a: Create adapter + type additions
- Created `src/core/adapters/nurseryToSprout.ts`
  - `NurseryBridgeInput` interface (avoids core→bedrock import violation)
  - `mapStatus()` maps ResearchSproutStatus → SproutStatus (3-value)
  - `mapStage()` maps ResearchSproutStatus → SproutStage (8-value botanical)
  - `nurseryToSprout()` full field mapping with provenance preservation
- Added `generatedArtifacts`, `promotedAt`, `promotionTier`, `promotionGardenDocId` to `SproutPayload` in `useNurseryData.ts`
- Added DB column mappings in `rowToGroveObject` for new fields
- Added `'promoted'` to `ResearchSproutStatus` union type in `research-sprout.ts`
- Added `'promoted'` to `VALID_STATUSES` array
- Added `promoted` transitions: `completed→promoted`, `promoted→archived`
- Fixed: `positionStatement` → `position` (correct ResearchDocument field)
- Gate: ✅ PASSED — Build succeeds, zero new TypeScript errors

### Files Changed
- `src/core/adapters/nurseryToSprout.ts` (NEW — 163 lines)
- `src/core/schema/research-sprout.ts` (MODIFIED — 3 edits)
- `src/bedrock/consoles/NurseryConsole/useNurseryData.ts` (MODIFIED — 3 edits)

### DEX Compliance
- Declarative Sovereignty: ✅ Adapter is pure mapping, no domain logic
- Capability Agnosticism: ✅ No model dependencies
- Provenance: ✅ All provenance fields preserved through mapping
- Organic Scalability: ✅ New fields are additive, adapter extends naturally

---

## Phase 1b: View Artifacts Button + SFR Modal Launch
**Started:** 2026-01-27
**Status:** complete

### Sub-phase 1b: Wire SFR modal from SproutEditor
- Added "View Artifacts" button with violet accent + artifact count badge
- Badge shows `generatedArtifacts.length` with `aria-label` for accessibility
- Added `aria-haspopup="dialog"` on Promote and View Artifacts buttons
- Imported and rendered SproutFinishingRoom modal
- Wired `nurseryToSprout` adapter via `useMemo` for efficient conversion
- Added post-promotion status display (green banner with timestamp + tier)
- `handlePromote` now opens SFR modal instead of direct archive
- Fixed GlassButton: `variant="primary" accent="violet"` (not `variant="violet"`)
- Gate: ✅ PASSED — Build succeeds, zero new TypeScript errors

### Files Changed
- `src/bedrock/consoles/NurseryConsole/SproutEditor.tsx` (MODIFIED — 5 edits, ~80 lines added)

### DEX Compliance
- Declarative Sovereignty: ✅ Badge visibility driven by data (artifact count)
- Capability Agnosticism: ✅ Modal is model-agnostic, adapter handles mapping
- Provenance: ✅ Full sprout context passed through adapter
- Organic Scalability: ✅ SFR modal is reusable from any context

---

## Phase 3a: Wire garden-bridge Promotion Pipeline
**Started:** 2026-01-27
**Status:** complete

### Sub-phase 3a: Real promotion from Nursery context
- Enhanced SFR `handlePromoteToGarden` to enrich `onSproutUpdate` callback with
  `promotionGardenDocId`, `promotionTier`, `promotedAt` from garden-bridge result
- Added fallback: `getSprout(sprout.id) ?? sprout` — Nursery sprouts live in Supabase,
  not localStorage, so getSprout() returns undefined for them
- Enhanced `handleSFRSproutUpdate` in SproutEditor to extract promotion data via type
  assertion (`Sprout & { promotionGardenDocId?, promotionTier? }`)
- Patch operations now include: status='promoted', promotedAt, promotionGardenDocId, promotionTier
- Post-promotion display now shows truncated Garden doc ID for traceability
- Gate: ✅ PASSED — Build succeeds in 9.96s, zero new TypeScript errors

### Files Changed
- `src/surface/components/modals/SproutFinishingRoom/SproutFinishingRoom.tsx` (MODIFIED — 1 edit)
- `src/bedrock/consoles/NurseryConsole/SproutEditor.tsx` (MODIFIED — 2 edits)

### DEX Compliance
- Declarative Sovereignty: ✅ Promotion pipeline is API-driven, no hardcoded logic
- Capability Agnosticism: ✅ garden-bridge is model-agnostic
- Provenance: ✅ gardenDocId, tier, promotedAt all tracked for full provenance chain
- Organic Scalability: ✅ Promotion fields are additive, tier system extensible

---

## Phase 3b: Promoted Navigation Tab
**Started:** 2026-01-27
**Status:** complete

### Sub-phase 3b: Config updates for promoted status
- Added `promoted` entry to `NURSERY_STATUS_CONFIG` (label: 'Promoted', icon: 'park', color: 'cyan')
- Added `promoted` navigation tab with filter `{ 'payload.status': 'promoted' }`
- Added `'promoted'` to `filterOptions` status select options
- Updated status comment header with promoted mapping
- Updated `StatusBadge.getDisplayStatus()` to return `'promoted'` for promoted sprouts
- Added `promoted` entry to `colorStyles` using semantic info CSS vars with fallbacks
- Typed `colorStyles` as `Record<NurseryDisplayStatus, React.CSSProperties>` for exhaustive key coverage
- Gate: ✅ PASSED — Build succeeds in 9.85s, zero new TypeScript errors

### Files Changed
- `src/bedrock/consoles/NurseryConsole/NurseryConsole.config.ts` (MODIFIED — 4 edits)
- `src/bedrock/consoles/NurseryConsole/SproutEditor.tsx` (MODIFIED — 2 edits)

### DEX Compliance
- Declarative Sovereignty: ✅ Status config is pure data, navigation driven by filter objects
- Capability Agnosticism: ✅ No model dependencies
- Provenance: ✅ Promoted status preserves full promotion chain metadata
- Organic Scalability: ✅ New status is additive — config, navigation, and filter all extend naturally
