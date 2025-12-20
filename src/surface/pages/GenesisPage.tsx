// src/surface/pages/GenesisPage.tsx
// Genesis landing experience - Jobs-style "Feel -> Understand -> Believe" progression
// DESIGN CONSTRAINT: Organic, warm, paper-textured - NOT futuristic/sci-fi

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Terminal from '../../../components/Terminal';
import AudioPlayer from '../../../components/AudioPlayer';
import { SectionId, TerminalState } from '../../../types';
import { INITIAL_TERMINAL_MESSAGE } from '../../../constants';
import {
  trackGenesisExperienceLoaded,
  trackGenesisScrollDepth,
  trackGenesisCTAClicked
} from '../../../utils/funnelAnalytics';

// Genesis screen components
import {
  HeroHook,
  ProblemStatement,
  ProductReveal,
  AhaDemo,
  Foundation,
  CallToAction
} from '../components/genesis';

// Quantum Interface - lens-reactive content (v0.13)
import { useQuantumInterface } from '../hooks/useQuantumInterface';

// Screen definitions for tracking
const GENESIS_SCREENS = [
  { id: 'hero-hook', name: 'HeroHook' },
  { id: 'problem-statement', name: 'ProblemStatement' },
  { id: 'product-reveal', name: 'ProductReveal' },
  { id: 'aha-demo', name: 'AhaDemo' },
  { id: 'foundation', name: 'Foundation' },
  { id: 'call-to-action', name: 'CallToAction' }
];

const GenesisPage: React.FC = () => {
  // Quantum Interface - lens-reactive content (v0.14: includes isCollapsing for tuning visual)
  const { reality, quantumTrigger, isCollapsing } = useQuantumInterface();

  const [activeSection] = useState<SectionId>(SectionId.STAKES);
  const [externalQuery, setExternalQuery] = useState<{ nodeId?: string; display: string; query: string } | null>(null);
  const [viewedScreens, setViewedScreens] = useState<Set<number>>(new Set([0])); // Screen 1 is always viewed on load
  const screenRefs = useRef<(HTMLDivElement | null)[]>([]);

  const [terminalState, setTerminalState] = useState<TerminalState>({
    isOpen: true,  // v0.12e: Terminal open by default to showcase experience
    messages: [
      { id: 'init', role: 'model', text: INITIAL_TERMINAL_MESSAGE }
    ],
    isLoading: false
  });

  // Track experience loaded on mount
  useEffect(() => {
    trackGenesisExperienceLoaded();
  }, []);

  // Scroll depth tracking with IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    screenRefs.current.forEach((ref, index) => {
      if (!ref) return;

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting && !viewedScreens.has(index)) {
              setViewedScreens(prev => new Set([...prev, index]));
              trackGenesisScrollDepth(index + 1, GENESIS_SCREENS[index].name);
            }
          });
        },
        { threshold: 0.3 }
      );

      observer.observe(ref);
      observers.push(observer);
    });

    return () => observers.forEach(obs => obs.disconnect());
  }, [viewedScreens]);

  // Handler for opening Terminal with a specific query
  const handleOpenTerminal = useCallback((query?: string) => {
    setTerminalState(prev => ({ ...prev, isOpen: true }));
    if (query) {
      setExternalQuery({
        display: query,
        query: query
      });
    }
  }, []);

  // CTA click handlers with telemetry
  const handleProductRevealCTA = useCallback(() => {
    trackGenesisCTAClicked('see-it-in-action', 3, 'ProductReveal');
    handleOpenTerminal();
  }, [handleOpenTerminal]);

  const handleAhaDemoCTA = useCallback(() => {
    trackGenesisCTAClicked('go-deeper', 4, 'AhaDemo');
    handleOpenTerminal("Explain the connection between distributed systems and cognitive architecture in The Grove.");
  }, [handleOpenTerminal]);

  const handleFoundationCTA = useCallback((query: string) => {
    trackGenesisCTAClicked('foundation-explore', 5, 'Foundation');
    handleOpenTerminal(query);
  }, [handleOpenTerminal]);

  const handleCallToActionTerminal = useCallback(() => {
    trackGenesisCTAClicked('explore-terminal', 6, 'CallToAction');
    handleOpenTerminal();
  }, [handleOpenTerminal]);

  const handleCallToActionAccess = useCallback(() => {
    trackGenesisCTAClicked('request-early-access', 6, 'CallToAction');
    // Opens email by default in CallToAction component
  }, []);

  return (
    <div className="bg-paper min-h-screen">
      <AudioPlayer />
      <Terminal
        activeSection={activeSection}
        terminalState={terminalState}
        setTerminalState={setTerminalState}
        externalQuery={externalQuery}
        onQueryHandled={() => setExternalQuery(null)}
      />

      {/* SCREEN 1: The Hook (Quantum-Reactive) */}
      <div ref={el => { screenRefs.current[0] = el; }}>
        <HeroHook
          content={reality.hero}
          trigger={quantumTrigger}
          isCollapsing={isCollapsing}
        />
      </div>

      {/* SCREEN 2: The Problem - Static CEO quotes (not lens-reactive) */}
      <div ref={el => { screenRefs.current[1] = el; }}>
        <ProblemStatement />
      </div>

      {/* SCREEN 3: Product Reveal */}
      <div ref={el => { screenRefs.current[2] = el; }}>
        <ProductReveal onOpenTerminal={handleProductRevealCTA} />
      </div>

      {/* SCREEN 4: Aha Demo */}
      <div ref={el => { screenRefs.current[3] = el; }}>
        <AhaDemo onGoDeeper={handleAhaDemoCTA} />
      </div>

      {/* SCREEN 5: Foundation */}
      <div ref={el => { screenRefs.current[4] = el; }}>
        <Foundation onOpenTerminal={handleFoundationCTA} />
      </div>

      {/* SCREEN 6: Call to Action */}
      <div ref={el => { screenRefs.current[5] = el; }}>
        <CallToAction
          onOpenTerminal={handleCallToActionTerminal}
          onRequestAccess={handleCallToActionAccess}
        />
      </div>
    </div>
  );
};

export default GenesisPage;
