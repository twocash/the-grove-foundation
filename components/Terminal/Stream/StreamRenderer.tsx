// components/Terminal/Stream/StreamRenderer.tsx
// Polymorphic stream renderer with AnimatePresence for exit animations
// Sprint: kinetic-stream-rendering-v1, kinetic-stream-polish-v1

import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { StreamItem, RhetoricalSpan, JourneyPath, JourneyFork } from '../../../src/core/schema/stream';
import { QueryBlock } from './blocks/QueryBlock';
import { ResponseBlock } from './blocks/ResponseBlock';
import { NavigationBlock } from './blocks/NavigationBlock';
import { SystemBlock } from './blocks/SystemBlock';
import CognitiveBridge from '../CognitiveBridge';
import type { BridgeState } from '../types';
import { blockVariants, reducedMotionVariants } from './motion/variants';

export interface StreamRendererProps {
  items: StreamItem[];
  currentItem?: StreamItem | null;
  onSpanClick?: (span: RhetoricalSpan) => void;
  onPathClick?: (path: JourneyPath) => void;
  onForkSelect?: (fork: JourneyFork) => void;
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
  onForkSelect,
  onPromptSubmit,
  bridgeState,
  onBridgeAccept,
  onBridgeDismiss,
  loadingMessages
}) => {
  const reducedMotion = useReducedMotion();
  const variants = reducedMotion ? reducedMotionVariants : blockVariants;
  const allItems = currentItem ? [...items, currentItem] : items;

  return (
    <div className="space-y-6" data-testid="stream-renderer">
      <AnimatePresence mode="popLayout">
        {allItems.map((item) => (
          <motion.div
            key={item.id}
            variants={variants}
            initial="hidden"
            animate="visible"
            exit="exit"
            layout
          >
            <StreamBlock
              item={item}
              onSpanClick={onSpanClick}
              onPathClick={onPathClick}
              onForkSelect={onForkSelect}
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
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

interface StreamBlockProps {
  item: StreamItem;
  onSpanClick?: (span: RhetoricalSpan) => void;
  onPathClick?: (path: JourneyPath) => void;
  onForkSelect?: (fork: JourneyFork) => void;
  onPromptSubmit?: (prompt: string) => void;
  loadingMessages?: string[];
}

const StreamBlock: React.FC<StreamBlockProps> = ({
  item,
  onSpanClick,
  onPathClick,
  onForkSelect,
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
          onForkSelect={onForkSelect}
          onPromptSubmit={onPromptSubmit}
          loadingMessages={loadingMessages}
        />
      );
    case 'navigation':
      return <NavigationBlock forks={item.forks} onSelect={onForkSelect} />;
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
