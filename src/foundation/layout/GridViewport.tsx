// src/foundation/layout/GridViewport.tsx
// Main content viewport with grid overlay for Foundation

import React from 'react';

interface GridViewportProps {
  children: React.ReactNode;
  className?: string;
}

export const GridViewport: React.FC<GridViewportProps> = ({
  children,
  className = '',
}) => {
  return (
    <main
      className={`
        flex-1 p-6 overflow-auto
        bg-theme-bg-primary f-grid-overlay f-scrollbar
        ${className}
      `}
    >
      {children}
    </main>
  );
};

export default GridViewport;
