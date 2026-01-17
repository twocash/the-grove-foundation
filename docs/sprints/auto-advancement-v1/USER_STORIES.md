# User Stories & Acceptance Criteria v1.0 Review

**Sprint:** S7-SL-AutoAdvancement
**Phase:** Story Extraction + Acceptance Criteria
**Epic:** Knowledge as Observable System (Phase 3 of 7)
**Status:** Draft for Review
**Date:** 2026-01-16

---

## Critical Observations

### 1. S6 Dependency Risk (Observable Signals)
**Issue:** Product Brief assumes S6 will provide observable signals (retrievals, citations, queryDiversity, utilityScore), but includes mock signals fallback strategy.

**Recommendation:** Split user stories into:
- **Tier 1 (Critical Path):** Stories that work with mock signals (prove engine works)
- **Tier 2 (S6 Integration):** Stories that require real signals (upgrade from mocks)

This ensures S7 can ship independently while maintaining clear integration path.

### 2. ExperienceConsole Pattern Extension
**Verification:** Product Brief correctly references v1.0 patterns:
- ✅ JSONB meta + payload (matches feature-flag, lifecycle-config)
- ✅ EXPERIENCE_TYPE_REGISTRY with `allowMultipleActive: true`
- ✅ useGroveData hook pattern for CRUD operations
- ✅ Quantum Glass v1.0 design tokens

No architectural drift detected. Stories can safely follow existing patterns.

### 3. Audit Model vs. Approve Model
**Clarity:** Product Brief clearly chooses "audit exceptions" over "approve every advancement" (Advisory Council: Adams + Taylor input).

**Story Impact:** Manual override and bulk rollback are **exception handling** stories, not **workflow approval** stories. This affects acceptance criteria (no approval queue UI needed).

### 4. Batch Processing Constraint
**Constraint:** Daily batch at 2am UTC (not event-driven). This affects:
- AC timing expectations (advancements happen once per day)
- Testing strategy (can't test real-time advancement)
- Notification timing (daily digest, not instant alerts)

Stories must reflect this batch constraint in scenarios.

---

## Proposed v1.0 Simplifications

### 1. Defer Visual Rule Builder (Phase 4)
**Rationale:** Product Brief explicitly defers json-render visual builder to Phase 4. S7 uses simple form builder (dropdowns + text inputs).

**Story Simplification:**
- ❌ Remove: "Drag-and-drop criteria builder" story
- ✅ Keep: "Create rule with form builder" story

### 2. Defer AI-Generated Rules (Phase 6)
**Rationale:** AI rule proposal requires pattern learning from historical data (not available in Phase 3).

**Story Simplification:**
- ❌ Remove: "AI proposes advancement rules" story
- ✅ Keep: "Operator creates rules manually" story

### 3. Simplify Notification System
**Rationale:** Product Brief mentions email/Slack but marks notification system as "FUTURE" soft dependency.

**Story Simplification:**
- ✅ MVP: Console logging for daily digest (sufficient for v1.0)
- 🔮 Future: Email/Slack integration (when notification system ready)

Stories should focus on audit trail visibility in ExperienceConsole, not external notifications.

---

## Epic Breakdown

### Epic 1: Advancement Rule Management (Foundation)
**Goal:** Operators can create, edit, enable/disable advancement rules via ExperienceConsole.

**Stories:**
- US-S001: Create advancement rule with criteria
- US-S002: Edit advancement rule
- US-S003: Enable/disable advancement rule
- US-S004: Delete advancement rule
- US-S005: View advancement rule in grid

---

### Epic 2: Automatic Evaluation Engine (Core Mechanism)
**Goal:** System automatically evaluates sprouts against rules and advances tiers.

**Stories:**
- US-S006: Daily batch evaluates all sprouts
- US-S007: Evaluate sprout against rule criteria
- US-S008: Update sprout tier on advancement
- US-S009: Log advancement event with provenance
- US-S010: Handle evaluation errors gracefully

---

### Epic 3: Operator Controls (Audit & Override)
**Goal:** Operators audit auto-advancements and override incorrect tier assignments.

**Stories:**
- US-S011: View advancement history
- US-S012: Manual tier override
- US-S013: Bulk rollback rule advancements
- US-S014: View advancement event details

---

### Epic 4: Gardener Experience (Visibility & Trust)
**Goal:** Gardeners understand why their sprouts advanced and trust the criteria.

**Stories:**
- US-S015: See tier badge update after advancement
- US-S016: View advancement reason in tooltip
- US-S017: View full audit trail for sprout

---

### Epic 5: ExperienceConsole Integration (Infrastructure)
**Goal:** Advancement rules integrate seamlessly with ExperienceConsole factory pattern.

**Stories:**
- US-S018: Register advancement-rule in EXPERIENCE_TYPE_REGISTRY
- US-S019: AdvancementRuleCard displays rule summary
- US-S020: AdvancementRuleEditor provides CRUD UI
- US-S021: useAdvancementRuleData hook provides data access

---

### Epic 6: S6 Integration (Real Signals)
**Goal:** Transition from mock signals to real observable signals when S6 completes.

**Stories:**
- US-S022: Fetch real signals from observable_signals table
- US-S023: Gracefully degrade when signals missing
- US-S024: Migrate from mock signals to real signals

---

## User Stories

---

## Epic 1: Advancement Rule Management

---

### US-S001: Create Advancement Rule with Criteria

**As an** operator managing a grove
**I want to** create an advancement rule that defines tier progression criteria
**So that** sprouts automatically advance when they meet observable usage thresholds

**INVEST Assessment:**
- ✅ Independent: Can be implemented without other stories (uses existing ExperienceConsole patterns)
- ✅ Negotiable: Criteria builder can start simple (form inputs), evolve to visual builder (Phase 4)
- ✅ Valuable: Core value proposition of S7 (automatic curation)
- ✅ Estimable: 2-3 days (schema + UI + validation)
- ✅ Small: Single user flow (create rule)
- ✅ Testable: Clear success criteria (rule persisted, appears in grid)

**Priority:** P0 (Critical Path)

**Dependencies:**
- S5-LifecycleEngine (lifecycle config for tier validation)
- ExperienceConsole factory pattern (existing)

**Acceptance Criteria:**

```gherkin
Scenario: Create simple advancement rule with single criterion
  Given I am an authenticated operator
  And the "botanical" lifecycle model exists with tiers ["seed", "sprout", "sapling", "tree", "grove"]
  When I navigate to "/bedrock/consoles/experience?tab=advancement-rules"
  And I click "Create New Rule" button
  And I fill in the rule form:
    | Field          | Value                              |
    | Rule Name      | Seed to Sprout (Basic)             |
    | Description    | Auto-advance sprouts with 10+ retrievals |
    | From Tier      | seed                               |
    | To Tier        | sprout                             |
    | Lifecycle Model| botanical                          |
  And I add criterion:
    | Signal     | Operator | Threshold |
    | retrievals | >=       | 10        |
  And I set logic operator to "AND"
  And I enable the rule
  And I click "Save Rule"
  Then the rule is persisted to the advancement_rules table
  And the rule appears in the grid with status "Enabled"
  And the rule card shows tier transition "🌰 → 🌱"
  And the rule card shows "1 criteria" badge

Scenario: Create complex advancement rule with multiple criteria
  Given I am creating an advancement rule
  When I add multiple criteria:
    | Signal          | Operator | Threshold |
    | retrievals      | >=       | 10        |
    | citations       | >=       | 3         |
    | queryDiversity  | >=       | 0.5       |
  And I set logic operator to "AND"
  And I save the rule
  Then all 3 criteria are persisted in the payload
  And the rule card shows "3 criteria" badge

Scenario: Validate tier selection from lifecycle config
  Given the "botanical" lifecycle model has tiers ["seed", "sprout", "sapling", "tree", "grove"]
  When I create an advancement rule
  Then the "From Tier" dropdown shows only valid tiers from the lifecycle model
  And the "To Tier" dropdown shows only valid tiers from the lifecycle model
  And I cannot select the same tier for both "From" and "To"

Scenario: Prevent invalid advancement rule (missing required fields)
  Given I am creating an advancement rule
  When I leave "Rule Name" empty
  And I click "Save Rule"
  Then the form shows validation error "Rule name is required"
  And the rule is not saved

Scenario: Prevent invalid advancement rule (invalid tier progression)
  Given the "botanical" lifecycle model has tier order [seed=0, sprout=1, sapling=2, tree=3, grove=4]
  When I create an advancement rule:
    | From Tier | To Tier |
    | tree      | seed    |
  And I click "Save Rule"
  Then the form shows validation error "Cannot advance backward (tree → seed)"
  And the rule is not saved

Scenario: Preview rule evaluation against sample sprout
  Given I am creating an advancement rule with criteria:
    | Signal     | Operator | Threshold |
    | retrievals | >=       | 10        |
  And a sample sprout exists with signals:
    | Signal     | Value |
    | retrievals | 15    |
  When I view the "Preview" section in the editor
  Then I see "Sample Sprout" dropdown with sprout options
  And I select the sample sprout
  And the preview shows:
    """
    Sprout: "Quantum Basics" (current tier: seed)
    Signals:
      retrievals: 15 ✓ (>= 10)

    Result: ✅ Would advance to sprout tier
    """
```

**Technical Notes:**
- Schema: `AdvancementRulePayload` with `criteria[]` and `logicOperator`
- Validation: Check tiers exist in lifecycle config before saving
- Preview: Use `evaluateAdvancement()` function with mock or real signals
- UI: Form builder with dropdowns (signal type, operator, lifecycle model)

---

### US-S002: Edit Advancement Rule

**As an** operator
**I want to** edit an existing advancement rule to refine criteria
**So that** I can improve accuracy based on observed false positives/negatives

**INVEST Assessment:**
- ✅ Independent: Builds on US-S001 but can be implemented separately
- ✅ Negotiable: Can start with simple edit (replace all fields), add partial updates later
- ✅ Valuable: Essential for iterating on rules based on real-world data
- ✅ Estimable: 1-2 days (editor UI + update logic)
- ✅ Small: Single CRUD operation (update)
- ✅ Testable: Clear success (rule updated, changes reflected in grid)

**Priority:** P0 (Critical Path)

**Acceptance Criteria:**

```gherkin
Scenario: Edit rule criteria
  Given an advancement rule exists:
    | Field      | Value               |
    | Rule Name  | Seed to Sprout      |
    | From Tier  | seed                |
    | To Tier    | sprout              |
    | Criteria   | retrievals >= 10    |
  When I click the rule card in the grid
  And the editor panel opens
  And I change criteria to:
    | Signal     | Operator | Threshold |
    | retrievals | >=       | 15        |
    | citations  | >=       | 5         |
  And I click "Save Changes"
  Then the rule payload is updated in Supabase
  And the rule card shows "2 criteria" badge
  And the meta.updatedAt timestamp is updated

Scenario: Edit rule status (enable/disable)
  Given an advancement rule exists with status "Enabled"
  When I open the rule editor
  And I click "Disable" button in the status banner
  Then the rule payload.isEnabled is set to false
  And the rule card status bar changes from green to gray
  And the rule card footer shows "Disabled" instead of "Enabled ✓"

Scenario: Cannot edit immutable fields
  Given an advancement rule exists with id "seed-to-sprout-basic"
  When I open the rule editor
  Then the "Rule ID" field is read-only (displays "seed-to-sprout-basic")
  And I cannot change the Rule ID

Scenario: Validate edited rule before saving
  Given I am editing an advancement rule
  When I change "From Tier" to "tree"
  And "To Tier" to "seed" (backward progression)
  And I click "Save Changes"
  Then the form shows validation error "Cannot advance backward"
  And the changes are not saved
  And the original rule remains unchanged in Supabase
```

**Technical Notes:**
- Update operation: PATCH to `advancement_rules` table
- Validation: Same rules as creation (tier order, required fields)
- Optimistic UI: Show changes immediately, revert on error

---

### US-S003: Enable/Disable Advancement Rule

**As an** operator
**I want to** quickly enable or disable an advancement rule
**So that** I can stop problematic rules without deleting them

**INVEST Assessment:**
- ✅ Independent: Simple toggle operation
- ✅ Negotiable: Can be implemented in card footer or editor (choose one or both)
- ✅ Valuable: Essential for error recovery (disable bad rule immediately)
- ✅ Estimable: 0.5 days (toggle button + payload update)
- ✅ Small: Single field update (isEnabled boolean)
- ✅ Testable: Clear success (rule enabled/disabled, batch skips disabled rules)

**Priority:** P0 (Critical Path)

**Acceptance Criteria:**

```gherkin
Scenario: Disable rule from card footer
  Given an advancement rule exists with status "Enabled"
  When I click the "Enabled ✓" button in the card footer
  Then the button label changes to "Disabled"
  And the card status bar changes from green to gray
  And the payload.isEnabled is set to false in Supabase
  And the next batch run will skip this rule

Scenario: Enable rule from editor
  Given an advancement rule exists with status "Disabled"
  When I open the rule editor
  And the status banner shows "🔴 Rule Disabled"
  And I click "Enable" button
  Then the banner changes to "🟢 Rule Enabled"
  And the payload.isEnabled is set to true
  And the card status bar changes from gray to green

Scenario: Batch evaluation skips disabled rules
  Given 3 advancement rules exist:
    | Rule Name        | Status   |
    | Rule A           | Enabled  |
    | Rule B           | Disabled |
    | Rule C           | Enabled  |
  When the daily batch evaluation runs at 2am
  Then only Rule A and Rule C are evaluated
  And Rule B is skipped
  And the batch log shows "2 active rules evaluated"
```

**Technical Notes:**
- Toggle updates `payload.isEnabled` field only
- Batch job filters `WHERE payload->>'isEnabled' = 'true'`
- No confirmation modal needed (simple toggle, reversible)

---

### US-S004: Delete Advancement Rule

**As an** operator
**I want to** delete an advancement rule that is no longer needed
**So that** I can keep the rule list clean and focused

**INVEST Assessment:**
- ✅ Independent: Standard CRUD delete operation
- ✅ Negotiable: Can add soft delete vs. hard delete later
- ✅ Valuable: Housekeeping (avoid cluttered rule list)
- ✅ Estimable: 0.5 days (delete button + confirmation modal)
- ✅ Small: Single DELETE operation
- ✅ Testable: Rule removed from database and grid

**Priority:** P1 (Important, not blocking)

**Acceptance Criteria:**

```gherkin
Scenario: Delete advancement rule with confirmation
  Given an advancement rule exists named "Old Rule"
  When I open the rule editor
  And I click "Delete" button
  Then a confirmation modal appears:
    """
    Delete "Old Rule"?

    This will:
    • Remove the rule from active evaluation
    • Preserve historical advancement events (audit trail)
    • Cannot be undone

    [Cancel] [Delete]
    """
  When I click "Delete"
  Then the rule is deleted from advancement_rules table
  And the rule card is removed from the grid
  And historical advancement_events with this rule_id remain intact

Scenario: Cancel rule deletion
  Given I am viewing the delete confirmation modal
  When I click "Cancel"
  Then the modal closes
  And the rule is not deleted
  And the editor remains open

Scenario: Prevent accidental deletion (confirmation required)
  Given an advancement rule exists
  When I click "Delete" button
  Then the rule is NOT immediately deleted
  And a confirmation modal must be acknowledged first
```

**Technical Notes:**
- Hard delete from `advancement_rules` table (rule no longer needed)
- Preserve `advancement_events` with this `rule_id` (audit trail)
- Foreign key: `advancement_events.rule_id` should allow NULL (rule deleted but event preserved)

---

### US-S005: View Advancement Rule in Grid

**As an** operator
**I want to** see all advancement rules in a grid layout
**So that** I can quickly scan active rules and their status

**INVEST Assessment:**
- ✅ Independent: Display-only story (no mutations)
- ✅ Negotiable: Grid layout can start simple, add filters/sorting later
- ✅ Valuable: Entry point for rule management (must see before edit)
- ✅ Estimable: 1 day (AdvancementRuleCard component)
- ✅ Small: Single component (card rendering)
- ✅ Testable: Visual regression test + unit test

**Priority:** P0 (Critical Path)

**Acceptance Criteria:**

```gherkin
Scenario: Display advancement rules in grid
  Given 3 advancement rules exist:
    | Rule Name          | From Tier | To Tier | Status   | Criteria Count |
    | Seed to Sprout     | seed      | sprout  | Enabled  | 2              |
    | Sprout to Sapling  | sprout    | sapling | Disabled | 1              |
    | Sapling to Tree    | sapling   | tree    | Enabled  | 3              |
  When I navigate to "/bedrock/consoles/experience?tab=advancement-rules"
  Then I see 3 rule cards in a grid layout
  And each card shows:
    | Element       | Example                          |
    | Status bar    | Green (enabled) or Gray (disabled)|
    | Icon          | ⬆️ (advancement icon)            |
    | Title         | "Seed to Sprout"                 |
    | ID            | "seed-to-sprout"                 |
    | Description   | "Auto-advance sprouts with..."   |
    | Tier transition| 🌰 → 🌱                          |
    | Criteria badge| "2 criteria"                     |
    | Footer toggle | "Enabled ✓" or "Disabled"        |

Scenario: Empty state when no rules exist
  Given no advancement rules exist
  When I navigate to the advancement rules tab
  Then I see an empty state message:
    """
    No advancement rules yet

    Create your first rule to enable automatic tier advancement
    based on observable usage signals.

    [Create New Rule]
    """

Scenario: Click card to open editor
  Given an advancement rule exists named "Seed to Sprout"
  When I click the rule card
  Then the AdvancementRuleEditor panel opens on the right
  And the editor loads the rule data
  And the form is pre-filled with current values
```

**Technical Notes:**
- Component: `AdvancementRuleCard.tsx` (follows FeatureFlagCard pattern)
- Grid: CSS Grid or Flexbox with responsive columns
- Status bar: Green (#10b981) for enabled, Gray (#6b7280) for disabled
- Tier emojis: Fetch from lifecycle config (referenced by lifecycleModelId)

---

## Epic 2: Automatic Evaluation Engine

---

### US-S006: Daily Batch Evaluates All Sprouts

**As a** system administrator
**I want** the system to automatically run advancement evaluation at 2am UTC daily
**So that** sprouts advance tiers without manual intervention

**INVEST Assessment:**
- ✅ Independent: Core engine logic (no UI dependencies)
- ✅ Negotiable: Batch time configurable, can add manual trigger later
- ✅ Valuable: Core automation mechanism (essence of S7)
- ✅ Estimable: 2 days (cron job + orchestration logic)
- ✅ Small: Single batch job (evaluates all sprouts)
- ✅ Testable: Can trigger manually in test, verify results

**Priority:** P0 (Critical Path)

**Acceptance Criteria:**

```gherkin
Scenario: Daily batch evaluates all enabled rules
  Given 2 advancement rules exist:
    | Rule Name     | Status   | From Tier | To Tier |
    | Rule A        | Enabled  | seed      | sprout  |
    | Rule B        | Disabled | sprout    | sapling |
  And 100 sprouts exist with tier "seed"
  When the daily batch runs at 2am UTC
  Then the system queries all enabled rules (Rule A only)
  And the system evaluates all 100 sprouts against Rule A
  And sprouts meeting criteria are advanced to "sprout" tier
  And the batch completes successfully

Scenario: Batch logs summary statistics
  Given the daily batch runs
  And 10 sprouts advanced
  And 5 evaluations failed (signal fetch error)
  And 85 sprouts did not meet criteria
  When the batch completes
  Then the system logs summary:
    """
    [AdvancementBatch] Complete: {
      advanced: 10,
      failed: 5,
      skipped: 85,
      duration: 1234ms
    }
    """

Scenario: Batch handles evaluation errors gracefully
  Given 100 sprouts exist
  And 1 sprout has invalid tier "unknown"
  When the daily batch runs
  Then the batch continues evaluating remaining 99 sprouts
  And the error is logged:
    """
    [AdvancementBatch] Failed for sprout <id>: Invalid tier "unknown"
    """
  And the batch summary shows failed: 1, advanced: <count>, skipped: <count>

Scenario: Batch skips sprouts at max tier
  Given the lifecycle model has max tier "grove"
  And 10 sprouts exist with tier "grove"
  When the daily batch runs
  Then those 10 sprouts are excluded from evaluation
  And the query filters with `.neq('tier', 'grove')`
  And no evaluation is attempted for max-tier sprouts

Scenario: Manual batch trigger (for testing/debugging)
  Given I am an operator
  When I navigate to the advancement history panel
  And I click "Run Evaluation Now" button
  Then the batch evaluation runs immediately (not waiting for 2am)
  And the results appear in the history panel
  And the manual trigger is logged in advancement_events with event_type: 'manual-batch'
```

**Technical Notes:**
- Cron schedule: `0 2 * * *` (2am UTC daily)
- Implementation: `src/core/jobs/advancementBatchJob.ts`
- Orchestration: Query rules → query sprouts → evaluate → update → log
- Error handling: Catch per-sprout errors, continue batch

---

### US-S007: Evaluate Sprout Against Rule Criteria

**As a** system
**I want to** evaluate whether a sprout meets advancement rule criteria
**So that** I can determine if the sprout should advance tiers

**INVEST Assessment:**
- ✅ Independent: Pure function (testable in isolation)
- ✅ Negotiable: Can start with simple operators (>=, ==), add complex later
- ✅ Valuable: Core evaluation logic (brain of the engine)
- ✅ Estimable: 1.5 days (evaluation engine + unit tests)
- ✅ Small: Single function (`evaluateAdvancement`)
- ✅ Testable: 100% unit test coverage expected

**Priority:** P0 (Critical Path)

**Acceptance Criteria:**

```gherkin
Scenario: Evaluate single criterion (retrievals >= threshold)
  Given a sprout with tier "seed"
  And observable signals: { retrievals: 15, citations: 5 }
  And an advancement rule:
    | From Tier | To Tier | Criteria           | Logic |
    | seed      | sprout  | retrievals >= 10   | AND   |
  When I evaluate the sprout against the rule
  Then the result is:
    """
    {
      shouldAdvance: true,
      toTier: "sprout",
      ruleId: "<rule-id>",
      criteriaMet: [{ signal: "retrievals", operator: ">=", threshold: 10 }],
      signalValues: { retrievals: 15, citations: 5 }
    }
    """

Scenario: Evaluate multiple criteria with AND logic
  Given a sprout with signals: { retrievals: 15, citations: 5 }
  And a rule with criteria:
    | Signal     | Operator | Threshold |
    | retrievals | >=       | 10        |
    | citations  | >=       | 3         |
  And logic operator: AND
  When I evaluate the sprout
  Then both criteria are met (15 >= 10 AND 5 >= 3)
  And shouldAdvance: true

Scenario: Evaluate multiple criteria with AND logic (one criterion fails)
  Given a sprout with signals: { retrievals: 15, citations: 2 }
  And a rule with criteria:
    | Signal     | Operator | Threshold |
    | retrievals | >=       | 10        |
    | citations  | >=       | 3         |
  And logic operator: AND
  When I evaluate the sprout
  Then the first criterion passes (15 >= 10)
  But the second criterion fails (2 >= 3)
  And shouldAdvance: false (AND requires all criteria)

Scenario: Evaluate multiple criteria with OR logic
  Given a sprout with signals: { retrievals: 5, citations: 10 }
  And a rule with criteria:
    | Signal     | Operator | Threshold |
    | retrievals | >=       | 10        |
    | citations  | >=       | 5         |
  And logic operator: OR
  When I evaluate the sprout
  Then the first criterion fails (5 >= 10)
  But the second criterion passes (10 >= 5)
  And shouldAdvance: true (OR requires at least one criterion)

Scenario: Graceful degradation when signal missing
  Given a sprout with signals: { retrievals: 15 }
  And a rule with criteria:
    | Signal          | Operator | Threshold |
    | retrievals      | >=       | 10        |
    | queryDiversity  | >=       | 0.5       |
  And logic operator: AND
  When I evaluate the sprout
  Then the retrievals criterion is evaluated (15 >= 10) ✓
  And the queryDiversity criterion is SKIPPED (signal missing)
  And shouldAdvance: false (AND logic, missing criterion treated as unmet)

Scenario: Support all comparison operators
  Given a sprout with signals: { utilityScore: 0.75 }
  When I evaluate against different operators:
    | Operator | Threshold | Result (0.75 compared to threshold) |
    | >=       | 0.5       | true (0.75 >= 0.5)                  |
    | >        | 0.75      | false (0.75 > 0.75)                 |
    | ==       | 0.75      | true (0.75 == 0.75)                 |
    | <        | 1.0       | true (0.75 < 1.0)                   |
    | <=       | 0.75      | true (0.75 <= 0.75)                 |
  Then all operator evaluations match expected results
```

**Technical Notes:**
- Function signature: `evaluateAdvancement(sprout, signals, rules): AdvancementResult | null`
- Pure function (no side effects, fully testable)
- Returns first matching rule (priority = rule order)
- Missing signals: Skip criterion, continue evaluation (graceful degradation)

---

### US-S008: Update Sprout Tier on Advancement

**As a** system
**I want to** update a sprout's tier when advancement criteria are met
**So that** the tier badge reflects the new tier

**INVEST Assessment:**
- ✅ Independent: Database update operation
- ✅ Negotiable: Can add optimistic locking later to prevent race conditions
- ✅ Valuable: Makes advancement visible to users
- ✅ Estimable: 0.5 days (SQL update + cache invalidation)
- ✅ Small: Single UPDATE statement
- ✅ Testable: Verify tier updated in database

**Priority:** P0 (Critical Path)

**Acceptance Criteria:**

```gherkin
Scenario: Update sprout tier after successful evaluation
  Given a sprout exists:
    | id   | tier | promoted_at | title          |
    | 123  | seed | 2026-01-10  | Quantum Basics |
  When the batch evaluation determines advancement:
    | toTier | ruleId          |
    | sprout | seed-to-sprout  |
  Then the sprout record is updated:
    """
    UPDATE sprouts
    SET tier = 'sprout', promoted_at = NOW()
    WHERE id = '123'
    """
  And the sprout.tier is now "sprout"
  And the sprout.promoted_at is updated to batch run timestamp

Scenario: Invalidate tier badge cache after update
  Given a sprout was advanced from "seed" to "sprout"
  When the tier is updated in Supabase
  Then the system calls `invalidateTierCache(sproutId)`
  And the next TierBadge render fetches fresh tier data
  And the badge displays "🌱 Sprout" (not cached "🌰 Seed")

Scenario: Atomic tier update (prevent race conditions)
  Given 2 rules both target the same sprout:
    | Rule       | From  | To      |
    | Rule A     | seed  | sprout  |
    | Rule B     | seed  | sapling |
  When both rules evaluate to true in the same batch
  Then only the FIRST matching rule is applied (Rule A)
  And the sprout advances to "sprout" (not "sapling")
  And only one UPDATE is executed (atomic operation)

Scenario: Do not update tier if already advanced
  Given a sprout has tier "sprout"
  And a rule targets "seed → sprout"
  When the batch evaluation runs
  Then the rule does not match (fromTier "seed" != current tier "sprout")
  And no UPDATE is executed
  And the tier remains "sprout"
```

**Technical Notes:**
- Update: `UPDATE sprouts SET tier = ?, promoted_at = NOW() WHERE id = ?`
- Cache invalidation: Trigger revalidation in useGroveData hook
- Atomic: Batch processes each sprout once per run (no concurrent updates)

---

### US-S009: Log Advancement Event with Provenance

**As a** system
**I want to** log every automatic advancement with full provenance (rule, signals, timestamp)
**So that** operators can audit why advancements occurred

**INVEST Assessment:**
- ✅ Independent: Audit logging (doesn't affect main flow)
- ✅ Negotiable: Can add more fields later (operator notes, etc.)
- ✅ Valuable: Essential for trust + debugging
- ✅ Estimable: 1 day (advancement_events table + logging logic)
- ✅ Small: Single INSERT operation
- ✅ Testable: Verify event logged with correct data

**Priority:** P0 (Critical Path)

**Acceptance Criteria:**

```gherkin
Scenario: Log auto-advancement event
  Given a sprout advanced from "seed" to "sprout"
  And the rule used was "seed-to-sprout-basic"
  And the criteria met were:
    | Signal     | Operator | Threshold | Actual |
    | retrievals | >=       | 10        | 15     |
    | citations  | >=       | 3         | 5      |
  And the full signal snapshot was: { retrievals: 15, citations: 5, queryDiversity: 0.7 }
  When the advancement is processed
  Then an event is logged to advancement_events:
    """
    INSERT INTO advancement_events (
      sprout_id,
      rule_id,
      from_tier,
      to_tier,
      criteria_met,
      signal_values,
      timestamp,
      event_type
    ) VALUES (
      '123',
      'seed-to-sprout-basic',
      'seed',
      'sprout',
      '[{"signal":"retrievals","operator":">=","threshold":10,"actual":15}, ...]',
      '{"retrievals":15,"citations":5,"queryDiversity":0.7}',
      '2026-01-16T02:00:00Z',
      'auto-advancement'
    )
    """

Scenario: Log manual override event
  Given an operator manually changes a sprout from "sprout" to "seed"
  And the operator provides reason: "Low quality content despite high retrievals"
  When the manual override is processed
  Then an event is logged with:
    | Field         | Value                                           |
    | event_type    | manual-override                                 |
    | rule_id       | NULL (no rule used)                             |
    | operator_id   | alex@example.com                                |
    | reason        | "Low quality content despite high retrievals"   |

Scenario: Log bulk rollback event
  Given an operator bulk rollbacks 50 sprouts from rule "bad-rule"
  When the rollback is processed
  Then a single event is logged with:
    | Field       | Value                               |
    | event_type  | bulk-rollback                       |
    | rule_id     | bad-rule                            |
    | operator_id | alex@example.com                    |
    | reason      | "Rule criteria too permissive"      |
  And 50 individual advancement_events are marked as "rolled_back: true" in metadata

Scenario: Query advancement history for sprout
  Given a sprout has 3 advancement events:
    | Timestamp            | From  | To      | Event Type       |
    | 2026-01-14T02:00:00Z | seed  | sprout  | auto-advancement |
    | 2026-01-15T02:00:00Z | sprout| sapling | auto-advancement |
    | 2026-01-16T10:30:00Z | sapling| sprout | manual-override  |
  When I query advancement_events for this sprout_id
  Then I receive all 3 events in chronological order
  And I can see the full tier progression history
```

**Technical Notes:**
- Table: `advancement_events` with JSONB fields for criteria_met and signal_values
- Indexes: `idx_advancement_events_sprout`, `idx_advancement_events_rule`, `idx_advancement_events_timestamp`
- Event types: `auto-advancement`, `manual-override`, `bulk-rollback`

---

### US-S010: Handle Evaluation Errors Gracefully

**As a** system
**I want to** handle evaluation errors without failing the entire batch
**So that** one bad sprout doesn't block all advancements

**INVEST Assessment:**
- ✅ Independent: Error handling (orthogonal to happy path)
- ✅ Negotiable: Can start with basic logging, add retries later
- ✅ Valuable: Essential for production resilience
- ✅ Estimable: 1 day (error handling + logging)
- ✅ Small: Try/catch blocks + error logging
- ✅ Testable: Inject errors, verify graceful degradation

**Priority:** P1 (Important for production)

**Acceptance Criteria:**

```gherkin
Scenario: Continue batch evaluation when one sprout fails
  Given 100 sprouts exist
  And sprout #50 has invalid tier "unknown"
  When the daily batch runs
  Then the evaluation fails for sprout #50
  And the error is logged:
    """
    [AdvancementBatch] Failed for sprout 50: Invalid tier "unknown"
    """
  And the batch continues evaluating sprouts #51-100
  And the batch summary shows: { advanced: <count>, failed: 1, skipped: <count> }

Scenario: Handle missing signal gracefully
  Given a rule requires signal "queryDiversity"
  And a sprout has signals { retrievals: 15 } (queryDiversity missing)
  When the evaluation runs
  Then the queryDiversity criterion is skipped (logged as warning)
  And the evaluation continues with remaining criteria
  And the log shows:
    """
    [AdvancementEvaluator] Signal 'queryDiversity' missing for sprout <id>, skipping criterion
    """

Scenario: Handle Supabase connection failure
  Given the daily batch is running
  And Supabase connection fails mid-batch
  When the error occurs
  Then the batch retries 3 times with exponential backoff (5s, 15s, 30s)
  And if all retries fail, the batch exits with error
  And an operator notification is sent:
    """
    Subject: Advancement Batch Failed
    Body: Daily evaluation failed after 3 retries. Check Supabase connection.
    """

Scenario: Handle invalid rule configuration
  Given an advancement rule has invalid criteria:
    """
    { signal: "invalidSignal", operator: ">=", threshold: 10 }
    """
  When the batch evaluation loads this rule
  Then the rule is skipped with error log:
    """
    [AdvancementBatch] Invalid rule <rule-id>: Unknown signal type "invalidSignal"
    """
  And other valid rules continue to evaluate
```

**Technical Notes:**
- Error handling: Try/catch per sprout (don't fail entire batch)
- Logging: Structured logs with sprout ID, rule ID, error message
- Retry logic: Exponential backoff for transient errors (network, Supabase)
- Graceful degradation: Skip missing signals, invalid rules

---

## Epic 3: Operator Controls

---

### US-S011: View Advancement History

**As an** operator
**I want to** view recent advancement events grouped by batch run
**So that** I can audit auto-advancements and spot anomalies

**INVEST Assessment:**
- ✅ Independent: Read-only view (no mutations)
- ✅ Negotiable: Can start with simple list, add filters/grouping later
- ✅ Valuable: Essential for audit model (operators review exceptions)
- ✅ Estimable: 1.5 days (AdvancementHistoryPanel component)
- ✅ Small: Single panel component
- ✅ Testable: Verify events displayed correctly

**Priority:** P0 (Critical Path)

**Acceptance Criteria:**

```gherkin
Scenario: View advancement history grouped by batch run
  Given 3 advancement events occurred:
    | Timestamp            | Sprout           | From  | To      | Rule               |
    | 2026-01-16T02:00:00Z | Quantum Basics   | seed  | sprout  | seed-to-sprout     |
    | 2026-01-16T02:00:00Z | CRISPR Notes     | seed  | sprout  | seed-to-sprout     |
    | 2026-01-15T02:00:00Z | Dark Matter      | sprout| sapling | sprout-to-sapling  |
  When I navigate to the advancement history panel
  Then I see events grouped by batch timestamp:
    """
    Jan 16, 2am (2 advancements) ▼
      ├─ "Quantum Basics" → sprout
      │  Rule: seed-to-sprout
      │  Criteria: retrievals: 15 (>=10), citations: 5 (>=3)
      │
      └─ "CRISPR Notes" → sprout
         Rule: seed-to-sprout
         Criteria: retrievals: 12 (>=10), citations: 4 (>=3)

    Jan 15, 2am (1 advancement) ▼
      └─ "Dark Matter" → sapling
         Rule: sprout-to-sapling
    """

Scenario: Expand batch to see individual events
  Given a batch run shows "Jan 16, 2am (10 advancements)"
  And the batch is initially collapsed
  When I click the batch header "▼"
  Then the batch expands to show all 10 events
  And each event shows: sprout name, tier transition, rule name, criteria met

Scenario: Filter advancement history by date range
  Given advancement events exist from Jan 1 - Jan 16
  When I select filter "Last 7 Days"
  Then only events from Jan 10 - Jan 16 are shown
  And older events are hidden

Scenario: Filter advancement history by rule
  Given events exist from 3 different rules
  When I select filter "Rule: seed-to-sprout"
  Then only events triggered by that rule are shown
  And events from other rules are hidden

Scenario: View empty state when no advancements occurred
  Given no advancement events exist
  When I navigate to the advancement history panel
  Then I see:
    """
    No advancement events yet

    Advancements will appear here after the daily batch runs (2am UTC)
    or when you create and enable advancement rules.
    """
```

**Technical Notes:**
- Component: `AdvancementHistoryPanel.tsx`
- Query: `SELECT * FROM advancement_events ORDER BY timestamp DESC LIMIT 100`
- Grouping: Client-side grouping by batch timestamp (truncate to hour)
- Expand/collapse: State management for batch expansion

---

### US-S012: Manual Tier Override

**As an** operator
**I want to** manually override a sprout's tier
**So that** I can correct false positives from auto-advancement

**INVEST Assessment:**
- ✅ Independent: Manual action (orthogonal to auto-advancement)
- ✅ Negotiable: Can start with simple tier change, add reason field later
- ✅ Valuable: Essential for audit model (override exceptions)
- ✅ Estimable: 1.5 days (modal + override logic)
- ✅ Small: Single modal + UPDATE operation
- ✅ Testable: Verify tier changed and event logged

**Priority:** P0 (Critical Path)

**Acceptance Criteria:**

```gherkin
Scenario: Manual tier override from advancement history
  Given a sprout "Dark Matter Theory" has tier "published"
  And the sprout appears in advancement history (auto-advanced yesterday)
  When I click the advancement event row
  And I click "Manual Override" button
  Then a modal opens:
    """
    Manual Tier Override

    Sprout: "Dark Matter Theory"
    Current Tier: published

    Override to: [validated ▼]

    Reason (optional):
    [Low utility score despite high citations]

    This will:
    • Change tier: published → validated
    • Log manual override event
    • Keep advancement event for audit trail

    [Cancel] [Override Tier]
    """

Scenario: Execute manual override
  Given the override modal is open
  When I select "validated" from the tier dropdown
  And I enter reason "Low utility score despite high citations"
  And I click "Override Tier"
  Then the sprout.tier is updated to "validated" in Supabase
  And an advancement_event is logged with:
    | Field       | Value                                   |
    | event_type  | manual-override                         |
    | from_tier   | published                               |
    | to_tier     | validated                               |
    | operator_id | alex@example.com                        |
    | reason      | "Low utility score despite high citations" |
  And the TierBadge cache is invalidated
  And the modal closes
  And the advancement history panel refreshes

Scenario: Cancel manual override
  Given the override modal is open
  When I click "Cancel"
  Then the modal closes
  And no tier change occurs
  And no event is logged

Scenario: Validate tier override (cannot select same tier)
  Given a sprout has tier "published"
  When I open the manual override modal
  And I select "published" from the dropdown
  Then the "Override Tier" button is disabled
  And a hint shows "Current tier already published"
```

**Technical Notes:**
- Modal: Confirmation required (prevent accidental overrides)
- Reason field: Optional but recommended (encourages documentation)
- Event log: `event_type: 'manual-override'` with operator_id

---

### US-S013: Bulk Rollback Rule Advancements

**As an** operator
**I want to** rollback all advancements from a problematic rule
**So that** I can quickly fix mistakes from overly permissive criteria

**INVEST Assessment:**
- ✅ Independent: Bulk operation (uses existing events table)
- ✅ Negotiable: Can start with all-or-nothing, add selective rollback later
- ✅ Valuable: Essential for error recovery (bad rule affects many sprouts)
- ✅ Estimable: 2 days (rollback logic + confirmation modal)
- ✅ Small: Single bulk UPDATE + event logging
- ✅ Testable: Verify all sprouts reverted and events logged

**Priority:** P1 (Important for production safety)

**Acceptance Criteria:**

```gherkin
Scenario: Bulk rollback all advancements from specific rule
  Given a rule "seed-to-tree-fast-track" advanced 50 sprouts yesterday
  And the rule criteria were too permissive (retrievals >= 1)
  When I open the rule detail view
  And I click "Bulk Rollback" button
  Then a confirmation modal opens:
    """
    Bulk Rollback

    Rule: "seed-to-tree-fast-track"
    This will revert 50 sprouts:

    • From: tree tier
    • To: seed tier (original)
    • Time window: Last 24 hours

    Audit trail will preserve:
    • Original advancement events (marked as "rolled back")
    • Rollback event (reason, timestamp, operator)

    Reason (required):
    [Rule criteria too permissive (retrievals >= 1)]

    [Cancel] [Rollback 50 Sprouts]
    """

Scenario: Execute bulk rollback
  Given the rollback modal is open
  When I enter reason "Rule criteria too permissive"
  And I click "Rollback 50 Sprouts"
  Then the system:
    1. Queries all advancement_events where rule_id = "seed-to-tree-fast-track" AND timestamp > (NOW() - 24 hours)
    2. For each event, UPDATEs the sprout.tier back to the original tier (from_tier)
    3. Logs a bulk_rollback event with count: 50, reason: "...", operator_id: "alex"
    4. Marks original events with metadata: { rolled_back: true, rollback_reason: "..." }
  And all 50 sprouts are reverted to "seed" tier
  And the advancement history shows [ROLLED BACK] badge on those events
  And the modal closes

Scenario: Prevent rollback without reason
  Given the rollback modal is open
  And the reason field is empty
  When I click "Rollback 50 Sprouts"
  Then the button is disabled
  And a validation message shows "Reason is required for bulk operations"

Scenario: Cancel bulk rollback
  Given the rollback modal is open
  When I click "Cancel"
  Then the modal closes
  And no sprouts are reverted
  And no rollback event is logged
```

**Technical Notes:**
- Query: `SELECT * FROM advancement_events WHERE rule_id = ? AND timestamp > (NOW() - INTERVAL '24 hours')`
- Bulk UPDATE: `UPDATE sprouts SET tier = original_tier WHERE id IN (...)`
- Event log: Single `bulk_rollback` event + mark original events with `rolled_back: true`
- Confirmation modal: REQUIRED (irreversible operation)

---

### US-S014: View Advancement Event Details

**As an** operator
**I want to** view full details of a specific advancement event
**So that** I can understand exactly why a sprout advanced

**INVEST Assessment:**
- ✅ Independent: Detail view (extends US-S011)
- ✅ Negotiable: Can start with simple modal, add side panel later
- ✅ Valuable: Essential for debugging and trust
- ✅ Estimable: 1 day (detail modal/panel)
- ✅ Small: Single component (event detail view)
- ✅ Testable: Verify all event data displayed

**Priority:** P1 (Important for transparency)

**Acceptance Criteria:**

```gherkin
Scenario: View advancement event details
  Given an advancement event exists:
    | Field          | Value                                |
    | sprout_id      | 123                                  |
    | sprout_title   | "Quantum Basics"                     |
    | rule_id        | seed-to-sprout-basic                 |
    | from_tier      | seed                                 |
    | to_tier        | sprout                               |
    | criteria_met   | [{ signal: "retrievals", threshold: 10, actual: 15 }] |
    | signal_values  | { retrievals: 15, citations: 5 }     |
    | timestamp      | 2026-01-16T02:00:00Z                 |
    | event_type     | auto-advancement                     |
  When I click the event row in the advancement history panel
  Then a detail view opens showing:
    """
    Advancement Event

    Date: Jan 16, 2026 at 2:00 AM UTC
    Sprout: "Quantum Basics"
    Rule: seed-to-sprout-basic

    Tier Change: seed → sprout

    Criteria Met:
      ✓ retrievals: 15 (threshold: >= 10)
      ✓ citations: 5 (threshold: >= 3)

    Full Signal Snapshot:
      retrievals: 15
      citations: 5
      queryDiversity: 0.7
      utilityScore: 0.8

    Event Type: Auto-Advancement
    """

Scenario: View manual override event details
  Given a manual override event exists with:
    | Field       | Value                                   |
    | event_type  | manual-override                         |
    | operator_id | alex@example.com                        |
    | reason      | "Low utility score despite high citations" |
  When I view the event details
  Then I see additional fields:
    """
    Event Type: Manual Override
    Operator: alex@example.com
    Reason: "Low utility score despite high citations"
    """

Scenario: Close event detail view
  Given the event detail view is open
  When I click the "Close" button or press Esc key
  Then the detail view closes
  And I return to the advancement history panel
```

**Technical Notes:**
- Component: Modal or side panel (design decision in wireframes)
- Data: Read from `advancement_events` table (single row)
- Display: Format JSONB fields (criteria_met, signal_values) as readable text

---

## Epic 4: Gardener Experience

---

### US-S015: See Tier Badge Update After Advancement

**As a** gardener
**I want to** see my sprout's tier badge update after auto-advancement
**So that** I know my content advanced to a higher tier

**INVEST Assessment:**
- ✅ Independent: UI update (uses existing TierBadge component)
- ✅ Negotiable: Can start with cache invalidation, add real-time updates later
- ✅ Valuable: Makes advancement visible to gardeners (motivation)
- ✅ Estimable: 0.5 days (cache invalidation logic)
- ✅ Small: Cache update only (no new UI)
- ✅ Testable: E2E test (advance sprout → verify badge updates)

**Priority:** P0 (Critical Path)

**Acceptance Criteria:**

```gherkin
Scenario: Tier badge updates after auto-advancement
  Given a gardener created a sprout "Quantum Basics" with tier "seed"
  And the TierBadge shows "🌰 Seed"
  When the daily batch runs and advances the sprout to "sprout" tier
  And the tier is updated in Supabase
  Then the TierBadge cache is invalidated
  And the next time the gardener views the sprout
  Then the badge shows "🌱 Sprout" (not cached "🌰 Seed")

Scenario: No visual regression (badge styling unchanged)
  Given the TierBadge component before S7
  When S7 is deployed
  Then the badge appearance is identical (same emoji, label, styling)
  And no visual regressions are detected (E2E screenshot test)
```

**Technical Notes:**
- Cache invalidation: `invalidateTierCache(sproutId)` after tier update
- No UI changes: Existing TierBadge component works unchanged
- Testing: Visual regression test (compare screenshots before/after S7)

---

### US-S016: View Advancement Reason in Tooltip

**As a** gardener
**I want to** see why my sprout advanced when I hover over the tier badge
**So that** I understand the advancement criteria

**INVEST Assessment:**
- ✅ Independent: Tooltip enhancement (extends TierBadge)
- ✅ Negotiable: Can start with simple text, add formatted criteria later
- ✅ Valuable: Builds trust (transparent criteria)
- ✅ Estimable: 1 day (tooltip content + query)
- ✅ Small: Single tooltip component
- ✅ Testable: Verify tooltip shows correct data

**Priority:** P1 (Important for trust)

**Acceptance Criteria:**

```gherkin
Scenario: Tooltip shows advancement reason
  Given a sprout advanced from "seed" to "sprout" on Jan 16
  And the advancement was triggered by rule "seed-to-sprout-basic"
  And the criteria met were: retrievals: 15 (>=10), citations: 5 (>=3)
  When a gardener hovers over the TierBadge
  Then a tooltip appears:
    """
    🌱 Sprout Tier
    Advanced automatically on Jan 16
    Based on community usage (15 retrievals, 5 citations)
    Click for full details →
    """

Scenario: Tooltip shows manual override reason
  Given a sprout was manually overridden to "seed" tier
  And the operator provided reason "Low quality content"
  When a gardener hovers over the TierBadge
  Then the tooltip shows:
    """
    🌰 Seed Tier
    Manually adjusted on Jan 16
    Reason: Low quality content
    """

Scenario: Tooltip shows no advancement if sprout never advanced
  Given a sprout remains at original tier "seed"
  And no advancement events exist for this sprout
  When a gardener hovers over the TierBadge
  Then the tooltip shows:
    """
    🌰 Seed Tier
    Original tier
    """
```

**Technical Notes:**
- Query: Fetch latest `advancement_event` for sprout_id
- Tooltip: Use existing tooltip component (Quantum Glass pattern)
- Progressive disclosure: Tooltip (brief) → click for full audit trail (US-S017)

---

### US-S017: View Full Audit Trail for Sprout

**As a** gardener
**I want to** view the complete advancement history for my sprout
**So that** I can see the full tier progression over time

**INVEST Assessment:**
- ✅ Independent: Read-only view (uses advancement_events table)
- ✅ Negotiable: Can start with simple list, add timeline visualization later
- ✅ Valuable: Transparency (gardeners trust the system)
- ✅ Estimable: 1.5 days (audit trail modal/panel)
- ✅ Small: Single component (event list)
- ✅ Testable: Verify all events displayed

**Priority:** P2 (Nice to have, not blocking)

**Acceptance Criteria:**

```gherkin
Scenario: View full advancement history for sprout
  Given a sprout has 3 advancement events:
    | Timestamp            | From  | To      | Event Type       | Rule             |
    | 2026-01-14T02:00:00Z | seed  | sprout  | auto-advancement | seed-to-sprout   |
    | 2026-01-15T02:00:00Z | sprout| sapling | auto-advancement | sprout-to-sapling|
    | 2026-01-16T10:30:00Z | sapling| sprout | manual-override  | N/A              |
  When a gardener clicks the tier badge
  Then a modal or panel opens showing:
    """
    Advancement History: "Quantum Basics"

    Jan 16, 10:30 AM
    🌱 Sprout (manual adjustment)
    Operator: alex@example.com
    Reason: Low utility score

    Jan 15, 2:00 AM
    🌿 Sapling (auto-advancement)
    Rule: sprout-to-sapling
    Criteria: retrievals: 25 (>=20), citations: 8 (>=5)

    Jan 14, 2:00 AM
    🌱 Sprout (auto-advancement)
    Rule: seed-to-sprout
    Criteria: retrievals: 15 (>=10), citations: 5 (>=3)

    Created: Jan 10
    🌰 Seed (original tier)
    """

Scenario: Close audit trail view
  Given the audit trail modal is open
  When the gardener clicks "Close" or presses Esc
  Then the modal closes
```

**Technical Notes:**
- Query: `SELECT * FROM advancement_events WHERE sprout_id = ? ORDER BY timestamp DESC`
- Display: Timeline format (most recent first)
- UI: Modal or side panel (design decision in wireframes)

---

## Epic 5: ExperienceConsole Integration

---

### US-S018: Register advancement-rule in EXPERIENCE_TYPE_REGISTRY

**As a** developer
**I want to** register `advancement-rule` as a new experience type
**So that** the ExperienceConsole factory can render AdvancementRuleCard and Editor

**INVEST Assessment:**
- ✅ Independent: Registry entry (infrastructure setup)
- ✅ Negotiable: Registry config (can add fields later)
- ✅ Valuable: Enables polymorphic rendering (ExperienceConsole pattern)
- ✅ Estimable: 0.5 days (registry entry + type updates)
- ✅ Small: Single config object
- ✅ Testable: Verify registry entry exists and has correct shape

**Priority:** P0 (Critical Path - infrastructure)

**Acceptance Criteria:**

```gherkin
Scenario: Register advancement-rule in EXPERIENCE_TYPE_REGISTRY
  Given the file "src/bedrock/config/component-registry.ts" exists
  When I add the registry entry:
    """
    export const EXPERIENCE_TYPE_REGISTRY = {
      'feature-flag': { ... },
      'lifecycle-config': { ... },
      'advancement-rule': {
        label: 'Advancement Rules',
        card: AdvancementRuleCard,
        editor: AdvancementRuleEditor,
        allowMultipleActive: true,
        icon: 'trending_up',
        iconColor: 'text-green-400',
        description: 'Automatic tier advancement based on observable usage signals',
      },
    };
    """
  Then the TypeScript compiler validates the entry
  And the ExperienceConsole can render AdvancementRuleCard for `advancement-rule` types

Scenario: Add advancement-rule to GroveObjectType union
  Given the file "src/core/types/grove-object.ts" exists
  When I add `'advancement-rule'` to the GroveObjectType union:
    """
    type GroveObjectType =
      | 'sprout'
      | 'feature-flag'
      | 'lifecycle-config'
      | 'advancement-rule'
      | ...;
    """
  Then TypeScript validates all uses of GroveObjectType
  And useGroveData('advancement-rule') is type-safe

Scenario: Add advancement-rule to PayloadMap
  Given the file "src/core/types/grove-object.ts" exists
  When I add AdvancementRulePayload to PayloadMap:
    """
    interface PayloadMap {
      'sprout': SproutPayload;
      'feature-flag': FeatureFlagPayload;
      'lifecycle-config': LifecycleConfigPayload;
      'advancement-rule': AdvancementRulePayload;
      ...
    }
    """
  Then useGroveData('advancement-rule') returns typed payload
  And TypeScript validates payload structure at compile time
```

**Technical Notes:**
- File: `src/bedrock/config/component-registry.ts`
- Pattern: Follow feature-flag and lifecycle-config examples
- Type safety: Add to GroveObjectType union and PayloadMap interface

---

### US-S019: AdvancementRuleCard Displays Rule Summary

**As an** operator
**I want to** see a summary card for each advancement rule in the grid
**So that** I can quickly understand the rule without opening the editor

**INVEST Assessment:**
- ✅ Independent: Card component (follows FeatureFlagCard pattern)
- ✅ Negotiable: Card layout can evolve (start simple)
- ✅ Valuable: Entry point for rule management
- ✅ Estimable: 1.5 days (card component + styling)
- ✅ Small: Single React component
- ✅ Testable: Unit test + visual regression test

**Priority:** P0 (Critical Path)

**Acceptance Criteria:**

```gherkin
Scenario: AdvancementRuleCard displays rule summary
  Given an advancement rule exists:
    | Field          | Value                              |
    | id             | seed-to-sprout-basic               |
    | title          | Seed to Sprout (Basic)             |
    | description    | Auto-advance sprouts with 10+ retrievals |
    | fromTier       | seed                               |
    | toTier         | sprout                             |
    | criteria       | [{ signal: "retrievals", ... }]    |
    | isEnabled      | true                               |
  When the card renders in the grid
  Then I see:
    | Element       | Content                          |
    | Status bar    | Green (#10b981)                  |
    | Icon          | ⬆️ (advancement icon)            |
    | Title         | "Seed to Sprout (Basic)"         |
    | ID            | "seed-to-sprout-basic"           |
    | Description   | "Auto-advance sprouts with..."   |
    | Tier transition| 🌰 → 🌱                          |
    | Criteria badge| "1 criteria"                     |
    | Footer toggle | "Enabled ✓"                      |

Scenario: AdvancementRuleCard shows disabled state
  Given an advancement rule has isEnabled: false
  When the card renders
  Then the status bar is gray (#6b7280)
  And the footer toggle shows "Disabled"
  And the icon background is dimmed (bg-slate-500/20)

Scenario: Click card to open editor
  Given an AdvancementRuleCard is displayed
  When I click the card
  Then the AdvancementRuleEditor panel opens
  And the editor loads the rule data
```

**Technical Notes:**
- Component: `src/bedrock/components/AdvancementRuleCard.tsx`
- Pattern: Follow `FeatureFlagCard.tsx` structure
- Styling: Quantum Glass v1.0 tokens (--glass-solid, --glass-border, --neon-green)
- Tier emojis: Fetch from lifecycle config via `useLifecycleConfig` hook

---

### US-S020: AdvancementRuleEditor Provides CRUD UI

**As an** operator
**I want to** use a visual editor to create and edit advancement rules
**So that** I don't need to manually edit JSON configuration

**INVEST Assessment:**
- ✅ Independent: Editor component (follows existing editor patterns)
- ✅ Negotiable: Can start with simple forms, add visual builder later (Phase 4)
- ✅ Valuable: Core UI for rule management
- ✅ Estimable: 3 days (editor component + validation + preview)
- ✅ Small: Single component (multiple sections)
- ✅ Testable: Unit test + E2E test (create/edit flow)

**Priority:** P0 (Critical Path)

**Acceptance Criteria:**

```gherkin
Scenario: AdvancementRuleEditor displays all sections
  Given I open the AdvancementRuleEditor for a rule
  Then I see sections:
    | Section           | Content                              |
    | Status Banner     | "🟢 Rule Enabled" with [Disable] button |
    | Identity          | Rule Name, Description, ID (read-only) |
    | Tier Transition   | From Tier dropdown, To Tier dropdown |
    | Criteria Builder  | Criteria list with [+ Add Criterion] |
    | Preview           | Live evaluation against sample sprout |
    | Metadata          | Created, Updated, Created By         |
    | Footer Actions    | [Save Changes] [Duplicate] [Delete]  |

Scenario: Add criterion in criteria builder
  Given I am editing an advancement rule
  When I click "[+ Add Criterion]" button
  Then a new criterion row appears:
    | Field     | Type     | Options                               |
    | Signal    | Dropdown | [retrievals, citations, queryDiversity, utilityScore] |
    | Operator  | Dropdown | [>=, >, ==, <, <=]                    |
    | Threshold | Number   | (numeric input)                       |
  And I can fill in the criterion values
  And the criterion is added to the rule.criteria array

Scenario: Remove criterion from criteria builder
  Given a rule has 2 criteria
  When I click the "x" button next to a criterion
  Then that criterion is removed from the list
  And the rule.criteria array is updated

Scenario: Change logic operator
  Given a rule has logic operator "AND"
  When I change the "Logic" dropdown to "OR"
  Then the rule.logicOperator is updated to "OR"
  And the preview section re-evaluates with OR logic

Scenario: Preview rule against sample sprout
  Given I am editing a rule with criteria: retrievals >= 10
  And a sample sprout has signals: { retrievals: 15 }
  When I view the "Preview" section
  Then I see:
    """
    Preview: Test Against Sample Sprout

    Sprout: "Quantum Basics" (current tier: seed)
    Signals:
      retrievals: 15 ✓ (>= 10)

    Result: ✅ Would advance to sprout tier
    """

Scenario: Save changes
  Given I edited a rule (changed criteria, enabled status, etc.)
  When I click "Save Changes"
  Then the rule payload is updated in Supabase
  And the card in the grid reflects the changes
  And a success toast shows "Rule updated successfully"
```

**Technical Notes:**
- Component: `src/bedrock/components/AdvancementRuleEditor.tsx`
- Pattern: Follow `FeatureFlagEditor.tsx` and `SystemPromptEditor.tsx` patterns
- Validation: Check tier order, validate signal types, ensure positive thresholds
- Preview: Call `evaluateAdvancement()` with sample sprout data

---

### US-S021: useAdvancementRuleData Hook Provides Data Access

**As a** developer
**I want to** use a React hook to access advancement rule data
**So that** components can read/write rules using standard patterns

**INVEST Assessment:**
- ✅ Independent: Hook implementation (infrastructure)
- ✅ Negotiable: Hook methods (can add more later)
- ✅ Valuable: Standardizes data access (DRY principle)
- ✅ Estimable: 1 day (hook implementation + tests)
- ✅ Small: Single hook file
- ✅ Testable: Unit test all hook methods

**Priority:** P0 (Critical Path - infrastructure)

**Acceptance Criteria:**

```gherkin
Scenario: useAdvancementRuleData provides CRUD operations
  Given I call the hook in a component:
    """
    const {
      rules,
      isLoading,
      createRule,
      updateRule,
      toggleRule,
      deleteRule
    } = useAdvancementRuleData();
    """
  Then the hook returns:
    | Method      | Purpose                              |
    | rules       | Array of AdvancementRuleObject[]     |
    | isLoading   | Boolean loading state                |
    | createRule  | Function to create new rule          |
    | updateRule  | Function to update existing rule     |
    | toggleRule  | Function to enable/disable rule      |
    | deleteRule  | Function to delete rule              |

Scenario: createRule persists new rule to Supabase
  Given I call createRule with payload:
    """
    {
      lifecycleModelId: "botanical",
      fromTier: "seed",
      toTier: "sprout",
      criteria: [{ signal: "retrievals", operator: ">=", threshold: 10 }],
      logicOperator: "AND",
      isEnabled: true
    }
    """
  And meta:
    """
    {
      status: "active",
      title: "Seed to Sprout",
      description: "Auto-advance sprouts with 10+ retrievals"
    }
    """
  Then the rule is inserted into advancement_rules table
  And the rules array is updated with the new rule
  And the UI re-renders with the new card

Scenario: updateRule updates existing rule
  Given a rule exists with id "123"
  When I call updateRule("123", { payload: { isEnabled: false } })
  Then the rule in Supabase is updated
  And the rules array is updated
  And the card re-renders with disabled state

Scenario: toggleRule enables/disables rule
  Given a rule exists with isEnabled: true
  When I call toggleRule("123", false)
  Then the rule.payload.isEnabled is set to false
  And the card status bar changes to gray

Scenario: deleteRule removes rule from database
  Given a rule exists with id "123"
  When I call deleteRule("123")
  Then the rule is deleted from advancement_rules table
  And the rules array no longer includes that rule
  And the card is removed from the grid
```

**Technical Notes:**
- Hook: `src/bedrock/hooks/useAdvancementRuleData.ts`
- Pattern: Extend `useGroveData('advancement-rule')` with CRUD methods
- Optimistic updates: Update local state immediately, revert on error
- Type safety: All methods return/accept typed payloads

---

## Epic 6: S6 Integration (Real Signals)

---

### US-S022: Fetch Real Signals from observable_signals Table

**As a** system
**I want to** fetch real observable signals from Supabase when S6 is ready
**So that** advancement rules use actual usage data instead of mocks

**INVEST Assessment:**
- ✅ Independent: Integration story (requires S6 complete)
- ✅ Negotiable: Can add signal types incrementally as S6 expands
- ✅ Valuable: Unlocks real-world auto-advancement (mocks → production)
- ✅ Estimable: 1 day (signal fetch function + integration)
- ✅ Small: Single function (getObservableSignals)
- ✅ Testable: Integration test with S6 table

**Priority:** P1 (Blocked by S6, but important)

**Dependencies:** S6-ObservableSignals (IN PROGRESS)

**Acceptance Criteria:**

```gherkin
Scenario: Fetch real signals when S6 is ready
  Given S6 has created the observable_signals table
  And the table has signals for sprout_id "123":
    | Signal          | Value |
    | retrievals      | 25    |
    | citations       | 8     |
    | queryDiversity  | 0.7   |
    | utilityScore    | 0.85  |
  And the environment variable USE_MOCK_SIGNALS is set to "false"
  When the evaluation engine calls getObservableSignals("123")
  Then it queries:
    """
    SELECT * FROM observable_signals WHERE sprout_id = '123'
    """
  And it returns:
    """
    {
      retrievals: 25,
      citations: 8,
      queryDiversity: 0.7,
      utilityScore: 0.85,
      lastUpdated: "2026-01-16T10:00:00Z"
    }
    """

Scenario: Fallback to mock signals when S6 not ready
  Given the environment variable USE_MOCK_SIGNALS is set to "true"
  When the evaluation engine calls getObservableSignals("123")
  Then it returns mock signals from MOCK_SIGNALS constant
  And no Supabase query is executed

Scenario: Handle missing signals gracefully
  Given the observable_signals table exists
  But no signals exist for sprout_id "456"
  When the evaluation engine calls getObservableSignals("456")
  Then it returns default signals:
    """
    {
      retrievals: 0,
      citations: 0,
      queryDiversity: 0,
      utilityScore: 0,
      lastUpdated: null
    }
    """
  And the evaluation continues (graceful degradation)
```

**Technical Notes:**
- Function: `getObservableSignals(sproutId: string): ObservableSignals`
- Environment variable: `USE_MOCK_SIGNALS` (true = use mocks, false = query Supabase)
- Fallback: If signal missing, return 0 (don't crash evaluation)
- Migration: Set `USE_MOCK_SIGNALS=true` for S7 launch, flip to `false` when S6 ready

---

### US-S023: Gracefully Degrade When Signals Missing

**As a** system
**I want to** skip criteria that reference missing signals
**So that** partial signal data doesn't block all advancements

**INVEST Assessment:**
- ✅ Independent: Error handling (orthogonal to happy path)
- ✅ Negotiable: Can add more sophisticated fallbacks later
- ✅ Valuable: Resilience (partial S6 deployment doesn't break S7)
- ✅ Estimable: 0.5 days (skip logic + logging)
- ✅ Small: Simple if-check in evaluation
- ✅ Testable: Unit test with missing signals

**Priority:** P1 (Important for production resilience)

**Acceptance Criteria:**

```gherkin
Scenario: Skip criterion when signal missing
  Given a rule has criteria:
    | Signal          | Operator | Threshold |
    | retrievals      | >=       | 10        |
    | queryDiversity  | >=       | 0.5       |
  And a sprout has signals: { retrievals: 15 } (queryDiversity missing)
  When the evaluation runs
  Then the retrievals criterion is evaluated (15 >= 10) ✓
  And the queryDiversity criterion is SKIPPED (signal missing)
  And a warning is logged:
    """
    [AdvancementEvaluator] Signal 'queryDiversity' missing for sprout <id>, skipping criterion
    """
  And the evaluation result is:
    """
    {
      shouldAdvance: false,
      criteriaMet: [{ signal: "retrievals", ... }]
    }
    """
  (AND logic: queryDiversity skipped = treated as unmet)

Scenario: Log missing signals for operator review
  Given 10 sprouts have missing queryDiversity signals
  When the batch evaluation runs
  Then 10 warnings are logged
  And the batch summary includes:
    """
    {
      advanced: <count>,
      skipped: <count>,
      failed: 0,
      warnings: 10 (missing signals)
    }
    """
  And operators can review warnings to decide if S6 integration needed
```

**Technical Notes:**
- Skip logic: `if (signalValue === undefined) continue;`
- Logging: Warn-level log (not error, since it's expected during mock phase)
- AND logic: Missing signal = criterion unmet (conservative approach)
- OR logic: If at least one criterion met, still advance

---

### US-S024: Migrate from Mock Signals to Real Signals

**As a** developer
**I want to** seamlessly switch from mock signals to real S6 signals
**So that** operators don't need to reconfigure anything when S6 launches

**INVEST Assessment:**
- ✅ Independent: Migration task (one-time operation)
- ✅ Negotiable: Migration timing (when S6 ready)
- ✅ Valuable: Completes S7 production readiness
- ✅ Estimable: 0.5 days (feature flag flip + validation)
- ✅ Small: Change environment variable + test
- ✅ Testable: Verify real signals used after migration

**Priority:** P2 (Future work, blocked by S6)

**Acceptance Criteria:**

```gherkin
Scenario: Migrate from mocks to real signals
  Given S7 launched with USE_MOCK_SIGNALS=true
  And S6 is now complete with observable_signals table populated
  When I set USE_MOCK_SIGNALS=false in production environment
  And the next daily batch runs at 2am
  Then the evaluation engine fetches real signals from Supabase
  And advancement decisions are based on actual usage data
  And no code changes are required (just env var flip)

Scenario: Validate real signals after migration
  Given USE_MOCK_SIGNALS=false
  When the batch evaluation runs
  Then I can compare batch results before/after migration:
    | Metric            | Before (Mock) | After (Real) |
    | Advanced count    | 10            | 12           |
    | Avg retrievals    | 15 (mock)     | 18 (real)    |
  And the advancement_events table shows real signal values in signal_values field

Scenario: Rollback to mocks if S6 fails
  Given USE_MOCK_SIGNALS=false (using real signals)
  And S6 experiences an outage
  When the batch evaluation fails 3 times
  Then I set USE_MOCK_SIGNALS=true
  And the next batch uses mocks as fallback
  And advancement continues (degraded mode, but operational)
```

**Technical Notes:**
- Environment variable: `USE_MOCK_SIGNALS` (boolean)
- No code changes: Just flip env var in production
- Rollback plan: If S6 fails, revert to mocks temporarily
- Validation: Compare advancement counts before/after migration (smoke test)

---

## Test Plan Summary

### Unit Tests (Pure Functions)
- `evaluateAdvancement()` - 20+ test cases (all operators, AND/OR logic, missing signals)
- `evaluateCriterion()` - 10+ test cases (each operator, edge cases)
- `useAdvancementRuleData` hook - 8 test cases (CRUD operations)

### Integration Tests (API + Database)
- Create rule → persist to Supabase → verify in grid
- Daily batch → evaluate sprouts → update tiers → log events
- Manual override → update tier → log event
- Bulk rollback → revert tiers → log rollback event

### E2E Tests (User Flows)
- Flow 1: Operator creates rule → batch runs → sprout advances → operator audits
- Flow 2: Gardener sees tier badge update → views tooltip → clicks for audit trail
- Flow 3: Operator discovers bad rule → bulk rollback → refines criteria → re-enables

### Visual Regression Tests
- AdvancementRuleCard matches FeatureFlagCard style
- AdvancementRuleEditor sections render correctly
- TierBadge unchanged (no regressions from S4)

---

## Definition of Done (Sprint S7)

**Functional:**
- [ ] All 24 user stories implemented and tested
- [ ] Daily batch evaluation runs successfully (mock signals)
- [ ] Operators can create, edit, enable/disable, delete rules
- [ ] Advancement events logged with full provenance
- [ ] Manual override and bulk rollback functional
- [ ] TierBadge updates reflect auto-advancements

**Technical:**
- [ ] `advancement_rules` and `advancement_events` tables created in Supabase
- [ ] `advancement-rule` registered in EXPERIENCE_TYPE_REGISTRY
- [ ] AdvancementRuleCard and AdvancementRuleEditor components complete
- [ ] `useAdvancementRuleData` hook provides CRUD operations
- [ ] Evaluation engine (`advancementEvaluator.ts`) with 100% test coverage
- [ ] Daily batch cron job configured (2am UTC)

**Quality:**
- [ ] Zero visual regressions (TierBadge identical to pre-S7)
- [ ] All E2E tests pass (create rule → batch → audit flow)
- [ ] Performance: <100ms per sprout evaluation
- [ ] Error handling: Batch continues despite individual failures

**Documentation:**
- [ ] SPEC.md updated with final architecture
- [ ] EXECUTION_PROMPT.md created for developer handoff
- [ ] User Stories & Acceptance Criteria (this document) approved
- [ ] Advisory Council sign-off (Park, Adams, Taylor, Short)

**S6 Integration Readiness:**
- [ ] Mock signals strategy validated (S7 ships independently)
- [ ] Migration path documented (flip USE_MOCK_SIGNALS when S6 ready)
- [ ] Graceful degradation tested (missing signals don't crash evaluation)

---

## Next Steps (After Approval)

1. **User review:** Present this document to user for approval
2. **Foundation Loop:** Generate SPEC.md (if not exists) and EXECUTION_PROMPT.md
3. **Developer handoff:** Developer agent executes stories in priority order
4. **Playwright scaffolding:** Generate test structure from Gherkin scenarios (Phase 3-4)

---

*User Stories & Acceptance Criteria for S7-SL-AutoAdvancement*
*Pattern: Gherkin scenarios with INVEST assessment*
*Foundation Loop v2*
*Ready for Review*
