// src/theme/index.ts
// Barrel export for theme system

export { ThemeProvider, useTheme, ThemeContext } from './ThemeProvider';
export { ThemeResolver, themeResolver } from './ThemeResolver';
export { detectSurface, THEME_MAP } from './constants';
export { defaultTokens, defaultTypography, defaultEffects } from './defaults';
export type {
  Surface,
  Mode,
  TokenSet,
  Typography,
  Effects,
  Theme,
  ResolvedTokens,
  TokenOverrides,
} from './tokens';
