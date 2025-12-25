# ARCHITECTURE.md — terminal-glass-v1

## Token Hierarchy

```
:root (globals.css)
├── --glass-void: #030712        ← Deepest background
├── --glass-panel: rgba(...)     ← Semi-transparent panels
├── --glass-solid: #111827       ← Opaque surfaces
├── --glass-elevated: rgba(...)  ← Raised elements
├── --glass-border: #1e293b      ← Default borders
├── --glass-border-hover         ← Hover state
├── --glass-border-active        ← Active state
├── --glass-text-primary: #fff   ← Primary text
├── --glass-text-body            ← Body text
├── --glass-text-secondary       ← Secondary text
├── --glass-text-subtle          ← Subtle/muted text
├── --neon-green: #10b981        ← Accent (send, active)
├── --neon-cyan: #06b6d4         ← Focus rings
└── --duration-fast              ← Transitions
```

## Component Architecture

```
Terminal.tsx
├── TerminalShell (chrome layer - drawer, FAB)
│   └── Content Area
│       ├── TerminalHeader
│       │   └── [Glass styling needed: bg, border, text]
│       ├── Messages Container (.glass-chat-container)
│       │   ├── Message (.glass-message)
│       │   │   ├── User (.glass-message-user)
│       │   │   └── Assistant (.glass-message-assistant)
│       │   └── CognitiveBridge (own styling)
│       └── Interactions Footer
│           ├── Journey Controls
│           ├── Scholar Mode Button
│           └── CommandInput
│               ├── Wrapper (.glass-input-wrapper)
│               ├── Field (.glass-input-field)
│               └── Send Button (.glass-send-btn)
```

## Message Bubble Architecture

```
Chat Container (.glass-chat-container)
  bg: --glass-void
  │
  ├── User Message (.glass-message-user)
  │   ├── bg: --glass-elevated
  │   ├── align: right (margin-left: auto)
  │   ├── border-radius: 12px 12px 4px 12px
  │   └── border: --glass-border
  │
  ├── Assistant Message (.glass-message-assistant)
  │   ├── bg: --glass-panel
  │   ├── align: left (margin-right: auto)
  │   ├── border-radius: 12px 12px 12px 4px
  │   ├── border: --glass-border
  │   └── backdrop-filter: blur(8px)
  │
  └── Error Message (.glass-message-error)
      ├── bg: rgba(239, 68, 68, 0.1)
      ├── border: rgba(239, 68, 68, 0.3)
      └── color: #fca5a5
```

## Dynamic Width Strategy

```
Container Width Behavior:
┌─────────────────────────────────────────────────────┐
│  max-w-[min(90%, 56rem)]                            │
│  ├── On narrow screens: 90% of container           │
│  └── On wide screens: caps at 56rem (896px)        │
│                                                     │
│  @media (min-width: 1280px):                       │
│  max-w-[min(85%, 64rem)]                           │
│  └── Even wider on large screens                   │
└─────────────────────────────────────────────────────┘
```

## DEX Compliance

### Declarative Sovereignty
- Glass tokens defined in CSS custom properties
- No persona/lens-specific styling hardcoded
- Theme variations possible via token overrides

### Capability Agnosticism
- Styling independent of AI model capability
- Works with any message content structure
- No model-specific visual treatments

### Provenance
- CSS classes are semantic and traceable
- Token namespace (`--glass-*`) documents origin
- Sprint artifacts track decision chain

### Organic Scalability
- Adding new message types = adding new CSS class
- Token system scales without restructuring
- No code changes needed for color tweaks
