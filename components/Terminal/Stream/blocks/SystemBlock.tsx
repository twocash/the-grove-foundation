// components/Terminal/Stream/blocks/SystemBlock.tsx
// System status message block with fade animation
// Sprint: kinetic-stream-rendering-v1, kinetic-stream-polish-v1

import React from 'react';
import { motion } from 'framer-motion';
import type { StreamItem } from '../../../../src/core/schema/stream';
import { systemVariants } from '../motion/variants';

export interface SystemBlockProps {
  item: StreamItem;
}

export const SystemBlock: React.FC<SystemBlockProps> = ({ item }) => {
  const isError = item.content.startsWith('Error:') ||
                  item.content.startsWith('SYSTEM ERROR');

  return (
    <motion.div
      className="flex justify-center"
      data-testid="system-block"
      variants={systemVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <div className={`text-xs px-3 py-1.5 rounded-full ${
        isError
          ? 'bg-red-50 text-red-600 dark:bg-red-900/20 dark:text-red-400'
          : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
      }`}>
        {item.content}
      </div>
    </motion.div>
  );
};

export default SystemBlock;
