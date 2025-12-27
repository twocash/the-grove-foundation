// hooks/useEngagementBus.ts - Core Engagement Bus implementation
// Sprint 7: Unified event-driven engagement state management
// Sprint: engagement-consolidation-v1 (stage computation, legacy migration)

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  EngagementState,
  EngagementEvent,
  EngagementEventType,
  EventPayloads,
  RevealQueueItem,
  RevealType,
  DEFAULT_ENGAGEMENT_STATE,
  EngagementBusAPI,
  EngagementEventHandler,
  StateChangeHandler,
  RevealQueueHandler,
  TriggerConfig
} from '../types/engagement';
import {
  DEFAULT_TRIGGERS,
  evaluateTriggers
} from '../utils/engagementTriggers';
import { computeSessionStage } from '../utils/stageComputation';
import { DEFAULT_STAGE_THRESHOLDS } from '../src/core/config';

// Storage keys
const ENGAGEMENT_STATE_KEY = 'grove-engagement-state';
const EVENT_HISTORY_KEY = 'grove-event-history';

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateSessionId(): string {
  return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function calculateMinutesActive(startedAt: string): number {
  if (!startedAt) return 0;
  const start = new Date(startedAt).getTime();
  return Math.floor((Date.now() - start) / 60000);
}

// ============================================================================
// ENGAGEMENT BUS SINGLETON (for cross-component communication)
// ============================================================================

type Subscriber<T> = (value: T) => void;

class EngagementBusSingleton {
  private state: EngagementState;
  private eventHistory: EngagementEvent[] = [];
  private triggers: TriggerConfig[] = DEFAULT_TRIGGERS;
  private revealQueue: RevealQueueItem[] = [];

  // Subscribers
  private eventSubscribers: Set<EngagementEventHandler> = new Set();
  private stateSubscribers: Set<StateChangeHandler> = new Set();
  private revealSubscribers: Set<RevealQueueHandler> = new Set();

  // Time tracking interval
  private timeInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.state = this.loadState();
    this.eventHistory = this.loadEventHistory();
    this.migrateFromLegacy();
    this.state.stage = computeSessionStage(this.state, DEFAULT_STAGE_THRESHOLDS);
    this.startTimeTracking();
  }

  // --- Legacy Migration (engagement-consolidation-v1) ---

  private migrateFromLegacy(): void {
    const legacy = localStorage.getItem('grove-telemetry');
    if (!legacy) return;

    try {
      const data = JSON.parse(legacy);
      console.log('[EngagementBus] Migrating from legacy telemetry');

      // Merge fields
      if (data.totalExchangeCount) {
        this.state.totalExchangeCount = Math.max(
          this.state.totalExchangeCount || 0,
          data.totalExchangeCount
        );
      }
      if (data.sproutsCaptured) {
        this.state.sproutsCaptured = Math.max(
          this.state.sproutsCaptured || 0,
          data.sproutsCaptured
        );
      }
      if (data.visitCount) {
        this.state.visitCount = Math.max(
          this.state.visitCount || 1,
          data.visitCount
        );
      }
      if (data.allTopicsExplored?.length) {
        const merged = [
          ...(this.state.allTopicsExplored || []),
          ...data.allTopicsExplored
        ];
        this.state.allTopicsExplored = Array.from(new Set(merged));
      }

      // Remove legacy key
      localStorage.removeItem('grove-telemetry');
      this.persistState();
      console.log('[EngagementBus] Legacy migration complete');
    } catch (e) {
      console.warn('[EngagementBus] Failed to migrate legacy data:', e);
    }
  }

  // --- Persistence ---

  private loadState(): EngagementState {
    try {
      const stored = localStorage.getItem(ENGAGEMENT_STATE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Generate new session if returning
        const isNewSession = !parsed.sessionId ||
          Date.now() - new Date(parsed.lastActivityAt).getTime() > 30 * 60 * 1000; // 30 min timeout

        if (isNewSession) {
          return {
            ...DEFAULT_ENGAGEMENT_STATE,
            ...parsed,
            sessionId: generateSessionId(),
            sessionStartedAt: new Date().toISOString(),
            lastActivityAt: new Date().toISOString(),
            minutesActive: 0,
            // Preserve cross-session state
            revealsShown: parsed.revealsShown || [],
            revealsAcknowledged: parsed.revealsAcknowledged || [],
            hasCustomLens: parsed.hasCustomLens || false,
            terminatorModeUnlocked: parsed.terminatorModeUnlocked || false
          };
        }

        return {
          ...DEFAULT_ENGAGEMENT_STATE,
          ...parsed,
          lastActivityAt: new Date().toISOString()
        };
      }
    } catch (err) {
      console.error('Failed to load engagement state:', err);
    }

    return {
      ...DEFAULT_ENGAGEMENT_STATE,
      sessionId: generateSessionId(),
      sessionStartedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString()
    };
  }

  private loadEventHistory(): EngagementEvent[] {
    try {
      const stored = localStorage.getItem(EVENT_HISTORY_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Keep only last 100 events
        return parsed.slice(-100);
      }
    } catch (err) {
      console.error('Failed to load event history:', err);
    }
    return [];
  }

  private persistState(): void {
    try {
      localStorage.setItem(ENGAGEMENT_STATE_KEY, JSON.stringify(this.state));
    } catch (err) {
      console.error('Failed to persist engagement state:', err);
    }
  }

  private persistEventHistory(): void {
    try {
      // Keep only last 100 events
      const toStore = this.eventHistory.slice(-100);
      localStorage.setItem(EVENT_HISTORY_KEY, JSON.stringify(toStore));
    } catch (err) {
      console.error('Failed to persist event history:', err);
    }
  }

  // --- Time Tracking ---

  private startTimeTracking(): void {
    if (this.timeInterval) return;

    this.timeInterval = setInterval(() => {
      const newMinutes = calculateMinutesActive(this.state.sessionStartedAt);
      if (newMinutes !== this.state.minutesActive) {
        this.updateState({ minutesActive: newMinutes });

        // Emit time milestones at key points
        const milestones = [3, 5, 10, 15, 20, 30];
        if (milestones.includes(newMinutes)) {
          this.emit('TIME_MILESTONE', { minutes: newMinutes });
        }
      }
    }, 30000); // Check every 30 seconds
  }

  // --- State Management ---

  private updateState(updates: Partial<EngagementState>): void {
    const prevState = { ...this.state };
    this.state = {
      ...this.state,
      ...updates,
      lastActivityAt: new Date().toISOString()
    };

    // Recompute stage after state changes
    this.state.stage = computeSessionStage(this.state, DEFAULT_STAGE_THRESHOLDS);

    this.persistState();
    this.evaluateAndNotify();

    // Notify state subscribers
    this.stateSubscribers.forEach(handler => handler(this.state, prevState));
  }

  private evaluateAndNotify(): void {
    const newQueue = evaluateTriggers(this.triggers, this.state);

    // Only notify if queue changed
    const queueChanged = JSON.stringify(newQueue) !== JSON.stringify(this.revealQueue);
    if (queueChanged) {
      this.revealQueue = newQueue;
      this.revealSubscribers.forEach(handler => handler(this.revealQueue));
    }
  }

  // --- Event Emission ---

  emit<T extends EngagementEventType>(type: T, payload: EventPayloads[T]): void {
    const event: EngagementEvent<T> = {
      type,
      payload,
      timestamp: new Date().toISOString(),
      sessionId: this.state.sessionId
    };

    // Record event
    this.eventHistory.push(event as EngagementEvent);
    this.persistEventHistory();

    // Update state based on event type
    this.processEvent(event);

    // Notify event subscribers
    this.eventSubscribers.forEach(handler => handler(event as EngagementEvent));
  }

  private processEvent(event: EngagementEvent): void {
    switch (event.type) {
      case 'EXCHANGE_SENT':
        this.updateState({
          exchangeCount: this.state.exchangeCount + 1,
          totalExchangeCount: (this.state.totalExchangeCount || 0) + 1
        });
        break;

      case 'SPROUT_CAPTURED':
        this.updateState({
          sproutsCaptured: (this.state.sproutsCaptured || 0) + 1
        });
        break;

      case 'JOURNEY_STARTED': {
        const payload = event.payload as EventPayloads['JOURNEY_STARTED'];
        this.updateState({
          journeysStarted: this.state.journeysStarted + 1,
          activeJourney: {
            lensId: payload.lensId,
            threadCardIds: [],
            currentPosition: 0,
            startedAt: new Date().toISOString()
          }
        });
        break;
      }

      case 'JOURNEY_COMPLETED': {
        this.updateState({
          journeysCompleted: this.state.journeysCompleted + 1,
          activeJourney: null
        });
        break;
      }

      case 'TOPIC_EXPLORED': {
        const payload = event.payload as EventPayloads['TOPIC_EXPLORED'];
        if (!this.state.topicsExplored.includes(payload.topicId)) {
          this.updateState({
            topicsExplored: [...this.state.topicsExplored, payload.topicId]
          });
        }
        break;
      }

      case 'CARD_VISITED': {
        const payload = event.payload as EventPayloads['CARD_VISITED'];
        if (!this.state.cardsVisited.includes(payload.cardId)) {
          this.updateState({
            cardsVisited: [...this.state.cardsVisited, payload.cardId]
          });
        }
        break;
      }

      case 'LENS_SELECTED': {
        const payload = event.payload as EventPayloads['LENS_SELECTED'];
        this.updateState({
          activeLensId: payload.lensId,
          hasCustomLens: payload.isCustom || this.state.hasCustomLens,
          currentArchetypeId: payload.archetypeId || null
        });
        break;
      }

      case 'REVEAL_SHOWN': {
        const payload = event.payload as EventPayloads['REVEAL_SHOWN'];
        if (!this.state.revealsShown.includes(payload.revealType)) {
          this.updateState({
            revealsShown: [...this.state.revealsShown, payload.revealType]
          });
        }
        break;
      }

      case 'REVEAL_DISMISSED': {
        const payload = event.payload as EventPayloads['REVEAL_DISMISSED'];
        if (payload.action === 'accepted' || payload.action === 'declined') {
          if (!this.state.revealsAcknowledged.includes(payload.revealType)) {
            this.updateState({
              revealsAcknowledged: [...this.state.revealsAcknowledged, payload.revealType]
            });
          }
        }
        // Handle specific reveal actions
        if (payload.revealType === 'terminatorPrompt' && payload.action === 'accepted') {
          this.updateState({
            terminatorModeUnlocked: true,
            terminatorModeActive: true
          });
        }
        break;
      }

      case 'TIME_MILESTONE':
        // Already handled in time tracking
        break;

      default:
        // Unknown event type - just record it
        break;
    }
  }

  // --- Public API ---

  getState(): EngagementState {
    return { ...this.state };
  }

  getRevealQueue(): RevealQueueItem[] {
    return [...this.revealQueue];
  }

  acknowledgeReveal(revealType: RevealType, action: 'accepted' | 'declined' | 'dismissed'): void {
    this.emit('REVEAL_DISMISSED', { revealType, action });
  }

  onEvent(handler: EngagementEventHandler): () => void {
    this.eventSubscribers.add(handler);
    return () => this.eventSubscribers.delete(handler);
  }

  onStateChange(handler: StateChangeHandler): () => void {
    this.stateSubscribers.add(handler);
    return () => this.stateSubscribers.delete(handler);
  }

  onRevealQueue(handler: RevealQueueHandler): () => void {
    this.revealSubscribers.add(handler);
    // Immediately notify with current queue
    handler(this.revealQueue);
    return () => this.revealSubscribers.delete(handler);
  }

  reset(): void {
    this.state = {
      ...DEFAULT_ENGAGEMENT_STATE,
      sessionId: generateSessionId(),
      sessionStartedAt: new Date().toISOString(),
      lastActivityAt: new Date().toISOString()
    };
    this.eventHistory = [];
    this.revealQueue = [];
    this.persistState();
    this.persistEventHistory();
    this.evaluateAndNotify();
  }

  getEventHistory(): EngagementEvent[] {
    return [...this.eventHistory];
  }

  setTriggers(triggers: TriggerConfig[]): void {
    this.triggers = triggers;
    this.evaluateAndNotify();
  }

  getTriggers(): TriggerConfig[] {
    return [...this.triggers];
  }

  // Cleanup
  destroy(): void {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
      this.timeInterval = null;
    }
  }
}

// Singleton instance
let busInstance: EngagementBusSingleton | null = null;

function getBus(): EngagementBusSingleton {
  if (!busInstance) {
    busInstance = new EngagementBusSingleton();
  }
  return busInstance;
}

// ============================================================================
// REACT HOOKS
// ============================================================================

/**
 * Main hook for accessing the Engagement Bus
 * Provides full API access
 */
export function useEngagementBus(): EngagementBusAPI {
  const bus = useMemo(() => getBus(), []);

  const api: EngagementBusAPI = useMemo(() => ({
    emit: bus.emit.bind(bus),
    getState: bus.getState.bind(bus),
    getRevealQueue: bus.getRevealQueue.bind(bus),
    acknowledgeReveal: bus.acknowledgeReveal.bind(bus),
    onEvent: bus.onEvent.bind(bus),
    onStateChange: bus.onStateChange.bind(bus),
    onRevealQueue: bus.onRevealQueue.bind(bus),
    reset: bus.reset.bind(bus),
    getEventHistory: bus.getEventHistory.bind(bus),
    setTriggers: bus.setTriggers.bind(bus),
    getTriggers: bus.getTriggers.bind(bus)
  }), [bus]);

  return api;
}

/**
 * Hook for accessing engagement state with auto-updates
 */
export function useEngagementState(): EngagementState {
  const bus = useMemo(() => getBus(), []);
  const [state, setState] = useState<EngagementState>(bus.getState());

  useEffect(() => {
    return bus.onStateChange((newState) => {
      setState(newState);
    });
  }, [bus]);

  return state;
}

/**
 * Hook for accessing the reveal queue with auto-updates
 */
export function useRevealQueue(): RevealQueueItem[] {
  const bus = useMemo(() => getBus(), []);
  const [queue, setQueue] = useState<RevealQueueItem[]>(bus.getRevealQueue());

  useEffect(() => {
    return bus.onRevealQueue((newQueue) => {
      setQueue(newQueue);
    });
  }, [bus]);

  return queue;
}

/**
 * Hook that returns the next reveal to show (if any)
 */
export function useNextReveal(): RevealQueueItem | null {
  const queue = useRevealQueue();
  return queue[0] || null;
}

/**
 * Hook for emitting specific event types (convenience wrapper)
 */
export function useEngagementEmit() {
  const { emit } = useEngagementBus();

  return useMemo(() => ({
    exchangeSent: (query: string, responseLength: number, cardId?: string) =>
      emit('EXCHANGE_SENT', { query, responseLength, cardId }),

    journeyStarted: (lensId: string, threadLength: number) =>
      emit('JOURNEY_STARTED', { lensId, threadLength }),

    journeyCompleted: (lensId: string, durationMinutes: number, cardsVisited: number) =>
      emit('JOURNEY_COMPLETED', { lensId, durationMinutes, cardsVisited }),

    topicExplored: (topicId: string, topicLabel: string) =>
      emit('TOPIC_EXPLORED', { topicId, topicLabel }),

    cardVisited: (cardId: string, cardLabel: string, fromCard?: string) =>
      emit('CARD_VISITED', { cardId, cardLabel, fromCard }),

    lensSelected: (lensId: string, isCustom: boolean, archetypeId?: string) =>
      emit('LENS_SELECTED', { lensId, isCustom, archetypeId: archetypeId as any }),

    revealShown: (revealType: RevealType) =>
      emit('REVEAL_SHOWN', { revealType }),

    revealDismissed: (revealType: RevealType, action: 'accepted' | 'declined' | 'dismissed') =>
      emit('REVEAL_DISMISSED', { revealType, action }),

    sproutCaptured: (sproutId: string, tags?: string[]) =>
      emit('SPROUT_CAPTURED', { sproutId, tags })
  }), [emit]);
}

/**
 * Hook for checking specific reveal conditions
 */
export function useRevealCheck(revealType: RevealType): boolean {
  const state = useEngagementState();
  const queue = useRevealQueue();

  return queue.some(item => item.type === revealType) &&
         !state.revealsShown.includes(revealType);
}

// Export singleton for direct access (use sparingly)
export { getBus as getEngagementBus };
