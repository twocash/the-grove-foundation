// components/Terminal/Stream/blocks/NavigationBlock.tsx
// Journey navigation fork block
// Sprint: kinetic-stream-rendering-v1

import React from 'react';
import type { StreamItem, JourneyPath } from '../../../../src/core/schema/stream';
import { hasPaths } from '../../../../src/core/schema/stream';
import SuggestionChip from '../../SuggestionChip';

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
    <div className="flex flex-col items-start" data-testid="navigation-block">
      <div className="text-xs font-semibold text-primary mb-2">
        Continue your exploration:
      </div>
      <div className="space-y-1.5">
        {item.suggestedPaths!.map((path) => (
          <SuggestionChip
            key={path.id}
            prompt={path.label}
            onClick={() => onPathClick?.(path)}
          />
        ))}
      </div>
    </div>
  );
};

export default NavigationBlock;
