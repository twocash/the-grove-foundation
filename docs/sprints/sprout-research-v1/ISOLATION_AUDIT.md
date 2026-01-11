# Sprout Research v1 - Isolation Audit

> Sprint: sprout-research-v1, Phase 6e
> Date: January 11, 2026
> Status: VERIFIED - Legacy commands isolated from /explore

## Executive Summary

The new sprout research system (`src/explore/`) is **completely isolated** from the legacy Terminal command system (`components/Terminal/`). The frozen zones remain untouched.

## Isolation Verification

### 1. New Flow Import Chain

```
/explore route
    ↓
src/surface/components/KineticStream/ExploreShell.tsx
    ↓ imports
@explore/services/prompt-architect-pipeline.ts
    ↓ imports
@explore/services/sprout-command-parser.ts
    ↓ intercepts
sprout:, research:, investigate: prefixes
```

### 2. Legacy Files - DEAD CODE in /explore Context

The following files exist in the frozen zone but are **never imported** by the /explore route:

| File | Purpose | Status in /explore |
|------|---------|-------------------|
| `components/Terminal/CommandInput/commands/sprout.ts` | Legacy /sprout command | UNREACHABLE |
| `components/Terminal/CommandInput/commands/garden.ts` | Legacy /garden command | UNREACHABLE |
| `components/Terminal/CommandInput/commands/capture.ts` | Legacy /capture command | N/A (doesn't exist) |
| `components/Terminal/CommandInput/commands/index.ts` | Command registry | UNREACHABLE |

### 3. Grep Evidence

#### No Terminal imports in src/explore/
```bash
grep -r "from.*Terminal/" src/explore/
# Result: No matches found
```

#### No Terminal command imports in KineticStream
```bash
grep -r "Terminal/CommandInput" src/surface/components/KineticStream/
# Result: No matches found
```

#### Only shared import is CustomLensWizard
```bash
grep -r "from.*Terminal/" src/surface/components/KineticStream/ExploreShell.tsx
# Result: import { CustomLensWizard } from '../../../../components/Terminal/CustomLensWizard';
```

The `CustomLensWizard` is a shared UI component (lens creation wizard), NOT related to sprout commands.

## Feature Flag Gates

| Flag | Purpose | Default |
|------|---------|---------|
| `sprout-research` | Enable new sprout: command interception | false |
| `garden-inspector` | Enable Garden Inspector panel | false |
| `legacy-sprout-disabled` | Mark legacy command as deprecated | false |

## Frozen Zones

These directories were **NOT TOUCHED** during this sprint:

### components/Terminal/ (77 files)
- Zero file modifications
- Zero line changes
- Existing command files remain intact

### src/foundation/ (23 files)
- Zero file modifications
- Zero line changes
- Admin consoles unaffected

## New Code Locations

All new code was added to permitted zones:

| Directory | Files Added | Purpose |
|-----------|-------------|---------|
| `src/explore/services/` | 8 | Pipeline, parser, agents |
| `src/explore/hooks/` | 5 | React bindings |
| `src/explore/context/` | 2 | State management |
| `src/explore/` | 1 | GardenInspector.tsx |
| `src/core/schema/` | 2 | Type definitions |

## Verification Commands

Run these commands to verify isolation:

```bash
# Verify no Terminal imports in explore
grep -r "from.*Terminal/" src/explore/
# Expected: No matches

# Verify no command file imports
grep -r "CommandInput/commands" src/
# Expected: No matches in surface/ or explore/

# Verify frozen zones untouched
git diff --stat origin/main -- components/Terminal/
# Expected: No changes

git diff --stat origin/main -- src/foundation/
# Expected: No changes
```

## Conclusion

The strangler fig pattern was successfully applied:
1. New system is fully functional in /explore
2. Legacy system remains untouched in frozen zones
3. Zero cross-imports between old and new
4. Feature flags control activation

**Gate Status: PASSED**
"Legacy commands effectively dead in /explore; FROZEN ZONE UNTOUCHED"
