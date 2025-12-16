// JourneyEnd - Shows options when user completes a narrative thread
// Offers: same lens/new topic, same topic/new lens, or change everything

import React from 'react';
import { Persona, Card, getPersonaColors } from '../../data/narratives-schema';

interface JourneyEndProps {
  currentLens: Persona | null;
  visitedCards: string[];
  suggestedTopics: Card[];       // AI-suggested entry points for current lens
  suggestedLenses: Persona[];    // Personas that overlap with visited content
  onSelectTopic: (card: Card) => void;
  onSelectLens: (personaId: string) => void;
  onChangeEverything: () => void;
}

const JourneyEnd: React.FC<JourneyEndProps> = ({
  currentLens,
  visitedCards,
  suggestedTopics,
  suggestedLenses,
  onSelectTopic,
  onSelectLens,
  onChangeEverything
}) => {
  return (
    <div className="bg-paper/50 border border-ink/10 rounded-lg p-4 space-y-4">
      <div className="text-[10px] font-mono uppercase tracking-widest text-grove-clay">
        What's Next?
      </div>

      {/* Same Lens, New Topic */}
      {currentLens && suggestedTopics.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">🔁</span>
            <span className="text-xs font-semibold text-ink">Same Lens, New Topic</span>
          </div>
          <div className="flex flex-wrap gap-2 pl-7">
            {suggestedTopics.slice(0, 2).map(card => (
              <button
                key={card.id}
                onClick={() => onSelectTopic(card)}
                className="px-3 py-2 bg-white border border-ink/10 rounded-sm text-xs font-serif text-ink hover:border-grove-forest/30 hover:text-grove-forest hover:shadow-sm transition-all"
              >
                {card.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Same Topic, New Lens */}
      {suggestedLenses.length > 0 && (
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="text-lg">🔄</span>
            <span className="text-xs font-semibold text-ink">Same Topic, New Lens</span>
          </div>
          <div className="flex flex-wrap gap-2 pl-7">
            {suggestedLenses.slice(0, 3).map(persona => {
              const colors = getPersonaColors(persona.color);
              return (
                <button
                  key={persona.id}
                  onClick={() => onSelectLens(persona.id)}
                  className={`px-3 py-2 ${colors.bgLight} border ${colors.border} rounded-sm text-xs font-sans ${colors.text} hover:shadow-sm transition-all`}
                >
                  See through {persona.publicLabel}'s lens
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Change Everything */}
      <div>
        <div className="flex items-center space-x-2 mb-2">
          <span className="text-lg">⚙️</span>
          <span className="text-xs font-semibold text-ink">Change Everything</span>
        </div>
        <div className="pl-7">
          <button
            onClick={onChangeEverything}
            className="px-3 py-2 bg-ink/5 border border-ink/10 rounded-sm text-xs font-sans text-ink-muted hover:bg-ink/10 hover:text-ink transition-all"
          >
            Switch to a different lens entirely
          </button>
        </div>
      </div>

      {/* Journey Stats */}
      {visitedCards.length > 0 && (
        <div className="pt-3 border-t border-ink/5">
          <div className="text-[9px] font-mono text-ink-muted">
            Journey: {visitedCards.length} card{visitedCards.length !== 1 ? 's' : ''} explored
            {currentLens && ` • ${currentLens.publicLabel} lens`}
          </div>
        </div>
      )}
    </div>
  );
};

export default JourneyEnd;
