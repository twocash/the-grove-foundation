// components/Terminal/Stream/StreamRenderer.tsx
// Polymorphic stream renderer - dispatches to appropriate block component
// Sprint: kinetic-stream-rendering-v1

import React from 'react';
import type { StreamItem, RhetoricalSpan, JourneyPath } from '../../../src/core/schema/stream';
import { QueryBlock } from './blocks/QueryBlock';
import { ResponseBlock } from './blocks/ResponseBlock';
import { NavigationBlock } from './blocks/NavigationBlock';
import { SystemBlock } from './blocks/SystemBlock';
import CognitiveBridge from '../CognitiveBridge';
import type { BridgeState } from '../types';

export interface StreamRendererProps {
  items: StreamItem[];
  currentItem?: StreamItem | null;
  onSpanClick?: (span: RhetoricalSpan) => void;
  onPathClick?: (path: JourneyPath) => void;
  onPromptSubmit?: (prompt: string) => void;
  bridgeState?: BridgeState;
  onBridgeAccept?: () => void;
  onBridgeDismiss?: () => void;
  loadingMessages?: string[];
}

export const StreamRenderer: React.FC<StreamRendererProps> = ({
  items,
  currentItem,
  onSpanClick,
  onPathClick,
  onPromptSubmit,
  bridgeState,
  onBridgeAccept,
  onBridgeDismiss,
  loadingMessages
}) => {
  const allItems = currentItem ? [...items, currentItem] : items;

  return (
    <div className="space-y-6" data-testid="stream-renderer">
      {allItems.map((item) => (
        <React.Fragment key={item.id}>
          <StreamBlock
            item={item}
            onSpanClick={onSpanClick}
            onPathClick={onPathClick}
            onPromptSubmit={onPromptSubmit}
            loadingMessages={loadingMessages}
          />
          {bridgeState?.visible &&
           bridgeState.afterMessageId === item.id &&
           bridgeState.journeyId &&
           bridgeState.topicMatch && (
            <CognitiveBridge
              journeyId={bridgeState.journeyId}
              topicMatch={bridgeState.topicMatch}
              onAccept={onBridgeAccept!}
              onDismiss={onBridgeDismiss!}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

interface StreamBlockProps {
  item: StreamItem;
  onSpanClick?: (span: RhetoricalSpan) => void;
  onPathClick?: (path: JourneyPath) => void;
  onPromptSubmit?: (prompt: string) => void;
  loadingMessages?: string[];
}

const StreamBlock: React.FC<StreamBlockProps> = ({
  item,
  onSpanClick,
  onPathClick,
  onPromptSubmit,
  loadingMessages
}) => {
  switch (item.type) {
    case 'query':
      return <QueryBlock item={item} />;
    case 'response':
      return (
        <ResponseBlock
          item={item}
          onSpanClick={onSpanClick}
          onPromptSubmit={onPromptSubmit}
          loadingMessages={loadingMessages}
        />
      );
    case 'navigation':
      return <NavigationBlock item={item} onPathClick={onPathClick} />;
    case 'system':
      return <SystemBlock item={item} />;
    case 'reveal':
      // Reveal blocks are handled separately by the reveal system
      return null;
    default:
      console.warn(`Unknown stream item type: ${(item as StreamItem).type}`);
      return null;
  }
};

export default StreamRenderer;
