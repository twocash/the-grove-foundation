// hooks/NarrativeEngineContext.tsx
// Shared context for NarrativeEngine state across all components
// v0.14.1: Fix - Terminal and GenesisPage now share lens state

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
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
import { deserializeLens } from '../src/utils/lensSerializer';

// LocalStorage keys
const STORAGE_KEY_LENS = 'grove-terminal-lens';
const STORAGE_KEY_SESSION = 'grove-terminal-session';
const STORAGE_KEY_REFERRER = 'grove-referrer';
const STORAGE_KEY_WELCOMED = 'grove-terminal-welcomed';
const STORAGE_KEY_ESTABLISHED = 'grove-session-established';

// v0.12e: Track referrer code from ?r= parameter
const captureReferrer = (): string | null => {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const referrer = params.get('r');
  if (referrer) {
    try {
      // Store referrer with timestamp for future social graph tracking
      const referrerData = {
        code: referrer,
        capturedAt: new Date().toISOString(),
        landingUrl: window.location.href
      };
      localStorage.setItem(STORAGE_KEY_REFERRER, JSON.stringify(referrerData));
      console.log('[v0.12e] Referrer captured:', referrer);
    } catch (e) {
      console.error('Failed to store referrer:', e);
    }
    return referrer;
  }
  return null;
};

// v0.12e: Check if user arrived with any identifying URL params
const hasIdentifyingParams = (): boolean => {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return !!(params.get('r') || params.get('lens') || params.get('share'));
};

// v0.12e: Force clear stale localStorage for fresh first-time experience
// Called when user arrives with no identifying params - ensures clean slate
// v0.12f: Skip clearing if user has established a session (picked a lens)
const ensureCleanFirstVisit = (): void => {
  if (typeof window === 'undefined') return;

  // If user has identifying URL params, don't clear - they're intentional
  if (hasIdentifyingParams()) return;

  // v0.12f: If user has established a session, preserve their state
  // This marker is set when user explicitly picks a lens
  try {
    const isEstablished = localStorage.getItem(STORAGE_KEY_ESTABLISHED) === 'true';
    if (isEstablished) {
      console.log('[v0.12f] Returning user with established session - preserving state');
      return;
    }
  } catch (e) {
    // Continue with clearing if we can't read the marker
  }

  // If user has NO identifying params and NO established session, clear stale state
  try {
    const hasAnyState = localStorage.getItem(STORAGE_KEY_WELCOMED) ||
                        localStorage.getItem(STORAGE_KEY_LENS) ||
                        localStorage.getItem(STORAGE_KEY_SESSION);

    if (hasAnyState) {
      console.log('[v0.12e] Clearing stale localStorage for fresh experience');
      localStorage.removeItem(STORAGE_KEY_WELCOMED);
      localStorage.removeItem(STORAGE_KEY_LENS);
      localStorage.removeItem(STORAGE_KEY_SESSION);
      // Keep referrer if they previously had one - that's intentional tracking
    }
  } catch (e) {
    console.error('Failed to clear stale localStorage:', e);
  }
};

// v0.12e: Check if this is a returning user (has any localStorage state)
const isReturningUser = (): boolean => {
  if (typeof window === 'undefined') return false;
  try {
    // User is returning if they have any Grove-specific localStorage
    const hasWelcomed = localStorage.getItem(STORAGE_KEY_WELCOMED) === 'true';
    const hasLens = !!localStorage.getItem(STORAGE_KEY_LENS);
    const hasSession = !!localStorage.getItem(STORAGE_KEY_SESSION);
    return hasWelcomed || hasLens || hasSession;
  } catch (e) {
    return false;
  }
};

// v0.12e: Get stored referrer data
const getStoredReferrer = (): { code: string; capturedAt: string; landingUrl: string } | null => {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem(STORAGE_KEY_REFERRER);
    if (stored) return JSON.parse(stored);
  } catch (e) {
    console.error('Failed to read referrer:', e);
  }
  return null;
};

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
  getPersona: (personaId: string) => Persona | undefined;
  getPersonaById: (id: string) => Persona | undefined;
  getEnabledPersonas: () => Persona[];
  getActiveLensData: () => Persona | null;
  getJourney: (journeyId: string) => Journey | undefined;
  getNode: (nodeId: string) => JourneyNode | undefined;
  getNextNodes: (nodeId: string) => JourneyNode[];
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
  globalSettings: GlobalSettings;
  // v0.12e: First-time user detection and referrer tracking
  isFirstTimeUser: boolean;
  urlLensId: string | null;
  referrer: { code: string; capturedAt: string; landingUrl: string } | null;
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
  // v0.12e: CRITICAL - Clean stale state BEFORE any localStorage reads
  // This ensures fresh first-time experience for users with no URL params
  const [isFirstTimeUser] = useState(() => {
    ensureCleanFirstVisit(); // Clear stale state for users with no URL params
    return !isReturningUser();
  });

  const [schema, setSchema] = useState<NarrativeSchemaV2 | null>(null);
  const [session, setSession] = useState<TerminalSession>(() => ({
    ...DEFAULT_TERMINAL_SESSION,
    activeLens: getInitialLens() // Now reads from cleaned localStorage
  }));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [urlLensId] = useState(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    return params.get('lens');
  });
  const [referrer] = useState(() => {
    // Capture new referrer first (if present in URL)
    captureReferrer();
    // Then return stored referrer (may be newly captured or previous)
    return getStoredReferrer();
  });

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


  // === Callbacks ===


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


  // Legacy thread methods
  const regenerateThread = useCallback(() => {
    console.warn('[V2.1] regenerateThread is deprecated.');
  }, []);

  const advanceThread = useCallback((): string | null => {
    console.warn('[V2.1] advanceThread is deprecated. Use engagement hooks instead.');
    return null;
  }, []);

  const getThreadCard = useCallback((position: number): Card | null => {
    const itemId = session.currentThread[position];
    if (!itemId) return null;

    // Try cards first (legacy), then nodes (v2.1)
    if (schema?.cards?.[itemId]) {
      return schema.cards[itemId];
    }
    if (schema?.nodes?.[itemId]) {
      // Nodes have compatible structure with cards for display
      const node = schema.nodes[itemId];
      return {
        id: node.id,
        label: node.label,
        query: node.query,
        contextSnippet: node.contextSnippet,
        sectionId: node.sectionId,
        next: node.primaryNext ? [node.primaryNext, ...(node.alternateNext || [])] : []
      } as Card;
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
    localStorage.removeItem(STORAGE_KEY_LENS);
    localStorage.removeItem(STORAGE_KEY_SESSION);
  }, []);


  const globalSettings = schema?.globalSettings || DEFAULT_GLOBAL_SETTINGS;

  const value: NarrativeEngineContextType = {
    schema,
    session,
    loading,
    error,
    getPersona,
    getPersonaById,
    getEnabledPersonas,
    getActiveLensData,
    getJourney,
    getNode,
    getNextNodes,
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
    globalSettings,
    // v0.12e: First-time user detection and referrer tracking
    isFirstTimeUser,
    urlLensId,
    referrer
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
