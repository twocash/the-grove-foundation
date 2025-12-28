// components/Terminal/Stream/blocks/QueryBlock.tsx
// User query message block
// Sprint: kinetic-stream-rendering-v1

import React from 'react';
import type { StreamItem } from '../../../../src/core/schema/stream';

export interface QueryBlockProps {
  item: StreamItem;
}

export const QueryBlock: React.FC<QueryBlockProps> = ({ item }) => {
  const displayContent = item.content.replace(' --verbose', '');

  return (
    <div className="flex flex-col items-end" data-testid="query-block">
      <div className="flex items-center gap-2 mb-1.5 justify-end">
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
          You
        </span>
      </div>
      <div className="max-w-[85%] md:max-w-[70%]">
        <div className="bg-primary text-white px-5 py-3.5 rounded-2xl rounded-tr-sm shadow-md">
          <p className="text-sm md:text-base leading-relaxed">{displayContent}</p>
        </div>
      </div>
    </div>
  );
};

export default QueryBlock;
