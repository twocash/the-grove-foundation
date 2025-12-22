// src/explore/ExploreChat.tsx
// Terminal wrapper for the workspace - embeds the existing Terminal component

import { useState, useCallback } from 'react';
import Terminal from '../../components/Terminal';
import { SectionId, TerminalState } from '../../types';
import { INITIAL_TERMINAL_MESSAGE } from '../../constants';

export function ExploreChat() {
  const [activeSection] = useState<SectionId>(SectionId.STAKES);
  const [externalQuery, setExternalQuery] = useState<{ nodeId?: string; display: string; query: string } | null>(null);

  const [terminalState, setTerminalState] = useState<TerminalState>({
    isOpen: true,
    messages: [
      { id: 'init', role: 'model', text: INITIAL_TERMINAL_MESSAGE }
    ],
    isLoading: false
  });

  const handleQueryHandled = useCallback(() => {
    setExternalQuery(null);
  }, []);

  return (
    <div className="explore-chat-container">
      {/*
        CSS overrides to embed the Terminal (normally a fixed drawer) into the workspace.
        The Terminal uses fixed positioning which we override to be relative.
      */}
      <style>{`
        .explore-chat-container {
          position: relative;
          height: 100%;
          overflow: hidden;
        }

        /* Override Terminal's fixed positioning to embed it */
        .explore-chat-container > div {
          position: relative !important;
          inset: unset !important;
          width: 100% !important;
          height: 100% !important;
          transform: none !important;
          z-index: 1 !important;
        }

        /* Hide the floating action button in workspace context */
        .explore-chat-container button[class*="fixed bottom-8 right-8"] {
          display: none !important;
        }

        /* Make the drawer fill the container */
        .explore-chat-container .fixed.inset-y-0.right-0 {
          position: relative !important;
          inset: unset !important;
          width: 100% !important;
          height: 100% !important;
          transform: none !important;
          border: none !important;
          box-shadow: none !important;
        }

        /* Ensure the inner flex container fills height */
        .explore-chat-container .flex.flex-col.h-full {
          height: 100% !important;
        }

        /* Override background to match workspace theme */
        .explore-chat-container .bg-white {
          background: var(--grove-surface, #121a22) !important;
        }

        /* Override text colors for dark theme */
        .explore-chat-container .text-ink {
          color: var(--grove-text, #e2e8f0) !important;
        }

        .explore-chat-container .text-ink-muted {
          color: var(--grove-text-muted, #94a3b8) !important;
        }

        /* Override border colors */
        .explore-chat-container .border-ink\\/10,
        .explore-chat-container .border-ink-border {
          border-color: var(--grove-border, #1e2a36) !important;
        }

        /* Override input/textarea backgrounds */
        .explore-chat-container input,
        .explore-chat-container textarea {
          background: var(--grove-bg, #0a0f14) !important;
          color: var(--grove-text, #e2e8f0) !important;
          border-color: var(--grove-border, #1e2a36) !important;
        }

        .explore-chat-container input::placeholder,
        .explore-chat-container textarea::placeholder {
          color: var(--grove-text-dim, #64748b) !important;
        }

        /* Override scrollbar for dark theme */
        .explore-chat-container ::-webkit-scrollbar-track {
          background: var(--grove-surface, #121a22) !important;
        }

        .explore-chat-container ::-webkit-scrollbar-thumb {
          background: var(--grove-border, #1e2a36) !important;
        }

        /* Hide the Terminal pill (minimized state) */
        .explore-chat-container .terminal-slide-up {
          display: none !important;
        }

        /* Accent colors */
        .explore-chat-container .text-grove-clay {
          color: var(--grove-accent, #00d4aa) !important;
        }

        .explore-chat-container .bg-grove-forest {
          background: var(--grove-accent, #00d4aa) !important;
        }

        /* Button styling */
        .explore-chat-container button:not([class*="fixed"]) {
          transition: all 150ms ease;
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
