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
 * - React preserves that null during hydration, ignoring URL params
 * - Too risky to modify directly—any change could cause cascading side effects
 *
 * NEW SYSTEM (useQuantumInterface + friends):
 * - Clean, focused, single-responsibility hooks
 * - Declarative inputs → outputs
 * - The pattern we're migrating toward
 *
 * THE BUG THIS HOOK FIXES:
 * When a user visits `/?lens=engineer`:
 * 1. Server renders with activeLens = null (window undefined on server)
 * 2. React hydrates, preserving SSR state (activeLens still null)
 * 3. User clicks seedling expecting to skip the picker
 * 4. Picker shows because handleTreeClick sees activeLens = null
 * 5. User has to re-select what the URL already specified
 *
 * THIS HOOK IS A BRIDGE:
 * - Fixes immediate SSR bug without touching legacy code
 * - Demonstrates the "isolated hook" pattern for future work
 * - Should be DEPRECATED when NarrativeEngine is refactored (Phase 2)
 *
 * ============================================================================
 * MIGRATION PATH
 * ============================================================================
 *
 * Phase 1 (Current - Q1 2025): Isolated bridge hooks
 *   - useLensHydration (this file) - URL params
 *   - useQuantumInterface - Reality resolution
 *   - Future: useJourneyHydration, useReferrerTracking
 *
 * Phase 2 (Q2 2025): Unified EngagementContext
 *   - Clean state machine for lens, journey, entropy
 *   - Declarative configuration loaded from GCS
 *   - This hook's logic absorbed into new system
 *   - See: docs/ENGAGEMENT_ARCHITECTURE_MIGRATION.md
 *
 * Phase 3 (Q3 2025): Legacy deprecation
 *   - NarrativeEngineContext deleted
 *   - This hook deleted
 *   - Single source of truth
 *
 * ============================================================================
 * WHEN TO MODIFY THIS FILE
 * ============================================================================
 *
 * YES - Appropriate modifications:
 *   - Adding logging, analytics, or telemetry
 *   - Supporting additional URL parameters (e.g., ?journey=)
 *   - Improving validation or error handling
 *   - Adding console warnings for debugging
 *
 * NO - Do NOT add these here (wait for Phase 2):
 *   - State management beyond calling selectLens()
 *   - Side effects beyond lens selection
 *   - Complex business logic
 *   - New localStorage keys
 *
 * If you need functionality this hook can't support, that's a signal to
 * accelerate the Phase 2 migration, not to bloat this bridge.
 *
 * ============================================================================
 * RELATED FILES
 * ============================================================================
 *
 * - hooks/useNarrativeEngine.ts - Exposes selectLens() mutator we use
 * - hooks/NarrativeEngineContext.tsx - Legacy monolith (DO NOT MODIFY)
 * - data/default-personas.ts - Source of truth for valid archetypes
 * - src/surface/hooks/useQuantumInterface.ts - Clean pattern to follow
 * - docs/sprints/active-grove-polish-v2/epic-5-lens-hydration/ - Full context
 *
 * ============================================================================
 * ADRs (Architecture Decision Records)
 * ============================================================================
 *
 * ADR-019: Bridge hook pattern chosen over patching NarrativeEngine
 * ADR-020: Validate against DEFAULT_PERSONAS, not hardcoded list
 * ADR-021: URL param wins over localStorage (deep link intent)
 * ADR-022: useRef for idempotency, not useState (avoid re-renders)
 * ADR-023: Empty dependency array - run once on mount only
 *
 * See: docs/sprints/active-grove-polish-v2/epic-5-lens-hydration/DECISIONS.md
 *
 * ============================================================================
 */

import { useEffect, useRef } from 'react';
import { useNarrativeEngine } from '../../../hooks/useNarrativeEngine';
import { DEFAULT_PERSONAS } from '../../../data/default-personas';

// Valid archetype IDs that can be passed via URL
// Derived from DEFAULT_PERSONAS to stay in sync automatically
const VALID_ARCHETYPES = Object.keys(DEFAULT_PERSONAS);

/**
 * Bridge hook that hydrates lens selection from URL parameters after SSR.
 *
 * Call this hook BEFORE useQuantumInterface() in your component to ensure
 * the lens is set before reality resolution occurs.
 *
 * @example
 * ```tsx
 * const GenesisPage: React.FC = () => {
 *   // 1. First: Hydrate lens from URL
 *   useLensHydration();
 *
 *   // 2. Then: Get reality (will see hydrated lens)
 *   const { activeLens } = useQuantumInterface();
 *
 *   // activeLens will be 'engineer' if URL was /?lens=engineer
 * };
 * ```
 *
 * @returns void - This is a side-effect only hook
 */
export function useLensHydration(): void {
  const { session, selectLens } = useNarrativeEngine();
  const hasHydrated = useRef(false);

  useEffect(() => {
    // SSR guard - window is undefined on server
    if (typeof window === 'undefined') return;

    // Idempotency guard - only run once per mount
    // Using useRef instead of useState to avoid triggering re-renders
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
    // Invalid params gracefully degrade to showing the picker
    if (!VALID_ARCHETYPES.includes(lensParam)) {
      console.warn('[LensHydration] Invalid lens param:', lensParam,
        '- Valid options:', VALID_ARCHETYPES.join(', '));
      return;
    }

    // Check if lens already set (localStorage may have restored it)
    // If already matching, skip to avoid unnecessary state update
    if (session.activeLens === lensParam) {
      console.log('[LensHydration] Lens already set:', lensParam);
      return;
    }

    // Hydrate lens to session via NarrativeEngine's mutator
    // This will trigger a re-render with the correct activeLens
    console.log('[LensHydration] Hydrating from URL:', lensParam);
    selectLens(lensParam);

  }, []); // Empty dependency array - run once on mount only
  // Note: session and selectLens are stable references from context
}

export default useLensHydration;
