// src/router/RootLayout.tsx
// Root layout wrapper that provides theme and data context to all routes

import React, { useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js';
import { ThemeProvider } from '../theme';
import { GroveDataProviderComponent, SupabaseAdapter } from '@core/data';

interface RootLayoutProps {
  children?: React.ReactNode;
}

/**
 * Root layout component that wraps all routes with ThemeProvider and GroveDataProvider.
 * ThemeProvider uses useLocation() for surface detection, so it must be
 * inside the router context.
 *
 * Uses SupabaseAdapter for production data access.
 */
export const RootLayout: React.FC<RootLayoutProps> = ({ children }) => {
  const provider = useMemo(() => {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    // Debug log for troubleshooting (remove in production)
    console.log('[RootLayout] Supabase URL configured:', !!supabaseUrl);
    console.log('[RootLayout] Supabase key configured:', !!supabaseKey);
    
    if (supabaseUrl && supabaseKey && supabaseUrl !== '' && supabaseKey !== '') {
      console.log('[RootLayout] Using SupabaseAdapter');
      const client = createClient(supabaseUrl, supabaseKey);
      return new SupabaseAdapter({ client });
    }
    // Falls back to localStorage if no Supabase config
    console.log('[RootLayout] Falling back to LocalStorageAdapter');
    return undefined;
  }, []);

  return (
    <ThemeProvider>
      <GroveDataProviderComponent provider={provider}>
        {children ?? <Outlet />}
      </GroveDataProviderComponent>
    </ThemeProvider>
  );
};

export default RootLayout;
