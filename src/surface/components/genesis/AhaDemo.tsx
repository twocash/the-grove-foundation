// src/surface/components/genesis/AhaDemo.tsx
// Screen 4: The Aha Demo - Simulated Terminal moment
// DESIGN: Paper card aesthetic - NOT dark terminal

import React, { useState, useEffect } from 'react';
import ScrollIndicator from './ScrollIndicator';

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
    <section className="min-h-screen bg-paper py-24 px-6 flex flex-col items-center justify-center">
      <div className="max-w-2xl mx-auto w-full">
        {/* Simulated message card - paper aesthetic */}
        <div className="bg-paper-dark border border-ink/10 rounded-sm shadow-lg p-8 md:p-10 mb-8">
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

            {/* Message content - clean serif */}
            <div className="font-serif text-lg md:text-xl text-ink leading-relaxed space-y-4">
              <p>"Good morning. I've been exploring a few threads while you were away.</p>
              <p>I found a connection between distributed systems and cognitive architecture that might interest you.</p>
              <p>Want me to explain, or should I keep digging?"</p>
            </div>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <button
                onClick={handleGoDeeper}
                className="px-6 py-3 bg-grove-forest text-white font-mono text-sm uppercase tracking-wider rounded-sm hover:bg-ink transition-colors"
              >
                Consult the Grove
              </button>
              <button
                onClick={handleKeepExploring}
                className="px-6 py-3 border border-grove-forest text-grove-forest font-mono text-sm uppercase tracking-wider rounded-sm hover:bg-grove-forest hover:text-white transition-colors"
              >
                Keep exploring
              </button>
            </div>
          </div>
        </div>

        {/* Tagline */}
        <p className="text-center font-serif text-xl md:text-2xl text-grove-forest italic mb-12">
          This is what AI feels like when it's yours.
        </p>

        {/* Scroll indicator - floating seedling */}
        <div className="flex justify-center">
          <ScrollIndicator onClick={() => window.scrollBy({ top: window.innerHeight * 0.8, behavior: 'smooth' })} />
        </div>
      </div>
    </section>
  );
};

export default AhaDemo;
