// src/theme/tokens.ts
// Theme token type definitions

export type Surface = 'marketing' | 'genesis' | 'foundation' | 'terminal' | 'global';
export type Mode = 'light' | 'dark';

export interface TokenSet {
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    glass: string;
    overlay: string;
  };
  text: {
    primary: string;
    secondary: string;
    muted: string;
    accent: string;
    inverse: string;
  };
  border: {
    default: string;
    strong: string;
    accent: string;
    focus: string;
  };
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
    highlight: string;
  };
  accent: {
    primary: string;
    primaryMuted: string;
    secondary: string;
    glow: string;
  };
}

export interface Typography {
  display: string[];
  body: string[];
  mono: string[];
  ui: string[];
}

export interface Effects {
  grain: boolean;
  glow: boolean;
  gridOverlay: boolean;
  glassmorphism: boolean;
  scanlines: boolean;
}

export interface Theme {
  id: string;
  name: string;
  version: string;
  extends?: string;
  surfaces: Surface[];
  tokens: Partial<TokenSet>;
  modes?: {
    light?: Partial<TokenSet>;
    dark?: Partial<TokenSet>;
  };
  typography?: Typography;
  effects?: Effects;
}

export interface ResolvedTokens extends TokenSet {}
export interface TokenOverrides { [path: string]: string; }
