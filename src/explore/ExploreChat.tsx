// src/explore/ExploreChat.tsx
// Terminal wrapper for the workspace - embeds the existing Terminal component
// v1.0: Simplified to use Terminal's embedded mode with chat tokens
// v1.1: Added chat persistence across navigation

import { useState, useCallback } from 'react';
import Terminal from '../../components/Terminal';
import { SectionId } from '../../types';
import { useChatPersistence } from '../../hooks/useChatPersistence';

export function ExploreChat() {
  const [activeSection] = useState<SectionId>(SectionId.STAKES);
  const [externalQuery, setExternalQuery] = useState<{ nodeId?: string; display: string; query: string } | null>(null);

  // Chat messages are persisted to localStorage, surviving navigation and refresh
  const { terminalState, setTerminalState } = useChatPersistence();

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
