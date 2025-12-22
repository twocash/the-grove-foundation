// src/foundation/consoles/NarrativeArchitect.tsx
// Foundation-styled Narrative Engine admin for V2.1
// V2.1: Manages Journeys/Nodes with Inspector pattern

import { useState, useMemo } from 'react';
import { CollectionHeader } from '../../shared';
import { DataPanel } from '../components/DataPanel';
import { GlowButton } from '../components/GlowButton';
import { MetricCard } from '../components/MetricCard';
import { LoadingSpinner } from '../../shared/feedback';
import { useNarrativeSchema, type ViewMode } from '../hooks/useNarrativeSchema';
import { useFoundationUI } from '../FoundationUIContext';
import type { Journey, JourneyNode, Card, Persona } from '../../../data/narratives-schema';

const NarrativeArchitect: React.FC = () => {
  const {
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
    save,
    createCard,
  } = useNarrativeSchema();

  const { openInspector, inspector } = useFoundationUI();

  // Navigation state
  const [viewMode, setViewMode] = useState<ViewMode>(isV21Schema ? 'journeys' : 'library');
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [selectedJourneyId, setSelectedJourneyId] = useState<string | null>(null);

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Derived filtered data
  const filteredCards = useMemo(
    () => getFilteredCards(viewMode, selectedPersonaId, searchQuery),
    [getFilteredCards, viewMode, selectedPersonaId, searchQuery]
  );

  const filteredJourneys = useMemo(
    () => getFilteredJourneys(searchQuery),
    [getFilteredJourneys, searchQuery]
  );

  const filteredNodes = useMemo(
    () => getFilteredNodes(viewMode, selectedJourneyId, searchQuery),
    [getFilteredNodes, viewMode, selectedJourneyId, searchQuery]
  );

  const selectedJourney = selectedJourneyId
    ? allJourneys.find((j) => j.id === selectedJourneyId) || null
    : null;

  const handleJourneyClick = (journeyId: string) => {
    setSelectedJourneyId(journeyId);
    openInspector({ type: 'journey', journeyId });
  };

  const handleNodeClick = (nodeId: string) => {
    openInspector({ type: 'node', nodeId });
  };

  const handleCardClick = (cardId: string) => {
    openInspector({ type: 'card', cardId });
  };

  const handlePersonaClick = (personaId: string) => {
    setSelectedPersonaId(personaId);
    openInspector({ type: 'persona', personaId });
  };

  const handleCreateCard = () => {
    const cardId = createCard();
    openInspector({ type: 'card', cardId });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <LoadingSpinner size="lg" label="Loading Narrative Engine..." />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <CollectionHeader
        title="Narrative Architect"
        description={
          isV21Schema
            ? `V2.1 Schema | ${allJourneys.length} journeys | ${allNodes.length} nodes`
            : `V2.0 Schema | ${allCards.length} cards | ${personas.length} personas`
        }
        searchPlaceholder={isV21Schema ? 'Search journeys or nodes...' : 'Search cards...'}
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
      >
        {/* Status & Actions */}
        <div className="flex items-center justify-between mt-4">
          <div className="flex items-center gap-2">
            {status && (
              <span
                className={`text-xs font-mono px-3 py-1 rounded ${
                  status.includes('Error')
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400'
                    : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400'
                }`}
              >
                {status}
              </span>
            )}
            {prUrl && (
              <a
                href={prUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono px-3 py-1 rounded bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                View PR #{prNumber}
              </a>
            )}
          </div>
          <GlowButton variant="primary" icon="save" loading={saving} onClick={save}>
            Save to Production
          </GlowButton>
        </div>
      </CollectionHeader>

      {/* Metrics Row */}
      <div className="grid grid-cols-4 gap-4">
        {isV21Schema ? (
          <>
            <MetricCard label="Total Journeys" value={allJourneys.length} highlight />
            <MetricCard
              label="Active Journeys"
              value={allJourneys.filter((j) => j.status === 'active').length}
            />
            <MetricCard label="Total Nodes" value={allNodes.length} />
            <MetricCard
              label="Orphan Nodes"
              value={
                allNodes.filter(
                  (n) => !n.primaryNext && (!n.alternateNext || n.alternateNext.length === 0)
                ).length
              }
            />
          </>
        ) : (
          <>
            <MetricCard label="Total Cards" value={allCards.length} highlight />
            <MetricCard
              label="Active Personas"
              value={personas.filter((p) => p.enabled).length}
            />
            <MetricCard
              label="Orphaned Cards"
              value={allCards.filter((c) => c.next.length === 0).length}
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
          {/* View Toggle */}
          <ViewToggle
            isV21Schema={isV21Schema}
            viewMode={viewMode}
            onViewModeChange={(mode) => {
              setViewMode(mode);
              if (mode === 'journeys') setSelectedJourneyId(null);
              if (mode === 'library') setSelectedPersonaId(null);
            }}
          />

          {/* Navigation List */}
          {isV21Schema ? (
            <DataPanel title="Journeys" icon="map">
              <JourneyList
                journeys={allJourneys}
                nodes={allNodes}
                selectedId={selectedJourneyId}
                activeInspectorId={
                  inspector.mode.type === 'journey' ? inspector.mode.journeyId : null
                }
                onSelect={handleJourneyClick}
              />
            </DataPanel>
          ) : (
            <DataPanel title="Personas" icon="group">
              <PersonaList
                personas={personas}
                cards={allCards}
                selectedId={selectedPersonaId}
                activeInspectorId={
                  inspector.mode.type === 'persona' ? inspector.mode.personaId : null
                }
                onSelect={handlePersonaClick}
              />
            </DataPanel>
          )}

          {/* Actions */}
          <div className="space-y-2">
            {isV21Schema ? (
              <>
                <GlowButton variant="primary" icon="add" fullWidth disabled>
                  New Journey (Read-only)
                </GlowButton>
                <GlowButton variant="secondary" icon="settings" fullWidth>
                  Global Settings
                </GlowButton>
              </>
            ) : (
              <>
                <GlowButton variant="primary" icon="add" onClick={handleCreateCard} fullWidth>
                  New Card
                </GlowButton>
                <GlowButton variant="secondary" icon="settings" fullWidth>
                  Global Settings
                </GlowButton>
              </>
            )}
          </div>
        </div>

        {/* Right Column - Content Grid */}
        <div className="col-span-2">
          {isV21Schema ? (
            <DataPanel
              title={
                viewMode === 'nodes' && selectedJourney
                  ? `${selectedJourney.title} Nodes`
                  : 'All Nodes'
              }
              icon="hub"
            >
              <NodeGrid
                nodes={filteredNodes}
                journeys={allJourneys}
                activeInspectorId={inspector.mode.type === 'node' ? inspector.mode.nodeId : null}
                searchQuery={searchQuery}
                onSelect={handleNodeClick}
              />
            </DataPanel>
          ) : (
            <DataPanel
              title={
                viewMode === 'persona' && selectedPersonaId
                  ? `${personas.find((p) => p.id === selectedPersonaId)?.publicLabel || ''} Cards`
                  : 'All Cards'
              }
              icon="article"
            >
              <CardGrid
                cards={filteredCards}
                activeInspectorId={inspector.mode.type === 'card' ? inspector.mode.cardId : null}
                searchQuery={searchQuery}
                onSelect={handleCardClick}
              />
            </DataPanel>
          )}
        </div>
      </div>
    </div>
  );
};

// Sub-components

interface ViewToggleProps {
  isV21Schema: boolean;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
}

function ViewToggle({ isV21Schema, viewMode, onViewModeChange }: ViewToggleProps) {
  if (isV21Schema) {
    return (
      <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
        <button
          onClick={() => onViewModeChange('journeys')}
          className={`flex-1 py-2 px-4 rounded text-sm font-medium uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
            viewMode === 'journeys'
              ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <span className="material-symbols-outlined text-base">map</span>
          Journeys
        </button>
        <button
          onClick={() => onViewModeChange('nodes')}
          className={`flex-1 py-2 px-4 rounded text-sm font-medium uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
            viewMode === 'nodes'
              ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <span className="material-symbols-outlined text-base">hub</span>
          Nodes
        </button>
      </div>
    );
  }

  return (
    <div className="flex gap-1 bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
      <button
        onClick={() => onViewModeChange('library')}
        className={`flex-1 py-2 px-4 rounded text-sm font-medium uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
          viewMode === 'library'
            ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
        }`}
      >
        <span className="material-symbols-outlined text-base">grid_view</span>
        Library
      </button>
      <button
        onClick={() => onViewModeChange('persona')}
        className={`flex-1 py-2 px-4 rounded text-sm font-medium uppercase tracking-wider transition-colors flex items-center justify-center gap-2 ${
          viewMode === 'persona'
            ? 'bg-white dark:bg-slate-700 text-primary shadow-sm'
            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
        }`}
      >
        <span className="material-symbols-outlined text-base">group</span>
        Personas
      </button>
    </div>
  );
}

interface JourneyListProps {
  journeys: Journey[];
  nodes: JourneyNode[];
  selectedId: string | null;
  activeInspectorId: string | null;
  onSelect: (id: string) => void;
}

function JourneyList({ journeys, nodes, selectedId, activeInspectorId, onSelect }: JourneyListProps) {
  if (journeys.length === 0) {
    return (
      <div className="text-center py-4 text-slate-500 dark:text-slate-400 text-sm">
        No journeys yet
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {journeys.map((journey) => {
        const nodeCount = nodes.filter((n) => n.journeyId === journey.id).length;
        const isSelected = selectedId === journey.id || activeInspectorId === journey.id;

        return (
          <button
            key={journey.id}
            onClick={() => onSelect(journey.id)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              isSelected
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    journey.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
                <span
                  className={`text-sm ${journey.status !== 'active' ? 'opacity-50' : ''}`}
                >
                  {journey.title}
                </span>
              </div>
              <span className="text-xs text-slate-400">{nodeCount}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

interface PersonaListProps {
  personas: Persona[];
  cards: Card[];
  selectedId: string | null;
  activeInspectorId: string | null;
  onSelect: (id: string) => void;
}

function PersonaList({ personas, cards, selectedId, activeInspectorId, onSelect }: PersonaListProps) {
  return (
    <div className="space-y-1">
      {personas.map((persona) => {
        const cardCount = cards.filter(
          (c) => c.personas.includes(persona.id) || c.personas.includes('all')
        ).length;
        const isSelected = selectedId === persona.id || activeInspectorId === persona.id;

        return (
          <button
            key={persona.id}
            onClick={() => onSelect(persona.id)}
            className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
              isSelected
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    persona.enabled ? 'bg-emerald-500' : 'bg-slate-400'
                  }`}
                />
                <span className={`text-sm ${!persona.enabled ? 'opacity-50' : ''}`}>
                  {persona.publicLabel}
                </span>
              </div>
              <span className="text-xs text-slate-400">{cardCount}</span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

interface NodeGridProps {
  nodes: JourneyNode[];
  journeys: Journey[];
  activeInspectorId: string | null;
  searchQuery: string;
  onSelect: (id: string) => void;
}

function NodeGrid({ nodes, journeys, activeInspectorId, searchQuery, onSelect }: NodeGridProps) {
  if (nodes.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
        {searchQuery ? 'No nodes match your search' : 'No nodes yet'}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-2">
      {nodes.map((node) => {
        const isSelected = activeInspectorId === node.id;
        const journey = journeys.find((j) => j.id === node.journeyId);

        return (
          <button
            key={node.id}
            onClick={() => onSelect(node.id)}
            className={`text-left p-3 rounded-lg border transition-all ${
              isSelected
                ? 'bg-primary/5 border-primary/50'
                : 'bg-white dark:bg-slate-800 border-border-light dark:border-border-dark hover:border-primary/30'
            }`}
          >
            <div className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate">
              {node.label}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate mt-1">
              {node.id}
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {node.sequenceOrder !== undefined && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded">
                  #{node.sequenceOrder}
                </span>
              )}
              {journey && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono bg-primary/10 text-primary rounded truncate max-w-[100px]">
                  {journey.title}
                </span>
              )}
              <span className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded">
                {node.primaryNext ? '\u2192' : '\u2205'}{' '}
                {(node.alternateNext?.length || 0) > 0 ? `+${node.alternateNext?.length}` : ''}
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

interface CardGridProps {
  cards: Card[];
  activeInspectorId: string | null;
  searchQuery: string;
  onSelect: (id: string) => void;
}

function CardGrid({ cards, activeInspectorId, searchQuery, onSelect }: CardGridProps) {
  if (cards.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500 dark:text-slate-400 text-sm">
        {searchQuery ? 'No cards match your search' : 'No cards yet'}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 max-h-[50vh] overflow-y-auto pr-2">
      {cards.map((card) => {
        const isSelected = activeInspectorId === card.id;

        return (
          <button
            key={card.id}
            onClick={() => onSelect(card.id)}
            className={`text-left p-3 rounded-lg border transition-all ${
              isSelected
                ? 'bg-primary/5 border-primary/50'
                : 'bg-white dark:bg-slate-800 border-border-light dark:border-border-dark hover:border-primary/30'
            }`}
          >
            <div className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate">
              {card.label}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate mt-1">
              {card.id}
            </div>
            <div className="flex flex-wrap gap-1 mt-2">
              {card.sectionId && (
                <span className="px-1.5 py-0.5 text-[10px] font-mono bg-primary/10 text-primary rounded">
                  {card.sectionId}
                </span>
              )}
              <span className="px-1.5 py-0.5 text-[10px] font-mono bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded">
                {card.next.length} next
              </span>
            </div>
          </button>
        );
      })}
    </div>
  );
}

export default NarrativeArchitect;
