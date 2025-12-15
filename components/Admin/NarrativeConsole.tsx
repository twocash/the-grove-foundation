// NarrativeConsole - Admin interface for Narrative Engine v2
// Three-column layout: Navigation | Card Grid | Editor
import React, { useState, useEffect, useMemo } from 'react';
import {
  NarrativeSchemaV2,
  Card,
  Persona,
  GlobalSettings,
  DEFAULT_GLOBAL_SETTINGS,
  isV1Schema,
  isV2Schema,
  nodeToCard,
  PERSONA_COLORS
} from '../../data/narratives-schema';
import { DEFAULT_PERSONAS } from '../../data/default-personas';
import CardEditor from './CardEditor';
import PersonaSettings from './PersonaSettings';
import GlobalSettingsModal from './GlobalSettingsModal';

type ViewMode = 'library' | 'persona';
type EditorMode = 'card' | 'persona' | 'none';

const NarrativeConsole: React.FC = () => {
  const [schema, setSchema] = useState<NarrativeSchemaV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');

  // Navigation state
  const [viewMode, setViewMode] = useState<ViewMode>('library');
  const [selectedPersonaId, setSelectedPersonaId] = useState<string | null>(null);
  const [showGlobalSettings, setShowGlobalSettings] = useState(false);

  // Editor state
  const [editorMode, setEditorMode] = useState<EditorMode>('none');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(null);

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
        finalSchema = data;
      } else if (isV1Schema(data)) {
        // Migrate v1 to v2
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
        // Empty - create default
        finalSchema = {
          version: "2.0",
          globalSettings: DEFAULT_GLOBAL_SETTINGS,
          personas: DEFAULT_PERSONAS,
          cards: {}
        };
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
        setStatus('Saved to Production');
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

    // Also remove from all personas' entryPoints and suggestedThreads
    const updatedPersonas: Record<string, Persona> = { ...schema.personas };
    for (const [id, persona] of Object.entries(updatedPersonas) as [string, Persona][]) {
      updatedPersonas[id] = {
        ...persona,
        entryPoints: persona.entryPoints.filter(ep => ep !== cardId),
        suggestedThread: persona.suggestedThread.filter(st => st !== cardId)
      };
    }

    // Remove from other cards' next arrays
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
    setEditorMode('none');
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
    setEditorMode('card');
  };

  // Persona operations
  const updatePersona = (persona: Persona) => {
    if (!schema) return;
    setSchema({
      ...schema,
      personas: { ...schema.personas, [persona.id]: persona }
    });
  };

  const updateGlobalSettings = (settings: GlobalSettings) => {
    if (!schema) return;
    setSchema({
      ...schema,
      globalSettings: settings
    });
  };

  // Filtered cards
  const filteredCards = useMemo(() => {
    if (!schema) return [];
    let cards = Object.values(schema.cards) as Card[];

    // Filter by persona if selected
    if (viewMode === 'persona' && selectedPersonaId) {
      cards = cards.filter(card =>
        card.personas.includes(selectedPersonaId) || card.personas.includes('all')
      );
    }

    // Filter by search
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

  // Get selected objects
  const selectedCard = selectedCardId && schema ? schema.cards[selectedCardId] : null;
  const selectedPersona = selectedPersonaId && schema ? schema.personas[selectedPersonaId] : null;
  const personas = schema ? (Object.values(schema.personas) as Persona[]) : [];
  const allCards = schema ? (Object.values(schema.cards) as Card[]) : [];

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading Narrative Engine...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Top Bar */}
      <div className="h-14 px-4 border-b border-gray-200 bg-white flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-gray-900">Narrative Engine v2</h1>
          <p className="text-xs text-gray-500">
            {Object.keys(schema?.cards || {}).length} cards • {Object.keys(schema?.personas || {}).length} personas
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {status && (
            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
              status.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {status}
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save to Production'}
          </button>
        </div>
      </div>

      {/* Main Content - Three Columns */}
      <div className="flex-1 flex overflow-hidden">
        {/* Column 1: Navigation (220px) */}
        <div className="w-56 border-r border-gray-200 bg-white flex flex-col">
          {/* View Toggle */}
          <div className="p-3 border-b border-gray-100">
            <div className="flex bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => { setViewMode('library'); setSelectedPersonaId(null); }}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  viewMode === 'library' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                }`}
              >
                Library
              </button>
              <button
                onClick={() => setViewMode('persona')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                  viewMode === 'persona' ? 'bg-white shadow text-gray-900' : 'text-gray-500'
                }`}
              >
                Personas
              </button>
            </div>
          </div>

          {/* Personas List */}
          <div className="flex-1 overflow-y-auto p-2">
            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">
              Personas
            </div>
            {personas.map(persona => {
              const colors = PERSONA_COLORS[persona.color];
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
                  className={`w-full text-left px-3 py-2 rounded-lg mb-1 transition-colors ${
                    isSelected ? 'bg-gray-100' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className={`w-2.5 h-2.5 rounded-full ${colors.dot} ${!persona.enabled ? 'opacity-30' : ''}`} />
                      <span className={`text-sm font-medium ${!persona.enabled ? 'text-gray-400' : 'text-gray-900'}`}>
                        {persona.publicLabel}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400">{cardCount}</span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Bottom Actions */}
          <div className="p-3 border-t border-gray-100 space-y-2">
            <button
              onClick={createCard}
              className="w-full py-2 text-sm font-semibold text-white bg-gray-900 rounded-lg hover:bg-gray-800 transition-colors"
            >
              + New Card
            </button>
            <button
              onClick={() => setShowGlobalSettings(true)}
              className="w-full py-2 text-sm font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Global Settings
            </button>
          </div>
        </div>

        {/* Column 2: Card Grid (320px) */}
        <div className="w-80 border-r border-gray-200 bg-gray-50 flex flex-col">
          {/* Header */}
          <div className="p-3 border-b border-gray-200 bg-white">
            {viewMode === 'persona' && selectedPersona ? (
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span className={`w-3 h-3 rounded-full ${PERSONA_COLORS[selectedPersona.color].dot}`} />
                  <span className="font-semibold text-gray-900">{selectedPersona.publicLabel}</span>
                </div>
                <button
                  onClick={() => {
                    setEditorMode('persona');
                    setSelectedCardId(null);
                  }}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  Edit Persona
                </button>
              </div>
            ) : (
              <div className="font-semibold text-gray-900 mb-2">All Cards</div>
            )}

            {/* Search */}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cards..."
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            />
          </div>

          {/* Cards List */}
          <div className="flex-1 overflow-y-auto p-2">
            {filteredCards.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                {searchQuery ? 'No cards match your search' : 'No cards yet'}
              </div>
            ) : (
              filteredCards.map(card => {
                const isSelected = selectedCardId === card.id;
                return (
                  <button
                    key={card.id}
                    onClick={() => {
                      setSelectedCardId(card.id);
                      setEditorMode('card');
                    }}
                    className={`w-full text-left p-3 rounded-lg mb-2 transition-all ${
                      isSelected
                        ? 'bg-white shadow-md ring-2 ring-green-500'
                        : 'bg-white hover:shadow-sm'
                    }`}
                  >
                    <div className="font-medium text-gray-900 text-sm truncate">
                      {card.label}
                    </div>
                    <div className="text-xs text-gray-500 font-mono truncate mt-1">
                      {card.id}
                    </div>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {card.sectionId && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-600 rounded">
                          {card.sectionId}
                        </span>
                      )}
                      {!card.personas.includes('all') && card.personas.slice(0, 2).map(pId => {
                        const p = schema?.personas[pId];
                        if (!p) return null;
                        return (
                          <span
                            key={pId}
                            className={`px-2 py-0.5 text-[10px] font-semibold rounded ${PERSONA_COLORS[p.color].bgLight} ${PERSONA_COLORS[p.color].text}`}
                          >
                            {p.publicLabel.split(' ')[0]}
                          </span>
                        );
                      })}
                      {!card.personas.includes('all') && card.personas.length > 2 && (
                        <span className="px-2 py-0.5 text-[10px] font-semibold bg-gray-100 text-gray-500 rounded">
                          +{card.personas.length - 2}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Column 3: Editor (flexible) */}
        <div className="flex-1 bg-white">
          {editorMode === 'card' && selectedCard ? (
            <CardEditor
              card={selectedCard}
              allCards={allCards}
              personas={personas}
              onUpdate={updateCard}
              onDelete={() => deleteCard(selectedCard.id)}
            />
          ) : editorMode === 'persona' && selectedPersona ? (
            <PersonaSettings
              persona={selectedPersona}
              allCards={allCards}
              onUpdate={updatePersona}
            />
          ) : (
            <div className="h-full flex items-center justify-center text-gray-400">
              <div className="text-center">
                <div className="text-4xl mb-2">📝</div>
                <div className="text-sm">Select a card or persona to edit</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global Settings Modal */}
      {showGlobalSettings && schema && (
        <GlobalSettingsModal
          settings={schema.globalSettings}
          onUpdate={updateGlobalSettings}
          onClose={() => setShowGlobalSettings(false)}
        />
      )}
    </div>
  );
};

export default NarrativeConsole;
