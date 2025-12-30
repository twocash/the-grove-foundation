// src/surface/components/KineticStream/Capture/components/ResearchManifestCard.tsx
// Research manifest capture card for building structured research briefs
// Sprint: sprout-declarative-v1

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SPROUT_CAPTURE_CONFIG } from '../config/sprout-capture.config';
import { SelectionState } from '../hooks/useTextSelection';
import { useResearchPurposes, ResearchPurpose, ClueTypeConfig } from '../hooks/useResearchPurposes';
import type { ResearchClue, ClueType, ResearchManifest, ResearchPurpose as ResearchPurposeType, Sprout, SproutStage } from '@core/schema/sprout';
import { generateResearchPrompt } from '@/src/lib/prompt-generator';
import { PromptPreviewModal } from './PromptPreviewModal';

interface ResearchManifestCardProps {
  selection: SelectionState;
  lensName?: string;
  journeyName?: string;
  onCapture: (manifest: ResearchManifest, tags: string[], stage?: SproutStage) => void;
  onCancel: () => void;
  layoutId: string;
}

/**
 * ResearchManifestCard - A capture card for building structured research briefs
 *
 * Features:
 * - Purpose selector (radio buttons)
 * - Clues list with add/remove
 * - Directions list with add/remove
 * - Tags input
 * - Save Draft / Generate Prompt buttons
 */
export const ResearchManifestCard: React.FC<ResearchManifestCardProps> = ({
  selection,
  lensName,
  journeyName,
  onCapture,
  onCancel,
  layoutId,
}) => {
  const { maxPreviewLength, maxTags } = SPROUT_CAPTURE_CONFIG.ui.card;
  const { cardExpand } = SPROUT_CAPTURE_CONFIG.animation;
  const { purposes, clueTypes, getDefaultPurpose } = useResearchPurposes();

  // Form state
  const [selectedPurpose, setSelectedPurpose] = useState<string>(getDefaultPurpose().id);
  const [clues, setClues] = useState<ResearchClue[]>([]);
  const [directions, setDirections] = useState<string[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  // Prompt generation state
  const [showPromptModal, setShowPromptModal] = useState(false);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);

  // Clue input state
  const [newClueType, setNewClueType] = useState<ClueType>('url');
  const [newClueValue, setNewClueValue] = useState('');
  const [newClueNote, setNewClueNote] = useState('');
  const [showClueForm, setShowClueForm] = useState(false);

  // Direction input state
  const [newDirection, setNewDirection] = useState('');

  const purposeRef = useRef<HTMLDivElement>(null);

  // Handle ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  // Add clue handler
  const handleAddClue = useCallback(() => {
    if (!newClueValue.trim()) return;
    setClues(prev => [...prev, {
      type: newClueType,
      value: newClueValue.trim(),
      note: newClueNote.trim() || undefined,
    }]);
    setNewClueValue('');
    setNewClueNote('');
    setShowClueForm(false);
  }, [newClueType, newClueValue, newClueNote]);

  // Remove clue handler
  const handleRemoveClue = useCallback((index: number) => {
    setClues(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Add direction handler
  const handleAddDirection = useCallback(() => {
    if (!newDirection.trim()) return;
    setDirections(prev => [...prev, newDirection.trim()]);
    setNewDirection('');
  }, [newDirection]);

  // Remove direction handler
  const handleRemoveDirection = useCallback((index: number) => {
    setDirections(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Tag input handler
  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().replace(',', '');
      if (newTag && tags.length < maxTags && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
        setTagInput('');
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  // Submit handler (Save Draft - stage: 'rooting')
  const handleSubmit = useCallback(() => {
    const manifest: ResearchManifest = {
      purpose: selectedPurpose as ResearchPurposeType,
      clues,
      directions,
    };
    onCapture(manifest, tags, 'rooting');
  }, [selectedPurpose, clues, directions, tags, onCapture]);

  // Generate prompt handler
  const handleGeneratePrompt = useCallback(() => {
    // Build temporary sprout object for prompt generation
    const tempSprout: Partial<Sprout> = {
      id: 'temp-prompt-gen',
      capturedAt: new Date().toISOString(),
      response: selection.text,
      query: '',
      researchManifest: {
        purpose: selectedPurpose as ResearchPurposeType,
        clues,
        directions,
      },
      provenance: lensName || journeyName ? {
        lens: lensName ? { id: 'current', name: lensName } : null,
        hub: null,
        journey: journeyName ? { id: 'current', name: journeyName } : null,
        node: null,
        knowledgeFiles: [],
        generatedAt: new Date().toISOString(),
      } : undefined,
    };

    try {
      const prompt = generateResearchPrompt(tempSprout as Sprout);
      setGeneratedPrompt(prompt);
      setShowPromptModal(true);
    } catch (err) {
      console.error('Failed to generate prompt:', err);
    }
  }, [selection.text, selectedPurpose, clues, directions, lensName, journeyName]);

  // Confirm prompt generation - advances stage to 'branching'
  const handlePromptConfirm = useCallback(() => {
    const manifest: ResearchManifest = {
      purpose: selectedPurpose as ResearchPurposeType,
      clues,
      directions,
      promptGenerated: {
        templateId: 'research-prompt-template-v1',
        generatedAt: new Date().toISOString(),
        rawPrompt: generatedPrompt || '',
      },
    };
    setShowPromptModal(false);
    onCapture(manifest, tags, 'branching');
  }, [selectedPurpose, clues, directions, generatedPrompt, tags, onCapture]);

  // Check if generate prompt button should be enabled
  const canGeneratePrompt = selectedPurpose && (clues.length > 0 || directions.length > 0);

  const preview = selection.text.slice(0, maxPreviewLength) +
    (selection.text.length > maxPreviewLength ? '...' : '');

  // Position card near selection but within viewport
  const cardWidth = 400;
  const cardX = Math.min(selection.rect.right + 10, window.innerWidth - cardWidth - 16);
  const cardY = Math.min(Math.max(selection.rect.top, 16), window.innerHeight - 600);

  const selectedPurposeData = purposes.find(p => p.id === selectedPurpose);

  return (
    <motion.div
      layoutId={layoutId}
      data-capture-ui="card"
      className="fixed z-50 rounded-xl overflow-hidden
                 bg-[var(--glass-solid)] border border-[var(--glass-border)]
                 backdrop-blur-xl shadow-2xl"
      style={{
        left: cardX,
        top: cardY,
        width: cardWidth,
        maxHeight: 'calc(100vh - 32px)',
      }}
      onMouseDown={(e) => e.preventDefault()}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: cardExpand.duration }}
    >
      {/* Scrollable container */}
      <div className="max-h-[calc(100vh-64px)] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b border-[var(--glass-border)] bg-[var(--glass-solid)]">
          <span className="text-sm font-medium text-[var(--glass-text-primary)]">
            🔬 Research Directive
          </span>
          <button
            onClick={onCancel}
            className="p-1 rounded-lg hover:bg-white/10 text-[var(--glass-text-muted)] hover:text-[var(--glass-text-primary)]"
            aria-label="Cancel capture"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Seed Preview */}
        <div className="px-4 py-3 border-b border-[var(--glass-border)]">
          <div className="text-[10px] uppercase tracking-wide text-[var(--glass-text-muted)] mb-1">
            Seed Insight
          </div>
          <p className="text-sm text-[var(--glass-text-body)] italic leading-relaxed line-clamp-3">
            "{preview}"
          </p>
        </div>

        {/* Context badges */}
        {(lensName || journeyName) && (
          <div className="px-4 py-2 border-b border-[var(--glass-border)] flex flex-wrap gap-2">
            {lensName && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full
                              bg-[var(--neon-cyan)]/20 text-xs text-[var(--neon-cyan)]">
                <span aria-hidden="true">👁</span> {lensName}
              </span>
            )}
            {journeyName && (
              <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full
                              bg-[var(--neon-violet)]/20 text-xs text-[var(--neon-violet)]">
                <span aria-hidden="true">🗺</span> {journeyName}
              </span>
            )}
          </div>
        )}

        {/* Purpose Selector */}
        <div ref={purposeRef} className="px-4 py-3 border-b border-[var(--glass-border)]">
          <div className="text-[10px] uppercase tracking-wide text-[var(--glass-text-muted)] mb-2">
            Research Purpose
          </div>
          <div className="space-y-2">
            {purposes.map(purpose => (
              <label
                key={purpose.id}
                className={`flex items-start gap-3 p-2 rounded-lg cursor-pointer transition-colors
                           ${selectedPurpose === purpose.id
                             ? 'bg-[var(--neon-cyan)]/10 ring-1 ring-[var(--neon-cyan)]'
                             : 'hover:bg-white/5'}`}
              >
                <input
                  type="radio"
                  name="purpose"
                  value={purpose.id}
                  checked={selectedPurpose === purpose.id}
                  onChange={(e) => setSelectedPurpose(e.target.value)}
                  className="sr-only"
                />
                <span className="text-lg flex-shrink-0">{purpose.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--glass-text-primary)]">
                    {purpose.label}
                  </div>
                  <div className="text-xs text-[var(--glass-text-muted)] line-clamp-1">
                    {purpose.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        </div>

        {/* Clues Section */}
        <div className="px-4 py-3 border-b border-[var(--glass-border)]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] uppercase tracking-wide text-[var(--glass-text-muted)]">
              Research Clues ({clues.length})
            </span>
            <button
              onClick={() => setShowClueForm(true)}
              className="text-xs text-[var(--neon-cyan)] hover:underline"
            >
              + Add Clue
            </button>
          </div>

          {/* Existing clues */}
          <div className="space-y-2 mb-2">
            {clues.map((clue, index) => (
              <div
                key={index}
                className="flex items-start gap-2 p-2 rounded-lg bg-white/5"
              >
                <span className="text-sm flex-shrink-0">
                  {clueTypes.find(c => c.id === clue.type)?.icon || '📎'}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[var(--glass-text-primary)] break-words">
                    {clue.value}
                  </div>
                  {clue.note && (
                    <div className="text-xs text-[var(--glass-text-muted)] italic">
                      {clue.note}
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveClue(index)}
                  className="flex-shrink-0 p-1 hover:text-red-400 text-[var(--glass-text-subtle)]"
                  aria-label="Remove clue"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Add clue form */}
          <AnimatePresence>
            {showClueForm && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 p-2 rounded-lg bg-white/5"
              >
                <select
                  value={newClueType}
                  onChange={(e) => setNewClueType(e.target.value as ClueType)}
                  className="w-full bg-transparent text-sm text-[var(--glass-text-primary)]
                            border border-[var(--glass-border)] rounded-lg px-3 py-2
                            focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]"
                >
                  {clueTypes.map(type => (
                    <option key={type.id} value={type.id} className="bg-[var(--glass-solid)]">
                      {type.icon} {type.label}
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newClueValue}
                  onChange={(e) => setNewClueValue(e.target.value)}
                  placeholder={clueTypes.find(c => c.id === newClueType)?.placeholder || 'Enter clue...'}
                  className="w-full bg-transparent text-sm text-[var(--glass-text-primary)]
                            placeholder-[var(--glass-text-subtle)]
                            border border-[var(--glass-border)] rounded-lg px-3 py-2
                            focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]"
                />
                <input
                  type="text"
                  value={newClueNote}
                  onChange={(e) => setNewClueNote(e.target.value)}
                  placeholder="Note (optional)"
                  className="w-full bg-transparent text-sm text-[var(--glass-text-primary)]
                            placeholder-[var(--glass-text-subtle)]
                            border border-[var(--glass-border)] rounded-lg px-3 py-2
                            focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]"
                  onKeyDown={(e) => e.key === 'Enter' && handleAddClue()}
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddClue}
                    disabled={!newClueValue.trim()}
                    className="flex-1 py-1.5 rounded-lg text-xs font-medium
                              bg-[var(--neon-cyan)] text-white
                              disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Add Clue
                  </button>
                  <button
                    onClick={() => setShowClueForm(false)}
                    className="py-1.5 px-3 rounded-lg text-xs
                              text-[var(--glass-text-muted)] hover:bg-white/5"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Directions Section */}
        <div className="px-4 py-3 border-b border-[var(--glass-border)]">
          <div className="text-[10px] uppercase tracking-wide text-[var(--glass-text-muted)] mb-2">
            Research Directions ({directions.length})
          </div>

          {/* Existing directions */}
          <div className="space-y-1 mb-2">
            {directions.map((direction, index) => (
              <div
                key={index}
                className="flex items-center gap-2 p-2 rounded-lg bg-white/5"
              >
                <span className="text-xs text-[var(--glass-text-muted)]">{index + 1}.</span>
                <span className="flex-1 text-sm text-[var(--glass-text-primary)]">{direction}</span>
                <button
                  onClick={() => handleRemoveDirection(index)}
                  className="flex-shrink-0 p-1 hover:text-red-400 text-[var(--glass-text-subtle)]"
                  aria-label="Remove direction"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* Add direction input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newDirection}
              onChange={(e) => setNewDirection(e.target.value)}
              placeholder="Add a research direction..."
              className="flex-1 bg-transparent text-sm text-[var(--glass-text-primary)]
                        placeholder-[var(--glass-text-subtle)]
                        border border-[var(--glass-border)] rounded-lg px-3 py-2
                        focus:outline-none focus:ring-1 focus:ring-[var(--neon-cyan)]"
              onKeyDown={(e) => e.key === 'Enter' && handleAddDirection()}
            />
            <button
              onClick={handleAddDirection}
              disabled={!newDirection.trim()}
              className="px-3 py-2 rounded-lg text-xs font-medium
                        bg-white/10 text-[var(--glass-text-primary)]
                        disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add
            </button>
          </div>
        </div>

        {/* Tags Section */}
        <div className="px-4 py-3 border-b border-[var(--glass-border)]">
          <div className="text-[10px] uppercase tracking-wide text-[var(--glass-text-muted)] mb-2">
            Tags
          </div>
          <div className="flex flex-wrap gap-2 mb-2 min-h-[24px]">
            {tags.map(tag => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full
                          bg-[var(--neon-green)]/20 text-[var(--neon-green)] text-xs"
              >
                {tag}
                <button
                  onClick={() => removeTag(tag)}
                  className="hover:text-white ml-0.5"
                  aria-label={`Remove tag ${tag}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleTagInput}
            placeholder="Add tags (comma or enter)"
            className="w-full bg-transparent text-sm text-[var(--glass-text-primary)]
                      placeholder-[var(--glass-text-subtle)] focus:outline-none"
          />
        </div>

        {/* Submit */}
        <div className="sticky bottom-0 px-4 py-3 bg-[var(--glass-solid)] border-t border-[var(--glass-border)]">
          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              className="flex-1 py-2.5 rounded-lg bg-white/10 hover:bg-white/20
                        text-[var(--glass-text-primary)] font-medium text-sm transition-colors"
            >
              Save Draft
            </button>
            <button
              onClick={handleGeneratePrompt}
              disabled={!canGeneratePrompt}
              className="flex-1 py-2.5 rounded-lg bg-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/80
                        text-white font-medium text-sm transition-colors
                        shadow-[0_0_12px_rgba(0,255,255,0.3)]
                        disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Generate Prompt
            </button>
          </div>
          <p className="mt-2 text-[10px] text-center text-[var(--glass-text-subtle)]">
            {canGeneratePrompt
              ? `Ready to generate "${selectedPurposeData?.label}" prompt`
              : 'Add clues or directions to generate prompt'}
          </p>
        </div>
      </div>

      {/* Prompt Preview Modal */}
      <AnimatePresence>
        {showPromptModal && generatedPrompt && (
          <PromptPreviewModal
            prompt={generatedPrompt}
            onClose={() => setShowPromptModal(false)}
            onConfirm={handlePromptConfirm}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ResearchManifestCard;
