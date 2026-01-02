// src/router/RootLayout.tsx
// Root layout wrapper that provides theme and data context to all routes

import React from 'react';
import { Outlet } from 'react-router-dom';
import { ThemeProvider } from '../theme';
import { GroveDataProviderComponent } from '@core/data';

interface RootLayoutProps {
  children?: React.ReactNode;
}

/**
 * Root layout component that wraps all routes with ThemeProvider and GroveDataProvider.
 * ThemeProvider uses useLocation() for surface detection, so it must be
 * inside the router context.
 *
 * GroveDataProvider defaults to LocalStorageAdapter for development.
 * In production, App.tsx configures HybridAdapter with Supabase.
 */
export const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  return (
    <ThemeProvider>
      <GroveDataProviderComponent>
        {children ?? <Outlet />}
      </GroveDataProviderComponent>
    </ThemeProvider>
  );
};

export default RootLayout;
