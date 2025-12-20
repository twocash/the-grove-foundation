// CognitiveBridge - Inline injection component for structured journey offers
// Appears in chat flow when entropy detector identifies high-complexity conversation
// Demonstrates the "cognitive split" - transitioning from freestyle to structured path

import React, { useState, useEffect } from 'react';

interface JourneyInfo {
  id: string;
  title: string;
  nodeCount: number;
  estimatedMinutes: number;
  coverTopics: string[];
}

interface CognitiveBridgeProps {
  journeyId: string;
  topicMatch: string;
  onAccept: () => void;
  onDismiss: () => void;
  journeyInfo?: JourneyInfo;
}

// Default journey metadata when not provided
// V2.1: Updated to match narratives.json journey IDs
// Last validated: Sprint 6 (2025-12-19)
const DEFAULT_JOURNEY_INFO: Record<string, JourneyInfo> = {
  'simulation': {
    id: 'simulation',
    title: 'The Ghost in the Machine',
    nodeCount: 5,  // sim-hook, sim-split, sim-observer, sim-recursion, sim-proof
    estimatedMinutes: 8,
    coverTopics: ['Meta-philosophy', 'Observer dynamic', 'Cognitive split', 'Recursive insight']
  },
  'stakes': {
    id: 'stakes',
    title: 'The $380 Billion Bet',
    nodeCount: 3,  // stakes-380b, stakes-thermodynamic, stakes-dependency
    estimatedMinutes: 12,
    coverTopics: ['Infrastructure investment', 'Ownership vs rental', 'Dependency trap']
  },
  'ratchet': {
    id: 'ratchet',
    title: 'The Ratchet',
    nodeCount: 1,  // ratchet-hook (ratchet-gap pending creation)
    estimatedMinutes: 5,  // Adjusted for current content
    coverTopics: ['Capability doubling', '21-month lag', 'Frontier to edge']
  }
};

const CognitiveBridge: React.FC<CognitiveBridgeProps> = ({
  journeyId,
  topicMatch,
  onAccept,
  onDismiss,
  journeyInfo: providedInfo
}) => {
  const [isResolving, setIsResolving] = useState(true);
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  // Get journey info from props or defaults
  const journeyInfo = providedInfo || DEFAULT_JOURNEY_INFO[journeyId] || {
    id: journeyId,
    title: 'Structured Journey',
    nodeCount: 4,
    estimatedMinutes: 6,
    coverTopics: [topicMatch]
  };

  // Warm invitation text
  const invitationText = `I'd love to take you on a guided journey about "${journeyInfo.title}" — we'll explore ${journeyInfo.coverTopics.slice(0, 3).join(', ')}. Or keep asking anything. I'm here to help!`;

  // 800ms loading animation to simulate "cloud latency"
  useEffect(() => {
    const timer = setTimeout(() => setIsResolving(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Typing animation
  useEffect(() => {
    if (!isResolving && !isTypingComplete) {
      let i = 0;
      const timer = setInterval(() => {
        setDisplayedText(invitationText.slice(0, i + 1));
        i++;
        if (i >= invitationText.length) {
          clearInterval(timer);
          setIsTypingComplete(true);
        }
      }, 20);
      return () => clearInterval(timer);
    }
  }, [isResolving, isTypingComplete, invitationText]);

  // Handle Escape key to dismiss
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
      }
    };
    window.addEventListener('keydown', handleEscape);
    return () => window.removeEventListener('keydown', handleEscape);
  }, [onDismiss]);

  return (
    <div className="my-6 border-l-2 border-grove-forest/30 pl-4 py-3 bg-paper/50">
      {isResolving ? (
        // Loading state - simulates "cloud latency"
        <div className="flex items-center space-x-2 font-mono text-xs text-ink-muted">
          <span className="animate-pulse text-grove-forest">●</span>
          <span>Resolving connection...</span>
        </div>
      ) : (
        // Typed invitation + journey card
        <div className="space-y-3">
          {/* Typed invitation message */}
          <p className="font-serif text-sm text-ink/80 leading-relaxed">
            {displayedText}
            {!isTypingComplete && <span className="inline-block w-0.5 h-3.5 bg-grove-forest/60 ml-0.5 animate-pulse" />}
          </p>

          {/* Journey preview card - only shows after typing complete */}
          {isTypingComplete && (
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="bg-white border border-ink/10 rounded-sm p-4 shadow-sm mb-3">
                <h4 className="font-sans font-bold text-ink text-sm mb-1">
                  {journeyInfo.title}
                </h4>
                <p className="font-mono text-[10px] text-ink-muted mb-2">
                  {journeyInfo.nodeCount} nodes • ~{journeyInfo.estimatedMinutes} min
                </p>
                <p className="font-sans text-xs text-ink/60">
                  Covers: {journeyInfo.coverTopics.join(', ')}
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex space-x-3">
                <button
                  onClick={onAccept}
                  className="px-4 py-2 bg-grove-forest text-white text-xs font-mono uppercase tracking-wider hover:bg-ink transition-colors rounded-sm"
                >
                  Start Journey
                </button>
                <button
                  onClick={onDismiss}
                  className="px-4 py-2 border border-ink/20 text-ink-muted text-xs font-mono uppercase tracking-wider hover:border-ink/40 hover:text-ink transition-colors rounded-sm"
                >
                  Keep exploring
                </button>
              </div>

              {/* Keyboard hint */}
              <p className="text-[9px] text-ink-muted/60 font-mono mt-2">
                Press Esc to dismiss
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CognitiveBridge;
