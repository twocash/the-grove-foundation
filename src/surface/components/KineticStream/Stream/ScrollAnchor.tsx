// src/surface/components/KineticStream/Stream/ScrollAnchor.tsx
// Invisible scroll target for reliable scrollIntoView
// Sprint: kinetic-scroll-v1

import React, { forwardRef } from 'react';

export const ScrollAnchor = forwardRef<HTMLDivElement>((_, ref) => {
  return (
    <div
      ref={ref}
      className="h-px w-full"
      aria-hidden="true"
      data-testid="scroll-anchor"
    />
  );
});

ScrollAnchor.displayName = 'ScrollAnchor';

export default ScrollAnchor;
