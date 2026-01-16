// src/foundation/components/CapabilityTag.tsx
// Capability indicator tag component
// Sprint: EPIC5-SL-Federation v1

import React from 'react';
import type { Capability } from '@core/federation/schema';

export interface CapabilityTagProps {
  capability: Capability;
  variant?: 'default' | 'compact' | 'outline';
  clickable?: boolean;
  onClick?: (capability: Capability) => void;
}

export function CapabilityTag({ capability, variant = 'default', clickable = false, onClick }: CapabilityTagProps): JSX.Element {
  const baseClasses = 'inline-flex items-center rounded-full font-medium';

  const variantClasses = {
    default: 'px-3 py-1 text-sm bg-blue-100 text-blue-800',
    compact: 'px-2 py-0.5 text-xs bg-blue-100 text-blue-800',
    outline: 'px-3 py-1 text-sm border border-blue-200 text-blue-700',
  };

  const clickableClasses = clickable ? 'cursor-pointer hover:opacity-80 transition-opacity' : '';

  const classes = `${baseClasses} ${variantClasses[variant]} ${clickableClasses}`;

  const handleClick = () => {
    if (clickable && onClick) {
      onClick(capability);
    }
  };

  return (
    <span className={classes} onClick={handleClick} title={capability.description || capability.tag}>
      <span className="truncate max-w-[150px]">{capability.tag}</span>
      {capability.version && (
        <span className="ml-1 opacity-75 text-xs">
          v{capability.version}
        </span>
      )}
    </span>
  );
}
