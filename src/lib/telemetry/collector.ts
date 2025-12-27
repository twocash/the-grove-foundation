// src/lib/telemetry/collector.ts
// Collects and persists engagement telemetry
// Sprint: adaptive-engagement-v1

import { SessionTelemetry, SessionStage } from '../../core/schema/session-telemetry';
import { getSessionId } from '../session';
import { computeSessionStage } from './stage-computation';

const STORAGE_KEY = 'grove-telemetry';

type TelemetryUpdateType =
  | 'exchange'
  | 'topic'
  | 'sprout'
  | 'journey_start'
  | 'journey_progress'
  | 'journey_complete';

interface TelemetryUpdate {
  type: TelemetryUpdateType;
  payload?: Record<string, unknown>;
}

type TelemetryListener = (telemetry: SessionTelemetry) => void;

class TelemetryCollector {
  private telemetry: SessionTelemetry;
  private listeners: Set<TelemetryListener> = new Set();

  constructor() {
    this.telemetry = this.loadOrCreate();
  }

  private loadOrCreate(): SessionTelemetry {
    if (typeof window === 'undefined') {
      return this.createNew('');
    }

    const stored = localStorage.getItem(STORAGE_KEY);
    const sessionId = getSessionId();

    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SessionTelemetry;
        const isNewSession = parsed.sessionId !== sessionId;

        if (isNewSession) {
          // Returning user - increment visit, preserve totals
          const updated: SessionTelemetry = {
            ...parsed,
            sessionId,
            visitCount: parsed.visitCount + 1,
            currentVisitStart: new Date().toISOString(),
            lastVisit: parsed.currentVisitStart,
            exchangeCount: 0,
            topicsExplored: [],
            stage: 'ARRIVAL', // Will recompute below
          };
          updated.stage = computeSessionStage(updated);
          return updated;
        }
        return parsed;
      } catch {
        return this.createNew(sessionId);
      }
    }

    return this.createNew(sessionId);
  }

  private createNew(sessionId: string): SessionTelemetry {
    return {
      sessionId,
      visitCount: 1,
      currentVisitStart: new Date().toISOString(),
      lastVisit: null,
      exchangeCount: 0,
      totalExchangeCount: 0,
      topicsExplored: [],
      allTopicsExplored: [],
      sproutsCaptured: 0,
      activeJourney: null,
      completedJourneys: [],
      stage: 'ARRIVAL',
    };
  }

  get(): SessionTelemetry {
    return { ...this.telemetry };
  }

  getStage(): SessionStage {
    return this.telemetry.stage;
  }

  update(update: TelemetryUpdate): SessionTelemetry {
    switch (update.type) {
      case 'exchange':
        this.telemetry.exchangeCount++;
        this.telemetry.totalExchangeCount++;
        break;

      case 'topic': {
        const topicId = update.payload?.topicId as string;
        if (topicId && !this.telemetry.topicsExplored.includes(topicId)) {
          this.telemetry.topicsExplored.push(topicId);
        }
        if (topicId && !this.telemetry.allTopicsExplored.includes(topicId)) {
          this.telemetry.allTopicsExplored.push(topicId);
        }
        break;
      }

      case 'sprout':
        this.telemetry.sproutsCaptured++;
        break;

      case 'journey_start':
        this.telemetry.activeJourney = {
          journeyId: update.payload?.journeyId as string,
          currentWaypoint: 0,
          startedAt: new Date().toISOString(),
          explicit: (update.payload?.explicit as boolean) ?? false,
        };
        break;

      case 'journey_progress':
        if (this.telemetry.activeJourney) {
          this.telemetry.activeJourney.currentWaypoint =
            update.payload?.waypoint as number;
        }
        break;

      case 'journey_complete':
        if (this.telemetry.activeJourney) {
          const journeyId = this.telemetry.activeJourney.journeyId;
          if (!this.telemetry.completedJourneys.includes(journeyId)) {
            this.telemetry.completedJourneys.push(journeyId);
          }
          this.telemetry.activeJourney = null;
        }
        break;
    }

    // Recompute stage
    this.telemetry.stage = computeSessionStage(this.telemetry);

    // Persist
    this.save();

    // Notify listeners
    this.notifyListeners();

    return this.get();
  }

  private save(): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.telemetry));
    } catch (e) {
      console.warn('Failed to save telemetry:', e);
    }
  }

  private notifyListeners(): void {
    const snapshot = this.get();
    this.listeners.forEach(fn => fn(snapshot));
  }

  subscribe(fn: TelemetryListener): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  // For testing
  reset(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem(STORAGE_KEY);
    this.telemetry = this.createNew(getSessionId());
    this.notifyListeners();
  }
}

// Singleton
export const telemetryCollector = new TelemetryCollector();
