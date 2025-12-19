// src/foundation/consoles/NarrativeArchitect.tsx
// Foundation-styled Narrative Engine admin for V2.1
// V2.1: Manages Journeys/Nodes instead of Cards/Personas

import React, { useState, useEffect, useMemo } from 'react';
import {
  NarrativeSchemaV2,
  Card,
  Persona,
  Journey,
  JourneyNode,
  GlobalSettings,
  PersonaPromptVersion,
  DEFAULT_GLOBAL_SETTINGS,
  isV1Schema,
  isV2Schema,
  nodeToCard,
  getPersonaColors
} from '../../../data/narratives-schema';
import { DEFAULT_PERSONAS } from '../../../data/default-personas';
import { DataPanel } from '../components/DataPanel';
import { GlowButton } from '../components/GlowButton';
import { MetricCard } from '../components/MetricCard';
import {
  BookOpen,
  Users,
  Grid3X3,
  Save,
  Plus,
  Settings,
  Search,
  ChevronRight,
  Trash2,
  Edit3,
  Map,
  Route,
  GitBranch
} from 'lucide-react';

// V2.1: Extended view modes to include journeys/nodes
type ViewMode = 'library' | 'persona' | 'journeys' | 'nodes';

const NarrativeArchitect: React.FC = () => {
  const [schema, setSchema] = useState<NarrativeSchemaV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  // Navigation state
  const [viewMode, setViewMode] = useState<ViewMode>('library');
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

  // V2.1 Journey/Node selection state
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Load schema on mount
  useEffect(() => {
    loadSchema();
  }, []);

  const loadSchema = async () => {
    try {
      const res = await fetch('/api/narrative');
      const data = await res.json();

      let finalSchema: NarrativeSchemaV2;

      if (isV2Schema(data)) {
        // V2.1 TRIPWIRE: Preserve V2.1 schema WITHOUT backfilling to cards/personas
        finalSchema = data;

        // Log schema version for debugging
        console.log('[NarrativeArchitect] Loaded schema version:', data.version, {
          hasJourneys: !!data.journeys,
          hasNodes: !!data.nodes,
          hasCards: !!data.cards,
          hasPersonas: !!data.personas
        });

        // Set default view based on schema version
        if (data.version === "2.1") {
          setViewMode('journeys');
          setStatus('V2.1 schema loaded');
        }
      } else if (isV1Schema(data)) {
        // V1 → V2.0 migration (legacy support only)
        const cards: Record<string, Card> = {};
        for (const [id, node] of Object.entries(data.nodes)) {
          cards[id] = nodeToCard(node as any);
        }
        finalSchema = {
          version: "2.0",
          globalSettings: DEFAULT_GLOBAL_SETTINGS,
          personas: DEFAULT_PERSONAS,
          cards
        };
        setStatus('Migrated from v1 format');
      } else {
        // Empty/invalid data → default V2.1 empty schema
        finalSchema = {
          version: "2.1",
          globalSettings: DEFAULT_GLOBAL_SETTINGS,
          journeys: {},
          nodes: {},
          hubs: {}
        };
        setViewMode('journeys');
      }

      setSchema(finalSchema);
    } catch (err) {
      console.error('Failed to load schema:', err);
      setStatus('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!schema) return;
    setSaving(true);
    setStatus('Saving...');

    try {
      const res = await fetch('/api/admin/narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schema)
      });
      const data = await res.json();

      if (data.success) {
        setStatus('Saved');
        setTimeout(() => setStatus(''), 3000);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setStatus('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Card operations
  const updateCard = (card: Card) => {
    if (!schema) return;
    setSchema({
      ...schema,
      cards: { ...schema.cards, [card.id]: card }
    });
  };

  const deleteCard = (cardId: string) => {
    if (!schema) return;
    const { [cardId]: _, ...remainingCards } = schema.cards;

    const updatedPersonas: Record<string, Persona> = { ...schema.personas };
    for (const [id, persona] of Object.entries(updatedPersonas) as [string, Persona][]) {
      updatedPersonas[id] = {
        ...persona,
        entryPoints: persona.entryPoints.filter(ep => ep !== cardId),
        suggestedThread: persona.suggestedThread.filter(st => st !== cardId)
      };
    }

    const updatedCards: Record<string, Card> = { ...remainingCards };
    for (const [id, card] of Object.entries(updatedCards) as [string, Card][]) {
      updatedCards[id] = {
        ...card,
        next: card.next.filter(n => n !== cardId)
      };
    }

    setSchema({
      ...schema,
      cards: updatedCards,
      personas: updatedPersonas
    });
    setSelectedCardId(null);
  };

  const createCard = () => {
    if (!schema) return;
    const id = `card-${Date.now()}`;
    const newCard: Card = {
      id,
      label: 'New Card',
      query: '',
      next: [],
      personas: ['all'],
      createdAt: new Date().toISOString()
    };
    setSchema({
      ...schema,
      cards: { ...schema.cards, [id]: newCard }
    });
    setSelectedCardId(id);
  };

  // Filtered cards
  const filteredCards = useMemo(() => {
    if (!schema?.cards) return [];
    let cards = Object.values(schema.cards) as Card[];

    if (viewMode === 'persona' && selectedPersonaId) {
      cards = cards.filter(card =>
        card.personas.includes(selectedPersonaId) || card.personas.includes('all')
      );
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      cards = cards.filter(card =>
        card.label.toLowerCase().includes(query) ||
        card.query.toLowerCase().includes(query) ||
        card.id.toLowerCase().includes(query)
      );
    }

    return cards;
  }, [schema, viewMode, selectedPersonaId, searchQuery]);

  const selectedCard = selectedCardId && schema?.cards ? schema.cards[selectedCardId] : null;
  const selectedPersona = selectedPersonaId && schema?.personas ? schema.personas[selectedPersonaId] : null;
  // V2.1 schemas may not have personas/cards - fall back to DEFAULT_PERSONAS
  const personas = schema?.personas ? (Object.values(schema.personas) as Persona[]) : Object.values(DEFAULT_PERSONAS) as Persona[];
  const allCards = schema?.cards ? (Object.values(schema.cards) as Card[]) : [];

  // V2.1: Journey and Node derived state
  const allJourneys = schema?.journeys ? (Object.values(schema.journeys) as Journey[]) : [];
  const allNodes = schema?.nodes ? (Object.values(schema.nodes) as JourneyNode[]) : [];
  const selectedJourney = selectedJourneyId && schema?.journeys ? schema.journeys[selectedJourneyId] : null;
  const selectedNode = selectedNodeId && schema?.nodes ? schema.nodes[selectedNodeId] : null;

  // V2.1: Filtered journeys
  const filteredJourneys = useMemo(() => {
    if (!schema?.journeys) return [];
    let journeys = Object.values(schema.journeys) as Journey[];

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      journeys = journeys.filter(j =>
        j.title.toLowerCase().includes(query) ||
        j.description.toLowerCase().includes(query) ||
        j.id.toLowerCase().includes(query)
      );
    }

    return journeys;
  }, [schema, searchQuery]);

  // V2.1: Filtered nodes (by selected journey or all)
  const filteredNodes = useMemo(() => {
    if (!schema?.nodes) return [];
    let nodes = Object.values(schema.nodes) as JourneyNode[];

    if (viewMode === 'nodes' && selectedJourneyId) {
      nodes = nodes.filter(node => node.journeyId === selectedJourneyId);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      nodes = nodes.filter(node =>
        node.label.toLowerCase().includes(query) ||
        node.query.toLowerCase().includes(query) ||
        node.id.toLowerCase().includes(query)
      );
    }

    // Sort by sequence order if available
    return nodes.sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0));
  }, [schema, viewMode, selectedJourneyId, searchQuery]);

  // Detect schema version for UI rendering
  const isV21Schema = schema?.version === "2.1";

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-holo-cyan animate-pulse font-mono">Loading Narrative Engine...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-sans font-semibold text-white mb-1">
            Narrative Architect
          </h1>
          <p className="text-gray-500 text-sm font-mono">
            {isV21Schema ? (
              <>v2.1 | {allJourneys.length} journeys | {allNodes.length} nodes</>
            ) : (
              <>v2.0 | {Object.keys(schema?.cards || {}).length} cards | {Object.keys(schema?.personas || {}).length} personas</>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {status && (
            <span className={`text-xs font-mono px-3 py-1 rounded ${
              status.includes('Error') ? 'bg-holo-red/20 text-holo-red' : 'bg-holo-lime/20 text-holo-lime'
            }`}>
              {status}
            </span>
          )}
          <GlowButton
            variant="primary"
            icon={Save}
            loading={saving}
            onClick={handleSave}
          >
            Save to Production
          </GlowButton>
        </div>
      </div>

      {/* Metrics Row - V2.1 aware */}
      <div className="grid grid-cols-4 gap-4">
        {isV21Schema ? (
          <>
            <MetricCard label="Total Journeys" value={allJourneys.length} highlight />
            <MetricCard label="Active Journeys" value={allJourneys.filter(j => j.status === 'active').length} />
            <MetricCard label="Total Nodes" value={allNodes.length} />
            <MetricCard
              label="Orphan Nodes"
              value={allNodes.filter(n => !n.primaryNext && (!n.alternateNext || n.alternateNext.length === 0)).length}
            />
          </>
        ) : (
          <>
            <MetricCard label="Total Cards" value={allCards.length} highlight />
            <MetricCard label="Active Personas" value={personas.filter(p => p.enabled).length} />
            <MetricCard
              label="Orphaned Cards"
              value={allCards.filter(c => c.next.length === 0).length}
            />
            <MetricCard
              label="Entry Points"
              value={personas.reduce((sum, p) => sum + p.entryPoints.length, 0)}
            />
          </>
        )}
      </div>

      {/* Main Content - Two Column Layout */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column - Navigation */}
        <div className="col-span-1 space-y-4">
          {/* View Toggle - V2.1 aware */}
          {isV21Schema ? (
            <div className="flex gap-1 bg-obsidian-raised rounded-lg p-1">
              <button
                onClick={() => { setViewMode('journeys'); setSelectedJourneyId(null); }}
                className={`
                  flex-1 py-2 px-4 rounded text-sm font-mono uppercase tracking-wider
                  transition-colors flex items-center justify-center gap-2
                  ${viewMode === 'journeys'
                    ? 'bg-holo-cyan/20 text-holo-cyan'
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <Map size={14} />
                Journeys
              </button>
              <button
                onClick={() => setViewMode('nodes')}
                className={`
                  flex-1 py-2 px-4 rounded text-sm font-mono uppercase tracking-wider
                  transition-colors flex items-center justify-center gap-2
                  ${viewMode === 'nodes'
                    ? 'bg-holo-cyan/20 text-holo-cyan'
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <GitBranch size={14} />
                Nodes
              </button>
            </div>
          ) : (
            <div className="flex gap-1 bg-obsidian-raised rounded-lg p-1">
              <button
                onClick={() => { setViewMode('library'); setSelectedPersonaId(null); }}
                className={`
                  flex-1 py-2 px-4 rounded text-sm font-mono uppercase tracking-wider
                  transition-colors flex items-center justify-center gap-2
                  ${viewMode === 'library'
                    ? 'bg-holo-cyan/20 text-holo-cyan'
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <Grid3X3 size={14} />
                Library
              </button>
              <button
                onClick={() => setViewMode('persona')}
                className={`
                  flex-1 py-2 px-4 rounded text-sm font-mono uppercase tracking-wider
                  transition-colors flex items-center justify-center gap-2
                  ${viewMode === 'persona'
                    ? 'bg-holo-cyan/20 text-holo-cyan'
                    : 'text-gray-500 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                <Users size={14} />
                Personas
              </button>
            </div>
          )}

          {/* V2.1: Journeys List */}
          {isV21Schema ? (
            <DataPanel title="Journeys" icon={Map}>
              <div className="space-y-1">
                {allJourneys.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 text-sm font-mono">
                    No journeys yet
                  </div>
                ) : (
                  allJourneys.map(journey => {
                    const nodeCount = allNodes.filter(n => n.journeyId === journey.id).length;
                    const isSelected = selectedJourneyId === journey.id;

                    return (
                      <button
                        key={journey.id}
                        onClick={() => {
                          setSelectedJourneyId(journey.id);
                          setViewMode('nodes');
                        }}
                        className={`
                          w-full text-left px-3 py-2 rounded transition-colors
                          ${isSelected
                            ? 'bg-holo-cyan/20 text-holo-cyan'
                            : 'hover:bg-white/5 text-gray-400'
                          }
                        `}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${
                              journey.status === 'active' ? 'bg-holo-lime' : 'bg-gray-600'
                            }`} />
                            <span className={`text-sm font-mono ${
                              journey.status !== 'active' ? 'opacity-50' : ''
                            }`}>
                              {journey.title}
                            </span>
                          </div>
                          <span className="text-xs text-gray-600">{nodeCount} nodes</span>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </DataPanel>
          ) : (
            // V2.0: Personas List
            <DataPanel title="Personas" icon={Users}>
              <div className="space-y-1">
                {personas.map(persona => {
                  const cardCount = allCards.filter(c =>
                    c.personas.includes(persona.id) || c.personas.includes('all')
                  ).length;
                  const isSelected = selectedPersonaId === persona.id;

                  return (
                    <button
                      key={persona.id}
                      onClick={() => {
                        setSelectedPersonaId(persona.id);
                        setViewMode('persona');
                      }}
                      className={`
                        w-full text-left px-3 py-2 rounded transition-colors
                        ${isSelected
                          ? 'bg-holo-cyan/20 text-holo-cyan'
                          : 'hover:bg-white/5 text-gray-400'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${
                            persona.enabled ? 'bg-holo-lime' : 'bg-gray-600'
                          }`} />
                          <span className={`text-sm font-mono ${
                            !persona.enabled ? 'opacity-50' : ''
                          }`}>
                            {persona.publicLabel}
                          </span>
                        </div>
                        <span className="text-xs text-gray-600">{cardCount}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </DataPanel>
          )}

          {/* Actions - V2.1 aware */}
          <div className="space-y-2">
            {isV21Schema ? (
              <>
                <GlowButton
                  variant="primary"
                  icon={Plus}
                  className="w-full"
                  disabled
                >
                  New Journey (Read-only)
                </GlowButton>
                <GlowButton
                  variant="secondary"
                  icon={Settings}
                  className="w-full"
                >
                  Global Settings
                </GlowButton>
              </>
            ) : (
              <>
                <GlowButton
                  variant="primary"
                  icon={Plus}
                  onClick={createCard}
                  className="w-full"
                >
                  New Card
                </GlowButton>
                <GlowButton
                  variant="secondary"
                  icon={Settings}
                  className="w-full"
                >
                  Global Settings
                </GlowButton>
              </>
            )}
          </div>
        </div>

        {/* Right Column - V2.1 Nodes or V2.0 Cards Grid & Editor */}
        <div className="col-span-2 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isV21Schema ? "Search journeys/nodes..." : "Search cards..."}
              className="
                w-full pl-10 pr-4 py-2.5 bg-obsidian-raised border border-holo-cyan/20
                rounded text-sm font-mono text-white placeholder-gray-600
                focus:outline-none focus:border-holo-cyan/50
              "
            />
          </div>

          {/* V2.1: Nodes Grid / V2.0: Cards Grid */}
          {isV21Schema ? (
            <>
              {/* V2.1: Journey Nodes Grid */}
              <DataPanel
                title={viewMode === 'nodes' && selectedJourney
                  ? `${selectedJourney.title} Nodes`
                  : 'All Nodes'
                }
                icon={GitBranch}
              >
                {filteredNodes.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm font-mono">
                    {searchQuery ? 'No nodes match your search' : 'No nodes yet'}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto f-scrollbar pr-2">
                    {filteredNodes.map(node => {
                      const isSelected = selectedNodeId === node.id;
                      const journey = allJourneys.find(j => j.id === node.journeyId);
                      return (
                        <button
                          key={node.id}
                          onClick={() => setSelectedNodeId(node.id)}
                          className={`
                            text-left p-3 rounded border transition-all
                            ${isSelected
                              ? 'bg-holo-cyan/10 border-holo-cyan/50'
                              : 'bg-obsidian border-holo-cyan/10 hover:border-holo-cyan/30'
                            }
                          `}
                        >
                          <div className="font-medium text-white text-sm truncate">
                            {node.label}
                          </div>
                          <div className="text-xs text-gray-600 font-mono truncate mt-1">
                            {node.id}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {node.sequenceOrder !== undefined && (
                              <span className="px-1.5 py-0.5 text-[10px] font-mono bg-holo-lime/10 text-holo-lime rounded">
                                #{node.sequenceOrder}
                              </span>
                            )}
                            {journey && (
                              <span className="px-1.5 py-0.5 text-[10px] font-mono bg-holo-cyan/10 text-holo-cyan rounded truncate max-w-[100px]">
                                {journey.title}
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 text-[10px] font-mono bg-gray-800 text-gray-400 rounded">
                              {node.primaryNext ? '→' : '∅'} {(node.alternateNext?.length || 0) > 0 ? `+${node.alternateNext?.length}` : ''}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </DataPanel>

              {/* V2.1: Node Details (Read-only) */}
              {selectedNode && (
                <DataPanel
                  title="Node Details (Read-only)"
                  icon={Edit3}
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-500 font-mono uppercase mb-1">
                        Label
                      </label>
                      <div className="px-3 py-2 bg-obsidian border border-holo-cyan/20 rounded text-sm font-mono text-white">
                        {selectedNode.label}
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 font-mono uppercase mb-1">
                        Query (LLM Instruction)
                      </label>
                      <div className="px-3 py-2 bg-obsidian border border-holo-cyan/20 rounded text-sm font-mono text-white whitespace-pre-wrap max-h-32 overflow-y-auto">
                        {selectedNode.query || <span className="text-gray-600">No query</span>}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-500 font-mono uppercase mb-1">
                          Journey
                        </label>
                        <div className="px-3 py-2 bg-obsidian border border-holo-cyan/20 rounded text-sm font-mono text-holo-cyan">
                          {allJourneys.find(j => j.id === selectedNode.journeyId)?.title || selectedNode.journeyId}
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 font-mono uppercase mb-1">
                          Sequence Order
                        </label>
                        <div className="px-3 py-2 bg-obsidian border border-holo-cyan/20 rounded text-sm font-mono text-white">
                          {selectedNode.sequenceOrder ?? 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 font-mono uppercase mb-1">
                        Navigation
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {selectedNode.primaryNext && (
                          <span className="px-2 py-1 text-xs font-mono bg-holo-lime/10 text-holo-lime rounded">
                            Primary: {selectedNode.primaryNext}
                          </span>
                        )}
                        {selectedNode.alternateNext?.map(nextId => (
                          <span
                            key={nextId}
                            className="px-2 py-1 text-xs font-mono bg-holo-cyan/10 text-holo-cyan rounded"
                          >
                            Alt: {nextId}
                          </span>
                        ))}
                        {!selectedNode.primaryNext && (!selectedNode.alternateNext || selectedNode.alternateNext.length === 0) && (
                          <span className="text-gray-600 text-sm font-mono">End node (no next)</span>
                        )}
                      </div>
                    </div>
                    {selectedNode.contextSnippet && (
                      <div>
                        <label className="block text-xs text-gray-500 font-mono uppercase mb-1">
                          Context Snippet
                        </label>
                        <div className="px-3 py-2 bg-obsidian border border-holo-cyan/20 rounded text-xs font-mono text-gray-400 whitespace-pre-wrap max-h-24 overflow-y-auto">
                          {selectedNode.contextSnippet}
                        </div>
                      </div>
                    )}
                  </div>
                </DataPanel>
              )}
            </>
          ) : (
            <>
              {/* V2.0: Cards Grid */}
              <DataPanel
                title={viewMode === 'persona' && selectedPersona
                  ? `${selectedPersona.publicLabel} Cards`
                  : 'All Cards'
                }
                icon={BookOpen}
              >
                {filteredCards.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm font-mono">
                    {searchQuery ? 'No cards match your search' : 'No cards yet'}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto f-scrollbar pr-2">
                    {filteredCards.map(card => {
                      const isSelected = selectedCardId === card.id;
                      return (
                        <button
                          key={card.id}
                          onClick={() => setSelectedCardId(card.id)}
                          className={`
                            text-left p-3 rounded border transition-all
                            ${isSelected
                              ? 'bg-holo-cyan/10 border-holo-cyan/50'
                              : 'bg-obsidian border-holo-cyan/10 hover:border-holo-cyan/30'
                            }
                          `}
                        >
                          <div className="font-medium text-white text-sm truncate">
                            {card.label}
                          </div>
                          <div className="text-xs text-gray-600 font-mono truncate mt-1">
                            {card.id}
                          </div>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {card.sectionId && (
                              <span className="px-1.5 py-0.5 text-[10px] font-mono bg-holo-cyan/10 text-holo-cyan rounded">
                                {card.sectionId}
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 text-[10px] font-mono bg-gray-800 text-gray-400 rounded">
                              {card.next.length} next
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </DataPanel>

              {/* V2.0: Card Preview/Quick Edit */}
              {selectedCard && (
                <DataPanel
                  title="Card Details"
                  icon={Edit3}
                  actions={
                    <GlowButton
                      variant="danger"
                      size="sm"
                      icon={Trash2}
                      onClick={() => deleteCard(selectedCard.id)}
                    >
                      Delete
                    </GlowButton>
                  }
                >
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs text-gray-500 font-mono uppercase mb-1">
                        Label
                      </label>
                      <input
                        type="text"
                        value={selectedCard.label}
                        onChange={(e) => updateCard({ ...selectedCard, label: e.target.value })}
                        className="
                          w-full px-3 py-2 bg-obsidian border border-holo-cyan/20
                          rounded text-sm font-mono text-white
                          focus:outline-none focus:border-holo-cyan/50
                        "
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 font-mono uppercase mb-1">
                        Query (LLM Instruction)
                      </label>
                      <textarea
                        value={selectedCard.query}
                        onChange={(e) => updateCard({ ...selectedCard, query: e.target.value })}
                        rows={4}
                        className="
                          w-full px-3 py-2 bg-obsidian border border-holo-cyan/20
                          rounded text-sm font-mono text-white resize-none
                          focus:outline-none focus:border-holo-cyan/50
                        "
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 font-mono uppercase mb-1">
                        Next Cards ({selectedCard.next.length})
                      </label>
                      <div className="flex flex-wrap gap-1">
                        {selectedCard.next.map(nextId => (
                          <span
                            key={nextId}
                            className="px-2 py-1 text-xs font-mono bg-holo-cyan/10 text-holo-cyan rounded"
                          >
                            {nextId}
                          </span>
                        ))}
                        {selectedCard.next.length === 0 && (
                          <span className="text-gray-600 text-sm font-mono">No next cards</span>
                        )}
                      </div>
                    </div>
                  </div>
                </DataPanel>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NarrativeArchitect;
