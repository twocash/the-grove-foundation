// src/theme/constants.ts
// Theme mapping and surface detection

import type { Surface } from './tokens';

export const THEME_MAP: Record<Surface, string> = {
  marketing: '/data/themes/surface.theme.json',
  genesis: '/data/themes/surface.theme.json',
  foundation: '/data/themes/foundation-quantum.theme.json',
  terminal: '/data/themes/terminal.theme.json',
  global: '/data/themes/surface.theme.json',
};

export function detectSurface(pathname: string): Surface {
  if (pathname.startsWith('/foundation')) return 'foundation';
  if (pathname.startsWith('/terminal')) return 'terminal';
  if (pathname === '/') return 'genesis';
  return 'marketing';
}
