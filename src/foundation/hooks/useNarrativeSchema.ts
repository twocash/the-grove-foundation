// src/foundation/hooks/useNarrativeSchema.ts
// Hook for loading, saving, and managing the narrative schema

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  NarrativeSchemaV2,
  Card,
  Persona,
  Journey,
  JourneyNode,
  DEFAULT_GLOBAL_SETTINGS,
  isV1Schema,
  isV2Schema,
  nodeToCard,
} from '../../../data/narratives-schema';
import { DEFAULT_PERSONAS } from '../../../data/default-personas';

export type ViewMode = 'journeys' | 'nodes' | 'library' | 'persona';

interface UseNarrativeSchemaReturn {
  // Schema
  schema: NarrativeSchemaV2 | null;
  loading: boolean;
  saving: boolean;
  status: string;
  prUrl: string | null;
  prNumber: number | null;

  // Derived data
  isV21Schema: boolean;
  personas: Persona[];
  allCards: Card[];
  allJourneys: Journey[];
  allNodes: JourneyNode[];

  // Filtered data (depends on viewMode and selections)
  getFilteredCards: (viewMode: ViewMode, personaId: string | null, searchQuery: string) => Card[];
  getFilteredJourneys: (searchQuery: string) => Journey[];
  getFilteredNodes: (viewMode: ViewMode, journeyId: string | null, searchQuery: string) => JourneyNode[];

  // Selectors
  getJourney: (id: string) => Journey | null;
  getNode: (id: string) => JourneyNode | null;
  getCard: (id: string) => Card | null;
  getPersona: (id: string) => Persona | null;

  // Actions
  save: () => Promise<void>;
  refresh: () => Promise<void>;
  updateCard: (card: Card) => void;
  deleteCard: (cardId: string) => void;
  createCard: () => string;
}

export function useNarrativeSchema(): UseNarrativeSchemaReturn {
  const [schema, setSchema] = useState<NarrativeSchemaV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [prUrl, setPrUrl] = useState<string | null>(null);
  const [prNumber, setPrNumber] = useState<number | null>(null);

  const loadSchema = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/narrative');
      const data = await res.json();

      let finalSchema: NarrativeSchemaV2;

      if (isV2Schema(data)) {
        finalSchema = data;
        console.log('[useNarrativeSchema] Loaded schema version:', data.version, {
          hasJourneys: !!data.journeys,
          hasNodes: !!data.nodes,
          hasCards: !!data.cards,
          hasPersonas: !!data.personas,
        });
        if (data.version === '2.1') {
          setStatus('V2.1 schema loaded');
        }
      } else if (isV1Schema(data)) {
        const cards: Record<string, Card> = {};
        for (const [id, node] of Object.entries(data.nodes)) {
          cards[id] = nodeToCard(node as any);
        }
        finalSchema = {
          version: '2.0',
          globalSettings: DEFAULT_GLOBAL_SETTINGS,
          personas: DEFAULT_PERSONAS,
          cards,
        };
        setStatus('Migrated from v1 format');
      } else {
        finalSchema = {
          version: '2.1',
          globalSettings: DEFAULT_GLOBAL_SETTINGS,
          journeys: {},
          nodes: {},
          hubs: {},
        };
      }

      setSchema(finalSchema);
    } catch (err) {
      console.error('Failed to load schema:', err);
      setStatus('Error loading data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchema();
  }, [loadSchema]);

  const save = useCallback(async () => {
    if (!schema) return;
    setSaving(true);
    setStatus('Saving...');
    setPrUrl(null);
    setPrNumber(null);

    try {
      const res = await fetch('/api/admin/narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schema),
      });
      const data = await res.json();

      if (data.success) {
        if (data.gitSync?.success && data.gitSync.prUrl) {
          setStatus('Saved to Runtime');
          setPrUrl(data.gitSync.prUrl);
          setPrNumber(data.gitSync.prNumber || null);
        } else if (data.gitSync?.success === false) {
          setStatus('Saved to Runtime (Git Sync Failed)');
        } else {
          setStatus('Saved to Runtime');
        }
        setTimeout(() => {
          setStatus('');
          setPrUrl(null);
          setPrNumber(null);
        }, 5000);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setStatus('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  }, [schema]);

  const updateCard = useCallback((card: Card) => {
    setSchema((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        cards: { ...prev.cards, [card.id]: card },
      };
    });
  }, []);

  const deleteCard = useCallback((cardId: string) => {
    setSchema((prev) => {
      if (!prev) return prev;

      const { [cardId]: _, ...remainingCards } = prev.cards || {};

      const updatedPersonas: Record<string, Persona> = { ...prev.personas };
      for (const [id, persona] of Object.entries(updatedPersonas) as [string, Persona][]) {
        updatedPersonas[id] = {
          ...persona,
          entryPoints: persona.entryPoints.filter((ep) => ep !== cardId),
          suggestedThread: persona.suggestedThread.filter((st) => st !== cardId),
        };
      }

      const updatedCards: Record<string, Card> = { ...remainingCards };
      for (const [id, card] of Object.entries(updatedCards) as [string, Card][]) {
        updatedCards[id] = {
          ...card,
          next: card.next.filter((n) => n !== cardId),
        };
      }

      return {
        ...prev,
        cards: updatedCards,
        personas: updatedPersonas,
      };
    });
  }, []);

  const createCard = useCallback((): string => {
    const id = `card-${Date.now()}`;
    const newCard: Card = {
      id,
      label: 'New Card',
      query: '',
      next: [],
      personas: ['all'],
      createdAt: new Date().toISOString(),
    };
    setSchema((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        cards: { ...prev.cards, [id]: newCard },
      };
    });
    return id;
  }, []);

  // Derived values
  const isV21Schema = schema?.version === '2.1';
  const personas = useMemo(
    () => (schema?.personas ? (Object.values(schema.personas) as Persona[]) : (Object.values(DEFAULT_PERSONAS) as Persona[])),
    [schema?.personas]
  );
  const allCards = useMemo(() => (schema?.cards ? (Object.values(schema.cards) as Card[]) : []), [schema?.cards]);
  const allJourneys = useMemo(() => (schema?.journeys ? (Object.values(schema.journeys) as Journey[]) : []), [schema?.journeys]);
  const allNodes = useMemo(() => (schema?.nodes ? (Object.values(schema.nodes) as JourneyNode[]) : []), [schema?.nodes]);

  // Filtered data functions
  const getFilteredCards = useCallback(
    (viewMode: ViewMode, personaId: string | null, searchQuery: string): Card[] => {
      if (!schema?.cards) return [];
      let cards = Object.values(schema.cards) as Card[];

      if (viewMode === 'persona' && personaId) {
        cards = cards.filter((card) => card.personas.includes(personaId) || card.personas.includes('all'));
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        cards = cards.filter(
          (card) =>
            card.label.toLowerCase().includes(query) ||
            card.query.toLowerCase().includes(query) ||
            card.id.toLowerCase().includes(query)
        );
      }

      return cards;
    },
    [schema?.cards]
  );

  const getFilteredJourneys = useCallback(
    (searchQuery: string): Journey[] => {
      if (!schema?.journeys) return [];
      let journeys = Object.values(schema.journeys) as Journey[];

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        journeys = journeys.filter(
          (j) =>
            j.title.toLowerCase().includes(query) ||
            j.description.toLowerCase().includes(query) ||
            j.id.toLowerCase().includes(query)
        );
      }

      return journeys;
    },
    [schema?.journeys]
  );

  const getFilteredNodes = useCallback(
    (viewMode: ViewMode, journeyId: string | null, searchQuery: string): JourneyNode[] => {
      if (!schema?.nodes) return [];
      let nodes = Object.values(schema.nodes) as JourneyNode[];

      if (viewMode === 'nodes' && journeyId) {
        nodes = nodes.filter((node) => node.journeyId === journeyId);
      }

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        nodes = nodes.filter(
          (node) =>
            node.label.toLowerCase().includes(query) ||
            node.query.toLowerCase().includes(query) ||
            node.id.toLowerCase().includes(query)
        );
      }

      return nodes.sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0));
    },
    [schema?.nodes]
  );

  // Selectors
  const getJourney = useCallback(
    (id: string): Journey | null => (schema?.journeys?.[id] as Journey) || null,
    [schema?.journeys]
  );
  const getNode = useCallback(
    (id: string): JourneyNode | null => (schema?.nodes?.[id] as JourneyNode) || null,
    [schema?.nodes]
  );
  const getCard = useCallback((id: string): Card | null => (schema?.cards?.[id] as Card) || null, [schema?.cards]);
  const getPersona = useCallback(
    (id: string): Persona | null => (schema?.personas?.[id] as Persona) || null,
    [schema?.personas]
  );

  return {
    schema,
    loading,
    saving,
    status,
    prUrl,
    prNumber,
    isV21Schema,
    personas,
    allCards,
    allJourneys,
    allNodes,
    getFilteredCards,
    getFilteredJourneys,
    getFilteredNodes,
    getJourney,
    getNode,
    getCard,
    getPersona,
    save,
    refresh: loadSchema,
    updateCard,
    deleteCard,
    createCard,
  };
}
