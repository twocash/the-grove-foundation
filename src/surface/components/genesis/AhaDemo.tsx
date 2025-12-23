// src/surface/components/genesis/AhaDemo.tsx
// Screen 4: The Aha Demo - Diary entry moment (Active Grove Polish v2)
// DESIGN: Paper card aesthetic - NOT dark terminal

import React, { useState, useEffect } from 'react';
import { ActiveTree } from './ActiveTree';

// Diary content (Active Grove Polish v2)
const DIARY_CONTENT = `I've been digging into Wang et al.'s research on hierarchical reasoning, which is informative as we build the Foundation: knowing things compresses well; thinking hard doesn't. That's why the hybrid works—your laptop handles the conversation, the memory; the cloud handles the breakthroughs. We're on the right path. Doing more research.`;

const DIARY_AUTHOR = "Leah";

interface AhaDemoProps {
  onGoDeeper?: () => void;
  onKeepExploring?: () => void;
}

export const AhaDemo: React.FC<AhaDemoProps> = ({ onGoDeeper, onKeepExploring }) => {
  const [showMessage, setShowMessage] = useState(false);
  const [isTyping, setIsTyping] = useState(true);

  // Simulate typing effect
  useEffect(() => {
    const typingTimer = setTimeout(() => {
      setIsTyping(false);
      setShowMessage(true);
    }, 2000);
    return () => clearTimeout(typingTimer);
  }, []);

  const handleGoDeeper = () => {
    if (onGoDeeper) {
      onGoDeeper();
    }
  };

  const handleKeepExploring = () => {
    if (onKeepExploring) {
      onKeepExploring();
    } else {
      // Default: scroll to next section
      window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' });
    }
  };

  return (
    <section className="flex-1 flex flex-col bg-paper">
      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto flex flex-col justify-center px-6 py-8">
        <div className="max-w-2xl mx-auto w-full">
          {/* Simulated message card - paper aesthetic */}
          <div className="bg-paper-dark border border-ink/10 rounded-sm shadow-lg p-6 md:p-8 mb-6">
            {/* Loading state */}
            {isTyping && (
              <div className="flex items-center gap-3 text-ink-muted mb-6">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-grove-forest rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-grove-forest rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-grove-forest rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="font-serif text-lg italic">Your Grove is thinking...</span>
              </div>
            )}

            {/* Demo message */}
            <div
              className={`transition-opacity duration-500 ${
                showMessage ? 'opacity-100' : 'opacity-0'
              }`}
            >
              {/* Divider */}
              <div className="border-t border-ink/10 mb-6" />

              {/* Diary entry content */}
              <blockquote className="diary-entry font-serif text-lg md:text-xl text-ink leading-relaxed mb-4">
                {DIARY_CONTENT}
              </blockquote>
              <p className="diary-author font-mono text-sm text-ink-muted mb-6">
                — {DIARY_AUTHOR}
              </p>

              {/* Single CTA (Active Grove Polish v2) */}
              <button
                onClick={handleGoDeeper}
                className="px-6 py-3 bg-grove-forest text-white rounded-lg hover:bg-grove-forest/90 transition-colors font-medium"
              >
                Ask The Grove: How does Grove know when to call for backup?
              </button>
            </div>
          </div>

          {/* Tagline */}
          <p className="text-center font-serif text-xl md:text-2xl text-grove-forest italic">
            This is what AI feels like when it's yours.
          </p>
        </div>
      </div>

      {/* ActiveTree anchored at bottom */}
      <div className="shrink-0 py-4 flex justify-center bg-paper">
        <ActiveTree mode="directional" onClick={handleKeepExploring} />
      </div>
    </section>
  );
};

export default AhaDemo;
