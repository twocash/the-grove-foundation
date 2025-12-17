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
const DEFAULT_JOURNEY_INFO: Record<string, JourneyInfo> = {
  'journey-ratchet': {
    id: 'journey-ratchet',
    title: 'The Ratchet Effect',
    nodeCount: 5,
    estimatedMinutes: 8,
    coverTopics: ['Capability doubling', '21-month lag', 'Frontier vs Local', 'Hardware trajectory']
  },
  'journey-economics': {
    id: 'journey-economics',
    title: 'Grove Economics',
    nodeCount: 6,
    estimatedMinutes: 10,
    coverTopics: ['Efficiency Tax', 'Credit economy', 'Self-obsolescence', 'Incentive alignment']
  },
  'journey-architecture': {
    id: 'journey-architecture',
    title: 'Hybrid Architecture',
    nodeCount: 5,
    estimatedMinutes: 8,
    coverTopics: ['Cognitive split', 'Local vs Cloud', 'Routing logic', 'Memory transfer']
  },
  'journey-commons': {
    id: 'journey-commons',
    title: 'The Knowledge Commons',
    nodeCount: 4,
    estimatedMinutes: 6,
    coverTopics: ['Innovation sharing', 'Attribution', 'Network effects', 'Collective intelligence']
  },
  'journey-observer': {
    id: 'journey-observer',
    title: 'The Observer Dynamic',
    nodeCount: 5,
    estimatedMinutes: 8,
    coverTopics: ['Gardener role', 'Asymmetric knowledge', 'Agent theology', 'Dramatic irony']
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

  // Get journey info from props or defaults
  const journeyInfo = providedInfo || DEFAULT_JOURNEY_INFO[journeyId] || {
    id: journeyId,
    title: 'Structured Journey',
    nodeCount: 4,
    estimatedMinutes: 6,
    coverTopics: [topicMatch]
  };

  // 800ms loading animation to simulate "cloud latency"
  useEffect(() => {
    const timer = setTimeout(() => setIsResolving(false), 800);
    return () => clearTimeout(timer);
  }, []);

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
        // Journey card
        <div className="space-y-3 animate-in fade-in duration-300">
          {/* Context message */}
          <p className="font-serif text-sm text-ink/80">
            This connects to the{' '}
            <strong className="text-grove-forest">{journeyInfo.title}</strong>{' '}
            sequence. To fully map this dependency, I can switch to a structured path.
          </p>

          {/* Journey preview card */}
          <div className="bg-white border border-ink/10 rounded-sm p-4 shadow-sm">
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
              Continue Freestyle
            </button>
          </div>

          {/* Keyboard hint */}
          <p className="text-[9px] text-ink-muted/60 font-mono">
            Press Esc to dismiss
          </p>
        </div>
      )}
    </div>
  );
};

export default CognitiveBridge;
