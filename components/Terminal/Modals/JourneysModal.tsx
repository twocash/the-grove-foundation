// JourneysModal - Display available journeys and their progress
// Sprint v0.16: Command Palette feature

import React from 'react';
import { useNarrativeEngine } from '../../../hooks/useNarrativeEngine';
import { Journey } from '../../../data/narratives-schema';

interface JourneysModalProps {
  onClose: () => void;
  onStartJourney?: (journeyId: string) => void;
}

// Color mapping for journey cards
const getColorClasses = (color?: string) => {
  const colorMap: Record<string, { bg: string; border: string; text: string }> = {
    forest: { bg: 'bg-grove-forest/5', border: 'border-grove-forest/20', text: 'text-grove-forest' },
    moss: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700' },
    clay: { bg: 'bg-grove-clay/5', border: 'border-grove-clay/20', text: 'text-grove-clay' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
    slate: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700' }
  };
  return colorMap[color || 'forest'] || colorMap.forest;
};

// Icon mapping using SVG
const JourneyIcon: React.FC<{ name?: string; className?: string }> = ({ name, className = '' }) => {
  // Default icon if none specified
  if (!name || name === 'compass') {
    return (
      <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
      </svg>
    );
  }
  if (name === 'book') {
    return (
      <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
      </svg>
    );
  }
  if (name === 'lightbulb') {
    return (
      <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
        <path d="M9 18h6" />
        <path d="M10 22h4" />
      </svg>
    );
  }
  // Default
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" />
    </svg>
  );
};

const JourneysModal: React.FC<JourneysModalProps> = ({ onClose, onStartJourney }) => {
  const { schema, activeJourneyId, visitedNodes, startJourney } = useNarrativeEngine();

  // Get journeys from schema
  const journeys = schema?.journeys || {};
  const journeyList = Object.values(journeys).filter(
    (j: Journey) => j.status === 'active'
  );

  const handleStartJourney = (journeyId: string) => {
    if (onStartJourney) {
      onStartJourney(journeyId);
    } else {
      startJourney(journeyId);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/30 backdrop-blur-sm">
      <div className="bg-paper w-full max-w-lg mx-4 rounded shadow-lg overflow-hidden">
        <div className="flex flex-col h-full max-h-[80vh]">
          {/* Header */}
          <div className="px-4 py-6 border-b border-ink/5">
            <div className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-2">
              GUIDED JOURNEYS
            </div>
            <p className="font-serif text-sm text-ink-muted leading-relaxed">
              Choose a curated exploration path to discover key insights.
            </p>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-4 py-4">
            {journeyList.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-ink-muted text-sm font-serif">
                  No journeys available yet.
                </div>
                <p className="text-xs text-ink-muted/70 mt-2">
                  Journeys are curated exploration paths through the research.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {journeyList.map((journey: Journey) => {
                  const colors = getColorClasses(journey.color);
                  const isActive = activeJourneyId === journey.id;
                  const hasVisited = visitedNodes.some(nodeId =>
                    nodeId.startsWith(journey.id)
                  );

                  return (
                    <div
                      key={journey.id}
                      className={`p-4 rounded border transition-all ${colors.bg} ${colors.border} ${
                        isActive ? 'ring-2 ring-grove-forest' : ''
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded ${colors.bg}`}>
                          <JourneyIcon name={journey.icon} className={colors.text} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-serif font-medium text-ink text-sm">
                            {journey.title}
                          </h3>
                          <p className="text-xs text-ink-muted mt-1 line-clamp-2">
                            {journey.description}
                          </p>
                          <div className="flex items-center gap-3 mt-2">
                            <span className="text-[10px] font-mono text-ink-muted">
                              ~{journey.estimatedMinutes} min
                            </span>
                            {hasVisited && !isActive && (
                              <span className="text-[10px] font-mono text-grove-forest">
                                Previously visited
                              </span>
                            )}
                            {isActive && (
                              <span className="text-[10px] font-mono text-grove-clay">
                                Currently active
                              </span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => handleStartJourney(journey.id)}
                          className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                            isActive
                              ? 'bg-grove-forest/10 text-grove-forest'
                              : 'bg-ink/5 text-ink-muted hover:bg-grove-forest hover:text-paper'
                          }`}
                        >
                          {isActive ? 'Continue' : hasVisited ? 'Restart' : 'Begin'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 py-3 border-t border-ink/5 bg-paper/50">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-ink-muted">
                Journeys guide you through curated exploration paths
              </p>
              <button
                onClick={onClose}
                className="px-3 py-1.5 text-xs font-mono text-ink-muted hover:text-ink border border-ink/20 hover:border-ink/40 rounded transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JourneysModal;
