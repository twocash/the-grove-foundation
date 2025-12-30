// src/surface/components/KineticStream/Capture/components/SproutCaptureCard.tsx
// Capture card for entering tags and confirming sprout creation
// Sprint: kinetic-cultivation-v1

import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { SPROUT_CAPTURE_CONFIG } from '../config/sprout-capture.config';
import { SelectionState } from '../hooks/useTextSelection';

interface SproutCaptureCardProps {
  selection: SelectionState;
  lensName?: string;
  journeyName?: string;
  onCapture: (tags: string[]) => void;
  onCancel: () => void;
  layoutId: string;
}

export const SproutCaptureCard: React.FC<SproutCaptureCardProps> = ({
  selection,
  lensName,
  journeyName,
  onCapture,
  onCancel,
  layoutId,
}) => {
  const { maxPreviewLength, maxTags } = SPROUT_CAPTURE_CONFIG.ui.card;
  const { cardExpand } = SPROUT_CAPTURE_CONFIG.animation;
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

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

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().replace(',', '');
      if (newTag && tags.length < maxTags && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
        setTagInput('');
      } else if (!newTag && e.key === 'Enter') {
        // Empty input + Enter = submit
        handleSubmit();
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = () => {
    onCapture(tags);
  };

  const preview = selection.text.slice(0, maxPreviewLength) +
    (selection.text.length > maxPreviewLength ? '...' : '');

  // Position card near selection but within viewport
  const cardX = Math.min(selection.rect.right + 10, window.innerWidth - 340);
  const cardY = Math.min(selection.rect.top, window.innerHeight - 320);

  return (
    <motion.div
      layoutId={layoutId}
      className="fixed z-50 w-80 rounded-xl overflow-hidden
                 bg-[var(--glass-solid)] border border-[var(--glass-border)]
                 backdrop-blur-xl shadow-2xl"
      style={{
        left: cardX,
        top: cardY,
      }}
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: cardExpand.duration }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--glass-border)]">
        <span className="text-sm font-medium text-[var(--glass-text-primary)]">
          {SPROUT_CAPTURE_CONFIG.defaultAction.icon} Plant Sprout
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

      {/* Preview */}
      <div className="px-4 py-3 border-b border-[var(--glass-border)]">
        <p className="text-sm text-[var(--glass-text-body)] italic leading-relaxed">
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

      {/* Tags */}
      <div className="px-4 py-3 border-b border-[var(--glass-border)]">
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
          ref={inputRef}
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
      <div className="px-4 py-3">
        <button
          onClick={handleSubmit}
          className="w-full py-2 rounded-lg bg-[var(--neon-green)] hover:bg-[var(--neon-green)]/80
                    text-white font-medium text-sm transition-colors"
        >
          Plant Sprout {SPROUT_CAPTURE_CONFIG.defaultAction.icon}
        </button>
      </div>
    </motion.div>
  );
};

export default SproutCaptureCard;
