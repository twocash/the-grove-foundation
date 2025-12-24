// src/core/engagement/types.ts

export interface JourneyStep {
  id: string;
  title: string;
  content: string;
}

export interface Journey {
  id: string;
  name: string;
  hubId: string;
  steps: JourneyStep[];
}

export interface EngagementContext {
  // Lens state
  lens: string | null;
  lensSource: 'url' | 'localStorage' | 'selection' | null;

  // Journey state
  journey: Journey | null;
  journeyProgress: number;
  journeyTotal: number;

  // Entropy state
  entropy: number;
  entropyThreshold: number;
}

export const initialContext: EngagementContext = {
  lens: null,
  lensSource: null,
  journey: null,
  journeyProgress: 0,
  journeyTotal: 0,
  entropy: 0,
  entropyThreshold: 0.7,
};

export type EngagementEvent =
  | { type: 'SELECT_LENS'; lens: string; source: 'url' | 'localStorage' | 'selection' }
  | { type: 'CHANGE_LENS'; lens: string }
  | { type: 'START_JOURNEY'; journey: Journey }
  | { type: 'ADVANCE_STEP' }
  | { type: 'COMPLETE_JOURNEY' }
  | { type: 'EXIT_JOURNEY' }
  | { type: 'OPEN_TERMINAL' }
  | { type: 'CLOSE_TERMINAL' }
  | { type: 'UPDATE_ENTROPY'; value: number };
