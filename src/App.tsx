// src/App.tsx
// Main application entry with React Router

import React, { useEffect } from 'react';
import { createBrowserRouter, RouterProvider, Navigate, useNavigate } from 'react-router-dom';
import { routes } from './router/routes';

// Component to handle legacy ?admin=true redirect
const LegacyAdminRedirect: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('admin') === 'true') {
      // Remove the query param and redirect to /foundation
      window.history.replaceState({}, '', window.location.pathname);
      navigate('/foundation', { replace: true });
    }
  }, [navigate]);

  return <>{children}</>;
};

// Wrap routes with legacy redirect handler
const routesWithRedirect = routes.map(route => {
  if (route.path === '/') {
    return {
      ...route,
      element: (
        <LegacyAdminRedirect>
          {route.element}
        </LegacyAdminRedirect>
      ),
    };
  }
  return route;
});

const router = createBrowserRouter(routesWithRedirect);

const App: React.FC = () => {
  return <RouterProvider router={router} />;
};

export default App;
