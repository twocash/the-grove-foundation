import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './index.html',
    './index.tsx',
    './App.tsx',
    './src/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './hooks/**/*.{ts,tsx}',
    './utils/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ============================================================
        // WORKSPACE TOKENS (Grove Workspace - Light/Dark mode)
        // Sprint 3: Clean paper aesthetic (light) / Deep slate (dark)
        // ============================================================
        primary: '#4d7c0f',                    // Grove green (emerald-700ish)
        'background-light': '#f8f7f5',         // Warm paper/cream
        'background-dark': '#0f172a',          // Deep slate
        'surface-light': '#ffffff',            // Cards, panels (light)
        'surface-dark': '#1e293b',             // Cards, panels (dark)
        'border-light': '#e7e5e4',             // Subtle borders (light)
        'border-dark': '#334155',              // Dark borders
        // Lens accent colors
        accent: {
          freestyle: '#3b82f6',                // blue
          citizen: '#dc2626',                  // red
          academic: '#10b981',                 // emerald
          engineer: '#6366f1',                 // indigo
          investor: '#f59e0b',                 // amber
          builder: '#8b5cf6',                  // violet
          skeptic: '#64748b',                  // slate
          visionary: '#ec4899',                // pink
        },

        // ============================================================
        // SURFACE TOKENS (The Village - Paper/Ink aesthetic)
        // v0.12e: Minimalist Orchard palette (warm bone, forest charcoal)
        // ============================================================
        paper: {
          DEFAULT: '#F9F8F4',
          dark: '#F0EFE9',
        },
        ink: {
          DEFAULT: '#1A2421',
          muted: '#4A5A50',
          border: '#E5E5E0',
        },
        grove: {
          cream: '#F9F8F4',
          dark: '#1A2421',
          forest: '#355E3B',
          accent: '#355E3B',
          clay: '#D95D39',
          light: '#E5E5E0',
        },
        terminal: {
          bg: '#FFFFFF',
          phosphor: '#1A2421',
          border: '#E5E5E0',
          highlight: '#D95D39',
        },

        // ============================================================
        // FOUNDATION TOKENS (The Control Plane - Holodeck aesthetic)
        // New dark-mode design system
        // ============================================================
        obsidian: {
          DEFAULT: '#0D0D0D',      // Deepest background
          raised: '#141414',       // Cards, panels
          elevated: '#1A1A1A',     // Modals, dropdowns
          surface: '#242424',      // Interactive surfaces, hover states
        },
        holo: {
          cyan: '#00D4FF',         // Primary accent
          magenta: '#FF00D4',      // Secondary accent
          lime: '#00FF88',         // Success states
          amber: '#FFB800',        // Warning states
          red: '#FF4444',          // Error/danger states
        },
        grid: {
          line: 'rgba(0, 212, 255, 0.1)',
          glow: 'rgba(0, 212, 255, 0.3)',
        },
      },

      fontFamily: {
        // Surface fonts (v0.12e: Minimalist Orchard)
        serif: ['EB Garamond', 'Lora', 'serif'],
        display: ['Tenor Sans', 'Playfair Display', 'sans-serif'],
        // Shared fonts
        sans: ['Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },

      // Foundation-specific spacing
      spacing: {
        'f-header': '48px',
        'f-sidebar': '56px',
        'f-sidebar-expanded': '200px',
        'f-grid': '40px',
      },

      // Animation for Foundation
      animation: {
        'pulse-slow': 'pulse 2s ease-in-out infinite',
        'glow-breathe': 'glow-breathe 3s ease-in-out infinite',
        // Garden Inspector badge animations (Phase 4c)
        'pulse-pending': 'pulse-pending 2s ease-in-out infinite',
        'pulse-attention': 'pulse-attention 1.5s ease-in-out infinite',
        'pulse-active': 'pulse-active 2s ease-in-out infinite',
      },
      keyframes: {
        'glow-breathe': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0, 212, 255, 0.2)' },
          '50%': { boxShadow: '0 0 15px rgba(0, 212, 255, 0.4)' },
        },
        // Garden Inspector badge keyframes (Phase 4c)
        'pulse-pending': {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(251, 191, 36, 0.4)',
            transform: 'scale(1)',
          },
          '50%': {
            boxShadow: '0 0 0 4px rgba(251, 191, 36, 0)',
            transform: 'scale(1.05)',
          },
        },
        'pulse-attention': {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(239, 68, 68, 0.5)',
            transform: 'scale(1)',
          },
          '50%': {
            boxShadow: '0 0 0 6px rgba(239, 68, 68, 0)',
            transform: 'scale(1.1)',
          },
        },
        'pulse-active': {
          '0%, 100%': {
            boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.4)',
            transform: 'scale(1)',
          },
          '50%': {
            boxShadow: '0 0 0 4px rgba(59, 130, 246, 0)',
            transform: 'scale(1.03)',
          },
        },
      },

      // Border for Foundation holographic effect
      borderColor: {
        'holo-default': 'rgba(0, 212, 255, 0.2)',
        'holo-hover': 'rgba(0, 212, 255, 0.4)',
        'holo-active': '#00D4FF',
      },
    },
  },
  plugins: [],
};

export default config;
