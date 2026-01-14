# Deprecated Tests Archive

**Purpose:** Archive for tests targeting FROZEN zones (legacy MVP code)

**Created:** 2026-01-14
**Protocol:** Mine Sweeper (`.agent/roles/mine-sweeper.md`)

---

## Archive Policy

Tests are moved here when they:
1. Target FROZEN zone components (legacy Terminal, Foundation)
2. Test features that were intentionally removed
3. Cannot be fixed without modifying legacy code

All archived tests MUST have:
- `@legacy` comment explaining why archived
- `test.skip()` wrapper
- Entry in manifest below

---

## Archive Manifest

| Test File | Date Archived | Reason | Original Location |
|-----------|---------------|--------|-------------------|
| *None yet* | - | - | - |

---

## Re-activation Policy

Tests can be re-activated if:
1. The feature is rebuilt in ACTIVE zones
2. New test targets the ACTIVE implementation
3. Visual verification confirms correct behavior

---

## Zone Reference

### FROZEN (Tests archived from here)
```
src/components/Terminal/
src/foundation/
pages/TerminalPage.tsx
```

### ACTIVE (Tests must pass)
```
src/bedrock/
src/explore/
src/core/
```
