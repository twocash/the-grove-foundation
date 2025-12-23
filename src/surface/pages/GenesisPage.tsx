// src/surface/pages/GenesisPage.tsx
// Genesis landing experience - Jobs-style "Feel -> Understand -> Believe" progression
// DESIGN CONSTRAINT: Organic, warm, paper-textured - NOT futuristic/sci-fi
// v0.15: Section-aware smooth scrolling for bespoke experience
// v0.16: Active Grove - Split layout with Tree-triggered terminal reveal

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import Terminal from '../../../components/Terminal';
import AudioPlayer from '../../../components/AudioPlayer';
import { SectionId, TerminalState } from '../../../types';
import { INITIAL_TERMINAL_MESSAGE } from '../../../constants';
import {
  trackGenesisExperienceLoaded,
  trackGenesisScrollDepth,
  trackGenesisCTAClicked
} from '../../../utils/funnelAnalytics';

// ============================================================================
// ACTIVE GROVE STATE MACHINE (Sprint: active-grove-v1)
// ============================================================================

/**
 * UI Mode: Controls the layout split
 * - 'hero': Full-width hero section, Terminal hidden/overlay
 * - 'split': Content rail on left, Terminal panel on right
 */
type UIMode = 'hero' | 'split';

/**
 * Flow State: Controls the user journey through the experience
 * - 'hero': Initial state, Tree pulsing, waiting for interaction
 * - 'split': Terminal visible, waiting for lens selection
 * - 'selecting': LensPicker active in Terminal
 * - 'collapsing': Lens chosen, WaveformCollapse animating headline
 * - 'unlocked': Headline rewritten, navigation enabled
 */
type FlowState = 'hero' | 'split' | 'selecting' | 'collapsing' | 'unlocked';

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
  // ============================================================================
  // ACTIVE GROVE STATE (Sprint: active-grove-v1)
  // ============================================================================
  const [uiMode, setUIMode] = useState<UIMode>('hero');
  const [flowState, setFlowState] = useState<FlowState>('hero');

  // Responsive breakpoint detection
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    const checkBreakpoint = () => {
      const width = window.innerWidth;
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
    };
    checkBreakpoint();
    window.addEventListener('resize', checkBreakpoint);
    return () => window.removeEventListener('resize', checkBreakpoint);
  }, []);

  // Derive tree mode from flow state
  const treeMode = useMemo(() => {
    switch (flowState) {
      case 'hero': return 'pulsing';
      case 'split':
      case 'selecting':
      case 'collapsing': return 'stabilized';
      case 'unlocked': return 'directional';
      default: return 'pulsing';
    }
  }, [flowState]);

  // Navigation lock - prevent scrolling until unlocked
  const isNavigationLocked = flowState !== 'unlocked' && flowState !== 'hero';

  // Quantum Interface - lens-reactive content (v0.14: includes isCollapsing for tuning visual)
  const { reality, quantumTrigger, isCollapsing, activeLens } = useQuantumInterface();

  const [activeSection] = useState<SectionId>(SectionId.STAKES);
  const [externalQuery, setExternalQuery] = useState<{ nodeId?: string; display: string; query: string } | null>(null);
  const [viewedScreens, setViewedScreens] = useState<Set<number>>(new Set([0])); // Screen 1 is always viewed on load
  const screenRefs = useRef<(HTMLDivElement | null)[]>([]);

  // v0.16: Terminal starts closed in hero mode, opens when split
  const [terminalState, setTerminalState] = useState<TerminalState>({
    isOpen: false,  // Active Grove: Terminal starts closed, opens on Tree click
    messages: [
      { id: 'init', role: 'model', text: INITIAL_TERMINAL_MESSAGE }
    ],
    isLoading: false
  });

  // ============================================================================
  // ACTIVE GROVE EVENT HANDLERS (Sprint: active-grove-v1)
  // ============================================================================

  /**
   * Handle Tree click - triggers the split layout
   */
  const handleTreeClick = useCallback(() => {
    if (flowState === 'hero') {
      // Transition to split mode
      setUIMode('split');
      setFlowState('split');
      setTerminalState(prev => ({ ...prev, isOpen: true }));
      console.log('[ActiveGrove] Tree clicked → split mode');
    } else if (flowState === 'unlocked') {
      // Scroll to next section
      const targetRef = screenRefs.current[1];
      if (targetRef) {
        targetRef.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    } else {
      // Navigation locked - could trigger shake animation
      console.log('[ActiveGrove] Navigation locked, flowState:', flowState);
    }
  }, [flowState]);

  /**
   * Handle lens selection from Terminal
   */
  const handleLensSelected = useCallback((lensId: string) => {
    console.log('[ActiveGrove] Lens selected:', lensId);
    setFlowState('collapsing');
    // WaveformCollapse will trigger via quantumTrigger change
  }, []);

  /**
   * Handle WaveformCollapse animation complete
   */
  const handleCollapseComplete = useCallback(() => {
    if (flowState === 'collapsing') {
      console.log('[ActiveGrove] Collapse complete → unlocked');
      setFlowState('unlocked');
    }
  }, [flowState]);

  // Listen for lens changes to trigger collapsing state
  useEffect(() => {
    if (activeLens && flowState === 'split') {
      setFlowState('collapsing');
    }
  }, [activeLens]);

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

  /**
   * Section-aware smooth scroll
   * Scrolls to a specific section by index, with the content centered in viewport
   */
  const scrollToSection = useCallback((sectionIndex: number) => {
    const targetRef = screenRefs.current[sectionIndex];
    if (targetRef) {
      targetRef.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start'  // Align to top of viewport
      });
    }
  }, []);

  /**
   * Create scroll handler for a given section
   * Returns a function that scrolls to the NEXT section
   */
  const createScrollToNext = useCallback((currentIndex: number) => {
    return () => {
      const nextIndex = currentIndex + 1;
      if (nextIndex < GENESIS_SCREENS.length) {
        scrollToSection(nextIndex);
      }
    };
  }, [scrollToSection]);

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
  const handleProductRevealCTA = useCallback((query: string) => {
    trackGenesisCTAClicked('consult-the-grove', 3, 'ProductReveal');
    handleOpenTerminal(query);
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
    <div className="bg-paper min-h-screen relative overflow-x-hidden">
      <AudioPlayer />

      {/* ====================================================================
          CONTENT RAIL (Sprint: active-grove-v1)
          Uses clip-path for smooth split animation without text reflow
          ==================================================================== */}
      <div
        className={`content-rail transition-all duration-1000 ease-out-expo ${
          uiMode === 'split' ? 'split' : ''
        }`}
        style={{
          // Prevent scroll when navigation is locked
          ...(isNavigationLocked && { overflow: 'hidden', height: '100vh' })
        }}
      >
        <div className="content-rail-inner">
          {/* SCREEN 1: The Hook (Quantum-Reactive) */}
          <div ref={el => { screenRefs.current[0] = el; }}>
          <HeroHook
            content={reality.hero}
            trigger={quantumTrigger}
            isCollapsing={isCollapsing}
            onScrollNext={handleTreeClick}
            onAnimationComplete={handleCollapseComplete}
            flowState={flowState}
          />
        </div>

        {/* Navigation-gated sections - only visible when unlocked */}
        {flowState === 'unlocked' && (
          <>
            {/* SCREEN 2: The Problem - Static CEO quotes (not lens-reactive) */}
            <div ref={el => { screenRefs.current[1] = el; }}>
              <ProblemStatement
                onScrollNext={createScrollToNext(1)}
                variant={uiMode === 'split' ? 'compressed' : 'full'}
              />
            </div>

            {/* SCREEN 3: Product Reveal */}
            <div ref={el => { screenRefs.current[2] = el; }}>
              <ProductReveal
                onOpenTerminal={handleProductRevealCTA}
                onScrollNext={createScrollToNext(2)}
              />
            </div>

            {/* SCREEN 4: Aha Demo */}
            <div ref={el => { screenRefs.current[3] = el; }}>
              <AhaDemo
                onGoDeeper={handleAhaDemoCTA}
                onKeepExploring={createScrollToNext(3)}
              />
            </div>

            {/* SCREEN 5: Foundation */}
            <div ref={el => { screenRefs.current[4] = el; }}>
              <Foundation
                onOpenTerminal={handleFoundationCTA}
                onScrollNext={createScrollToNext(4)}
              />
            </div>

            {/* SCREEN 6: Call to Action (no scroll indicator - it's the last section) */}
            <div ref={el => { screenRefs.current[5] = el; }}>
              <CallToAction
                onOpenTerminal={handleCallToActionTerminal}
                onRequestAccess={handleCallToActionAccess}
              />
            </div>
          </>
        )}
        </div>{/* Close content-rail-inner */}
      </div>

      {/* ====================================================================
          TERMINAL PANEL (Sprint: active-grove-v1)
          Fixed right panel (desktop/tablet) or bottom sheet (mobile)
          ==================================================================== */}
      <div
        className={`terminal-panel ${uiMode === 'split' ? 'visible' : ''} ${isMobile ? 'mobile-sheet' : ''}`}
        aria-hidden={uiMode !== 'split'}
        aria-expanded={uiMode === 'split'}
        role="complementary"
        aria-label="Grove Terminal"
      >
        <Terminal
          activeSection={activeSection}
          terminalState={terminalState}
          setTerminalState={setTerminalState}
          externalQuery={externalQuery}
          onQueryHandled={() => setExternalQuery(null)}
          onLensSelected={handleLensSelected}
          variant={isMobile ? 'overlay' : 'embedded'}
        />
      </div>
    </div>
  );
};

export default GenesisPage;
