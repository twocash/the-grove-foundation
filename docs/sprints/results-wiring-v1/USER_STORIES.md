# Results Wiring v1 - User Stories

**Sprint:** `results-wiring-v1`
**Status:** Ready for Execution
**Protocol:** Grove Execution Protocol v1.5

---

## User Stories

### US-RW001: Display Real Research Results
**Priority:** P0 (Critical)
**As a** researcher using Grove
**I want** to see my actual research results when I click a completed sprout
**So that** I can review the findings from MY research query, not unrelated mock data

#### Acceptance Criteria (Gherkin)

```gherkin
Feature: Real Research Results Display

  Scenario: AC-RW001 - Results show REAL citations
    Given I have completed a research sprout about "Grove Foundation local AI"
    When I click on the completed sprout in GardenTray
    Then I should see research results about "Grove" or "local AI"
    And I should NOT see "Google Achieves Quantum Supremacy"
    And I should NOT see "ionq.com" in citations

  Scenario: AC-RW002 - Citation URLs match actual sources
    Given I have completed research about a specific topic
    When I view the research results
    Then citation URLs should be relevant to my research query
    And URLs should NOT be hardcoded mock URLs

  Scenario: AC-RW003 - Confidence score reflects actual synthesis
    Given multiple completed sprouts with different evidence quality
    When I view each sprout's results
    Then confidence scores should vary based on evidence quality
    And scores should NOT always show 85%
```

---

### US-RW002: Legacy Sprout Fallback
**Priority:** P1 (High)
**As a** returning user with existing sprouts
**I want** my older sprouts (created before this update) to still display results
**So that** I don't lose access to previous research

#### Acceptance Criteria (Gherkin)

```gherkin
Feature: Legacy Sprout Compatibility

  Scenario: AC-RW004 - Fallback handles legacy sprouts
    Given I have a completed sprout without a stored researchDocument field
    When I click on that sprout
    Then I should see results converted from synthesis.summary and evidence
    And I should NOT see an error or blank screen
```

---

### US-RW003: Error-Free Results Display
**Priority:** P1 (High)
**As a** user
**I want** to view research results without console errors
**So that** the application feels stable and professional

#### Acceptance Criteria (Gherkin)

```gherkin
Feature: Error-Free Display

  Scenario: AC-RW005 - Zero console errors during display
    Given I am viewing any completed sprout's results
    When I interact with the results (scroll, click citations, copy)
    Then there should be zero critical console errors
    And no "Cannot read properties" errors
    And no "Unexpected Application Error" messages
```

---

### US-RW004: Loading State During Retrieval
**Priority:** P2 (Medium)
**As a** user
**I want** to see a loading indicator while results are being prepared
**So that** I know the system is working

#### Acceptance Criteria (Gherkin)

```gherkin
Feature: Loading State

  Scenario: AC-RW006 - Loading state during document retrieval
    Given I click on a completed sprout
    When the document is being retrieved/converted
    Then I should see a loading spinner or skeleton
    And the spinner should disappear when results are ready
```

---

## Story Map

```
US-RW001 (P0)                 US-RW002 (P1)
Display Real Results          Legacy Fallback
     │                             │
     ├── AC-RW001: Real citations  ├── AC-RW004: Converter works
     ├── AC-RW002: Real URLs       │
     └── AC-RW003: Real confidence │
                                   │
US-RW003 (P1)                 US-RW004 (P2)
Error-Free Display            Loading State
     │                             │
     └── AC-RW005: Zero errors     └── AC-RW006: Spinner shown
```

---

## Critical Test Pattern

The **key test** that proves the fix works:

```typescript
test('AC-RW001: Shows REAL citations, not quantum computing mock', async ({ page }) => {
  // Research about Grove/local AI (distinctive topic)
  // ... complete research flow ...

  const content = await page.locator('.research-results').textContent();

  // Should NOT contain mock quantum content
  expect(content).not.toContain('Quantum computing');
  expect(content).not.toContain('Google Achieves Quantum Supremacy');
  expect(content).not.toContain('ionq.com');

  // SHOULD contain actual research topic
  expect(content).toContain('Grove');
});
```

---

## INVEST Assessment

| Story | Independent | Negotiable | Valuable | Estimable | Small | Testable |
|-------|-------------|------------|----------|-----------|-------|----------|
| US-RW001 | ✅ | ✅ | ✅ Critical | ✅ ~4h | ✅ | ✅ Clear ACs |
| US-RW002 | ✅ | ✅ | ✅ UX | ✅ ~2h | ✅ | ✅ Clear ACs |
| US-RW003 | ✅ | ✅ | ✅ Quality | ✅ ~1h | ✅ | ✅ Console check |
| US-RW004 | ✅ | ✅ | ⚠️ Nice-to-have | ✅ ~1h | ✅ | ✅ Visual |

---

## Dependencies

- ✅ Knowledge Base Integration v1 (corpus_documents table exists)
- ✅ Race condition fixes in ResearchExecutionContext (completed in polish sprint)
- ✅ SproutRow null safety fix (completed)
