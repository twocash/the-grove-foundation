// src/surface/components/KineticStream/Capture/components/PromptPreviewModal.tsx
// Sprint: sprout-declarative-v1-epic4

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface PromptPreviewModalProps {
  prompt: string;
  onClose: () => void;
  onConfirm: () => void;  // Called after successful copy, advances stage
}

export const PromptPreviewModal: React.FC<PromptPreviewModalProps> = ({
  prompt,
  onClose,
  onConfirm
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);

      // Reset after 1.5s, then confirm
      setTimeout(() => {
        setCopied(false);
        onConfirm();
      }, 1500);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="relative w-full max-w-2xl max-h-[80vh] flex flex-col
                   bg-[var(--glass-solid)] border border-[var(--glass-border)]
                   rounded-2xl shadow-2xl overflow-hidden"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--glass-border)]">
          <h2 className="text-lg font-semibold text-[var(--glass-text-primary)]">
            Research Prompt Generated
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close"
          >
            <span className="text-[var(--glass-text-muted)]">X</span>
          </button>
        </div>

        {/* Prompt Content */}
        <div className="flex-1 overflow-auto p-4">
          <pre className="whitespace-pre-wrap font-mono text-sm text-[var(--glass-text-secondary)]
                         bg-black/20 rounded-lg p-4 leading-relaxed">
            {prompt}
          </pre>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-[var(--glass-border)]
                       bg-[var(--glass-bg)]">
          <p className="text-xs text-[var(--glass-text-muted)]">
            Copy and paste into Claude, ChatGPT, or your preferred research tool
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm
                        text-[var(--glass-text-secondary)] hover:bg-white/10
                        transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleCopy}
              disabled={copied}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all
                         ${copied
                           ? 'bg-green-500/20 text-green-400'
                           : 'bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/30'
                         }`}
            >
              {copied ? 'Copied!' : 'Copy to Clipboard'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default PromptPreviewModal;
