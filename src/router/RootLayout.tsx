// src/router/RootLayout.tsx
// Root layout wrapper that provides theme context to all routes

import React from 'react';
import { Outlet } from 'react-router-dom';
import { ThemeProvider } from '../theme';

interface RootLayoutProps {
  children?: React.ReactNode;
}

/**
 * Root layout component that wraps all routes with ThemeProvider.
 * ThemeProvider uses useLocation() for surface detection, so it must be
 * inside the router context.
 */
export const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  return (
    <ThemeProvider>
      {children ?? <Outlet />}
    </ThemeProvider>
  );
};

export default RootLayout;
