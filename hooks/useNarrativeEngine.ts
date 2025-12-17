// useNarrativeEngine - Core state management for Narrative Engine v2
// Handles lens selection, card filtering, session persistence, and entropy state

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  NarrativeSchemaV2,
  TerminalSession,
  Card,
  Persona,
  GlobalSettings,
  DEFAULT_TERMINAL_SESSION,
  DEFAULT_GLOBAL_SETTINGS,
  isV1Schema,
  isV2Schema,
  nodeToCard
} from '../data/narratives-schema';
import { DEFAULT_PERSONAS } from '../data/default-personas';
import { generateThread as generateArcThread } from '../utils/threadGenerator';
import {
  EntropyState,
  EntropyResult,
  DEFAULT_ENTROPY_STATE,
  calculateEntropy,
  shouldInject,
  updateEntropyState,
  dismissEntropy,
  getJourneyForCluster,
  type EntropyMessage
} from '../src/core/engine/entropyDetector';

// LocalStorage keys
const STORAGE_KEY_LENS = 'grove-terminal-lens';
const STORAGE_KEY_SESSION = 'grove-terminal-session';
const STORAGE_KEY_ENTROPY = 'grove-terminal-entropy';

interface UseNarrativeEngineReturn {
  // Data
  schema: NarrativeSchemaV2 | null;
  session: TerminalSession;
  loading: boolean;
  error: string | null;

  // Persona/Lens methods
  selectLens: (personaId: string | null) => void;
  getPersona: (personaId: string) => Persona | undefined;
  getEnabledPersonas: () => Persona[];
  getActiveLensData: () => Persona | null;

  // Card methods
  getCard: (cardId: string) => Card | undefined;
  getPersonaCards: (personaId: string | null) => Card[];
  getEntryPoints: (personaId: string | null) => Card[];
  getNextCards: (cardId: string) => Card[];
  getSectionCards: (sectionId: string) => Card[];

  // Thread methods
  getSuggestedThread: (personaId: string) => string[];
  currentThread: string[];
  currentPosition: number;
  regenerateThread: () => void;
  advanceThread: () => string | null;
  getThreadCard: (position: number) => Card | null;

  // Session methods
  incrementExchangeCount: () => void;
  addVisitedCard: (cardId: string) => void;
  shouldNudge: () => boolean;
  resetSession: () => void;

  // Entropy / Cognitive Bridge methods
  entropyState: EntropyState;
  evaluateEntropy: (message: string, history: EntropyMessage[]) => EntropyResult;
  checkShouldInject: (entropy: EntropyResult) => boolean;
  recordEntropyInjection: (entropy: EntropyResult) => void;
  recordEntropyDismiss: () => void;
  getJourneyIdForCluster: (cluster: string) => string | null;

  // Settings
  globalSettings: GlobalSettings;
}

export const useNarrativeEngine = (): UseNarrativeEngineReturn => {
  const [schema, setSchema] = useState<NarrativeSchemaV2 | null>(null);
  const [session, setSession] = useState<TerminalSession>(DEFAULT_TERMINAL_SESSION);
  const [entropyState, setEntropyState] = useState<EntropyState>(DEFAULT_ENTROPY_STATE);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load schema from API on mount
  useEffect(() => {
    const loadSchema = async () => {
      try {
        const res = await fetch('/api/narrative');
        const data = await res.json();

        let finalSchema: NarrativeSchemaV2;

        if (isV2Schema(data)) {
          // Already v2, use as-is
          finalSchema = data;
        } else if (isV1Schema(data)) {
          // Migrate v1 to v2
          finalSchema = migrateV1ToV2(data);
        } else {
          // Empty or invalid - create default
          finalSchema = {
            version: "2.0",
            globalSettings: DEFAULT_GLOBAL_SETTINGS,
            personas: DEFAULT_PERSONAS,
            cards: {}
          };
        }

        setSchema(finalSchema);
      } catch (err) {
        console.error('Failed to load narrative schema:', err);
        setError('Failed to load narrative data');
        // Still set a default schema so the app works
        setSchema({
          version: "2.0",
          globalSettings: DEFAULT_GLOBAL_SETTINGS,
          personas: DEFAULT_PERSONAS,
          cards: {}
        });
      } finally {
        setLoading(false);
      }
    };

    loadSchema();
  }, []);

  // Load session from localStorage on mount
  useEffect(() => {
    try {
      const storedLens = localStorage.getItem(STORAGE_KEY_LENS);
      const storedSession = localStorage.getItem(STORAGE_KEY_SESSION);

      if (storedSession) {
        const parsed = JSON.parse(storedSession) as Partial<TerminalSession>;
        setSession(prev => ({
          ...prev,
          ...parsed,
          // Always restore lens from dedicated key for reliability
          activeLens: storedLens || parsed.activeLens || null
        }));
      } else if (storedLens) {
        setSession(prev => ({ ...prev, activeLens: storedLens }));
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
    }
  }, []);

  // Persist session changes to localStorage
  useEffect(() => {
    try {
      if (session.activeLens !== null) {
        localStorage.setItem(STORAGE_KEY_LENS, session.activeLens);
      } else {
        localStorage.removeItem(STORAGE_KEY_LENS);
      }
      localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(session));
    } catch (err) {
      console.error('Failed to persist session:', err);
    }
  }, [session]);

  // Load entropy state from localStorage on mount
  useEffect(() => {
    try {
      const storedEntropy = localStorage.getItem(STORAGE_KEY_ENTROPY);
      if (storedEntropy) {
        const parsed = JSON.parse(storedEntropy) as Partial<EntropyState>;
        setEntropyState(prev => ({
          ...prev,
          ...parsed
        }));
      }
    } catch (err) {
      console.error('Failed to restore entropy state:', err);
    }
  }, []);

  // Persist entropy state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ENTROPY, JSON.stringify(entropyState));
    } catch (err) {
      console.error('Failed to persist entropy state:', err);
    }
  }, [entropyState]);

  // === Persona/Lens Methods ===

  const selectLens = useCallback((personaId: string | null) => {
    setSession(prev => {
      // FIX: Prevent thread reset if selecting the same lens
      if (prev.activeLens === personaId) {
        return prev;
      }
      // Only wipe state if it's actually a new lens
      return {
        ...prev,
        activeLens: personaId,
        exchangeCount: 0, // Reset exchange count on lens change
        currentThread: [],
        currentPosition: 0
      };
    });
  }, []);

  const getPersona = useCallback((personaId: string): Persona | undefined => {
    if (!schema) return DEFAULT_PERSONAS[personaId];
    return schema.personas[personaId];
  }, [schema]);

  const getEnabledPersonas = useCallback((): Persona[] => {
    const personas: Record<string, Persona> = schema?.personas || DEFAULT_PERSONAS;
    return (Object.values(personas) as Persona[]).filter(p => p.enabled);
  }, [schema]);

  const getActiveLensData = useCallback((): Persona | null => {
    if (!session.activeLens) return null;
    return getPersona(session.activeLens) || null;
  }, [session.activeLens, getPersona]);

  // === Card Methods ===

  const getCard = useCallback((cardId: string): Card | undefined => {
    if (!schema) return undefined;
    return schema.cards[cardId];
  }, [schema]);

  const getPersonaCards = useCallback((personaId: string | null): Card[] => {
    if (!schema) return [];
    const cards = Object.values(schema.cards) as Card[];

    if (!personaId) {
      // No lens selected - show all cards
      return cards;
    }

    return cards.filter(card =>
      card.personas.includes(personaId) || card.personas.includes('all')
    );
  }, [schema]);

  const getEntryPoints = useCallback((personaId: string | null): Card[] => {
    if (!schema) return [];

    if (personaId) {
      const persona = schema.personas[personaId];
      if (persona?.entryPoints?.length) {
        // Use persona's configured entry points
        return persona.entryPoints
          .map(id => schema.cards[id])
          .filter(Boolean);
      }
    }

    // Fallback: cards marked as entry or with sectionId
    const personaCards = getPersonaCards(personaId);
    return personaCards.filter(card => card.isEntry || card.sectionId);
  }, [schema, getPersonaCards]);

  const getNextCards = useCallback((cardId: string): Card[] => {
    if (!schema) return [];
    const card = schema.cards[cardId];
    if (!card?.next?.length) return [];

    return card.next
      .map(id => schema.cards[id])
      .filter(Boolean);
  }, [schema]);

  const getSectionCards = useCallback((sectionId: string): Card[] => {
    if (!schema) return [];
    return (Object.values(schema.cards) as Card[]).filter(card => card.sectionId === sectionId);
  }, [schema]);

  // === Thread Methods ===

  const getSuggestedThread = useCallback((personaId: string): string[] => {
    if (!schema) return [];
    const persona = schema.personas[personaId];

    // First check for manually curated thread
    if (persona?.suggestedThread?.length) {
      return persona.suggestedThread;
    }

    // Use arc-based thread generator for intelligent ordering
    return generateArcThread(personaId, schema);
  }, [schema]);

  // Generate thread when lens changes or on demand
  const regenerateThread = useCallback(() => {
    if (!session.activeLens || !schema) {
      setSession(prev => ({
        ...prev,
        currentThread: [],
        currentPosition: 0
      }));
      return;
    }

    const newThread = generateArcThread(session.activeLens, schema);
    setSession(prev => ({
      ...prev,
      currentThread: newThread,
      currentPosition: 0,
      visitedCards: [] // Reset visited cards on regenerate
    }));
  }, [session.activeLens, schema]);

  // Auto-generate thread when lens is selected
  useEffect(() => {
    if (session.activeLens && schema && session.currentThread.length === 0) {
      const thread = generateArcThread(session.activeLens, schema);
      setSession(prev => ({
        ...prev,
        currentThread: thread,
        currentPosition: 0
      }));
    }
  }, [session.activeLens, schema]);

  // Advance to next position in thread
  const advanceThread = useCallback((): string | null => {
    if (session.currentPosition >= session.currentThread.length - 1) {
      return null; // End of thread
    }

    const nextPosition = session.currentPosition + 1;
    const nextCardId = session.currentThread[nextPosition];

    setSession(prev => ({
      ...prev,
      currentPosition: nextPosition,
      visitedCards: prev.visitedCards.includes(nextCardId)
        ? prev.visitedCards
        : [...prev.visitedCards, nextCardId]
    }));

    return nextCardId;
  }, [session.currentPosition, session.currentThread]);

  // Get card at specific thread position
  const getThreadCard = useCallback((position: number): Card | null => {
    if (!schema || position < 0 || position >= session.currentThread.length) {
      return null;
    }
    return schema.cards[session.currentThread[position]] || null;
  }, [schema, session.currentThread]);

  // === Session Methods ===

  const incrementExchangeCount = useCallback(() => {
    setSession(prev => ({
      ...prev,
      exchangeCount: prev.exchangeCount + 1
    }));
  }, []);

  const addVisitedCard = useCallback((cardId: string) => {
    setSession(prev => ({
      ...prev,
      visitedCards: prev.visitedCards.includes(cardId)
        ? prev.visitedCards
        : [...prev.visitedCards, cardId]
    }));
  }, []);

  const shouldNudge = useCallback((): boolean => {
    if (!schema) return false;
    if (session.activeLens !== null) return false;

    const behavior = schema.globalSettings.noLensBehavior;
    if (behavior === 'never-nudge') return false;

    const threshold = schema.globalSettings.nudgeAfterExchanges || 3;
    return session.exchangeCount >= threshold;
  }, [schema, session.activeLens, session.exchangeCount]);

  const resetSession = useCallback(() => {
    setSession(DEFAULT_TERMINAL_SESSION);
    setEntropyState(DEFAULT_ENTROPY_STATE);
    localStorage.removeItem(STORAGE_KEY_LENS);
    localStorage.removeItem(STORAGE_KEY_SESSION);
    localStorage.removeItem(STORAGE_KEY_ENTROPY);
  }, []);

  // === Entropy / Cognitive Bridge Methods ===

  const evaluateEntropy = useCallback((
    message: string,
    history: EntropyMessage[]
  ): EntropyResult => {
    const topicHubs = schema?.globalSettings.topicHubs || [];
    return calculateEntropy(message, history, topicHubs, session.exchangeCount);
  }, [schema, session.exchangeCount]);

  const checkShouldInject = useCallback((entropy: EntropyResult): boolean => {
    return shouldInject(entropy, entropyState);
  }, [entropyState]);

  const recordEntropyInjection = useCallback((entropy: EntropyResult) => {
    setEntropyState(prev => updateEntropyState(
      prev,
      entropy,
      true, // didInject
      session.exchangeCount
    ));
  }, [session.exchangeCount]);

  const recordEntropyDismiss = useCallback(() => {
    setEntropyState(prev => dismissEntropy(prev, session.exchangeCount));
  }, [session.exchangeCount]);

  const getJourneyIdForCluster = useCallback((cluster: string): string | null => {
    return getJourneyForCluster(cluster);
  }, []);

  // === Settings ===

  const globalSettings = schema?.globalSettings || DEFAULT_GLOBAL_SETTINGS;

  return {
    schema,
    session,
    loading,
    error,
    selectLens,
    getPersona,
    getEnabledPersonas,
    getActiveLensData,
    getCard,
    getPersonaCards,
    getEntryPoints,
    getNextCards,
    getSectionCards,
    getSuggestedThread,
    currentThread: session.currentThread,
    currentPosition: session.currentPosition,
    regenerateThread,
    advanceThread,
    getThreadCard,
    incrementExchangeCount,
    addVisitedCard,
    shouldNudge,
    resetSession,
    // Entropy / Cognitive Bridge
    entropyState,
    evaluateEntropy,
    checkShouldInject,
    recordEntropyInjection,
    recordEntropyDismiss,
    getJourneyIdForCluster,
    globalSettings
  };
};

// === Migration Helper ===

function migrateV1ToV2(v1Data: { version: string; nodes: Record<string, any> }): NarrativeSchemaV2 {
  const cards: Record<string, Card> = {};

  for (const [id, node] of Object.entries(v1Data.nodes)) {
    cards[id] = nodeToCard(node);
  }

  return {
    version: "2.0",
    globalSettings: DEFAULT_GLOBAL_SETTINGS,
    personas: DEFAULT_PERSONAS,
    cards
  };
}

export default useNarrativeEngine;
