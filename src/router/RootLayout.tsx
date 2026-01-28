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
import type { Sprout, SproutStage, SproutProvenance, CanonicalResearch, GeneratedArtifact } from '@core/schema/sprout';
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
    // S22-WP: 100% lossless canonical research from structured API
    canonicalResearch: rs.canonicalResearch,
    // Sprint: research-template-wiring-v1 - Bridge research data for document generation
    researchBranches: rs.branches,
    researchEvidence: rs.evidence,
    researchSynthesis: rs.synthesis,
    tags: rs.tags || [],
    notes: rs.notes,
    sessionId: rs.sessionId || 'unknown',
    creatorId: rs.creatorId,
    // S26-NUR: Map generated artifacts from ResearchSprout
    generatedArtifacts: rs.generatedArtifacts,
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
    // S22-WP: 100% lossless canonical research from structured API
    canonicalResearch: row.canonical_research as CanonicalResearch | undefined,
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
    // S23-SFR: Add gateDecisions to fix TypeScript error
    gateDecisions: (row.gate_decisions as ResearchSprout['gateDecisions']) || [],
    // S26-NUR: Map generated_artifacts from Supabase row
    generatedArtifacts: (row.generated_artifacts as GeneratedArtifact[]) || undefined,
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
    console.warn('[FinishingRoomGlobal] No Supabase client available');
    return null;
  }

  console.log('[FinishingRoomGlobal] Fetching sprout from Supabase:', id);
  console.log('[FinishingRoomGlobal] Table:', RESEARCH_SPROUTS_TABLE);

  try {
    const { data, error, status, statusText } = await client
      .from(RESEARCH_SPROUTS_TABLE)
      .select('*')
      .eq('id', id)
      .single();

    // Log full response details for debugging
    console.log('[FinishingRoomGlobal] Supabase response:', {
      status,
      statusText,
      hasData: !!data,
      hasError: !!error,
      errorCode: error?.code,
      errorMessage: error?.message,
      errorDetails: error?.details,
      errorHint: error?.hint,
    });

    if (error) {
      // PGRST116 = no rows found (not an error condition)
      if (error.code === 'PGRST116') {
        console.log('[FinishingRoomGlobal] Sprout not found in Supabase:', id);
        return null;
      }
      console.error('[FinishingRoomGlobal] Supabase fetch error:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
        status,
      });
      return null;
    }

    if (!data) {
      console.log('[FinishingRoomGlobal] No data returned (but no error)');
      return null;
    }

    console.log('[FinishingRoomGlobal] Successfully fetched sprout data');
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
 * Listens for: `open-finishing-room` CustomEvent with { sproutId, researchSprout? } detail
 * S23-SFR-Fix: Now accepts researchSprout data directly to avoid re-fetching
 */
function FinishingRoomGlobal() {
  const [isOpen, setIsOpen] = useState(false);
  const [sprout, setSprout] = useState<Sprout | null>(null);

  // Handle opening the finishing room
  const handleOpen = useCallback(async (event: CustomEvent<{ sproutId: string; researchSprout?: ResearchSprout }>) => {
    const { sproutId, researchSprout } = event.detail;
    console.log('[FinishingRoomGlobal] Event received, sproutId:', sproutId, 'hasResearchSprout:', !!researchSprout);

    let foundSprout: Sprout | null = null;

    // S23-SFR-Fix: Priority 0 - Use sprout data from event if available (avoids 406 errors)
    // This is the new preferred path when clicking from GardenTray/ResearchSproutContext
    if (researchSprout) {
      // S23-SFR DEBUG: Log incoming ResearchSprout canonical data
      console.log('[FinishingRoomGlobal] Incoming researchSprout.canonicalResearch:', {
        hasCanonical: !!researchSprout.canonicalResearch,
        title: researchSprout.canonicalResearch?.title,
        sectionsCount: researchSprout.canonicalResearch?.sections?.length || 0,
        sourcesCount: researchSprout.canonicalResearch?.sources?.length || 0,
        execSummaryLength: researchSprout.canonicalResearch?.executive_summary?.length || 0,
      });
      foundSprout = researchSproutToSprout(researchSprout);
      // S23-SFR DEBUG: Log converted Sprout canonical data
      console.log('[FinishingRoomGlobal] Converted sprout.canonicalResearch:', {
        hasCanonical: !!foundSprout.canonicalResearch,
        title: foundSprout.canonicalResearch?.title,
        sectionsCount: foundSprout.canonicalResearch?.sections?.length || 0,
        sourcesCount: foundSprout.canonicalResearch?.sources?.length || 0,
        execSummaryLength: foundSprout.canonicalResearch?.executive_summary?.length || 0,
      });
      console.log('[FinishingRoomGlobal] Using sprout data from event');

      // S26-NUR: Event data may be stale (cached context). Merge latest artifacts from Supabase
      // so that artifacts generated in a previous SFR session are not lost on reopen.
      if (!foundSprout.generatedArtifacts?.length) {
        const fresh = await fetchSproutFromSupabase(sproutId);
        if (fresh?.generatedArtifacts?.length) {
          foundSprout = { ...foundSprout, generatedArtifacts: fresh.generatedArtifacts };
          console.log('[FinishingRoomGlobal] Merged artifacts from Supabase:', fresh.generatedArtifacts.length);
        }
      }
    }

    // 1. First check test sprout (used by E2E tests) - localStorage takes priority for tests
    if (!foundSprout) {
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
    }

    // 2. Try Supabase (fallback for cases where event data isn't available)
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
  const handleSproutUpdate = useCallback(async (updated: Sprout) => {
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

    // S26-NUR: Persist generated artifacts to Supabase
    if (updated.generatedArtifacts && updated.generatedArtifacts.length > 0) {
      console.log('[FinishingRoomGlobal] Persisting artifacts to Supabase:', {
        sproutId: updated.id,
        artifactCount: updated.generatedArtifacts.length,
      });
      const client = getFinishingRoomSupabaseClient();
      if (client) {
        try {
          const { error: writeError, status, statusText } = await client
            .from(RESEARCH_SPROUTS_TABLE)
            .update({
              generated_artifacts: updated.generatedArtifacts,
              updated_at: new Date().toISOString(),
            })
            .eq('id', updated.id);

          if (writeError) {
            console.error('[FinishingRoomGlobal] Supabase artifact write error:', {
              code: writeError.code,
              message: writeError.message,
              details: writeError.details,
              hint: writeError.hint,
              status,
              statusText,
            });
          } else {
            console.log('[FinishingRoomGlobal] Artifacts persisted to Supabase successfully');
          }
        } catch (e) {
          console.error('[FinishingRoomGlobal] Failed to persist artifacts to Supabase:', e);
        }
      } else {
        console.warn('[FinishingRoomGlobal] No Supabase client — artifacts only in memory');
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
