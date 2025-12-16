import type { Config } from 'tailwindcss';

const config: Config = {
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
        // SURFACE TOKENS (The Village - Paper/Ink aesthetic)
        // Preserved from index.html CDN config
        // ============================================================
        paper: {
          DEFAULT: '#FBFBF9',
          dark: '#F2F0E9',
        },
        ink: {
          DEFAULT: '#1C1C1C',
          muted: '#575757',
          border: '#E5E5E0',
        },
        grove: {
          cream: '#FBFBF9',
          dark: '#1C1C1C',
          forest: '#2F5C3B',
          accent: '#2F5C3B',
          clay: '#D95D39',
          light: '#E5E5E0',
        },
        terminal: {
          bg: '#FFFFFF',
          phosphor: '#1C1C1C',
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
        // Surface fonts
        serif: ['Lora', 'serif'],
        display: ['Playfair Display', 'serif'],
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
      },
      keyframes: {
        'glow-breathe': {
          '0%, 100%': { boxShadow: '0 0 5px rgba(0, 212, 255, 0.2)' },
          '50%': { boxShadow: '0 0 15px rgba(0, 212, 255, 0.4)' },
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
