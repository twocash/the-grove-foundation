# Sprint Stories — trellis-terminology-v1

## Epic 1: Production Code Updates

### Story 1.1: Update health-validator.js header
**File:** `lib/health-validator.js`
**Change:** Lines 3-8, replace "DAIRE principles" with "Trellis Architecture / DEX Standard"
**Verify:** `node -e "import('./lib/health-validator.js')"`

### Story 1.2: Update server.js health comment
**File:** `server.js`
**Change:** Line ~1686, replace "DAIRE" comment with "Trellis Architecture / DEX Standard"
**Verify:** `npm run build`

### Story 1.3: Update HealthDashboard panel title
**File:** `src/foundation/consoles/HealthDashboard.tsx`
**Change:** Line ~414, replace "DAIRE Alignment" with "DEX Standard Alignment"
**Verify:** `npm run build`

---

## Epic 2: Sprint Documentation Updates

### Story 2.1: Update DEVLOG.md terminology
**File:** `docs/sprints/health-dashboard-v1/DEVLOG.md`
**Changes:** 
- Line 13: Replace "DAIRE" trigger with "Trellis Architecture"
- Line 16: Replace "DAIRE" with "Trellis"
- Line 52: Replace "DAIRE" with "Trellis"

### Story 2.2: Update MIGRATION_MAP.md terminology
**File:** `docs/sprints/health-dashboard-v1/MIGRATION_MAP.md`
**Changes:**
- Line 5: Replace "DAIRE" with "Trellis Architecture / DEX Standard"
- Line 10: Replace "DAIRE" with "DEX"
- Line 141: Replace "DAIRE" with "DEX"

### Story 2.3: Update SPRINTS.md section title
**File:** `docs/sprints/health-dashboard-v1/SPRINTS.md`
**Change:** Line 208, replace "DAIRE Alignment" with "DEX Standard Alignment"

### Story 2.4: Update EXECUTION_PROMPT.md (verify/complete)
**File:** `docs/sprints/health-dashboard-v1/EXECUTION_PROMPT.md`
**Change:** Search for any remaining "DAIRE" references, update to Trellis/DEX

---

## Epic 3: Create Canonical Reference Documentation

### Story 3.1: Create TRELLIS.md architecture document
**File:** `docs/architecture/TRELLIS.md`
**Content:** First Order Directives, DEX Stack, Four Principles, Terminology Reference
**Source:** Uploaded Trellis Architecture documents

### Story 3.2: Create or update README architecture section
**File:** `README.md` (if exists) or `docs/README.md`
**Change:** Add link to TRELLIS.md, brief Trellis introduction

---

## Epic 4: Standalone Skill Package Update

### Story 4.1: Update skill SKILL.md
**File:** `C:\GitHub\grove-foundation-loop-skill\SKILL.md`
**Content:** Full Trellis/DEX terminology (sync with `C:\GitHub\the-grove-foundation\SKILL.md`)

### Story 4.2: Update skill references
**Files:** `C:\GitHub\grove-foundation-loop-skill\references\*.md`
**Change:** Add DEX Standard alignment checklist where appropriate

---

## Epic 5: Verification

### Story 5.1: Run DAIRE search verification
**Command:** `grep -r "DAIRE" --include="*.md" --include="*.ts" --include="*.tsx" --include="*.js" .`
**Expected:** 0 results

### Story 5.2: Run tests
**Command:** `npm test`
**Expected:** All pass

### Story 5.3: Run health check
**Command:** `npm run health`
**Expected:** All pass

### Story 5.4: Verify build
**Command:** `npm run build`
**Expected:** Success

---

## Execution Order

1. Epic 1 (Code) — Functional changes, needs build verification
2. Epic 5.4 (Build verification) — Confirm no breaks
3. Epic 2 (Sprint docs) — Non-breaking
4. Epic 3 (Reference docs) — New files
5. Epic 4 (Skill package) — Separate repo
6. Epic 5.1-5.3 (Final verification)

## Commit Format

```
docs: migrate DAIRE terminology to Trellis/DEX Standard

- Replace DAIRE references with Trellis Architecture
- Update DEX Standard principle names
- Add canonical TRELLIS.md reference
```
