# User Stories, Acceptance Criteria & E2E Tests v2.0 Review

**Sprint:** S26-NUR — Nursery Inspector Rationalization + SFR Bridge
**Codename:** nursery-sfr-bridge-v1
**Phase:** Story Extraction + Acceptance Criteria + E2E Test Specs
**Scope:** Phases 1 and 3 ONLY (Phase 2 UI rationalization deferred)
**Status:** PM Reconciled — Ready for Approval

---

## Critical Observations

### 1. Cross-Boundary Import Problem

SproutFinishingRoom lives in `src/surface/components/modals/` but Nursery lives in `src/bedrock/consoles/`. Importing Surface code from Bedrock violates the layer boundary. The UX Chief mandates moving SFR to `src/shared/components/modals/` before wiring the bridge.

**Recommendation:** Epic 1 (Infrastructure) must complete the relocation BEFORE Epic 2 (Modal Interception) can begin. This is a hard dependency.

### 2. Type Shape Mismatch: SproutPayload vs Sprout

The Nursery operates on `GroveObject<SproutPayload>` (from `useNurseryData.ts`, ~20 fields including `spark`, `synthesis`, `qualityScore`, etc.), while SFR expects a `Sprout` object (from `src/core/schema/sprout.ts`, ~25 fields including `query`, `response`, `canonicalResearch`, `generatedArtifacts`, etc.).

These are **substantially different shapes**. Key mismatches:
- `SproutPayload.spark` → `Sprout.query`
- `SproutPayload.synthesis` → `Sprout.researchSynthesis`
- `SproutPayload` has no `response` field (Sprout requires it)
- `Sprout` has no `qualityScore`, `groveId`, `requiresReview` fields
- `SproutPayload` wraps in `GroveObject<T>` with `meta` + `payload`; `Sprout` is flat

**Recommendation:** A dedicated `nurseryToSprout()` adapter is required in `src/core/adapters/`. This adapter must document every field mapping and handle missing data gracefully.

### 3. Missing `generatedArtifacts` on SproutPayload

SFR reads `sprout.generatedArtifacts` (added to `Sprout` schema in S25-GSE) but `SproutPayload` in `useNurseryData.ts` has no such field. The adapter needs to either:
- (a) Add `generatedArtifacts` to `SproutPayload` and back it with Supabase, or
- (b) Initialize as empty `[]` in the adapter (Nursery sprouts haven't been through SFR yet)

**Recommendation:** Option (a) for full round-trip support. If a user opens SFR, generates artifacts, and closes, those artifacts should persist.

### 4. Broken Promote Handler is Simple Archive

Current `handlePromote()` in `SproutEditor.tsx:187-201` just sets `status='archived'` + `archiveReason='promoted'`. It does NOT call the garden-bridge pipeline. S26-NUR replaces this with modal launch → SFR → real promotion.

### 5. `ResearchSproutStatus` Needs 'promoted' Value

The current `ResearchSproutStatus` type (in `useNurseryData.ts`) does not include `'promoted'`. Adding it requires:
- TypeScript type update
- Supabase schema migration (if stored as enum)
- Config updates in `NurseryConsole.config.ts`
- Status badge styling

---

## Proposed v1.0 Simplifications

| Spec Feature | v1.0 Approach | Rationale |
|--------------|---------------|-----------|
| Phase 2 UI Rationalization | **Defer** | Executive direction: Phases 1+3 only |
| Cross-device artifact sync | **Defer** | Supabase persistence sufficient for single-device |
| Re-promote already-promoted sprout | **Block** | Show "Already Promoted" state, don't allow re-promotion |
| SFR customization for Nursery context | **Minimal** | Same SFR modal, just different launch context |
| Artifact round-trip persistence | **Phase 1** | Required for meaningful SFR integration |

---

## Epic 1: Infrastructure (Phase 1)

> Prerequisites and plumbing: relocate SFR, create type adapter, extend schemas, add GlassButton variant.

### US-N001: Relocate SproutFinishingRoom to Shared Module

**As a** developer
**I want to** move SproutFinishingRoom from `src/surface/` to `src/shared/components/modals/`
**So that** both Bedrock and Surface layers can import it without violating layer boundaries

**INVEST Assessment:**
- **I**ndependent: Yes — pure file move with import updates
- **N**egotiable: No — UX Chief blocking condition
- **V**aluable: Yes — unblocks cross-boundary usage
- **E**stimable: Yes — mechanical refactor
- **S**mall: Yes — move files, update imports
- **T**estable: Yes — build succeeds, existing tests pass

**Acceptance Criteria:**

```gherkin
Scenario: SFR module relocated to shared
  Given SproutFinishingRoom exists at src/surface/components/modals/SproutFinishingRoom/
  When the relocation is complete
  Then all SFR files exist at src/shared/components/modals/SproutFinishingRoom/
  And all existing imports from Surface components resolve correctly
  And Bedrock components can import from the shared path
  And the build completes with zero TypeScript errors

Scenario: No broken imports after relocation
  Given the relocation is complete
  When I run npm run build
  Then zero import resolution errors are reported
  And all existing SFR functionality works unchanged
```

**E2E Test Specification:**

```typescript
test('US-N001: SFR opens from /explore after relocation', async ({ page }) => {
  await page.goto('/explore');
  // Open a sprout that has research results
  await page.locator('[data-testid="sprout-card"]').first().click();
  // Verify SFR modal renders
  await expect(page.locator('[role="dialog"][aria-modal="true"]')).toBeVisible();
  await expect(page).toHaveScreenshot('sfr-after-relocation.png');
});
```

**Visual Verification Points:**
| State | Screenshot | Description |
|-------|------------|-------------|
| SFR from /explore | `sfr-after-relocation.png` | Modal renders identically post-move |

**Traceability:** UX Chief Blocking Condition #3

---

### US-N002: Create nurseryToSprout Type Adapter

**As a** developer
**I want to** create a `nurseryToSprout()` adapter in `src/core/adapters/`
**So that** `GroveObject<SproutPayload>` can be converted to `Sprout` for SFR consumption

**INVEST Assessment:**
- **I**ndependent: Yes — pure transform function
- **N**egotiable: Yes — field mapping details flexible
- **V**aluable: Yes — bridges the type gap between Nursery and SFR
- **E**stimable: Yes — known source and target shapes
- **S**mall: Yes — single function with field mapping
- **T**estable: Yes — unit testable with known inputs/outputs

**Acceptance Criteria:**

```gherkin
Scenario: Adapter maps all required Sprout fields
  Given a GroveObject<SproutPayload> from the Nursery
  When nurseryToSprout() is called
  Then the result has a valid Sprout.id (from meta.id)
  And Sprout.query maps from SproutPayload.spark
  And Sprout.response maps from SproutPayload.synthesis.summary or empty string
  And Sprout.capturedAt maps from meta.createdAt
  And Sprout.generatedArtifacts maps from SproutPayload.generatedArtifacts or []
  And Sprout.canonicalResearch is populated if synthesis exists
  And all required Sprout fields have valid values

Scenario: Adapter handles missing optional fields gracefully
  Given a SproutPayload with null synthesis
  When nurseryToSprout() is called
  Then Sprout.response defaults to ''
  And Sprout.researchSynthesis is undefined
  And Sprout.canonicalResearch is undefined
  And the result passes the isSprout() type guard

Scenario: Field mapping documentation exists
  Given the adapter file at src/core/adapters/nurseryToSprout.ts
  When a developer reads the file
  Then each field mapping is documented with source and target
  And edge cases (null, missing, empty) are documented
```

**E2E Test Specification:**

```typescript
// Unit test (not E2E, but required for adapter correctness)
test('US-N002: nurseryToSprout maps required fields', () => {
  const nurseryObject = createMockNurserySprout({ spark: 'test query' });
  const sprout = nurseryToSprout(nurseryObject);
  expect(sprout.query).toBe('test query');
  expect(sprout.id).toBe(nurseryObject.meta.id);
  expect(isSprout(sprout)).toBe(true);
});
```

**Traceability:** UX Chief Blocking Condition #4

---

### US-N003: Add generatedArtifacts to SproutPayload

**As a** developer
**I want to** add a `generatedArtifacts` field to `SproutPayload`
**So that** artifacts generated in SFR persist back to the Nursery sprout record

**INVEST Assessment:**
- **I**ndependent: Yes — schema extension
- **N**egotiable: Yes — storage mechanism flexible
- **V**aluable: Yes — enables round-trip artifact persistence
- **E**stimable: Yes — known pattern from S25-GSE
- **S**mall: Yes — one field addition + Supabase column
- **T**estable: Yes — field present after SFR interaction

**Acceptance Criteria:**

```gherkin
Scenario: SproutPayload includes generatedArtifacts field
  Given the SproutPayload type in useNurseryData.ts
  When a developer reads the type definition
  Then generatedArtifacts is an optional GeneratedArtifact[] field
  And the field has a JSDoc comment explaining its purpose

Scenario: Supabase schema supports generatedArtifacts
  Given the research_sprouts table in Supabase
  When a new migration is applied
  Then a generated_artifacts JSONB column exists
  And it defaults to null
  And existing rows are unaffected
```

**Traceability:** UX Chief Blocking Condition #1

---

### US-N004: Add 'promoted' to ResearchSproutStatus

**As a** developer
**I want to** add `'promoted'` to the `ResearchSproutStatus` type
**So that** promoted sprouts have a distinct status separate from 'archived'

**INVEST Assessment:**
- **I**ndependent: Yes — type extension
- **N**egotiable: No — required for post-promotion UX
- **V**aluable: Yes — distinguishes promoted from archived
- **E**stimable: Yes — mechanical type change + migration
- **S**mall: Yes — type change + 4 new fields
- **T**estable: Yes — status visible in UI

**Acceptance Criteria:**

```gherkin
Scenario: ResearchSproutStatus includes 'promoted'
  Given the ResearchSproutStatus type
  When a developer reads the type
  Then 'promoted' is a valid status value

Scenario: Promoted sprout has required metadata fields
  Given a sprout with status 'promoted'
  Then the payload includes promotedAt (ISO timestamp)
  And promotedToGardenId (string, the Garden document ID)
  And promotedTemplateName (string, the template used)
  And promotedTier (string, always 'seed' for v1)

Scenario: Supabase migration adds promoted status support
  Given the research_sprouts table
  When the migration runs
  Then status enum includes 'promoted'
  And promoted_at, promoted_to_garden_id, promoted_template_name, promoted_tier columns exist

Scenario: State machine allows transition to 'promoted'
  Given the canTransitionTo() function in research-sprout.ts
  When called with fromStatus='completed' and toStatus='promoted'
  Then it returns true
  When called with fromStatus='blocked' and toStatus='promoted'
  Then it returns false
  When called with fromStatus='archived' and toStatus='promoted'
  Then it returns false
  When called with fromStatus='promoted' and toStatus='promoted'
  Then it returns false (no self-transition)

Scenario: VALID_STATUSES includes 'promoted' with valid transitions
  Given the VALID_STATUSES constant in research-sprout.ts
  When a developer reads the transition map
  Then 'promoted' is a valid status entry
  And only 'completed' can transition to 'promoted'
  And 'promoted' can only transition to 'archived' (for manual override)
```

**Traceability:** UX Chief Blocking Condition #2, PM Reconciliation: canTransitionTo() state machine update

---

### US-N005: Verify GlassButton Violet Accent Meets Wireframe

**As a** developer
**I want to** verify that GlassButton's existing `accent="violet"` styling matches the wireframe specifications
**So that** the "View Artifacts" button renders correctly without additional CSS work

> **PM Note:** The `NeonAccent` type in `GlassButton.tsx` already includes `'violet'` with full accent styling (background, hover, text). This story is scoped to **verification and visual regression**, not implementation.

**INVEST Assessment:**
- **I**ndependent: Yes — verification task
- **N**egotiable: Yes — if existing styling matches, story is complete
- **V**aluable: Yes — confirms wireframe compliance without redundant work
- **E**stimable: Yes — inspect existing code + visual test
- **S**mall: Yes — read code, run visual test, done
- **T**estable: Yes — visual regression test

**Acceptance Criteria:**

```gherkin
Scenario: Existing violet accent matches wireframe
  Given a GlassButton with variant="primary" accent="violet"
  When the button renders
  Then the background uses var(--neon-violet) or its rgba variant
  And the text is legible against the violet background
  And hover state has slightly increased opacity
  And the styling matches the wireframe Section 1 specification

Scenario: Violet accent already defined in GlassButton
  Given the GlassButton source at src/bedrock/primitives/GlassButton.tsx
  When a developer reads the NeonAccent type and accentStyles map
  Then 'violet' is already a valid accent value
  And background, hover, and text color mappings exist
  And NO code changes are needed for the accent itself
```

**E2E Test Specification:**

```typescript
test('US-N005: GlassButton violet accent renders per wireframe', async ({ page }) => {
  // Navigate to a page with violet button
  await page.goto('/explore/nursery');
  await page.locator('[data-testid="sprout-card"]').first().click();
  const viewArtifactsBtn = page.locator('button:has-text("View Artifacts")');
  await expect(viewArtifactsBtn).toBeVisible();
  await expect(page).toHaveScreenshot('glass-button-violet.png');
});
```

**Visual Verification Points:**
| State | Screenshot | Description |
|-------|------------|-------------|
| Default | `glass-button-violet.png` | Existing violet accent matches wireframe |
| Hover | `glass-button-violet-hover.png` | Hover state visible |

**Traceability:** PM Reconciliation: GlassButton violet already exists, re-scoped to verification

---

## Epic 2: Modal Interception (Phase 3a)

> Replace the broken Promote handler with SFR modal launch. The core user journey.

### US-N006: Replace Promote Button with SFR Modal Launch

**As a** Nursery curator
**I want to** click "Promote to Garden" and see the Sprout Finishing Room modal
**So that** I can review the research, generate artifacts, and execute a real Garden promotion

**INVEST Assessment:**
- **I**ndependent: No — depends on US-N001 (relocation), US-N002 (adapter)
- **N**egotiable: Yes — exact button styling flexible
- **V**aluable: Yes — core sprint deliverable
- **E**stimable: Yes — event handler + modal state
- **S**mall: Yes — replace handler, add state, render modal
- **T**estable: Yes — click → modal appears

**Acceptance Criteria:**

```gherkin
Scenario: Promote button opens SFR modal
  Given I am viewing a sprout with status 'completed' (Ready) in the Nursery inspector
  When I click "Promote to Garden"
  Then the SproutFinishingRoom modal opens as an overlay
  And the modal receives the sprout data converted via nurseryToSprout()
  And the modal displays the three-column layout (provenance, document viewer, action panel)

Scenario: Promote button has modal indicator
  Given the Promote button is visible in the Status section
  When I look at the button
  Then it includes aria-haspopup="dialog" attribute
  And a subtle "Opens refinement modal" helper text appears below the button

Scenario: Promote button disabled states
  Given I am viewing a sprout in the Nursery inspector
  When the sprout status is 'archived'
  Then the Promote button is not visible
  When the sprout status is 'promoted'
  Then the Promote button is replaced by "Promoted" badge
  When the sprout status is 'blocked' (Failed)
  Then the Promote button is not visible

Scenario: Adapter failure prevents modal from opening
  Given a SproutPayload that fails nurseryToSprout() conversion
  When I click "Promote to Garden"
  Then an error toast appears: "Unable to prepare sprout for promotion"
  And the SFR modal does NOT open
  And the sprout status is unchanged
```

**E2E Test Specification:**

```typescript
test('US-N006: Promote opens SFR modal', async ({ page }) => {
  await page.goto('/explore/nursery');
  // Select a ready sprout
  await page.locator('[data-testid="sprout-card"]').first().click();

  // Click Promote
  await page.locator('button:has-text("Promote to Garden")').click();

  // Verify SFR modal opened
  await expect(page.locator('[role="dialog"][aria-modal="true"]')).toBeVisible();
  await expect(page.locator('[id="finishing-room-title"]')).toBeVisible();

  // Visual verification
  await expect(page).toHaveScreenshot('nursery-sfr-modal-open.png');
});

test('US-N006: Promote button has aria-haspopup', async ({ page }) => {
  await page.goto('/explore/nursery');
  await page.locator('[data-testid="sprout-card"]').first().click();
  const btn = page.locator('button:has-text("Promote to Garden")');
  await expect(btn).toHaveAttribute('aria-haspopup', 'dialog');
});
```

**Visual Verification Points:**
| State | Screenshot | Description |
|-------|------------|-------------|
| Before click | `nursery-promote-button.png` | Promote button with modal hint |
| After click | `nursery-sfr-modal-open.png` | SFR modal overlaid on Nursery |

**Traceability:** Executive Direction: Modal Interception Pattern, Definition of Done #1

---

### US-N007: SFR Garden-Bridge Executes from Nursery Context

**As a** Nursery curator
**I want to** complete a Garden promotion through the SFR modal launched from Nursery
**So that** the full two-step promotion pipeline (upload + provenance) executes correctly

**INVEST Assessment:**
- **I**ndependent: No — depends on US-N006 (modal launch)
- **N**egotiable: Yes — callback mechanism flexible
- **V**aluable: Yes — core sprint deliverable
- **E**stimable: Yes — wire existing garden-bridge
- **S**mall: Yes — callback from SFR back to Nursery editor
- **T**estable: Yes — promotion result returned

**Acceptance Criteria:**

```gherkin
Scenario: Successful promotion from Nursery SFR
  Given the SFR modal is open from the Nursery inspector
  And an artifact has been generated (version tab visible)
  When I click "Promote to Garden" in the SFR document viewer footer
  Then the garden-bridge promoteToGarden() function executes
  And a PromotionResult with success=true is returned
  And the SFR shows the promotion confirmation card
  And a success toast notification appears

Scenario: Promotion updates Nursery sprout status
  Given a successful Garden promotion from SFR
  When the promotion completes
  Then the Nursery sprout's status is updated to 'promoted'
  And promotedAt is set to the promotion timestamp
  And promotedToGardenId is set to the Garden document ID
  And promotedTemplateName is set to the template name used
  And the sprout is saved automatically

Scenario: Promotion failure shows error in SFR
  Given the SFR modal is open from the Nursery inspector
  When promotion fails at the upload step
  Then an error toast appears with the failure reason
  And the SFR remains open for retry
  And the Nursery sprout status is NOT changed

Scenario: Promotion failure at provenance step is non-fatal
  Given the SFR modal is open from the Nursery inspector
  When promotion succeeds at upload but fails at provenance patching
  Then the promotion is still considered successful (garden-bridge design)
  And a success toast appears
  And a console.warn is logged for the provenance failure
  And the Nursery sprout status is updated to 'promoted'

Scenario: Nursery status writeback on promotion success
  Given a successful promotion from SFR
  When the onSproutUpdate callback fires
  Then the Nursery updates the sprout via PatchOperation[]
  And status is set to 'promoted'
  And promotedAt, promotedToGardenId, promotedTemplateName fields are populated
  And the change persists to Supabase
```

**E2E Test Specification:**

```typescript
test('US-N007: Full promotion pipeline from Nursery', async ({ page }) => {
  await page.goto('/explore/nursery');
  await page.locator('[data-testid="sprout-card"]').first().click();
  await page.locator('button:has-text("Promote to Garden")').click();

  // Wait for SFR modal
  await expect(page.locator('[role="dialog"]')).toBeVisible();

  // Check if artifact exists or generate one
  const versionTab = page.locator('button:has-text("V1:")');
  if (await versionTab.isVisible()) {
    await versionTab.click();
  }

  // Click Promote to Garden in SFR
  const sfrPromote = page.locator('[role="dialog"] button:has-text("Promote to Garden")');
  await sfrPromote.click();

  // Wait for promotion result
  await expect(page.locator('text=Promoted to Garden')).toBeVisible({ timeout: 10000 });
  await expect(page).toHaveScreenshot('nursery-promotion-success.png');
});
```

**Visual Verification Points:**
| State | Screenshot | Description |
|-------|------------|-------------|
| Promoting | `nursery-promotion-in-progress.png` | Button shows "Promoting..." |
| Success | `nursery-promotion-success.png` | Confirmation card + toast |
| Error | `nursery-promotion-error.png` | Error toast in SFR context |

**Traceability:** Definition of Done #2

---

### US-N008: Closing SFR Without Promoting Preserves State

**As a** Nursery curator
**I want to** close the SFR modal without promoting and return to the inspector unchanged
**So that** I can review research without being forced to promote

**INVEST Assessment:**
- **I**ndependent: Yes — close handler already exists
- **N**egotiable: Yes — exact behavior flexible
- **V**aluable: Yes — non-destructive close is essential
- **E**stimable: Yes — verify existing close behavior
- **S**mall: Yes — ensure no side effects
- **T**estable: Yes — close and verify status unchanged

**Acceptance Criteria:**

```gherkin
Scenario: Close SFR without promoting
  Given the SFR modal is open from the Nursery inspector
  And no promotion has been executed
  When I click the close button (X) or press Escape
  Then the SFR modal closes
  And the Nursery inspector is still visible
  And the sprout status remains 'completed' (Ready)
  And no data is lost

Scenario: Close SFR preserves generated artifacts
  Given the SFR modal is open from the Nursery inspector
  And I generated an artifact within SFR
  And I did NOT promote
  When I close the SFR modal
  Then the generated artifacts are saved to the Nursery sprout's generatedArtifacts field
  And re-opening the SFR shows the previously generated artifacts
```

**E2E Test Specification:**

```typescript
test('US-N008: Close SFR without promoting', async ({ page }) => {
  await page.goto('/explore/nursery');
  await page.locator('[data-testid="sprout-card"]').first().click();

  // Note original status
  const statusBadge = page.locator('.status-badge').first();
  const originalStatus = await statusBadge.textContent();

  // Open SFR
  await page.locator('button:has-text("Promote to Garden")').click();
  await expect(page.locator('[role="dialog"]')).toBeVisible();

  // Close without promoting
  await page.keyboard.press('Escape');
  await expect(page.locator('[role="dialog"]')).not.toBeVisible();

  // Verify status unchanged
  await expect(statusBadge).toHaveText(originalStatus!);
  await expect(page).toHaveScreenshot('nursery-after-sfr-close.png');
});
```

**Visual Verification Points:**
| State | Screenshot | Description |
|-------|------------|-------------|
| After close | `nursery-after-sfr-close.png` | Inspector unchanged, status preserved |

**Traceability:** PM Note: Edge case — closing SFR without promoting

---

## Epic 3: Post-Promotion Display (Phase 3b)

> After promotion, the Nursery must reflect the new state clearly.

### US-N009: Post-Promotion Inspector State

**As a** Nursery curator
**I want to** see a clear "Promoted" state in the inspector after promoting a sprout
**So that** I know the sprout has been successfully promoted to the Garden

**INVEST Assessment:**
- **I**ndependent: No — depends on US-N004 ('promoted' status), US-N007 (promotion flow)
- **N**egotiable: Yes — exact layout flexible
- **V**aluable: Yes — core sprint deliverable
- **E**stimable: Yes — status section rendering
- **S**mall: Yes — conditional rendering in Status section
- **T**estable: Yes — visual verification

**Acceptance Criteria:**

```gherkin
Scenario: Promoted sprout shows violet badge and Garden card
  Given a sprout that has been promoted to Garden
  When I view it in the Nursery inspector
  Then the status badge shows "Promoted" in violet (var(--neon-violet))
  And the badge has aria-label="Status: Promoted to Garden"
  And a Garden Promotion card appears below the status badge
  And the card shows: Garden Document ID, template name used, promotion date, and tier (seed)
  And the "Promote to Garden" button is replaced by a "View in Garden" link/button

Scenario: Promoted sprout hides promote and archive buttons
  Given a sprout with status 'promoted'
  When I view the Status section
  Then the "Promote to Garden" button is NOT visible
  And the "Archive" button is NOT visible
  And the "View Artifacts" button remains visible (if artifacts exist)
```

**E2E Test Specification:**

```typescript
test('US-N009: Promoted sprout inspector state', async ({ page }) => {
  await page.goto('/explore/nursery');
  // Navigate to promoted tab
  await page.locator('nav >> text=Promoted').click();
  await page.locator('[data-testid="sprout-card"]').first().click();

  // Verify promoted badge
  const badge = page.locator('[aria-label*="Promoted"]');
  await expect(badge).toBeVisible();

  // Verify Garden card
  await expect(page.locator('text=Garden Document')).toBeVisible();
  await expect(page.locator('text=seed')).toBeVisible();

  // Verify no promote button
  await expect(page.locator('button:has-text("Promote to Garden")')).not.toBeVisible();

  await expect(page).toHaveScreenshot('nursery-promoted-inspector.png');
});
```

**Visual Verification Points:**
| State | Screenshot | Description |
|-------|------------|-------------|
| Promoted state | `nursery-promoted-inspector.png` | Violet badge + Garden card + no promote button |

**Traceability:** Definition of Done #3, Wireframe Section 4

---

### US-N010: Add 'Promoted' Navigation Tab and Status Config

**As a** Nursery curator
**I want to** filter the sprout list by "Promoted" status
**So that** I can quickly find all sprouts that have been promoted to Garden

**INVEST Assessment:**
- **I**ndependent: No — depends on US-N004 ('promoted' status type)
- **N**egotiable: Yes — icon and placement flexible
- **V**aluable: Yes — discoverability of promoted sprouts
- **E**stimable: Yes — declarative config change
- **S**mall: Yes — config entries only
- **T**estable: Yes — navigation renders, filter works

**Acceptance Criteria:**

```gherkin
Scenario: Promoted tab appears in navigation
  Given the Nursery Console navigation sidebar
  When I view the Status section
  Then a "Promoted" navigation item appears after "Archived"
  And it has the icon 'park' (garden tree icon)
  And clicking it filters to sprouts with status 'promoted'

Scenario: Promoted status in filter dropdown
  Given the collection view filter options
  When I open the Status filter
  Then 'promoted' is available as a filter option

Scenario: NURSERY_STATUS_CONFIG includes promoted entry
  Given the NURSERY_STATUS_CONFIG object
  When a developer reads it
  Then a 'promoted' entry exists with:
    | Field | Value |
    | label | Promoted |
    | icon | park |
    | color | violet |
    | description | Promoted to Knowledge Garden |

Scenario: Promoted status badge renders correctly
  Given a sprout card in the collection view with status 'promoted'
  When the card renders
  Then the status badge shows "Promoted" with violet styling
  And the badge uses aria-label for accessibility
```

**E2E Test Specification:**

```typescript
test('US-N010: Promoted navigation tab filters correctly', async ({ page }) => {
  await page.goto('/explore/nursery');

  // Click Promoted tab
  const promotedTab = page.locator('nav >> text=Promoted');
  await expect(promotedTab).toBeVisible();
  await promotedTab.click();

  // Verify filter applied
  const cards = page.locator('[data-testid="sprout-card"]');
  // All visible cards should have promoted badge
  for (const card of await cards.all()) {
    await expect(card.locator('[aria-label*="Promoted"]')).toBeVisible();
  }

  await expect(page).toHaveScreenshot('nursery-promoted-tab.png');
});
```

**Visual Verification Points:**
| State | Screenshot | Description |
|-------|------------|-------------|
| Tab selected | `nursery-promoted-tab.png` | Promoted tab active, filtered list |
| Empty state | `nursery-promoted-empty.png` | No promoted sprouts message |

**Traceability:** PM Note: NavigationConfig needs 'promoted' tab, Wireframe Section 4

---

### US-N011: Promoted Status Metric in Console Header

**As a** Nursery curator
**I want to** see a count of promoted sprouts in the console metrics bar
**So that** I can track promotion activity at a glance

**INVEST Assessment:**
- **I**ndependent: No — depends on US-N004
- **N**egotiable: Yes — metric placement flexible
- **V**aluable: Yes — operational visibility
- **E**stimable: Yes — follows existing metric pattern
- **S**mall: Yes — one config entry
- **T**estable: Yes — metric renders with count

**Acceptance Criteria:**

```gherkin
Scenario: Promoted metric appears in console header
  Given the Nursery Console metrics bar
  When the console loads
  Then a "Promoted" metric card appears with icon 'park'
  And the count reflects the number of sprouts with status 'promoted'
  And the accent color is violet
```

**Traceability:** Wireframe Section 4

---

## Epic 4: Artifact Visibility (Phase 3c)

> View Artifacts button in the inspector for sprouts that have generated documents.

### US-N012: View Artifacts Button in Inspector

**As a** Nursery curator
**I want to** see a "View Artifacts" button when a sprout has generated artifacts
**So that** I can open the SFR to review previously generated documents

**INVEST Assessment:**
- **I**ndependent: No — depends on US-N003 (generatedArtifacts field), US-N001 (SFR relocation)
- **N**egotiable: Yes — button placement and styling flexible
- **V**aluable: Yes — access to artifact history
- **E**stimable: Yes — conditional button rendering
- **S**mall: Yes — button + click handler
- **T**estable: Yes — button visible/hidden based on data

**Acceptance Criteria:**

```gherkin
Scenario: View Artifacts button visible when artifacts exist
  Given a sprout with generatedArtifacts.length > 0
  When I view the inspector
  Then a "View Artifacts" button appears in the Generate Document section
  And the button uses violet accent styling (GlassButton accent="violet")
  And a count badge shows the number of artifacts (e.g., "2")

Scenario: View Artifacts button hidden when no artifacts
  Given a sprout with generatedArtifacts undefined or empty
  When I view the inspector
  Then the "View Artifacts" button is NOT visible

Scenario: View Artifacts opens SFR with artifact tab active
  Given a sprout with 2 generated artifacts
  When I click "View Artifacts"
  Then the SFR modal opens
  And the first artifact's version tab (V1) is active by default
  And both version tabs are visible (V1, V2)

Scenario: Artifact count badge displays correctly
  Given a sprout with artifacts
  When I view the "View Artifacts" button
  Then the count badge shows the artifact count
  And for 1-9 artifacts, the badge shows the exact number
  And the badge uses neon-cyan background with dark text
```

**E2E Test Specification:**

```typescript
test('US-N012: View Artifacts button with count badge', async ({ page }) => {
  await page.goto('/explore/nursery');
  // Select a sprout with generated artifacts
  await page.locator('[data-testid="sprout-card"]').first().click();

  const viewBtn = page.locator('button:has-text("View Artifacts")');

  // If sprout has artifacts, button should be visible
  if (await viewBtn.isVisible()) {
    // Verify count badge
    const badge = viewBtn.locator('.count-badge');
    await expect(badge).toBeVisible();

    // Click to open SFR
    await viewBtn.click();
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    await expect(page).toHaveScreenshot('nursery-view-artifacts-sfr.png');
  }
});

test('US-N012: View Artifacts hidden when no artifacts', async ({ page }) => {
  await page.goto('/explore/nursery');
  // This test requires a sprout WITHOUT artifacts
  // Find one by checking the inspector
  await page.locator('[data-testid="sprout-card"]').first().click();
  // If no artifacts, button should not be present
  await expect(page).toHaveScreenshot('nursery-no-artifacts.png');
});
```

**Visual Verification Points:**
| State | Screenshot | Description |
|-------|------------|-------------|
| With artifacts | `nursery-view-artifacts-button.png` | Violet button with count badge |
| No artifacts | `nursery-no-artifacts.png` | No View Artifacts button |
| SFR opened | `nursery-view-artifacts-sfr.png` | SFR with version tabs |

**Traceability:** Wireframe Section 1, Wireframe Section 5

---

### US-N013: Re-opening SFR on Already-Promoted Sprout

**As a** Nursery curator
**I want to** open the SFR on an already-promoted sprout to review artifacts
**So that** I can view the promotion history and generated documents without re-promoting

**INVEST Assessment:**
- **I**ndependent: No — depends on US-N009, US-N012
- **N**egotiable: Yes — exact UX flexible
- **V**aluable: Yes — important edge case
- **E**stimable: Yes — conditional rendering in SFR
- **S**mall: Yes — check promotion status, hide promote button
- **T**estable: Yes — promoted sprout → SFR without promote action

**Acceptance Criteria:**

```gherkin
Scenario: SFR on promoted sprout shows read-only promotion state
  Given a sprout with status 'promoted' that has generated artifacts
  When I click "View Artifacts" to open the SFR
  Then the SFR modal opens with the artifact tabs visible
  And the "Promote to Garden" button in the SFR footer is NOT visible
  And the promotion confirmation card IS visible (showing previous promotion result)
  And I can browse all generated artifact tabs

Scenario: SFR on promoted sprout cannot re-promote
  Given a promoted sprout with the SFR open
  When I view the document viewer footer
  Then no promote action is available
  And a read-only promotion summary is shown instead
```

**E2E Test Specification:**

```typescript
test('US-N013: SFR on promoted sprout is read-only for promotion', async ({ page }) => {
  await page.goto('/explore/nursery');
  // Navigate to promoted tab
  await page.locator('nav >> text=Promoted').click();
  await page.locator('[data-testid="sprout-card"]').first().click();

  // Open SFR via View Artifacts
  await page.locator('button:has-text("View Artifacts")').click();
  await expect(page.locator('[role="dialog"]')).toBeVisible();

  // Verify no promote button in SFR
  await expect(page.locator('[role="dialog"] button:has-text("Promote to Garden")')).not.toBeVisible();

  // Verify promotion card is visible
  await expect(page.locator('[role="dialog"] >> text=Garden Document')).toBeVisible();

  await expect(page).toHaveScreenshot('nursery-sfr-promoted-readonly.png');
});
```

**Visual Verification Points:**
| State | Screenshot | Description |
|-------|------------|-------------|
| Read-only SFR | `nursery-sfr-promoted-readonly.png` | No promote button, promotion card visible |

**Traceability:** PM Note: Edge case — re-opening SFR on already-promoted sprout

---

## Accessibility Stories (Cross-Cutting)

### US-N014: Accessibility Attributes on Promote and Artifact Buttons

**As a** screen reader user
**I want to** have proper ARIA attributes on the Promote and View Artifacts buttons
**So that** I understand what each button does before activating it

**INVEST Assessment:**
- **I**ndependent: Yes — additive attributes
- **N**egotiable: Yes — exact labels negotiable
- **V**aluable: Yes — WCAG compliance
- **E**stimable: Yes — known attributes
- **S**mall: Yes — attribute additions
- **T**estable: Yes — automated ARIA audit

**Acceptance Criteria:**

```gherkin
Scenario: Promote button has dialog hint
  Given the "Promote to Garden" button is visible
  Then it has aria-haspopup="dialog"
  And it has an accessible name "Promote to Garden - opens refinement modal"

Scenario: Status badge is accessible
  Given any status badge (Ready, Promoted, Archived, Failed)
  Then it has aria-label="Status: {status name}"
  And the badge text is not the only indicator (icon + text + color)

Scenario: Post-promotion status change is announced
  Given a successful promotion
  When the status updates to "Promoted"
  Then an aria-live="polite" region announces the status change
  And the screen reader user hears "Status changed to Promoted"

Scenario: View Artifacts button has count context
  Given a "View Artifacts" button with count badge showing "3"
  Then the button has aria-label="View 3 artifacts - opens refinement modal"
  And the count badge has aria-hidden="true" (redundant with label)
```

**Traceability:** PM Note: Accessibility requirements

---

## E2E Test Summary

### Test File Structure

```
tests/e2e/s26-nur/
├── infrastructure.spec.ts        # US-N001, US-N005
├── modal-interception.spec.ts    # US-N006, US-N007, US-N008
├── post-promotion.spec.ts        # US-N009, US-N010, US-N011
├── artifact-visibility.spec.ts   # US-N012, US-N013
├── accessibility.spec.ts         # US-N014
└── fixtures/
    └── nursery-test-data.ts      # Mock sprout data
```

### Screenshot Baselines Required

| Screenshot | Story | State |
|------------|-------|-------|
| `sfr-after-relocation.png` | US-N001 | SFR from /explore post-move |
| `glass-button-violet.png` | US-N005 | Violet accent button |
| `nursery-promote-button.png` | US-N006 | Promote button with modal hint |
| `nursery-sfr-modal-open.png` | US-N006 | SFR overlaid on Nursery |
| `nursery-promotion-in-progress.png` | US-N007 | Promoting state |
| `nursery-promotion-success.png` | US-N007 | Promotion success |
| `nursery-promotion-error.png` | US-N007 | Promotion error toast |
| `nursery-after-sfr-close.png` | US-N008 | Inspector after closing SFR |
| `nursery-promoted-inspector.png` | US-N009 | Promoted state in inspector |
| `nursery-promoted-tab.png` | US-N010 | Promoted navigation tab |
| `nursery-promoted-empty.png` | US-N010 | Empty promoted tab |
| `nursery-view-artifacts-button.png` | US-N012 | Violet button with badge |
| `nursery-no-artifacts.png` | US-N012 | No artifacts state |
| `nursery-view-artifacts-sfr.png` | US-N012 | SFR with version tabs |
| `nursery-sfr-promoted-readonly.png` | US-N013 | Read-only SFR for promoted |

### Test Data Requirements

| Test | Required Data | Setup Method |
|------|---------------|--------------|
| US-N006 Happy Path | 1 ready sprout with synthesis | Seed via Supabase fixture |
| US-N007 Promotion | 1 ready sprout with generated artifact | Seed + mock API |
| US-N008 Close | 1 ready sprout | Seed via fixture |
| US-N009 Post-Promotion | 1 promoted sprout with Garden ID | Seed via fixture |
| US-N010 Navigation | Mix of ready, promoted, archived | Seed via fixture |
| US-N012 Artifacts | 1 sprout with generatedArtifacts[] | Seed via fixture |
| US-N013 Re-open | 1 promoted sprout with artifacts | Seed via fixture |

---

## Deferred to Phase 2 / Future Sprints

### US-N0XX: Inspector UI Rationalization (DEFERRED)

**Reason:** Phase 2 explicitly deferred per executive direction. Includes:
- Section reordering
- Collapsible section improvements
- Tag editor redesign
- Quality score display enhancements

**v1.1 Prerequisite:** S26-NUR Phase 1+3 complete

### US-N0XX: Writer Config Sprint (DEFERRED)

**Reason:** Separate sprint to be tackled after S26-NUR reaches "ready" state.

---

## Execution Risks

### Risk 1: Three-Type Sprout Confusion

The codebase has three distinct "Sprout" type systems that developers must distinguish:

| Type | Location | Used By |
|------|----------|---------|
| `Sprout` | `src/core/schema/sprout.ts` | SFR, /explore, localStorage |
| `SproutPayload` | `src/bedrock/consoles/NurseryConsole/useNurseryData.ts` | Nursery Console, Supabase |
| `SproutPayload` (Bedrock) | `src/bedrock/types/sprout.ts` (if exists) | Bedrock primitives |

**Mitigation:** US-N002 (adapter) must include explicit JSDoc documenting which `Sprout` type it converts FROM and TO. The adapter file name `nurseryToSprout` uses the naming convention `{source}To{target}` to reduce confusion. Consider adding a `// WARNING: This is NOT the same SproutPayload as...` comment at the top of any file that imports one vs the other.

### Risk 2: SFR Relocation Blast Radius

Moving SFR from `src/surface/` to `src/shared/` (US-N001) touches every file that imports from the old path. The SFR module has 7+ internal files and external consumers import at least `SproutFinishingRoom`, `GeneratedArtifact`, and `garden-bridge` types.

**Mitigation:** Use TypeScript path aliases (`@shared`) for the new location. Update all imports in a single atomic commit. Run full build + existing tests before proceeding to other stories.

### Risk 3: Supabase Migration for 'promoted' Status

Adding `'promoted'` to `ResearchSproutStatus` (US-N004) requires a Supabase migration. If the status is stored as a PostgreSQL enum, altering enums requires careful migration syntax. If stored as text, simpler but loses type safety.

**Mitigation:** Check the current column type before writing the migration. If enum, use `ALTER TYPE ... ADD VALUE 'promoted'`. If text, add CHECK constraint or rely on application-level validation.

---

## PM Reconciliation Notes

**Review Verdict:** APPROVED WITH NOTES (5 changes applied)

1. **US-N005 re-scoped:** GlassButton violet accent already exists — story changed from "add" to "verify existing meets wireframe"
2. **US-N004 expanded:** Added `canTransitionTo()` state machine AC — must update `VALID_STATUSES` map and state transition logic in `research-sprout.ts`
3. **US-N006 expanded:** Added adapter failure AC — toast error if `nurseryToSprout()` fails
4. **US-N007 expanded:** Added provenance failure non-fatal AC, Nursery status writeback AC
5. **Dependency graph updated:** Added US-N005→US-N009 soft dependency for violet badge styling

**PM Resolved Questions:**
- **Artifact persistence:** Immediate write via Supabase onSproutUpdate callback (consistent with /explore SFR behavior)
- **Garden document link:** Defer clickable link, show read-only Garden Document ID for v1
- **Metrics counter:** Optimistic update, consistent with existing ExperienceConsole patterns

---

## Open Questions

1. ~~**Artifact persistence round-trip**~~ — **RESOLVED by PM:** Immediate write via Supabase onSproutUpdate callback. Consistent with /explore SFR behavior.

2. ~~**Garden document link**~~ — **RESOLVED by PM:** Defer clickable link for v1. Show read-only Garden Document ID in the promoted inspector card.

3. ~~**Metrics counter update**~~ — **RESOLVED by PM:** Optimistic update. Consistent with existing ExperienceConsole patterns.

4. **`research-sprout.ts` location** — The `canTransitionTo()` function and `VALID_STATUSES` map need to be located. If they don't exist yet, US-N004 must create them. Verify during execution.

---

## Summary

| Story ID | Title | Priority | Complexity | E2E Tests | Epic |
|----------|-------|----------|------------|-----------|------|
| US-N001 | Relocate SFR to shared | P0 | M | 1 | Infrastructure |
| US-N002 | nurseryToSprout adapter | P0 | M | 1 (unit) | Infrastructure |
| US-N003 | Add generatedArtifacts to SproutPayload | P0 | S | 0 | Infrastructure |
| US-N004 | Add 'promoted' to ResearchSproutStatus | P0 | S | 0 | Infrastructure |
| US-N005 | Verify violet accent meets wireframe | P1 | S | 1 | Infrastructure |
| US-N006 | Promote opens SFR modal | P0 | M | 2 | Modal Interception |
| US-N007 | Garden-bridge from Nursery | P0 | M | 1 | Modal Interception |
| US-N008 | Close SFR preserves state | P0 | S | 1 | Modal Interception |
| US-N009 | Post-promotion inspector | P0 | M | 1 | Post-Promotion |
| US-N010 | Promoted navigation tab | P0 | S | 1 | Post-Promotion |
| US-N011 | Promoted metric | P1 | S | 0 | Post-Promotion |
| US-N012 | View Artifacts button | P1 | M | 2 | Artifact Visibility |
| US-N013 | Re-open SFR on promoted | P1 | S | 1 | Artifact Visibility |
| US-N014 | Accessibility attributes | P1 | S | 0 | Cross-Cutting |

**Total v1.0 Stories:** 14
**Total E2E Tests:** 12
**Visual Verification Points:** 15
**Deferred:** 2 (Phase 2 UI + Writer Config)

---

## Dependency Graph

```
US-N001 (Relocate SFR) ─────────┐
US-N002 (Type Adapter) ──────────┼──→ US-N006 (Modal Launch) ──→ US-N007 (Garden Bridge) ──→ US-N009 (Post-Promotion)
US-N003 (generatedArtifacts) ────┤                              US-N008 (Close SFR)          US-N010 (Nav Tab)
US-N004 ('promoted' status) ─────┘                                                            US-N011 (Metric)
US-N005 (Verify violet) ─── soft dependency ─→ US-N009 (Post-Promotion violet badge)
                         └──────────────────→ US-N012 (View Artifacts button)
                                               US-N013 (Re-open promoted)
US-N014 (Accessibility) ─── applies to US-N006, US-N009, US-N012
```

**Dependency Notes:**
- **Hard dependencies:** US-N001 through US-N004 MUST complete before US-N006. US-N006 MUST complete before US-N007.
- **Soft dependency:** US-N005 (verify violet) is soft — existing violet accent should work as-is. If visual testing reveals issues, US-N009 and US-N012 may need styling adjustments.
- **Parallel tracks:** After Epic 1 is done, Epic 2 (Modal Interception) and Epic 4 (Artifact Visibility) can run in parallel. Epic 3 (Post-Promotion) depends on Epic 2 completing.

---

## DEX Alignment Verification

| Pillar | How Stories Support |
|--------|---------------------|
| **Declarative Sovereignty** | All config changes (US-N010, US-N011) are in declarative config files (`NurseryConsole.config.ts`). Status mappings are data, not code. Template names loaded from Supabase at runtime, not hardcoded in UI. |
| **Capability Agnosticism** | The promotion pipeline (US-N007) uses the existing `garden-bridge.ts` which is model-agnostic. The type adapter (US-N002) is a pure transform — no AI model dependency. |
| **Provenance as Infrastructure** | Garden promotion (US-N007) preserves full provenance chain: sprout → artifact → Garden document. The `source_context` payload tracks templateId, templateName, sproutQuery, and generatedAt. Post-promotion state (US-N009) displays the provenance. |
| **Organic Scalability** | The SFR relocation (US-N001) to shared makes it available for future consoles. The adapter pattern (US-N002) is extensible to other type bridges. Adding 'promoted' status (US-N004) follows the existing config-driven status pattern. |
