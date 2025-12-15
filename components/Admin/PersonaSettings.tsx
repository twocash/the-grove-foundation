// PersonaSettings - Column 3 component for editing persona configuration
import React from 'react';
import { Persona, Card, PersonaColor, NarrativeStyle, OpeningPhase, PERSONA_COLORS } from '../../data/narratives-schema';

interface PersonaSettingsProps {
  persona: Persona;
  allCards: Card[];
  onUpdate: (persona: Persona) => void;
}

const COLOR_OPTIONS: PersonaColor[] = ['emerald', 'amber', 'blue', 'rose', 'slate', 'violet'];
const STYLE_OPTIONS: { value: NarrativeStyle; label: string }[] = [
  { value: 'evidence-first', label: 'Evidence First' },
  { value: 'stakes-heavy', label: 'Stakes Heavy' },
  { value: 'mechanics-deep', label: 'Mechanics Deep' },
  { value: 'resolution-oriented', label: 'Resolution Oriented' },
];
const PHASE_OPTIONS: { value: OpeningPhase; label: string }[] = [
  { value: 'hook', label: 'Hook' },
  { value: 'stakes', label: 'Stakes' },
  { value: 'mechanics', label: 'Mechanics' },
];

const PersonaSettings: React.FC<PersonaSettingsProps> = ({
  persona,
  allCards,
  onUpdate
}) => {
  const handleFieldChange = (field: keyof Persona, value: unknown) => {
    onUpdate({ ...persona, [field]: value });
  };

  const handleArcChange = (phase: keyof typeof persona.arcEmphasis, value: number) => {
    onUpdate({
      ...persona,
      arcEmphasis: {
        ...persona.arcEmphasis,
        [phase]: value as 1 | 2 | 3 | 4
      }
    });
  };

  const toggleEntryPoint = (cardId: string) => {
    const current = persona.entryPoints || [];
    const newEntryPoints = current.includes(cardId)
      ? current.filter(id => id !== cardId)
      : [...current, cardId];
    handleFieldChange('entryPoints', newEntryPoints);
  };

  // Get cards that are visible to this persona
  const personaCards = allCards.filter(card =>
    card.personas.includes(persona.id) || card.personas.includes('all')
  );

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold text-gray-900">Persona Settings</h3>
          <p className="text-xs font-mono text-gray-500 mt-1">{persona.id}</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">Enabled</span>
          <button
            onClick={() => handleFieldChange('enabled', !persona.enabled)}
            className={`relative w-10 h-6 rounded-full transition-colors ${
              persona.enabled ? 'bg-green-600' : 'bg-gray-300'
            }`}
          >
            <span
              className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                persona.enabled ? 'left-5' : 'left-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Public Label */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
          Public Label
        </label>
        <input
          type="text"
          value={persona.publicLabel}
          onChange={(e) => handleFieldChange('publicLabel', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
          Description (One-liner)
        </label>
        <input
          type="text"
          value={persona.description}
          onChange={(e) => handleFieldChange('description', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
          placeholder="Shown in lens picker..."
        />
      </div>

      {/* Color */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
          Color
        </label>
        <div className="flex space-x-2">
          {COLOR_OPTIONS.map(color => {
            const colors = PERSONA_COLORS[color];
            const isSelected = persona.color === color;
            return (
              <button
                key={color}
                onClick={() => handleFieldChange('color', color)}
                className={`w-8 h-8 rounded-full ${colors.bg} transition-all ${
                  isSelected ? 'ring-2 ring-offset-2 ring-gray-900 scale-110' : 'hover:scale-105'
                }`}
                title={color}
              />
            );
          })}
        </div>
      </div>

      {/* Tone Guidance */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
          Tone Guidance
        </label>
        <textarea
          value={persona.toneGuidance}
          onChange={(e) => handleFieldChange('toneGuidance', e.target.value)}
          rows={6}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-green-500 focus:border-green-500"
          placeholder="Instructions injected into LLM prompt..."
        />
        <p className="text-xs text-gray-500 mt-1">
          This text is added to every prompt when this lens is active.
        </p>
      </div>

      {/* Narrative Style */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
          Narrative Style
        </label>
        <select
          value={persona.narrativeStyle}
          onChange={(e) => handleFieldChange('narrativeStyle', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
        >
          {STYLE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>

      {/* Arc Emphasis */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-3">
          Arc Emphasis (1-4)
        </label>
        <div className="space-y-3">
          {(['hook', 'stakes', 'mechanics', 'evidence', 'resolution'] as const).map(phase => (
            <div key={phase} className="flex items-center justify-between">
              <span className="text-sm text-gray-700 capitalize w-24">{phase}</span>
              <div className="flex space-x-1">
                {[1, 2, 3, 4].map(value => (
                  <button
                    key={value}
                    onClick={() => handleArcChange(phase, value)}
                    className={`w-8 h-8 rounded text-xs font-bold transition-colors ${
                      persona.arcEmphasis[phase] === value
                        ? 'bg-gray-900 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Opening Phase */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
          Opening Phase
        </label>
        <div className="flex space-x-2">
          {PHASE_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => handleFieldChange('openingPhase', opt.value)}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                persona.openingPhase === opt.value
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Thread Length */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
          Default Thread Length
        </label>
        <div className="flex items-center space-x-4">
          <input
            type="range"
            min={3}
            max={10}
            value={persona.defaultThreadLength}
            onChange={(e) => handleFieldChange('defaultThreadLength', parseInt(e.target.value))}
            className="flex-1"
          />
          <span className="text-lg font-bold text-gray-900 w-8 text-center">
            {persona.defaultThreadLength}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Number of cards in an auto-generated journey
        </p>
      </div>

      {/* Entry Points */}
      <div>
        <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
          Entry Points ({(persona.entryPoints || []).length} selected)
        </label>
        <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg">
          {personaCards.length === 0 ? (
            <div className="px-3 py-4 text-sm text-gray-500 text-center">
              No cards assigned to this persona yet
            </div>
          ) : (
            personaCards.map(card => {
              const isSelected = (persona.entryPoints || []).includes(card.id);
              return (
                <button
                  key={card.id}
                  onClick={() => toggleEntryPoint(card.id)}
                  className={`w-full text-left px-3 py-2 text-sm border-b border-gray-100 last:border-b-0 transition-colors ${
                    isSelected
                      ? 'bg-green-50 text-green-700'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="truncate">{card.label}</span>
                    {isSelected && (
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Icon Reference */}
      <div className="pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          Icon: {persona.icon} (Lucide React)
        </p>
      </div>
    </div>
  );
};

export default PersonaSettings;
