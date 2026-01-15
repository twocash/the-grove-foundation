// src/router/RootLayout.tsx
// Root layout wrapper that provides theme and data context to all routes
// Updated: S3||SFR-Actions - Added FinishingRoomGlobal for test/integration support
// Updated: Data source fix - Fetch from Supabase instead of localStorage

import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ThemeProvider } from '../theme';
import { GroveDataProviderComponent, SupabaseAdapter } from '@core/data';
import { SproutFinishingRoom } from '@surface/components/modals/SproutFinishingRoom';
import { ToastProvider } from '../explore/context/ToastContext';
import type { Sprout, SproutStage, SproutProvenance } from '@core/schema/sprout';
import type { ResearchSprout, ResearchSproutStatus } from '@core/schema/research-sprout';
import { RESEARCH_SPROUTS_TABLE } from '@core/schema/research-sprout-registry';

// =============================================================================
// Supabase Client for FinishingRoomGlobal
// =============================================================================

let finishingRoomSupabaseClient: SupabaseClient | null = null;

function getFinishingRoomSupabaseClient(): SupabaseClient | null {
  if (finishingRoomSupabaseClient) return finishingRoomSupabaseClient;

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('[FinishingRoomGlobal] Supabase not configured, falling back to localStorage');
    return null;
  }

  finishingRoomSupabaseClient = createClient(supabaseUrl, supabaseKey);
  return finishingRoomSupabaseClient;
}

// =============================================================================
// ResearchSprout → Sprout Adapter
// =============================================================================

/**
 * Map ResearchSproutStatus to SproutStage
 */
function mapStatusToStage(status: ResearchSproutStatus): SproutStage {
  const mapping: Record<ResearchSproutStatus, SproutStage> = {
    'pending': 'tender',
    'active': 'rooting',
    'paused': 'dormant',
    'blocked': 'withered',
    'completed': 'hardened',
    'archived': 'dormant',
  };
  return mapping[status] ?? 'tender';
}

/**
 * Convert ResearchSprout (from Supabase) to Sprout (for SproutFinishingRoom)
 *
 * This adapter bridges the two different sprout schemas:
 * - ResearchSprout: Agent-driven research from Supabase
 * - Sprout: Capture-based sprout for display
 */
function researchSproutToSprout(rs: ResearchSprout): Sprout {
  // Build provenance from grove config snapshot
  const provenance: SproutProvenance = {
    lens: null, // ResearchSprout doesn't have lens concept
    hub: null,  // Could extract from groveConfigSnapshot.hypothesisGoals
    journey: null,
    node: null,
    knowledgeFiles: rs.groveConfigSnapshot?.corpusBoundaries || [],
    model: rs.execution?.agentId,
    generatedAt: rs.createdAt,
  };

  // Build response from synthesis or use title as fallback
  const response = rs.synthesis?.summary
    || rs.researchDocument?.analysis
    || rs.title
    || 'Research in progress...';

  return {
    id: rs.id,
    capturedAt: rs.createdAt,
    response,
    query: rs.spark,
    provenance,
    personaId: null,
    journeyId: null,
    hubId: null,
    nodeId: null,
    status: 'sprout', // Legacy field
    stage: mapStatusToStage(rs.status),
    researchDocument: rs.researchDocument,
    tags: rs.tags || [],
    notes: rs.notes,
    sessionId: rs.sessionId || 'unknown',
    creatorId: rs.creatorId,
  };
}

/**
 * Transform database row to ResearchSprout
 * (Duplicated from ResearchSproutContext to avoid import issues)
 */
function rowToResearchSprout(row: Record<string, unknown>): ResearchSprout {
  return {
    id: row.id as string,
    spark: row.spark as string,
    title: row.title as string,
    groveId: row.grove_id as string,
    status: row.status as ResearchSproutStatus,
    strategy: row.strategy as ResearchSprout['strategy'],
    branches: (row.branches as ResearchSprout['branches']) || [],
    evidence: (row.evidence as ResearchSprout['evidence']) || [],
    synthesis: row.synthesis as ResearchSprout['synthesis'] | undefined,
    execution: row.execution as ResearchSprout['execution'] | undefined,
    researchDocument: row.research_document as ResearchSprout['researchDocument'],
    statusHistory: (row.status_history as ResearchSprout['statusHistory']) || [],
    appliedRuleIds: (row.applied_rule_ids as string[]) || [],
    inferenceConfidence: (row.inference_confidence as number) || 0,
    groveConfigSnapshot: row.grove_config_snapshot as ResearchSprout['groveConfigSnapshot'],
    architectSessionId: row.architect_session_id as string | null,
    parentSproutId: row.parent_sprout_id as string | null,
    spawnDepth: (row.spawn_depth as number) || 0,
    childSproutIds: (row.child_sprout_ids as string[]) || [],
    creatorId: row.creator_id as string | null,
    sessionId: (row.session_id as string) || 'unknown',
    tags: (row.tags as string[]) || [],
    notes: (row.notes as string) || null,
    reviewed: (row.reviewed as boolean) || false,
    requiresReview: (row.requires_review as boolean) || false,
    rating: row.rating as number | undefined,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

/**
 * Fetch a single sprout from Supabase by ID
 */
async function fetchSproutFromSupabase(id: string): Promise<Sprout | null> {
  const client = getFinishingRoomSupabaseClient();
  if (!client) {
    return null;
  }

  try {
    const { data, error } = await client
      .from(RESEARCH_SPROUTS_TABLE)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // PGRST116 = no rows found (not an error condition)
      if (error.code === 'PGRST116') {
        console.log('[FinishingRoomGlobal] Sprout not found in Supabase:', id);
        return null;
      }
      console.error('[FinishingRoomGlobal] Supabase fetch error:', error.message);
      return null;
    }

    if (!data) return null;

    // Convert to ResearchSprout then to Sprout
    const researchSprout = rowToResearchSprout(data);
    return researchSproutToSprout(researchSprout);
  } catch (e) {
    console.error('[FinishingRoomGlobal] Failed to fetch sprout:', e);
    return null;
  }
}

interface RootLayoutProps {
  children?: React.ReactNode;
}

/**
 * FinishingRoomGlobal - Global modal integration for SproutFinishingRoom
 *
 * Enables the Finishing Room to be opened from anywhere via custom event.
 * Used by E2E tests and can be used for future integrations.
 *
 * Listens for: `open-finishing-room` CustomEvent with { sproutId } detail
 */
function FinishingRoomGlobal() {
  const [isOpen, setIsOpen] = useState(false);
  const [sprout, setSprout] = useState<Sprout | null>(null);

  // Handle opening the finishing room
  const handleOpen = useCallback(async (event: CustomEvent<{ sproutId: string }>) => {
    const { sproutId } = event.detail;
    console.log('[FinishingRoomGlobal] Event received, sproutId:', sproutId);

    let foundSprout: Sprout | null = null;

    // 1. First check test sprout (used by E2E tests) - localStorage takes priority for tests
    const testSproutJson = localStorage.getItem('grove-test-sprout');
    if (testSproutJson) {
      try {
        const testSprout = JSON.parse(testSproutJson);
        if (testSprout.id === sproutId) {
          foundSprout = testSprout;
          console.log('[FinishingRoomGlobal] Found in test sprout localStorage');
        }
      } catch (e) {
        console.warn('[FinishingRoomGlobal] Failed to parse test sprout:', e);
      }
    }

    // 2. Try Supabase (primary source for production)
    if (!foundSprout) {
      console.log('[FinishingRoomGlobal] Fetching from Supabase...');
      foundSprout = await fetchSproutFromSupabase(sproutId);
      if (foundSprout) {
        console.log('[FinishingRoomGlobal] Found in Supabase');
      }
    }

    // 3. Fallback to localStorage grove-sprouts (legacy support)
    if (!foundSprout) {
      const sproutsJson = localStorage.getItem('grove-sprouts');
      if (sproutsJson) {
        try {
          const sprouts = JSON.parse(sproutsJson);
          foundSprout = sprouts.find((s: Sprout) => s.id === sproutId) || null;
          if (foundSprout) {
            console.log('[FinishingRoomGlobal] Found in localStorage grove-sprouts');
          }
        } catch (e) {
          console.warn('[FinishingRoomGlobal] Failed to parse sprouts:', e);
        }
      }
    }

    console.log('[FinishingRoomGlobal] Found sprout:', !!foundSprout, foundSprout?.id);
    if (foundSprout) {
      setSprout(foundSprout);
      setIsOpen(true);
      console.log('[FinishingRoomGlobal] Modal opening');
    } else {
      console.warn('[FinishingRoomGlobal] Sprout not found in any source:', sproutId);
    }
  }, []);

  // Handle closing
  const handleClose = useCallback(() => {
    setIsOpen(false);
    setSprout(null);
  }, []);

  // Handle sprout updates (from action panel)
  const handleSproutUpdate = useCallback((updated: Sprout) => {
    setSprout(updated);
    // Update in localStorage
    const sproutsJson = localStorage.getItem('grove-sprouts');
    if (sproutsJson) {
      try {
        const sprouts = JSON.parse(sproutsJson);
        const index = sprouts.findIndex((s: Sprout) => s.id === updated.id);
        if (index !== -1) {
          sprouts[index] = updated;
          localStorage.setItem('grove-sprouts', JSON.stringify(sprouts));
        }
      } catch (e) {
        console.warn('[FinishingRoomGlobal] Failed to update sprout:', e);
      }
    }
  }, []);

  // Track when listener is ready for E2E tests
  const [listenerReady, setListenerReady] = useState(false);

  // Listen for custom event
  useEffect(() => {
    console.log('[FinishingRoomGlobal] Registering event listener');
    const handler = (e: Event) => handleOpen(e as CustomEvent<{ sproutId: string }>);
    window.addEventListener('open-finishing-room', handler);
    setListenerReady(true);
    return () => {
      console.log('[FinishingRoomGlobal] Removing event listener');
      window.removeEventListener('open-finishing-room', handler);
      setListenerReady(false);
    };
  }, [handleOpen]);

  // Always render marker div for E2E tests to detect readiness
  return (
    <>
      {/* Hidden marker for E2E tests to wait on */}
      {listenerReady && (
        <div
          data-testid="finishing-room-listener-ready"
          style={{ display: 'none' }}
          aria-hidden="true"
        />
      )}
      {isOpen && sprout && (
        <ToastProvider>
          <SproutFinishingRoom
            sprout={sprout}
            isOpen={isOpen}
            onClose={handleClose}
            onSproutUpdate={handleSproutUpdate}
          />
        </ToastProvider>
      )}
    </>
  );
}

/**
 * Root layout component that wraps all routes with ThemeProvider and GroveDataProvider.
 * ThemeProvider uses useLocation() for surface detection, so it must be
 * inside the router context.
 *
 * Uses SupabaseAdapter for production data access.
 */
export const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  const provider = useMemo(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Debug log for troubleshooting (remove in production)
    console.log('[RootLayout] Supabase URL configured:', !!supabaseUrl);
    console.log('[RootLayout] Supabase key configured:', !!supabaseKey);
    
    if (supabaseUrl && supabaseKey && supabaseUrl !== '' && supabaseKey !== '') {
      console.log('[RootLayout] Using SupabaseAdapter');
      const client = createClient(supabaseUrl, supabaseKey);
      return new SupabaseAdapter({ client });
    }
    // Falls back to localStorage if no Supabase config
    console.log('[RootLayout] Falling back to LocalStorageAdapter');
    return undefined;
  }, []);

  return (
    <ThemeProvider>
      <GroveDataProviderComponent provider={provider}>
        {children ?? <Outlet />}
        <FinishingRoomGlobal />
      </GroveDataProviderComponent>
    </ThemeProvider>
  );
};

export default RootLayout;
