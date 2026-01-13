# User Stories & Acceptance Criteria (v1.0 Review)

**Sprint:** 6 - Knowledge Base Integration
**Codename:** knowledge-base-integration-v1
**Phase:** Story Extraction + Acceptance Criteria
**Status:** Draft for Review
**Created:** 2026-01-13
**Spec Source:** Notion page `6. Knowledge Base Integration`

---

## Critical Observations

Before diving into stories, the following observations emerged from spec analysis:

### 1. Dependency on Sprint 5 (Results Display)

**Discovery:** Sprint 5 (Results Display) is in "ready" status, not yet complete. Sprint 6 logically follows Sprint 5 because the "Add to Knowledge Base" action appears in the results display view.

**Implication:** Sprint 6 execution should wait for Sprint 5 completion, OR the integration point can be stubbed with a placeholder in GardenInspector until ResearchResultsView exists.

### 2. SupabaseAdapter Already Supports Documents ✓

**Discovery:** The `SupabaseAdapter` at `src/core/data/adapters/supabase-adapter.ts` already has:
- `TABLE_MAP.document = 'documents'` mapping
- Auto-embedding trigger via `/api/knowledge/embed`
- `CreateOptions.triggerEmbedding` flag

**Implication:** Document persistence infrastructure exists. This sprint wires UI to existing capabilities.

### 3. ResearchDocument Schema Exists ✓

**Discovery:** `src/core/schema/research-document.ts` defines `ResearchDocument` with:
- `evidenceBundleId` linking to evidence
- `citations` array with URLs and snippets
- `confidenceScore` for quality indication
- `status` enum for completeness

**Implication:** No schema work needed. Sprint focuses on UI action and provenance chain.

### 4. Provenance Chain Requires Explicit Wiring

**Discovery:** Notion spec defines provenance chain linking:
- Original spark (user query)
- ResearchSprout (inferred branches)
- EvidenceBundle (sources used)
- WriterAgentConfig snapshot (voice/style)

**Current State:** `ResearchDocument` has `evidenceBundleId` but NOT `sproutId` or `configSnapshot`.

**Recommendation:** Extend `ResearchDocument` schema with provenance fields OR create a `KnowledgeCorpusEntry` wrapper that adds provenance.

---

## Proposed v1.0 Simplifications

| Spec Feature | v1.0 Approach | Rationale |
|--------------|---------------|-----------|
| Document persistence | Use existing SupabaseAdapter | Infrastructure ready |
| Embedding pipeline | Trigger existing `/api/knowledge/embed` | No new API needed |
| Provenance chain | Add `sproutId` + `configSnapshotId` to document | Minimal schema extension |
| Success toast | Use existing toast system | No new UI components |
| Corpus retrieval | Defer search/browse to Sprint 7 | Keep scope minimal |

---

## Epic 1: Knowledge Base Action

### US-KB001: Add to Knowledge Base Button

**As a** researcher viewing completed research results
**I want to** click "Add to Knowledge Base" button
**So that** I can promote the research document to my grove's corpus

**INVEST Assessment:**
- **I**ndependent: Yes — Can be developed as button + handler
- **N**egotiable: Yes — Button placement flexible
- **V**aluable: Yes — Core feature for knowledge persistence
- **E**stimable: Yes — Button + API call, known pattern
- **S**mall: Yes — Single action, single handler
- **T**estable: Yes — Click → toast → document exists

**Acceptance Criteria:**

```gherkin
Scenario: Add to Knowledge Base button is visible
  Given I am viewing a completed research document in GardenInspector
  When the document has status "complete"
  Then I should see an "Add to Knowledge Base" button
  And the button should be enabled

Scenario: Button disabled for incomplete research
  Given I am viewing research results
  When the document has status "insufficient-evidence"
  Then the "Add to Knowledge Base" button should be disabled
  And hovering should show tooltip "Insufficient evidence to add"

Scenario: Click Add to Knowledge Base triggers persistence
  Given I am viewing a complete research document
  When I click "Add to Knowledge Base"
  Then the button should show loading state
  And the document should be saved to the grove's corpus
  And the button should transition to "Added ✓" state
```

**Traceability:** Spec section "User Experience" bullet 1

**Priority:** P0 — Core feature
**Complexity:** S — Button + handler

---

### US-KB002: Success Confirmation Toast

**As a** researcher adding to knowledge base
**I want to** see confirmation that my document was saved
**So that** I have confidence the action succeeded

**INVEST Assessment:**
- **I**ndependent: Yes — Toast is separate from persistence
- **N**egotiable: Yes — Toast content/style flexible
- **V**aluable: Yes — User feedback essential
- **E**stimable: Yes — Standard toast pattern
- **S**mall: Yes — Single toast component call
- **T**estable: Yes — Toast visible with expected content

**Acceptance Criteria:**

```gherkin
Scenario: Success toast appears after save
  Given I clicked "Add to Knowledge Base"
  When the document is successfully saved
  Then I should see a toast notification
  And the toast should say "Added to Grove knowledge base"
  And the toast should have success styling (green/positive)
  And the toast should auto-dismiss after 5 seconds

Scenario: Toast includes link to document
  Given the document was saved successfully
  When the success toast appears
  Then it should include a "View in Corpus" link
  And clicking the link should navigate to the document in corpus view

Scenario: Error toast on save failure
  Given I clicked "Add to Knowledge Base"
  When the save operation fails
  Then I should see an error toast
  And the toast should say "Failed to add to knowledge base"
  And the toast should have error styling (red/negative)
  And the button should return to enabled state
```

**Traceability:** Spec section "User Experience" bullet 2

**Priority:** P0 — User feedback
**Complexity:** S — Standard toast

---

## Epic 2: Document Persistence

### US-KB003: Save Document to Corpus

**As the** knowledge base integration service
**I want to** persist research documents via GroveDataProvider
**So that** documents are stored in the grove's Supabase database

**INVEST Assessment:**
- **I**ndependent: Yes — Backend service function
- **N**egotiable: Yes — Storage details flexible
- **V**aluable: Yes — Core persistence capability
- **E**stimable: Yes — SupabaseAdapter already configured
- **S**mall: Yes — Single service function
- **T**estable: Yes — Document retrievable after save

**Acceptance Criteria:**

```gherkin
Scenario: Document saved to Supabase
  Given I have a complete ResearchDocument
  When I call addToKnowledgeBase(document, sproutId)
  Then the document should be inserted into the documents table
  And the document should have a unique ID
  And the createdAt timestamp should be set
  And the status should be "active"

Scenario: Embedding pipeline triggered
  Given a document was saved to corpus
  When the save operation completes
  Then the embedding pipeline should be triggered
  And the document should be queued for vectorization
  And the embedding status should be logged

Scenario: Duplicate prevention
  Given a document with the same evidenceBundleId exists
  When I try to add the same document again
  Then the operation should detect the duplicate
  And it should return the existing document ID
  And no new record should be created
```

**Traceability:** Spec section "Scope" bullet 2

**Priority:** P0 — Core persistence
**Complexity:** S — Uses existing adapter

---

### US-KB004: Maintain Provenance Chain

**As a** knowledge curator
**I want to** trace any document back to its research origin
**So that** I can verify sources and understand the research process

**INVEST Assessment:**
- **I**ndependent: Partial — Depends on document structure
- **N**egotiable: Yes — Fields can be adjusted
- **V**aluable: Yes — Core DEX requirement (Provenance as Infrastructure)
- **E**stimable: Yes — Known data flow
- **S**mall: Yes — Schema fields + assignment
- **T**estable: Yes — Fields populated, can trace back

**Acceptance Criteria:**

```gherkin
Scenario: Document links to ResearchSprout
  Given I add a document to knowledge base
  Then the document should have a sproutId field
  And sproutId should match the source ResearchSprout.id
  And I should be able to fetch the original sprout by ID

Scenario: Document links to EvidenceBundle
  Given I add a document to knowledge base
  Then the document should have evidenceBundleId field
  And evidenceBundleId should match the EvidenceBundle used for writing
  And I should be able to fetch the evidence by ID

Scenario: Document captures config snapshot
  Given I add a document to knowledge base
  Then the document should have configSnapshotId field
  And configSnapshotId should reference the WriterAgentConfig used
  And the snapshot should be immutable (not affected by config changes)

Scenario: Full provenance trace
  Given a document in the knowledge base
  When I request its provenance
  Then I should receive:
    | Field | Description |
    | spark | Original user query |
    | sproutId | ResearchSprout that initiated research |
    | evidenceBundleId | Evidence collected during research |
    | citations | Array of source URLs with timestamps |
    | configSnapshotId | WriterAgentConfig at creation time |
```

**Traceability:** Spec section "Provenance Chain"

**Priority:** P0 — DEX Compliance
**Complexity:** M — Schema extension

---

## Epic 3: Integration

### US-KB005: GardenInspector Integration

**As a** researcher viewing completed research
**I want to** add to knowledge base from the results view
**So that** I don't need to navigate elsewhere to save my work

**INVEST Assessment:**
- **I**ndependent: Partial — Requires ResearchResultsView from Sprint 5
- **N**egotiable: Yes — Button placement flexible
- **V**aluable: Yes — Seamless UX
- **E**stimable: Yes — Component integration
- **S**mall: Yes — Wire button to handler
- **T**estable: Yes — Click flow testable

**Acceptance Criteria:**

```gherkin
Scenario: Button in ResearchResultsView actions bar
  Given I am viewing ResearchResultsView in GardenInspector
  When the document status is "complete"
  Then the actions bar should include "Add to Knowledge Base" button
  And the button should use the Glass design system styling

Scenario: Action handler receives context
  Given I click "Add to Knowledge Base" in ResearchResultsView
  Then the handler should receive:
    | Context | Source |
    | document | Current ResearchDocument |
    | sproutId | Selected ResearchSprout.id |
    | groveId | Current grove context |

Scenario: View updates after save
  Given I successfully added a document to knowledge base
  Then the button should show "Added ✓" disabled state
  And the button should remain disabled (no duplicate adds)
```

**Traceability:** Spec section "Scope" bullet 3

**Priority:** P0 — Integration
**Complexity:** S — Wire existing components

---

### US-KB006: Corpus Visibility

**As a** researcher who added a document
**I want to** find my document in the corpus
**So that** I can verify it was saved and access it later

**INVEST Assessment:**
- **I**ndependent: Yes — Query existing data
- **N**egotiable: Yes — UI can vary
- **V**aluable: Yes — Closes the loop
- **E**stimable: Yes — List query
- **S**mall: Depends — If corpus view exists
- **T**estable: Yes — Document appears in list

**Acceptance Criteria:**

```gherkin
Scenario: Document appears in corpus list
  Given I added a document to knowledge base
  When I navigate to the corpus view (e.g., /foundation/knowledge)
  Then my document should appear in the document list
  And it should show the original query as title
  And it should show the creation timestamp

Scenario: Document includes research provenance badge
  Given I view a document in corpus that came from research
  Then it should have a "Research" provenance badge
  And clicking the badge should show provenance details
  And provenance should include sprout link, evidence count, citations count
```

**Traceability:** Spec section "User Experience" bullet 3

**Priority:** P1 — Verification
**Complexity:** S — Uses existing corpus view

---

## Epic 4: Build & Verification

### US-KB007: Build Gate Compliance

**As a** developer completing this sprint
**I want** the build to pass without errors
**So that** the sprint can be merged

**INVEST Assessment:**
- **I**ndependent: Yes — Standard gate
- **N**egotiable: No — Must pass
- **V**aluable: Yes — Ensures deployability
- **E**stimable: Yes — Binary pass/fail
- **S**mall: Yes — Run commands, fix issues
- **T**estable: Yes — Commands exit 0

**Acceptance Criteria:**

```gherkin
Scenario: TypeScript compilation passes
  Given I run `npm run build`
  Then the process should exit with code 0
  And there should be no TypeScript errors

Scenario: No console errors on load
  Given I open the Explore page with a completed sprout
  When I open developer tools console
  Then there should be no red error messages
  And there should be no uncaught exceptions

Scenario: Visual QA tests pass
  Given I run Playwright visual QA tests
  Then all screenshots should be captured
  And the REVIEW.html should show all ACs verified
```

**Traceability:** Standard Bedrock build gates

**Priority:** P0 — Required for merge
**Complexity:** S — Standard verification

---

## Deferred to v1.1

### US-KB008: Corpus Search (DEFERRED)

**Reason:** v1.0 focuses on adding documents; search/browse is Sprint 7 scope.

**Original Flow:** User searches corpus by query, filters by date/source/confidence.

**v1.1 Prerequisite:** Corpus view component built.

---

### US-KB009: Edit Document Metadata (DEFERRED)

**Reason:** v1.0 adds documents as-is; editing is future enhancement.

**Original Flow:** User edits title, tags, or notes on corpus document.

**v1.1 Prerequisite:** Document detail view with edit mode.

---

## Open Questions

1. **Schema Extension** — Should we add `sproutId` + `configSnapshotId` directly to `ResearchDocument` schema, or create a separate `CorpusEntry` wrapper?

2. **Duplicate Handling** — When user tries to add same document twice, should we show error or silently succeed?

3. **Corpus Location** — Does the document go to `/foundation/knowledge` or a new `/explore/corpus` view?

4. **Embedding Delay** — Should toast wait for embedding completion or just acknowledge save?

---

## Summary

| Story ID | Title | Priority | Complexity | Status |
|----------|-------|----------|------------|--------|
| US-KB001 | Add to Knowledge Base Button | P0 | S | Ready |
| US-KB002 | Success Confirmation Toast | P0 | S | Ready |
| US-KB003 | Save Document to Corpus | P0 | S | Ready |
| US-KB004 | Maintain Provenance Chain | P0 | M | Ready |
| US-KB005 | GardenInspector Integration | P0 | S | Ready |
| US-KB006 | Corpus Visibility | P1 | S | Ready |
| US-KB007 | Build Gate Compliance | P0 | S | Ready |

**Total v1.0 Stories:** 7
**Deferred:** 2
**Estimated Effort:** 2-4 hours (Feature tier)

---

## DEX Alignment Verification

| Pillar | How Stories Support |
|--------|---------------------|
| **Declarative Sovereignty** | Document structure defined in schema; persistence via generic adapter. No hardcoded behavior. |
| **Capability Agnosticism** | Works regardless of which LLM generated the research document. |
| **Provenance as Infrastructure** | Every document traces to spark → sprout → evidence → citations → config. Full audit chain. |
| **Organic Scalability** | Schema extensible; new provenance fields don't break existing documents. |

---

## Test Generation Readiness

These stories are ready for Phase 3 (Test Case Generation):

- **Fixtures needed:** Mock ResearchDocument, mock ResearchSprout, mock GroveDataProvider
- **Page objects:** GardenInspectorPage, ResearchResultsView, ToastContainer
- **Key assertions:** Button states, toast content, document in corpus

---

## Execution Notes

1. **Start with US-KB003** — Persistence service is foundation
2. **Then US-KB004** — Provenance extension (may need schema migration)
3. **Then US-KB001 + US-KB002** — Button and toast wiring
4. **Then US-KB005** — GardenInspector integration (depends on Sprint 5)
5. **US-KB006** — Verify in corpus view
6. **US-KB007** — Build gates throughout

**Critical Path:** US-KB003 → US-KB004 → US-KB001/US-KB002 → US-KB005 → US-KB006 → US-KB007

**Blocking Dependency:** Sprint 5 (Results Display) must be in progress or complete for US-KB005.
