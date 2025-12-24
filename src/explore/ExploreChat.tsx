// src/explore/ExploreChat.tsx
// Terminal wrapper for the workspace - embeds the existing Terminal component
// v1.0: Simplified to use Terminal's embedded mode with chat tokens

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
    <div className="h-full w-full">
      <Terminal
        activeSection={activeSection}
        terminalState={terminalState}
        setTerminalState={setTerminalState}
        externalQuery={externalQuery}
        onQueryHandled={handleQueryHandled}
        variant="embedded"
      />
    </div>
  );
}
