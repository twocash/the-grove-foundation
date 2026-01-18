# Epic 5: Lens URL Hydration - Specification

**Sprint**: active-grove-polish-v2
**Epic**: 5 - URL Lens Parameter Hydration
**Date**: 2024-12-23

---

## Problem Statement

Users arriving via personalized URLs (`?lens=engineer`) see correct personalized content but encounter the lens picker when clicking the seedling—breaking the seamless experience that deep links should provide.

**Root Cause**: SSR hydration gap in NarrativeEngineContext leaves `session.activeLens` null even when URL param is present.

**Strategic Context**: This is not just a bug fix—it's an opportunity to establish a migration pattern away from the legacy NarrativeEngine monolith toward a cleaner, declarative engagement architecture.

---

## Goals

### G1: Fix URL Lens Parameter (Immediate)
Users arriving via `?lens=<archetype>` should skip the lens picker entirely and land directly into the personalized Terminal experience.

### G2: Establish Migration Pattern (Strategic)
Create an isolated, well-documented hook that demonstrates how to extend functionality WITHOUT modifying the legacy NarrativeEngineContext. This becomes the template for future engagement system work.

### G3: Document Architectural Vision (Long-term)
Leave comprehensive breadcrumbs for future developers (and Claude sessions) about WHY we're making these choices and WHERE we're headed architecturally.

---

## Non-Goals

- **NOT fixing NarrativeEngineContext directly** — Too risky, too much scope
- **NOT migrating all lens logic** — That's a future sprint
- **NOT handling custom lens URL sharing** — Already handled by `?share=` param
- **NOT analytics integration** — Can add in future iteration

---

## Acceptance Criteria

### Functional Requirements

| ID | Requirement | Validation |
|----|-------------|------------|
| F1 | `/?lens=engineer` → activeLens is 'engineer' on tree click | Console log shows lens |
| F2 | `/?lens=academic` → Skips picker, opens Terminal directly | Visual inspection |
| F3 | `/?lens=freestyle` → Works for freestyle lens | Visual inspection |
| F4 | `/?lens=invalid` → Falls back to picker (graceful degradation) | No errors, picker shows |
| F5 | No lens param → Shows picker as before (no regression) | Visual inspection |
| F6 | Lens in localStorage + URL param → URL param wins (deep link intent) | Console log |

### Technical Requirements

| ID | Requirement | Validation |
|----|-------------|------------|
| T1 | New hook `useLensHydration.ts` in `src/surface/hooks/` | File exists |
| T2 | Hook uses existing `selectLens()` from NarrativeEngine | No new state mutations |
| T3 | Hook validates lens against known archetypes | Invalid lens → no-op |
| T4 | Hook logs actions for debugging | Console output |
| T5 | Hook is idempotent (safe to call multiple times) | No double-selection |
| T6 | GenesisPage imports and calls hook before useQuantumInterface | Code review |

### Documentation Requirements

| ID | Requirement | Validation |
|----|-------------|------------|
| D1 | Hook file has 20+ lines of header documentation | Code review |
| D2 | Migration path documented in ARCHITECTURE.md | File exists |
| D3 | ADR for "bridge hook" pattern | DECISIONS.md |
| D4 | Future refactoring roadmap documented | ARCHITECTURE.md |

---

## User Stories

### Story 1: Deep Link Visitor
```
AS a visitor clicking a shared link with ?lens=engineer
I WANT to land directly into the engineer experience  
SO THAT I don't have to re-select what the link already specified
```

**Acceptance**: Seedling click → Terminal opens → No picker shown

### Story 2: Marketing Campaign
```
AS a marketer sending email campaigns
I WANT to use ?lens= URLs for audience targeting
SO THAT academics get academic framing, engineers get technical depth
```

**Acceptance**: Each lens URL produces correct personalized experience

### Story 3: Future Developer
```
AS a developer working on engagement architecture
I WANT clear documentation about why useLensHydration exists
SO THAT I know whether to enhance it or deprecate it during migration
```

**Acceptance**: Reading the hook file explains the full context

---

## Technical Specification

### New File: `src/surface/hooks/useLensHydration.ts`

```typescript
/**
 * useLensHydration - Bridge SSR hydration gap for URL lens parameters
 * 
 * ============================================================================
 * ARCHITECTURAL CONTEXT - READ BEFORE MODIFYING
 * ============================================================================
 * 
 * This hook exists because of a fundamental tension in The Grove's architecture:
 * 
 * LEGACY SYSTEM (NarrativeEngineContext):
 * - 694-line monolith handling session, journeys, entropy, persistence
 * - URL param reading broken by SSR (useState initializer returns null on server)
 * - Too risky to modify directly
 * 
 * NEW SYSTEM (useQuantumInterface + friends):
 * - Clean, focused, single-responsibility hooks
 * - Declarative inputs → outputs
 * - The pattern we're migrating toward
 * 
 * THIS HOOK IS A BRIDGE:
 * - Fixes immediate SSR bug without touching legacy code
 * - Demonstrates the "isolated hook" pattern for future work
 * - Should be DEPRECATED when NarrativeEngine is refactored
 * 
 * ============================================================================
 * MIGRATION PATH
 * ============================================================================
 * 
 * Phase 1 (Current): Isolated bridge hooks
 *   - useLensHydration (this file) - URL params
 *   - useQuantumInterface - Reality resolution
 * 
 * Phase 2 (Future): Unified EngagementContext
 *   - Clean state machine for lens, journey, entropy
 *   - Declarative configuration
 *   - This hook's logic absorbed into new system
 * 
 * Phase 3 (Future): Legacy deprecation
 *   - NarrativeEngineContext deleted
 *   - This hook deleted
 *   - Single source of truth
 * 
 * ============================================================================
 * WHEN TO MODIFY THIS FILE
 * ============================================================================
 * 
 * YES: Adding logging, analytics, validation
 * YES: Supporting new URL parameters (e.g., ?journey=)
 * NO:  Adding state management (use NarrativeEngine or wait for EngagementContext)
 * NO:  Adding side effects beyond lens selection
 * 
 * If you need to do something this hook can't support, that's a signal to
 * accelerate the Phase 2 migration, not to bloat this bridge.
 * 
 * ============================================================================
 */

import { useEffect, useRef } from 'react';
import { useNarrativeEngine } from '../../../hooks/useNarrativeEngine';
import { DEFAULT_PERSONAS } from '../../../data/default-personas';

// Valid archetype IDs that can be passed via URL
const VALID_ARCHETYPES = Object.keys(DEFAULT_PERSONAS);

export function useLensHydration(): void {
  const { session, selectLens } = useNarrativeEngine();
  const hasHydrated = useRef(false);

  useEffect(() => {
    // SSR guard
    if (typeof window === 'undefined') return;
    
    // Idempotency guard
    if (hasHydrated.current) return;
    hasHydrated.current = true;

    // Read URL parameter
    const params = new URLSearchParams(window.location.search);
    const lensParam = params.get('lens');
    
    if (!lensParam) {
      console.log('[LensHydration] No URL lens param');
      return;
    }

    // Validate against known archetypes
    if (!VALID_ARCHETYPES.includes(lensParam)) {
      console.warn('[LensHydration] Invalid lens param:', lensParam);
      return;
    }

    // Check if lens already set (localStorage may have restored it)
    if (session.activeLens === lensParam) {
      console.log('[LensHydration] Lens already set:', lensParam);
      return;
    }

    // Hydrate lens to session
    console.log('[LensHydration] Hydrating from URL:', lensParam);
    selectLens(lensParam);
    
  }, []); // Run once on mount - dependencies intentionally empty
}

export default useLensHydration;
```

### Modified File: `src/surface/pages/GenesisPage.tsx`

```typescript
// Add import at top with other hooks:
import { useLensHydration } from '../hooks/useLensHydration';

// Add call BEFORE useQuantumInterface (order matters):
const GenesisPage: React.FC = () => {
  // ... existing state

  // Bridge SSR gap for URL lens params (see hook for migration context)
  useLensHydration();

  // Quantum Interface - lens-reactive content (v0.14)
  const { reality, quantumTrigger, isCollapsing, activeLens } = useQuantumInterface();
  
  // ... rest of component
};
```

---

## Testing Strategy

### Manual Testing Matrix

| Scenario | URL | Expected | Verify |
|----------|-----|----------|--------|
| Engineer lens | `/?lens=engineer` | Skip picker, Terminal opens | ✓ |
| Academic lens | `/?lens=academic` | Skip picker, academic welcome | ✓ |
| Freestyle | `/?lens=freestyle` | Skip picker, freestyle mode | ✓ |
| Invalid lens | `/?lens=foobar` | Show picker (fallback) | ✓ |
| No param | `/` | Show picker | ✓ |
| Case sensitivity | `/?lens=Engineer` | Show picker (case-sensitive) | ✓ |

### Console Log Verification

```
// Success case:
[LensHydration] Hydrating from URL: engineer
[ActiveGrove] Tree clicked → unlocked (lens exists: engineer)

// Already set case:
[LensHydration] Lens already set: engineer

// Invalid case:
[LensHydration] Invalid lens param: foobar
[ActiveGrove] Tree clicked → split mode (no lens)

// No param case:
[LensHydration] No URL lens param
[ActiveGrove] Tree clicked → split mode (no lens)
```

---

## Dependencies

### Imports Required
- `useNarrativeEngine` from `hooks/useNarrativeEngine`
- `DEFAULT_PERSONAS` from `data/default-personas`

### No New Dependencies
- No new npm packages
- No new API calls
- No new localStorage keys

---

## Risks & Mitigations

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Double lens selection | LOW | LOW | useRef guard for idempotency |
| Race with localStorage restore | LOW | MEDIUM | Check if already set before selecting |
| Future NarrativeEngine changes | MEDIUM | LOW | Hook is isolated, easy to update |
| Confusion about which system to use | HIGH | MEDIUM | Extensive documentation |

---

## Success Metrics

1. **Immediate**: URL lens works on first try
2. **Short-term**: No regressions in lens picker flow
3. **Long-term**: This pattern copied for future bridge hooks
4. **Strategic**: Migration documentation used in future sprints

---

## Next Document

See **ARCHITECTURE.md** for target state, migration roadmap, and engagement system vision.
