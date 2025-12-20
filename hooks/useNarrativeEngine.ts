// useNarrativeEngine - Core state management for Narrative Engine v2.1
// Handles lens selection, journey navigation, session persistence, and entropy state
// V2.1: Journey/Node graph traversal replaces thread generation

import { useState, useEffect, useCallback, useMemo } from 'react';
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

  // Create ephemeral lens in sessionStorage
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

// v0.13/v0.14: Quantum Deep Linking - Check URL params for initial lens
const getInitialLens = (): string | null => {
  if (typeof window === 'undefined') return null;

  // 1. Shared Reality (Highest Priority - v0.14)
  const shared = getInitialShare();
  if (shared) return shared;

  // 2. Quantum Deep Link (?lens=engineer)
  const params = new URLSearchParams(window.location.search);
  const lensParam = params.get('lens');
  if (lensParam && DEFAULT_PERSONAS[lensParam]) {
    return lensParam;
  }

  // 3. Local Storage (History)
  try {
    const storedLens = localStorage.getItem(STORAGE_KEY_LENS);
    if (storedLens) return storedLens;
  } catch (e) {
    console.error('Failed to read stored lens:', e);
  }

  return null;
};

interface UseNarrativeEngineReturn {
  // Data
  schema: NarrativeSchemaV2 | null;
  session: TerminalSession;
  loading: boolean;
  error: string | null;

  // Persona/Lens methods (tone modifiers, decoupled from journey flow)
  selectLens: (personaId: string | null) => void;
  getPersona: (personaId: string) => Persona | undefined;
  getPersonaById: (id: string) => Persona | undefined;  // v0.14: includes ephemeral lenses
  getEnabledPersonas: () => Persona[];
  getActiveLensData: () => Persona | null;

  // V2.1 Journey Navigation (replaces thread methods)
  startJourney: (journeyId: string) => void;
  advanceNode: (choiceIndex?: number) => void;  // 0 = primary, 1+ = alternates
  exitJourney: () => void;
  getJourney: (journeyId: string) => Journey | undefined;
  getNode: (nodeId: string) => JourneyNode | undefined;
  getNextNodes: (nodeId: string) => JourneyNode[];
  activeJourneyId: string | null;
  currentNodeId: string | null;
  visitedNodes: string[];

  // Card methods (kept for backward compatibility with V2.0 schemas)
  getCard: (cardId: string) => Card | undefined;
  getPersonaCards: (personaId: string | null) => Card[];
  getEntryPoints: (personaId: string | null) => Card[];
  getNextCards: (cardId: string) => Card[];
  getSectionCards: (sectionId: string) => Card[];

  // Legacy thread methods (deprecated - kept for Terminal.tsx compatibility during migration)
  /** @deprecated Use V2.1 journey methods instead */
  currentThread: string[];
  /** @deprecated Use V2.1 journey methods instead */
  currentPosition: number;
  /** @deprecated Use startJourney instead */
  regenerateThread: () => void;
  /** @deprecated Use advanceNode instead */
  advanceThread: () => string | null;
  /** @deprecated Use getNode instead */
  getThreadCard: (position: number) => Card | null;

  // Session methods
  incrementExchangeCount: () => void;
  addVisitedCard: (cardId: string) => void;
  addVisitedNode: (nodeId: string) => void;
  shouldNudge: () => boolean;
  resetSession: () => void;

  // Entropy / Cognitive Bridge methods
  entropyState: EntropyState;
  evaluateEntropy: (message: string, history: EntropyMessage[]) => EntropyResult;
  checkShouldInject: (entropy: EntropyResult) => boolean;
  recordEntropyInjection: (entropy: EntropyResult) => void;
  recordEntropyDismiss: () => void;
  tickEntropyCooldown: () => void;
  getJourneyIdForCluster: (cluster: string) => string | null;

  // Settings
  globalSettings: GlobalSettings;
}

export const useNarrativeEngine = (): UseNarrativeEngineReturn => {
  const [schema, setSchema] = useState<NarrativeSchemaV2 | null>(null);
  // v0.13: Initialize with deep-linked lens (prevents Flash of Default Reality)
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
  // V2.1: Lenses are TONAL MODIFIERS only - switching does NOT reset journey state

  const selectLens = useCallback((personaId: string | null) => {
    setSession(prev => {
      if (prev.activeLens === personaId) {
        return prev;
      }
      // V2.1 TRIPWIRE: Lens switching must NOT reset journey state
      // Only update the lens and exchange count
      return {
        ...prev,
        activeLens: personaId,
        exchangeCount: 0 // Reset exchange count on lens change
        // NOTE: activeJourneyId, currentNodeId, visitedNodes are PRESERVED
      };
    });
  }, []);

  const getPersona = useCallback((personaId: string): Persona | undefined => {
    if (!schema) return DEFAULT_PERSONAS[personaId];
    // V2.1 may not have personas - fall back to defaults
    return schema.personas?.[personaId] ?? DEFAULT_PERSONAS[personaId];
  }, [schema]);

  const getEnabledPersonas = useCallback((): Persona[] => {
    const personas: Record<string, Persona> = schema?.personas || DEFAULT_PERSONAS;
    return (Object.values(personas) as Persona[]).filter(p => p.enabled);
  }, [schema]);

  const getActiveLensData = useCallback((): Persona | null => {
    if (!session.activeLens) return null;
    return getPersona(session.activeLens) || null;
  }, [session.activeLens, getPersona]);

  // v0.14: Get persona by ID, including ephemeral lenses from sessionStorage
  const getPersonaById = useCallback((id: string): Persona | undefined => {
    // 1. Check default personas (archetypes)
    if (DEFAULT_PERSONAS[id]) return DEFAULT_PERSONAS[id];

    // 2. Check schema personas
    if (schema?.personas?.[id]) return schema.personas[id];

    // 3. Check ephemeral lenses from sessionStorage (shared links)
    try {
      const ephemeral = sessionStorage.getItem(`grove-ephemeral-${id}`);
      if (ephemeral) return JSON.parse(ephemeral) as Persona;
    } catch (e) {
      console.error('Failed to read ephemeral lens:', e);
    }

    return undefined;
  }, [schema]);

  // === Card Methods ===

  const getCard = useCallback((cardId: string): Card | undefined => {
    if (!schema?.cards) return undefined;
    return schema.cards[cardId];
  }, [schema]);

  const getPersonaCards = useCallback((personaId: string | null): Card[] => {
    if (!schema?.cards) return [];
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
    if (!schema?.cards) return [];

    if (personaId && schema.personas) {
      const persona = schema.personas[personaId];
      if (persona?.entryPoints?.length) {
        // Use persona's configured entry points
        return persona.entryPoints
          .map(id => schema.cards![id])
          .filter(Boolean);
      }
    }

    // Fallback: cards marked as entry or with sectionId
    const personaCards = getPersonaCards(personaId);
    return personaCards.filter(card => card.isEntry || card.sectionId);
  }, [schema, getPersonaCards]);

  const getNextCards = useCallback((cardId: string): Card[] => {
    if (!schema?.cards) return [];
    const card = schema.cards[cardId];
    if (!card?.next?.length) return [];

    return card.next
      .map(id => schema.cards![id])
      .filter(Boolean);
  }, [schema]);

  const getSectionCards = useCallback((sectionId: string): Card[] => {
    if (!schema?.cards) return [];
    return (Object.values(schema.cards) as Card[]).filter(card => card.sectionId === sectionId);
  }, [schema]);

  // === V2.1 Journey Methods ===

  /**
   * Get a journey by ID from the schema
   */
  const getJourney = useCallback((journeyId: string): Journey | undefined => {
    if (!schema?.journeys) return undefined;
    return schema.journeys[journeyId];
  }, [schema]);

  /**
   * Get a node by ID from the schema
   */
  const getNode = useCallback((nodeId: string): JourneyNode | undefined => {
    if (!schema?.nodes) return undefined;
    return schema.nodes[nodeId];
  }, [schema]);

  /**
   * Get next nodes for navigation (primary + alternates)
   */
  const getNextNodes = useCallback((nodeId: string): JourneyNode[] => {
    if (!schema?.nodes) return [];
    const node = schema.nodes[nodeId];
    if (!node) return [];

    const nextIds: string[] = [];
    if (node.primaryNext) nextIds.push(node.primaryNext);
    if (node.alternateNext) nextIds.push(...node.alternateNext);

    return nextIds
      .map(id => schema.nodes![id])
      .filter(Boolean) as JourneyNode[];
  }, [schema]);

  /**
   * Start a journey - sets active journey and current node to entry point
   */
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

  /**
   * Advance to the next node in the journey
   * @param choiceIndex - 0 for primary, 1+ for alternates
   */
  const advanceNode = useCallback((choiceIndex: number = 0) => {
    if (!session.currentNodeId || !schema?.nodes) return;

    const currentNode = schema.nodes[session.currentNodeId];
    if (!currentNode) return;

    // Build list of next options: primary first, then alternates
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
      visitedNodes: prev.visitedNodes.includes(nextNodeId)
        ? prev.visitedNodes
        : [...prev.visitedNodes, nextNodeId]
    }));
  }, [session.currentNodeId, schema]);

  /**
   * Exit the current journey (return to freestyle mode)
   */
  const exitJourney = useCallback(() => {
    console.log('[V2.1] Exiting journey');
    setSession(prev => ({
      ...prev,
      activeJourneyId: null,
      currentNodeId: null,
      visitedNodes: []
    }));
  }, []);

  // === Legacy Thread Methods (Deprecated - shims for Terminal.tsx compatibility) ===

  /** @deprecated V2.1 no longer uses thread generation */
  const regenerateThread = useCallback(() => {
    console.warn('[V2.1] regenerateThread is deprecated. Use startJourney instead.');
    // No-op in V2.1
  }, []);

  /** @deprecated V2.1 uses advanceNode instead */
  const advanceThread = useCallback((): string | null => {
    console.warn('[V2.1] advanceThread is deprecated. Use advanceNode instead.');
    // Shim: if in a journey, advance to primary next
    if (session.currentNodeId && schema?.nodes) {
      const currentNode = schema.nodes[session.currentNodeId];
      if (currentNode?.primaryNext) {
        advanceNode(0);
        return currentNode.primaryNext;
      }
    }
    return null;
  }, [session.currentNodeId, schema, advanceNode]);

  /** @deprecated V2.1 uses getNode instead */
  const getThreadCard = useCallback((position: number): Card | null => {
    // Shim: try to get from V2.0 cards if available
    if (schema?.cards && session.currentThread[position]) {
      return schema.cards[session.currentThread[position]] || null;
    }
    return null;
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

  const addVisitedNode = useCallback((nodeId: string) => {
    setSession(prev => ({
      ...prev,
      visitedNodes: prev.visitedNodes.includes(nodeId)
        ? prev.visitedNodes
        : [...prev.visitedNodes, nodeId]
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
    // V2.1: Prefer top-level hubs, fall back to globalSettings.topicHubs for backwards compatibility
    const v21Hubs = schema?.hubs
      ? Object.values(schema.hubs).filter(h => h.status === 'active')
      : [];
    const legacyHubs = schema?.globalSettings.topicHubs || [];
    const topicHubs = v21Hubs.length > 0 ? v21Hubs : legacyHubs;
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

  // Decrement cooldown on every exchange (called regardless of freestyle mode)
  const tickEntropyCooldown = useCallback(() => {
    setEntropyState(prev => ({
      ...prev,
      cooldownRemaining: Math.max(0, prev.cooldownRemaining - 1)
    }));
  }, []);

  const getJourneyIdForCluster = useCallback((cluster: string): string | null => {
    return getJourneyForCluster(cluster);
  }, []);

  // === Settings ===

  const globalSettings = schema?.globalSettings || DEFAULT_GLOBAL_SETTINGS;

  return {
    // Data
    schema,
    session,
    loading,
    error,

    // Persona/Lens methods
    selectLens,
    getPersona,
    getPersonaById,
    getEnabledPersonas,
    getActiveLensData,

    // V2.1 Journey Navigation (primary API)
    startJourney,
    advanceNode,
    exitJourney,
    getJourney,
    getNode,
    getNextNodes,
    activeJourneyId: session.activeJourneyId,
    currentNodeId: session.currentNodeId,
    visitedNodes: session.visitedNodes,

    // Card methods (V2.0 backward compatibility)
    getCard,
    getPersonaCards,
    getEntryPoints,
    getNextCards,
    getSectionCards,

    // Legacy thread methods (deprecated)
    currentThread: session.currentThread,
    currentPosition: session.currentPosition,
    regenerateThread,
    advanceThread,
    getThreadCard,

    // Session methods
    incrementExchangeCount,
    addVisitedCard,
    addVisitedNode,
    shouldNudge,
    resetSession,

    // Entropy / Cognitive Bridge
    entropyState,
    evaluateEntropy,
    checkShouldInject,
    recordEntropyInjection,
    recordEntropyDismiss,
    tickEntropyCooldown,
    getJourneyIdForCluster,

    // Settings
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
