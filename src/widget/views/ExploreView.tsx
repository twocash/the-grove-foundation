// src/widget/views/ExploreView.tsx
// Explore mode content - integrates the existing Terminal component
// Uses CSS overrides to embed the Terminal (normally a fixed drawer) into the widget

import { useState, useCallback } from 'react';
import Terminal from '../../../components/Terminal';
import { SectionId, TerminalState } from '../../../types';
import { INITIAL_TERMINAL_MESSAGE } from '../../../constants';

export function ExploreView() {
  const [activeSection] = useState<SectionId>(SectionId.STAKES);
  const [externalQuery, setExternalQuery] = useState<{ nodeId?: string; display: string; query: string } | null>(null);

  const [terminalState, setTerminalState] = useState<TerminalState>({
    isOpen: true,  // Always open in widget context
    messages: [
      { id: 'init', role: 'model', text: INITIAL_TERMINAL_MESSAGE }
    ],
    isLoading: false
  });

  const handleQueryHandled = useCallback(() => {
    setExternalQuery(null);
  }, []);

  return (
    <div className="explore-view-container">
      {/*
        Terminal wrapper with CSS overrides to embed the fixed-position drawer.
        The Terminal is normally a fixed drawer (right: 0, width: 480px).
        We override it to be relative and fill the container.
      */}
      <style>{`
        .explore-view-container {
          position: relative;
          height: 100%;
          overflow: hidden;
        }

        /* Override Terminal's fixed positioning to embed it */
        .explore-view-container > div {
          position: relative !important;
          inset: unset !important;
          width: 100% !important;
          height: 100% !important;
          transform: none !important;
          z-index: 1 !important;
        }

        /* Hide the floating action button in widget context */
        .explore-view-container button[class*="fixed bottom-8 right-8"] {
          display: none !important;
        }

        /* Make the drawer fill the container instead of being a sidebar */
        .explore-view-container .fixed.inset-y-0.right-0 {
          position: relative !important;
          inset: unset !important;
          width: 100% !important;
          height: 100% !important;
          transform: none !important;
          border: none !important;
          box-shadow: none !important;
        }

        /* Ensure the inner flex container fills height */
        .explore-view-container .flex.flex-col.h-full {
          height: 100% !important;
        }

        /* Override background to match widget theme */
        .explore-view-container .bg-white {
          background: var(--grove-bg, #0a0f14) !important;
        }

        /* Override text colors for dark theme */
        .explore-view-container .text-ink {
          color: var(--grove-text, #e2e8f0) !important;
        }

        .explore-view-container .text-ink-muted {
          color: var(--grove-text-muted, #94a3b8) !important;
        }

        /* Override border colors */
        .explore-view-container .border-ink\\/10,
        .explore-view-container .border-ink-border {
          border-color: var(--grove-border, #1e2a36) !important;
        }

        /* Override input/textarea backgrounds */
        .explore-view-container input,
        .explore-view-container textarea {
          background: var(--grove-surface, #121a22) !important;
          color: var(--grove-text, #e2e8f0) !important;
          border-color: var(--grove-border, #1e2a36) !important;
        }

        .explore-view-container input::placeholder,
        .explore-view-container textarea::placeholder {
          color: var(--grove-text-dim, #64748b) !important;
        }

        /* Override scrollbar for dark theme */
        .explore-view-container ::-webkit-scrollbar-track {
          background: var(--grove-bg, #0a0f14) !important;
        }

        .explore-view-container ::-webkit-scrollbar-thumb {
          background: var(--grove-border, #1e2a36) !important;
        }

        /* Hide the Terminal pill (minimized state) - not needed in widget */
        .explore-view-container .terminal-slide-up {
          display: none !important;
        }

        /* Accent colors */
        .explore-view-container .text-grove-clay {
          color: var(--grove-accent, #00d4aa) !important;
        }

        .explore-view-container .bg-grove-forest {
          background: var(--grove-accent, #00d4aa) !important;
        }
      `}</style>

      <Terminal
        activeSection={activeSection}
        terminalState={terminalState}
        setTerminalState={setTerminalState}
        externalQuery={externalQuery}
        onQueryHandled={handleQueryHandled}
      />
    </div>
  );
}
