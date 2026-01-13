// src/explore/hooks/useResearchProgress.ts
// Progress state management for Research Lifecycle UI
// Sprint: progress-streaming-ui-v1
//
// DEX: Provenance as Infrastructure
// Every event includes timestamp for debugging and metrics.

import { useState, useCallback, useRef } from 'react';
import type { PipelineProgressEvent } from '../services/research-pipeline';

// =============================================================================
// Types
// =============================================================================

export interface ProgressSource {
  url: string;
  title: string;
  domain: string;
  timestamp: string;
}

export interface TimestampedEvent {
  event: PipelineProgressEvent;
  timestamp: string;
}

export type ProgressPhase = 'idle' | 'research' | 'writing' | 'complete' | 'error';

export interface ResearchProgressState {
  /** Whether research is currently active */
  isActive: boolean;

  /** Current pipeline phase */
  currentPhase: ProgressPhase;

  /** Recent progress events (max 10, FIFO) */
  events: TimestampedEvent[];

  /** Discovered sources */
  sources: ProgressSource[];

  /** Current search query (if searching) */
  currentQuery: string | null;

  /** Current branch being processed */
  currentBranch: { id: string; label: string } | null;

  /** Error message (if failed) */
  error: string | null;

  /** Completion data (if complete) */
  completion: {
    documentId?: string;
    duration: number;
    sourceCount: number;
  } | null;
}

export interface UseResearchProgressResult {
  state: ResearchProgressState;
  pushEvent: (event: PipelineProgressEvent) => void;
  reset: () => void;
}

// =============================================================================
// Constants
// =============================================================================

const MAX_EVENTS = 10;

const INITIAL_STATE: ResearchProgressState = {
  isActive: false,
  currentPhase: 'idle',
  events: [],
  sources: [],
  currentQuery: null,
  currentBranch: null,
  error: null,
  completion: null,
};

// =============================================================================
// Event Type Guards
// =============================================================================

// Pipeline-level event types
const PIPELINE_EVENT_TYPES = [
  'phase-started',
  'phase-completed',
  'pipeline-complete',
  'pipeline-error',
] as const;

// Research agent event types
const RESEARCH_EVENT_TYPES = [
  'branch-started',
  'branch-completed',
  'search-started',
  'source-discovered',
  'evidence-collected',
  'research-complete',
  'error',
] as const;

// Writer agent event types
const WRITER_EVENT_TYPES = [
  'writer-started',
  'section-started',
  'section-completed',
  'writer-complete',
] as const;

type PipelineEventType = typeof PIPELINE_EVENT_TYPES[number];
type ResearchEventType = typeof RESEARCH_EVENT_TYPES[number];
type WriterEventType = typeof WRITER_EVENT_TYPES[number];

function isPipelineEvent(type: string): type is PipelineEventType {
  return PIPELINE_EVENT_TYPES.includes(type as PipelineEventType);
}

function isResearchEvent(type: string): type is ResearchEventType {
  return RESEARCH_EVENT_TYPES.includes(type as ResearchEventType);
}

function isWriterEvent(type: string): type is WriterEventType {
  return WRITER_EVENT_TYPES.includes(type as WriterEventType);
}

// =============================================================================
// Utilities
// =============================================================================

function extractDomain(url: string): string {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return url.slice(0, 30);
  }
}

// =============================================================================
// Hook
// =============================================================================

export function useResearchProgress(): UseResearchProgressResult {
  const [state, setState] = useState<ResearchProgressState>(INITIAL_STATE);
  const eventsRef = useRef<TimestampedEvent[]>([]);
  const sourcesRef = useRef<ProgressSource[]>([]);

  // Push a new event and update state
  const pushEvent = useCallback((event: PipelineProgressEvent) => {
    const timestamp = new Date().toISOString();
    const timestampedEvent: TimestampedEvent = { event, timestamp };

    // Add to events buffer (FIFO)
    eventsRef.current = [...eventsRef.current.slice(-(MAX_EVENTS - 1)), timestampedEvent];

    setState(prev => {
      const newState = { ...prev, isActive: true };
      newState.events = eventsRef.current;

      const eventType = event.type;

      // Handle pipeline-level events
      if (isPipelineEvent(eventType)) {
        switch (eventType) {
          case 'phase-started': {
            const phaseEvent = event as { type: 'phase-started'; phase: 'research' | 'writing' };
            newState.currentPhase = phaseEvent.phase;
            newState.error = null;
            break;
          }
          case 'pipeline-complete': {
            const completeEvent = event as { type: 'pipeline-complete'; totalDuration: number };
            newState.currentPhase = 'complete';
            newState.isActive = false;
            newState.completion = {
              duration: completeEvent.totalDuration,
              sourceCount: sourcesRef.current.length,
            };
            break;
          }
          case 'pipeline-error': {
            const errorEvent = event as { type: 'pipeline-error'; message: string };
            newState.currentPhase = 'error';
            newState.isActive = false;
            newState.error = errorEvent.message;
            break;
          }
        }
      }

      // Handle research agent events
      if (isResearchEvent(eventType)) {
        switch (eventType) {
          case 'search-started': {
            const searchEvent = event as { type: 'search-started'; query: string };
            newState.currentQuery = searchEvent.query;
            break;
          }
          case 'source-discovered': {
            const sourceEvent = event as { type: 'source-discovered'; url: string; title: string };
            const source: ProgressSource = {
              url: sourceEvent.url,
              title: sourceEvent.title,
              domain: extractDomain(sourceEvent.url),
              timestamp,
            };
            sourcesRef.current = [...sourcesRef.current, source];
            newState.sources = sourcesRef.current;
            break;
          }
          case 'branch-started': {
            const branchEvent = event as { type: 'branch-started'; branchId: string; label: string };
            newState.currentBranch = { id: branchEvent.branchId, label: branchEvent.label };
            break;
          }
          case 'branch-completed':
            newState.currentBranch = null;
            newState.currentQuery = null;
            break;
          case 'research-complete': {
            const researchCompleteEvent = event as { type: 'research-complete'; totalEvidence: number };
            newState.completion = {
              ...newState.completion,
              sourceCount: researchCompleteEvent.totalEvidence,
              duration: newState.completion?.duration ?? 0,
            };
            break;
          }
          case 'error': {
            const errorEvent = event as { type: 'error'; message: string };
            newState.error = errorEvent.message;
            break;
          }
        }
      }

      // Handle writer agent events
      if (isWriterEvent(eventType)) {
        switch (eventType) {
          case 'writer-started':
            // Phase change handled by pipeline-level event
            break;
          case 'writer-complete': {
            // Completion handled by pipeline-level event
            break;
          }
        }
      }

      return newState;
    });
  }, []);

  // Reset state for new execution
  const reset = useCallback(() => {
    eventsRef.current = [];
    sourcesRef.current = [];
    setState(INITIAL_STATE);
  }, []);

  return { state, pushEvent, reset };
}

// =============================================================================
// Export
// =============================================================================

export default useResearchProgress;
