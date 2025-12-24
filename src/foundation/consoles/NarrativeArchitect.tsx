// src/foundation/consoles/NarrativeArchitect.tsx
// Foundation-styled Narrative Engine admin for V2.1
// V2.1: Manages Journeys/Nodes with Inspector pattern

import { useState, useMemo } from 'react';
import { CollectionHeader, SegmentedControl, ObjectList, ObjectGrid, type ObjectCardBadge } from '../../shared';
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
          {/* View Toggle - using shared SegmentedControl */}
          <SegmentedControl
            options={
              isV21Schema
                ? [
                    { id: 'journeys' as ViewMode, label: 'Journeys', icon: 'map' },
                    { id: 'nodes' as ViewMode, label: 'Nodes', icon: 'hub' },
                  ]
                : [
                    { id: 'library' as ViewMode, label: 'Library', icon: 'grid_view' },
                    { id: 'persona' as ViewMode, label: 'Personas', icon: 'group' },
                  ]
            }
            value={viewMode}
            onChange={(mode) => {
              setViewMode(mode);
              if (mode === 'journeys') setSelectedJourneyId(null);
              if (mode === 'library') setSelectedPersonaId(null);
            }}
            fullWidth
          />

          {/* Navigation List - using shared ObjectList */}
          {isV21Schema ? (
            <DataPanel title="Journeys" icon="map">
              <ObjectList
                items={allJourneys}
                selectedId={selectedJourneyId}
                activeInspectorId={
                  inspector.mode.type === 'journey' ? inspector.mode.journeyId : null
                }
                onSelect={handleJourneyClick}
                getItemProps={(j) => ({
                  id: j.id,
                  label: j.title || j.id,
                  count: allNodes.filter((n) => n.journeyId === j.id).length,
                  status: j.status === 'active' ? 'active' : 'inactive',
                })}
                emptyMessage="No journeys yet"
              />
            </DataPanel>
          ) : (
            <DataPanel title="Personas" icon="group">
              <ObjectList
                items={personas}
                selectedId={selectedPersonaId}
                activeInspectorId={
                  inspector.mode.type === 'persona' ? inspector.mode.personaId : null
                }
                onSelect={handlePersonaClick}
                getItemProps={(p) => ({
                  id: p.id,
                  label: p.publicLabel,
                  count: allCards.filter(
                    (c) => c.personas.includes(p.id) || c.personas.includes('all')
                  ).length,
                  status: p.enabled ? 'active' : 'inactive',
                })}
                emptyMessage="No personas"
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

        {/* Right Column - Content Grid - using shared ObjectGrid */}
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
              <ObjectGrid
                items={filteredNodes}
                activeInspectorId={inspector.mode.type === 'node' ? inspector.mode.nodeId : null}
                searchQuery={searchQuery}
                onSelect={handleNodeClick}
                getCardProps={(node) => {
                  const journey = allJourneys.find((j) => j.id === node.journeyId);
                  const badges: ObjectCardBadge[] = [];
                  if (node.sequenceOrder !== undefined) {
                    badges.push({ label: `#${node.sequenceOrder}`, variant: 'success' });
                  }
                  if (journey) {
                    badges.push({ label: journey.title, variant: 'primary' });
                  }
                  badges.push({
                    label: `${node.primaryNext ? '\u2192' : '\u2205'}${(node.alternateNext?.length || 0) > 0 ? ` +${node.alternateNext?.length}` : ''}`,
                    variant: 'default',
                  });
                  return {
                    id: node.id,
                    title: node.label,
                    subtitle: node.id,
                    badges,
                  };
                }}
                emptyMessage="No nodes yet"
                emptySearchMessage="No nodes match your search"
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
              <ObjectGrid
                items={filteredCards}
                activeInspectorId={inspector.mode.type === 'card' ? inspector.mode.cardId : null}
                searchQuery={searchQuery}
                onSelect={handleCardClick}
                getCardProps={(card) => {
                  const badges: ObjectCardBadge[] = [];
                  if (card.sectionId) {
                    badges.push({ label: card.sectionId, variant: 'primary' });
                  }
                  badges.push({ label: `${card.next.length} next`, variant: 'default' });
                  return {
                    id: card.id,
                    title: card.label,
                    subtitle: card.id,
                    badges,
                  };
                }}
                emptyMessage="No cards yet"
                emptySearchMessage="No cards match your search"
              />
            </DataPanel>
          )}
        </div>
      </div>
    </div>
  );
};

// Kinetic Foundation v1: Sub-components replaced with shared ObjectList/ObjectGrid

export default NarrativeArchitect;
