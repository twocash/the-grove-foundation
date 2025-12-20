// hooks/NarrativeEngineContext.tsx
// Shared context for NarrativeEngine state across all components
// v0.14.1: Fix - Terminal and GenesisPage now share lens state

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import {
  NarrativeSchemaV2,
  TerminalSession,
  Card,
  Persona,
  GlobalSettings,
  Journey,
  JourneyNode,
  DEFAULT_TERMINAL_SESSION,
  DEFAULT_GLOBAL_SETTINGS,
  isV1Schema,
  isV2Schema,
  nodeToCard
} from '../data/narratives-schema';
import { DEFAULT_PERSONAS } from '../data/default-personas';
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
import { deserializeLens } from '../src/utils/lensSerializer';

// LocalStorage keys
const STORAGE_KEY_LENS = 'grove-terminal-lens';
const STORAGE_KEY_SESSION = 'grove-terminal-session';
const STORAGE_KEY_ENTROPY = 'grove-terminal-entropy';

// v0.14: Handle shared reality URL (?share=...)
const getInitialShare = (): string | null => {
  if (typeof window === 'undefined') return null;
  const shareParam = new URLSearchParams(window.location.search).get('share');
  if (!shareParam) return null;

  const config = deserializeLens(shareParam);
  if (!config) return null;

  const ephemeralId = `shared-${Date.now()}`;
  try {
    sessionStorage.setItem(`grove-ephemeral-${ephemeralId}`, JSON.stringify({
      ...config,
      id: ephemeralId,
      isEphemeral: true,
      createdAt: new Date().toISOString()
    }));
    console.log('[v0.14] Shared reality hydrated:', ephemeralId);
  } catch (e) {
    console.error('Failed to store ephemeral lens:', e);
    return null;
  }
  return ephemeralId;
};

// v0.13/v0.14: Quantum Deep Linking
const getInitialLens = (): string | null => {
  if (typeof window === 'undefined') return null;

  const shared = getInitialShare();
  if (shared) return shared;

  const params = new URLSearchParams(window.location.search);
  const lensParam = params.get('lens');
  if (lensParam && DEFAULT_PERSONAS[lensParam]) {
    return lensParam;
  }

  try {
    const storedLens = localStorage.getItem(STORAGE_KEY_LENS);
    if (storedLens) return storedLens;
  } catch (e) {
    console.error('Failed to read stored lens:', e);
  }

  return null;
};

// Context type matches UseNarrativeEngineReturn
interface NarrativeEngineContextType {
  schema: NarrativeSchemaV2 | null;
  session: TerminalSession;
  loading: boolean;
  error: string | null;
  selectLens: (personaId: string | null) => void;
  getPersona: (personaId: string) => Persona | undefined;
  getPersonaById: (id: string) => Persona | undefined;
  getEnabledPersonas: () => Persona[];
  getActiveLensData: () => Persona | null;
  startJourney: (journeyId: string) => void;
  advanceNode: (choiceIndex?: number) => void;
  exitJourney: () => void;
  getJourney: (journeyId: string) => Journey | undefined;
  getNode: (nodeId: string) => JourneyNode | undefined;
  getNextNodes: (nodeId: string) => JourneyNode[];
  activeJourneyId: string | null;
  currentNodeId: string | null;
  visitedNodes: string[];
  getCard: (cardId: string) => Card | undefined;
  getPersonaCards: (personaId: string | null) => Card[];
  getEntryPoints: (personaId: string | null) => Card[];
  getNextCards: (cardId: string) => Card[];
  getSectionCards: (sectionId: string) => Card[];
  currentThread: string[];
  currentPosition: number;
  regenerateThread: () => void;
  advanceThread: () => string | null;
  getThreadCard: (position: number) => Card | null;
  incrementExchangeCount: () => void;
  addVisitedCard: (cardId: string) => void;
  addVisitedNode: (nodeId: string) => void;
  shouldNudge: () => boolean;
  resetSession: () => void;
  entropyState: EntropyState;
  evaluateEntropy: (message: string, history: EntropyMessage[]) => EntropyResult;
  checkShouldInject: (entropy: EntropyResult) => boolean;
  recordEntropyInjection: (entropy: EntropyResult) => void;
  recordEntropyDismiss: () => void;
  tickEntropyCooldown: () => void;
  getJourneyIdForCluster: (cluster: string) => string | null;
  globalSettings: GlobalSettings;
}

const NarrativeEngineContext = createContext<NarrativeEngineContextType | null>(null);

// Migration helper
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

export const NarrativeEngineProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [schema, setSchema] = useState<NarrativeSchemaV2 | null>(null);
  const [session, setSession] = useState<TerminalSession>(() => ({
    ...DEFAULT_TERMINAL_SESSION,
    activeLens: getInitialLens()
  }));
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
          finalSchema = data;
        } else if (isV1Schema(data)) {
          finalSchema = migrateV1ToV2(data);
        } else {
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
          activeLens: storedLens || parsed.activeLens || null
        }));
      } else if (storedLens) {
        setSession(prev => ({ ...prev, activeLens: storedLens }));
      }
    } catch (err) {
      console.error('Failed to restore session:', err);
    }
  }, []);

  // Persist session changes
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

  // Load entropy state
  useEffect(() => {
    try {
      const storedEntropy = localStorage.getItem(STORAGE_KEY_ENTROPY);
      if (storedEntropy) {
        const parsed = JSON.parse(storedEntropy) as Partial<EntropyState>;
        setEntropyState(prev => ({ ...prev, ...parsed }));
      }
    } catch (err) {
      console.error('Failed to restore entropy state:', err);
    }
  }, []);

  // Persist entropy state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_ENTROPY, JSON.stringify(entropyState));
    } catch (err) {
      console.error('Failed to persist entropy state:', err);
    }
  }, [entropyState]);

  // === Callbacks ===

  const selectLens = useCallback((personaId: string | null) => {
    console.log('[NarrativeEngine] selectLens:', personaId);
    setSession(prev => {
      if (prev.activeLens === personaId) return prev;
      return { ...prev, activeLens: personaId, exchangeCount: 0 };
    });
  }, []);

  const getPersona = useCallback((personaId: string): Persona | undefined => {
    if (!schema) return DEFAULT_PERSONAS[personaId];
    return schema.personas?.[personaId] ?? DEFAULT_PERSONAS[personaId];
  }, [schema]);

  const getPersonaById = useCallback((id: string): Persona | undefined => {
    if (DEFAULT_PERSONAS[id]) return DEFAULT_PERSONAS[id];
    if (schema?.personas?.[id]) return schema.personas[id];
    try {
      const ephemeral = sessionStorage.getItem(`grove-ephemeral-${id}`);
      if (ephemeral) return JSON.parse(ephemeral) as Persona;
    } catch (e) {
      console.error('Failed to read ephemeral lens:', e);
    }
    return undefined;
  }, [schema]);

  const getEnabledPersonas = useCallback((): Persona[] => {
    const personas: Record<string, Persona> = schema?.personas || DEFAULT_PERSONAS;
    return (Object.values(personas) as Persona[]).filter(p => p.enabled);
  }, [schema]);

  const getActiveLensData = useCallback((): Persona | null => {
    if (!session.activeLens) return null;
    return getPersona(session.activeLens) || null;
  }, [session.activeLens, getPersona]);

  // Card methods
  const getCard = useCallback((cardId: string): Card | undefined => {
    return schema?.cards?.[cardId];
  }, [schema]);

  const getPersonaCards = useCallback((personaId: string | null): Card[] => {
    if (!schema?.cards) return [];
    const cards = Object.values(schema.cards) as Card[];
    if (!personaId) return cards;
    return cards.filter(card => card.personas.includes(personaId) || card.personas.includes('all'));
  }, [schema]);

  const getEntryPoints = useCallback((personaId: string | null): Card[] => {
    if (!schema?.cards) return [];
    if (personaId && schema.personas) {
      const persona = schema.personas[personaId];
      if (persona?.entryPoints?.length) {
        return persona.entryPoints.map(id => schema.cards![id]).filter(Boolean);
      }
    }
    const personaCards = getPersonaCards(personaId);
    return personaCards.filter(card => card.isEntry || card.sectionId);
  }, [schema, getPersonaCards]);

  const getNextCards = useCallback((cardId: string): Card[] => {
    if (!schema?.cards) return [];
    const card = schema.cards[cardId];
    if (!card?.next?.length) return [];
    return card.next.map(id => schema.cards![id]).filter(Boolean);
  }, [schema]);

  const getSectionCards = useCallback((sectionId: string): Card[] => {
    if (!schema?.cards) return [];
    return (Object.values(schema.cards) as Card[]).filter(card => card.sectionId === sectionId);
  }, [schema]);

  // Journey methods
  const getJourney = useCallback((journeyId: string): Journey | undefined => {
    return schema?.journeys?.[journeyId];
  }, [schema]);

  const getNode = useCallback((nodeId: string): JourneyNode | undefined => {
    return schema?.nodes?.[nodeId];
  }, [schema]);

  const getNextNodes = useCallback((nodeId: string): JourneyNode[] => {
    if (!schema?.nodes) return [];
    const node = schema.nodes[nodeId];
    if (!node) return [];
    const nextIds: string[] = [];
    if (node.primaryNext) nextIds.push(node.primaryNext);
    if (node.alternateNext) nextIds.push(...node.alternateNext);
    return nextIds.map(id => schema.nodes![id]).filter(Boolean) as JourneyNode[];
  }, [schema]);

  const startJourney = useCallback((journeyId: string) => {
    const journey = getJourney(journeyId);
    if (!journey) {
      console.warn(`[V2.1] Journey not found: ${journeyId}`);
      return;
    }
    console.log(`[V2.1] Starting journey: ${journeyId}, entry: ${journey.entryNode}`);
    setSession(prev => ({
      ...prev,
      activeJourneyId: journeyId,
      currentNodeId: journey.entryNode,
      visitedNodes: [journey.entryNode]
    }));
  }, [getJourney]);

  const advanceNode = useCallback((choiceIndex: number = 0) => {
    if (!session.currentNodeId || !schema?.nodes) return;
    const currentNode = schema.nodes[session.currentNodeId];
    if (!currentNode) return;
    const nextOptions: string[] = [];
    if (currentNode.primaryNext) nextOptions.push(currentNode.primaryNext);
    if (currentNode.alternateNext) nextOptions.push(...currentNode.alternateNext);
    const nextNodeId = nextOptions[choiceIndex];
    if (!nextNodeId) {
      console.log('[V2.1] Journey complete - no more nodes');
      return;
    }
    console.log(`[V2.1] Advancing to node: ${nextNodeId} (choice: ${choiceIndex})`);
    setSession(prev => ({
      ...prev,
      currentNodeId: nextNodeId,
      visitedNodes: prev.visitedNodes.includes(nextNodeId) ? prev.visitedNodes : [...prev.visitedNodes, nextNodeId]
    }));
  }, [session.currentNodeId, schema]);

  const exitJourney = useCallback(() => {
    console.log('[V2.1] Exiting journey');
    setSession(prev => ({ ...prev, activeJourneyId: null, currentNodeId: null, visitedNodes: [] }));
  }, []);

  // Legacy thread methods
  const regenerateThread = useCallback(() => {
    console.warn('[V2.1] regenerateThread is deprecated.');
  }, []);

  const advanceThread = useCallback((): string | null => {
    console.warn('[V2.1] advanceThread is deprecated.');
    if (session.currentNodeId && schema?.nodes) {
      const currentNode = schema.nodes[session.currentNodeId];
      if (currentNode?.primaryNext) {
        advanceNode(0);
        return currentNode.primaryNext;
      }
    }
    return null;
  }, [session.currentNodeId, schema, advanceNode]);

  const getThreadCard = useCallback((position: number): Card | null => {
    if (schema?.cards && session.currentThread[position]) {
      return schema.cards[session.currentThread[position]] || null;
    }
    return null;
  }, [schema, session.currentThread]);

  // Session methods
  const incrementExchangeCount = useCallback(() => {
    setSession(prev => ({ ...prev, exchangeCount: prev.exchangeCount + 1 }));
  }, []);

  const addVisitedCard = useCallback((cardId: string) => {
    setSession(prev => ({
      ...prev,
      visitedCards: prev.visitedCards.includes(cardId) ? prev.visitedCards : [...prev.visitedCards, cardId]
    }));
  }, []);

  const addVisitedNode = useCallback((nodeId: string) => {
    setSession(prev => ({
      ...prev,
      visitedNodes: prev.visitedNodes.includes(nodeId) ? prev.visitedNodes : [...prev.visitedNodes, nodeId]
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

  // Entropy methods
  const evaluateEntropy = useCallback((message: string, history: EntropyMessage[]): EntropyResult => {
    const v21Hubs = schema?.hubs ? Object.values(schema.hubs).filter(h => h.status === 'active') : [];
    const legacyHubs = schema?.globalSettings.topicHubs || [];
    const topicHubs = v21Hubs.length > 0 ? v21Hubs : legacyHubs;
    return calculateEntropy(message, history, topicHubs, session.exchangeCount);
  }, [schema, session.exchangeCount]);

  const checkShouldInject = useCallback((entropy: EntropyResult): boolean => {
    return shouldInject(entropy, entropyState);
  }, [entropyState]);

  const recordEntropyInjection = useCallback((entropy: EntropyResult) => {
    setEntropyState(prev => updateEntropyState(prev, entropy, true, session.exchangeCount));
  }, [session.exchangeCount]);

  const recordEntropyDismiss = useCallback(() => {
    setEntropyState(prev => dismissEntropy(prev, session.exchangeCount));
  }, [session.exchangeCount]);

  const tickEntropyCooldown = useCallback(() => {
    setEntropyState(prev => ({ ...prev, cooldownRemaining: Math.max(0, prev.cooldownRemaining - 1) }));
  }, []);

  const getJourneyIdForCluster = useCallback((cluster: string): string | null => {
    return getJourneyForCluster(cluster);
  }, []);

  const globalSettings = schema?.globalSettings || DEFAULT_GLOBAL_SETTINGS;

  const value: NarrativeEngineContextType = {
    schema,
    session,
    loading,
    error,
    selectLens,
    getPersona,
    getPersonaById,
    getEnabledPersonas,
    getActiveLensData,
    startJourney,
    advanceNode,
    exitJourney,
    getJourney,
    getNode,
    getNextNodes,
    activeJourneyId: session.activeJourneyId,
    currentNodeId: session.currentNodeId,
    visitedNodes: session.visitedNodes,
    getCard,
    getPersonaCards,
    getEntryPoints,
    getNextCards,
    getSectionCards,
    currentThread: session.currentThread,
    currentPosition: session.currentPosition,
    regenerateThread,
    advanceThread,
    getThreadCard,
    incrementExchangeCount,
    addVisitedCard,
    addVisitedNode,
    shouldNudge,
    resetSession,
    entropyState,
    evaluateEntropy,
    checkShouldInject,
    recordEntropyInjection,
    recordEntropyDismiss,
    tickEntropyCooldown,
    getJourneyIdForCluster,
    globalSettings
  };

  return (
    <NarrativeEngineContext.Provider value={value}>
      {children}
    </NarrativeEngineContext.Provider>
  );
};

export const useNarrativeEngineContext = (): NarrativeEngineContextType => {
  const context = useContext(NarrativeEngineContext);
  if (!context) {
    throw new Error('useNarrativeEngineContext must be used within NarrativeEngineProvider');
  }
  return context;
};
