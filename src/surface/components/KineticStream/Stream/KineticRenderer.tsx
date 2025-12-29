// src/surface/components/KineticStream/Stream/KineticRenderer.tsx
// Polymorphic renderer for StreamItems
// Sprint: kinetic-experience-v1

import React from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { StreamItem, RhetoricalSpan, JourneyFork } from '@core/schema/stream';
import { QueryObject } from './blocks/QueryObject';
import { ResponseObject } from './blocks/ResponseObject';
import { NavigationObject } from './blocks/NavigationObject';
import { SystemObject } from './blocks/SystemObject';
import { LensOfferObject } from './blocks/LensOfferObject';
import { JourneyOfferObject } from './blocks/JourneyOfferObject';
import { ScrollAnchor } from './ScrollAnchor';
import { blockVariants, reducedMotionVariants } from './motion/variants';

export interface KineticRendererProps {
  items: StreamItem[];
  currentItem?: StreamItem | null;
  bottomRef?: React.RefObject<HTMLDivElement>;
  onConceptClick?: (span: RhetoricalSpan, sourceId: string) => void;
  onForkSelect?: (fork: JourneyFork) => void;
  onPromptSubmit?: (prompt: string) => void;
  onLensAccept?: (lensId: string) => void;
  onLensDismiss?: (offerId: string) => void;
  onJourneyAccept?: (journeyId: string) => void;
  onJourneyDismiss?: (offerId: string) => void;
}

export const KineticRenderer: React.FC<KineticRendererProps> = ({
  items,
  currentItem,
  bottomRef,
  onConceptClick,
  onForkSelect,
  onPromptSubmit,
  onLensAccept,
  onLensDismiss,
  onJourneyAccept,
  onJourneyDismiss
}) => {
  const reducedMotion = useReducedMotion();
  const variants = reducedMotion ? reducedMotionVariants : blockVariants;
  const allItems = currentItem ? [...items, currentItem] : items;

  return (
    <div className="space-y-6" data-testid="kinetic-renderer">
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
            <KineticBlock
              item={item}
              onConceptClick={onConceptClick}
              onForkSelect={onForkSelect}
              onPromptSubmit={onPromptSubmit}
              onLensAccept={onLensAccept}
              onLensDismiss={onLensDismiss}
              onJourneyAccept={onJourneyAccept}
              onJourneyDismiss={onJourneyDismiss}
            />
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Scroll anchor - must be last */}
      <ScrollAnchor ref={bottomRef} />
    </div>
  );
};

interface KineticBlockProps {
  item: StreamItem;
  onConceptClick?: (span: RhetoricalSpan, sourceId: string) => void;
  onForkSelect?: (fork: JourneyFork) => void;
  onPromptSubmit?: (prompt: string) => void;
  onLensAccept?: (lensId: string) => void;
  onLensDismiss?: (offerId: string) => void;
  onJourneyAccept?: (journeyId: string) => void;
  onJourneyDismiss?: (offerId: string) => void;
}

const KineticBlock: React.FC<KineticBlockProps> = ({
  item,
  onConceptClick,
  onForkSelect,
  onPromptSubmit,
  onLensAccept,
  onLensDismiss,
  onJourneyAccept,
  onJourneyDismiss
}) => {
  switch (item.type) {
    case 'query':
      return <QueryObject item={item} />;
    case 'response':
      return (
        <ResponseObject
          item={item}
          onConceptClick={onConceptClick ? (span) => onConceptClick(span, item.id) : undefined}
          onForkSelect={onForkSelect}
          onPromptSubmit={onPromptSubmit}
        />
      );
    case 'navigation':
      return <NavigationObject forks={item.forks} onSelect={onForkSelect} />;
    case 'system':
      return <SystemObject item={item} />;
    case 'lens_offer':
      return (
        <LensOfferObject
          item={item}
          onAccept={onLensAccept}
          onDismiss={onLensDismiss}
        />
      );
    case 'journey_offer':
      return (
        <JourneyOfferObject
          item={item}
          onAccept={onJourneyAccept}
          onDismiss={onJourneyDismiss}
        />
      );
    default:
      return null;
  }
};

export default KineticRenderer;
