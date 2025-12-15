// CardEditor - Column 3 component for editing individual cards
import React from 'react';
import { Card, Persona, PERSONA_COLORS } from '../../data/narratives-schema';
import { SectionId } from '../../types';

interface CardEditorProps {
  card: Card;
  allCards: Card[];
  personas: Persona[];
  onUpdate: (card: Card) => void;
  onDelete: () => void;
}

const SECTION_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'No Section' },
  { value: SectionId.STAKES, label: 'Stakes' },
  { value: SectionId.RATCHET, label: 'Ratchet' },
  { value: SectionId.WHAT_IS_GROVE, label: 'What Is Grove' },
  { value: SectionId.ARCHITECTURE, label: 'Architecture' },
  { value: SectionId.ECONOMICS, label: 'Economics' },
  { value: SectionId.DIFFERENTIATION, label: 'Differentiation' },
  { value: SectionId.NETWORK, label: 'Network' },
  { value: SectionId.GET_INVOLVED, label: 'Get Involved' },
];

const CardEditor: React.FC<CardEditorProps> = ({
  card,
  allCards,
  personas,
  onUpdate,
  onDelete
}) => {
  const handleFieldChange = (field: keyof Card, value: unknown) => {
    onUpdate({ ...card, [field]: value });
  };

  const togglePersona = (personaId: string) => {
    const currentPersonas = card.personas || [];
    const newPersonas = currentPersonas.includes(personaId)
      ? currentPersonas.filter(p => p !== personaId)
      : [...currentPersonas, personaId];

    // If removing all personas, default to 'all'
    if (newPersonas.length === 0) {
      handleFieldChange('personas', ['all']);
    } else {
      // Remove 'all' if adding specific personas
      handleFieldChange('personas', newPersonas.filter(p => p !== 'all'));
    }
  };

  const toggleAllPersonas = () => {
    if (card.personas.includes('all')) {
      // Switch to specific personas - start with all enabled
      handleFieldChange('personas', personas.map(p => p.id));
    } else {
      // Switch back to 'all'
      handleFieldChange('personas', ['all']);
    }
  };

  const toggleNextCard = (cardId: string) => {
    const currentNext = card.next || [];
    const newNext = currentNext.includes(cardId)
      ? currentNext.filter(id => id !== cardId)
      : [...currentNext, cardId];
    handleFieldChange('next', newNext);
  };

  const isAllPersonas = card.personas.includes('all');

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Edit Card</h3>
          <p className="text-xs font-mono text-gray-500 mt-1">{card.id}</p>
        </div>
        <button
          onClick={onDelete}
          className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded transition-colors"
        >
          Delete
        </button>
      </div>

      {/* Label */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
          Label (Button Text)
        </label>
        <input
          type="text"
          value={card.label}
          onChange={(e) => handleFieldChange('label', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
          placeholder="What the user sees..."
        />
      </div>

      {/* Query */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
          Query (LLM Prompt)
        </label>
        <textarea
          value={card.query}
          onChange={(e) => handleFieldChange('query', e.target.value)}
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-green-500 focus:border-green-500"
          placeholder="The instruction sent to the AI..."
        />
      </div>

      {/* Context Snippet */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
          Context Snippet (RAG Override)
        </label>
        <textarea
          value={card.contextSnippet || ''}
          onChange={(e) => handleFieldChange('contextSnippet', e.target.value || undefined)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
          placeholder="Optional verbatim quote to inject as context..."
        />
        <p className="text-xs text-gray-500 mt-1">
          Leave empty to use dynamic RAG. Filled = verbatim injection.
        </p>
      </div>

      {/* Section */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
          Section
        </label>
        <select
          value={card.sectionId || ''}
          onChange={(e) => handleFieldChange('sectionId', e.target.value || undefined)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
          {SECTION_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Is Entry Point */}
      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="isEntry"
          checked={card.isEntry || false}
          onChange={(e) => handleFieldChange('isEntry', e.target.checked || undefined)}
          className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
        />
        <label htmlFor="isEntry" className="text-sm text-gray-700">
          Entry point (shows as starter prompt)
        </label>
      </div>

      {/* Personas */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
            Visible to Personas
          </label>
          <button
            onClick={toggleAllPersonas}
            className={`px-2 py-1 text-xs font-semibold rounded transition-colors ${
              isAllPersonas
                ? 'bg-gray-900 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {isAllPersonas ? 'All Personas' : 'Specific'}
          </button>
        </div>

        {!isAllPersonas && (
          <div className="flex flex-wrap gap-2 mt-2">
            {personas.map(persona => {
              const isSelected = card.personas.includes(persona.id);
              const colors = PERSONA_COLORS[persona.color];
              return (
                <button
                  key={persona.id}
                  onClick={() => togglePersona(persona.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full transition-all ${
                    isSelected
                      ? `${colors.bg} text-white`
                      : `${colors.bgLight} ${colors.text} hover:opacity-80`
                  }`}
                >
                  {persona.publicLabel}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Next Cards */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
          Next Cards (Journey Flow)
        </label>
        <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg">
          {allCards
            .filter(c => c.id !== card.id)
            .map(c => {
              const isSelected = (card.next || []).includes(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggleNextCard(c.id)}
                  className={`w-full text-left px-3 py-2 text-sm border-b border-gray-100 last:border-b-0 transition-colors ${
                    isSelected
                      ? 'bg-green-50 text-green-700'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{c.label}</span>
                    {isSelected && (
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                  <span className="text-xs text-gray-500 font-mono">{c.id}</span>
                </button>
              );
            })}
        </div>
        {(card.next || []).length > 0 && (
          <p className="text-xs text-gray-500 mt-2">
            {card.next.length} card{card.next.length !== 1 ? 's' : ''} selected
          </p>
        )}
      </div>

      {/* Metadata */}
      {card.createdAt && (
        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Created: {new Date(card.createdAt).toLocaleDateString()}
          </p>
          {card.sourceDoc && (
            <p className="text-xs text-gray-500 mt-1">
              Source: {card.sourceDoc}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default CardEditor;
