// components/Terminal/Stream/blocks/NavigationBlock.tsx
// Journey navigation fork block with stagger animation
// Sprint: kinetic-stream-rendering-v1, kinetic-stream-polish-v1

import React from 'react';
import { motion } from 'framer-motion';
import type { StreamItem, JourneyPath } from '../../../../src/core/schema/stream';
import { hasPaths } from '../../../../src/core/schema/stream';
import SuggestionChip from '../../SuggestionChip';
import { staggerContainer, staggerItem } from '../motion/variants';

export interface NavigationBlockProps {
  item: StreamItem;
  onPathClick?: (path: JourneyPath) => void;
}

export const NavigationBlock: React.FC<NavigationBlockProps> = ({
  item,
  onPathClick
}) => {
  if (!hasPaths(item)) return null;

  return (
    <motion.div
      className="flex flex-col items-start"
      data-testid="navigation-block"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <div className="text-xs font-semibold text-primary mb-2">
        Continue your exploration:
      </div>
      <div className="space-y-1.5">
        {item.suggestedPaths!.map((path) => (
          <motion.div key={path.id} variants={staggerItem}>
            <SuggestionChip
              prompt={path.label}
              onClick={() => onPathClick?.(path)}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default NavigationBlock;
