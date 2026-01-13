# DECISIONS: Polish and Demo Prep (polish-demo-prep-v1)

## ADR-001: Error Message Strategy

**Status:** Accepted

**Context:**
The pipeline returns technical error messages that are not user-friendly. We need to map these to helpful messages without losing technical detail for debugging.

**Decision:**
Create an error mapping layer that:
1. Preserves original error in `error.detail` for logs
2. Maps to user-friendly `error.message` for display
3. Includes actionable next steps in `error.action`

**Consequences:**
- Users see helpful messages
- Developers can still debug
- Slight increase in code complexity

---

## ADR-002: Partial Evidence Behavior

**Status:** Accepted

**Context:**
When some research branches fail but others succeed, should we:
1. Fail the entire pipeline?
2. Continue with partial evidence?

**Decision:**
Continue with partial evidence because:
- Partial results are better than no results
- The pipeline already supports this (`evidence: evidenceBundle` on failure)
- Users are shown clear warning about incomplete research

**Rejected Alternative:**
Failing the entire pipeline was rejected because it loses valuable completed research and frustrates users unnecessarily.

**Consequences:**
- Users get partial value even on failures
- Documents may have gaps (acknowledged in limitations)
- Warning banner required for transparency

---

## ADR-003: Retry Strategy

**Status:** Accepted

**Context:**
How should retry work after timeout or failure?

**Decision:**
- **Research timeout:** Retry entire pipeline with same sprout
- **Writer timeout:** Retry writing phase only (evidence preserved)
- **Network failure:** Exponential backoff (1s, 2s, 4s, max 30s)

**Consequences:**
- Evidence is not lost on writer failure
- Network issues resolve automatically when possible
- User has control via explicit retry buttons

---

## ADR-004: Skeleton vs Spinner

**Status:** Accepted

**Context:**
Should loading states use spinners or skeleton placeholders?

**Decision:**
Use skeletons for:
- Initial data load (shows layout)
- Document preview (shows structure)

Use spinners for:
- Phase transitions (brief, clear state)
- Action buttons (in-progress state)

**Consequences:**
- More polished, professional feel
- Users understand final layout during load
- Slight additional component complexity

---

## ADR-005: Demo Scope

**Status:** Accepted

**Context:**
What should the demo video include?

**Decision:**
Show the "happy path" with brief acknowledgment of error handling:
1. Sprout command submission
2. Research phase with progress
3. Writing phase with progress
4. Final document display
5. Brief mention of error states (not full demo)

**Rejected Alternative:**
Full demo of all error states rejected because it extends video length and focuses on edge cases rather than core value.

**Consequences:**
- Demo is concise and compelling
- Error handling is documented, not demonstrated
- Stakeholders understand the core flow
