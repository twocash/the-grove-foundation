// components/Terminal/Stream/blocks/QueryBlock.tsx
// User query message block with glass effect and slide-in animation
// Sprint: kinetic-stream-rendering-v1, kinetic-stream-polish-v1

import React from 'react';
import { motion } from 'framer-motion';
import type { StreamItem } from '../../../../src/core/schema/stream';
import { GlassPanel } from '../motion/GlassPanel';
import { queryVariants } from '../motion/variants';

export interface QueryBlockProps {
  item: StreamItem;
}

export const QueryBlock: React.FC<QueryBlockProps> = ({ item }) => {
  const displayContent = item.content.replace(' --verbose', '');

  return (
    <motion.div
      className="flex flex-col items-end"
      data-testid="query-block"
      variants={queryVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className="flex items-center gap-2 mb-1.5 justify-end">
        <span className="text-xs font-semibold text-[var(--glass-text-subtle)]">
          You
        </span>
      </div>
      <div className="max-w-[85%] md:max-w-[70%]">
        <GlassPanel
          intensity="light"
          className="glass-message glass-message-user px-5 py-3.5"
        >
          <p className="text-sm md:text-base leading-relaxed">{displayContent}</p>
        </GlassPanel>
      </div>
    </motion.div>
  );
};

export default QueryBlock;
