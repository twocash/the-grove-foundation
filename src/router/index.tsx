// src/router/index.tsx
// Main router configuration

import React from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { routes } from './routes';

const router = createBrowserRouter(routes);

export const AppRouter: React.FC = () => {
  return <RouterProvider router={router} />;
};

export { router, routes };
