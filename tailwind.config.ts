import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

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

        // ============================================================
        // QUANTUM GLASS TOKENS (Explore/Bedrock - Dynamic theming)
        // Reference CSS variables for runtime skin switching
        // Fallbacks defined in styles/globals.css :root block
        // ============================================================
        glass: {
          void: 'var(--glass-void)',
          panel: 'var(--glass-panel)',
          solid: 'var(--glass-solid)',
          elevated: 'var(--glass-elevated)',
          border: 'var(--glass-border)',
        },
        'glass-text': {
          primary: 'var(--glass-text-primary)',
          secondary: 'var(--glass-text-secondary)',
          muted: 'var(--glass-text-muted)',
          body: 'var(--glass-text-body)',
        },
        neon: {
          cyan: 'var(--neon-cyan)',
          violet: 'var(--neon-violet)',
          green: 'var(--neon-green)',
          amber: 'var(--neon-amber)',
          rose: 'var(--neon-rose)',
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
        // Progress Streaming UI animations (Sprint: progress-streaming-ui-v1)
        'slide-in-left': 'slide-in-left 200ms ease-out',
        'scale-in': 'scale-in 300ms ease-out',
      },
      keyframes: {
        'glow-breathe': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0, 212, 255, 0.2)' },
          '50%': { boxShadow: '0 0 15px rgba(0, 212, 255, 0.4)' },
        },
        // Progress Streaming UI keyframes (Sprint: progress-streaming-ui-v1)
        'slide-in-left': {
          '0%': { transform: 'translateX(-10px)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
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

      // ============================================================
      // TYPOGRAPHY (S22-WP: json-render prose styling)
      // GroveSkins integration - paper/ink colors, serif fonts
      // ============================================================
      typography: ({ theme }: { theme: (path: string) => string }) => ({
        DEFAULT: {
          css: {
            // Base text color (ink)
            '--tw-prose-body': theme('colors.ink.DEFAULT'),
            '--tw-prose-headings': theme('colors.ink.DEFAULT'),
            '--tw-prose-lead': theme('colors.ink.muted'),
            '--tw-prose-links': theme('colors.grove.forest'),
            '--tw-prose-bold': theme('colors.ink.DEFAULT'),
            '--tw-prose-counters': theme('colors.ink.muted'),
            '--tw-prose-bullets': theme('colors.grove.forest'),
            '--tw-prose-hr': theme('colors.ink.border'),
            '--tw-prose-quotes': theme('colors.ink.DEFAULT'),
            '--tw-prose-quote-borders': theme('colors.grove.forest'),
            '--tw-prose-captions': theme('colors.ink.muted'),
            '--tw-prose-code': theme('colors.grove.forest'),
            '--tw-prose-pre-code': theme('colors.paper.DEFAULT'),
            '--tw-prose-pre-bg': theme('colors.ink.DEFAULT'),
            '--tw-prose-th-borders': theme('colors.ink.border'),
            '--tw-prose-td-borders': theme('colors.ink.border'),
            // Dark mode (inverted for dark bg)
            '--tw-prose-invert-body': theme('colors.paper.DEFAULT'),
            '--tw-prose-invert-headings': theme('colors.paper.DEFAULT'),
            '--tw-prose-invert-lead': 'rgba(249, 248, 244, 0.7)',
            '--tw-prose-invert-links': theme('colors.grove.forest'),
            '--tw-prose-invert-bold': theme('colors.paper.DEFAULT'),
            '--tw-prose-invert-counters': 'rgba(249, 248, 244, 0.6)',
            '--tw-prose-invert-bullets': theme('colors.grove.forest'),
            '--tw-prose-invert-hr': 'rgba(249, 248, 244, 0.2)',
            '--tw-prose-invert-quotes': theme('colors.paper.DEFAULT'),
            '--tw-prose-invert-quote-borders': theme('colors.grove.forest'),
            '--tw-prose-invert-captions': 'rgba(249, 248, 244, 0.6)',
            '--tw-prose-invert-code': theme('colors.grove.forest'),
            '--tw-prose-invert-pre-code': theme('colors.paper.DEFAULT'),
            '--tw-prose-invert-pre-bg': 'rgba(0, 0, 0, 0.5)',
            '--tw-prose-invert-th-borders': 'rgba(249, 248, 244, 0.2)',
            '--tw-prose-invert-td-borders': 'rgba(249, 248, 244, 0.1)',
            // Font styling
            fontFamily: theme('fontFamily.serif'),
            lineHeight: '1.75',
            // Heading sizes
            h1: {
              fontSize: theme('fontSize.2xl'),
              fontWeight: '700',
              lineHeight: '1.2',
              marginTop: '1.5em',
              marginBottom: '0.75em',
            },
            h2: {
              fontSize: theme('fontSize.xl'),
              fontWeight: '600',
              lineHeight: '1.25',
              marginTop: '1.25em',
              marginBottom: '0.5em',
            },
            h3: {
              fontSize: theme('fontSize.lg'),
              fontWeight: '600',
              lineHeight: '1.3',
              marginTop: '1em',
              marginBottom: '0.5em',
            },
            // Links with grove-forest color
            a: {
              color: theme('colors.grove.forest'),
              textDecoration: 'none',
              '&:hover': {
                textDecoration: 'underline',
              },
            },
            // Blockquotes with grove accent
            blockquote: {
              borderLeftColor: theme('colors.grove.forest'),
              fontStyle: 'italic',
            },
            // Code styling
            code: {
              color: theme('colors.grove.forest'),
              fontWeight: '500',
              '&::before': { content: 'none' },
              '&::after': { content: 'none' },
            },
            // Lists with grove bullets
            'ul > li::marker': {
              color: theme('colors.grove.forest'),
            },
            'ol > li::marker': {
              color: theme('colors.ink.muted'),
            },
          },
        },
      }),
    },
  },
  plugins: [
    // S22-WP: Typography plugin for json-render prose styling
    // Integrates with GroveSkins (paper/ink colors, serif fonts, grove-forest accents)
    typography({
      className: 'prose',
    }),
  ],
};

export default config;
