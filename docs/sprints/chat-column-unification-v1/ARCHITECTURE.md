# Architecture: Chat Column Unification v1

**Sprint:** Chat Column Unification v1
**Date:** 2024-12-24

---

## System Context

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              TOKEN ARCHITECTURE                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│   globals.css                                                                │
│   ┌─────────────────────────────────────────────────────────────────────┐   │
│   │  @theme { ... }           ← Tailwind v4 theme tokens                │   │
│   │                                                                      │   │
│   │  :root {                                                             │   │
│   │    --grove-* tokens       ← Workspace shell (nav, header, inspector)│   │
│   │    --chat-* tokens        ← Chat column (NEW)                       │   │
│   │    --theme-* tokens       ← Foundation consoles                     │   │
│   │  }                                                                   │   │
│   └─────────────────────────────────────────────────────────────────────┘   │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
                                      │
                    ┌─────────────────┼─────────────────┐
                    ▼                 ▼                 ▼
            ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
            │ Workspace   │   │ Chat Column │   │ Foundation  │
            │ --grove-*   │   │ --chat-*    │   │ --theme-*   │
            └─────────────┘   └─────────────┘   └─────────────┘
```

---

## Token Namespace Strategy

### Why Three Namespaces?

| Namespace | Surface | Aesthetic | Owner |
|-----------|---------|-----------|-------|
| `--grove-*` | Workspace shell | Cool slate, professional | Workspace components |
| `--chat-*` | Chat/Terminal | Warm forest, organic | Terminal embedded mode |
| `--theme-*` | Foundation | Dark holodeck, technical | Foundation consoles |

**Rationale:** Each surface has a distinct visual language. Forcing them to share tokens would either compromise the design or create complex conditional logic.

### Token Inheritance

```
None - tokens are independent

--grove-* ←/→ --chat-* ←/→ --theme-*
     (no inheritance, no coupling)
```

---

## Component Architecture

### Terminal Render Paths

```typescript
// components/Terminal.tsx

const Terminal: React.FC<TerminalProps> = ({ variant = 'overlay', ... }) => {
  
  // EMBEDDED MODE - Uses --chat-* tokens
  if (variant === 'embedded') {
    return (
      <div className="chat-container">
        <TerminalHeader variant="embedded" />
        <ChatContent />
        <CommandInput variant="embedded" />
      </div>
    );
  }
  
  // OVERLAY MODE - Uses paper/ink (unchanged)
  return (
    <TerminalShell>
      <TerminalHeader variant="overlay" />
      <ChatContent />
      <CommandInput variant="overlay" />
    </TerminalShell>
  );
};
```

### Chat Container Structure

```
┌─────────────────────────────────────────────┐
│ .chat-container                             │
│ (container-type: inline-size)               │
│ bg-[var(--chat-bg)]                         │
├─────────────────────────────────────────────┤
│ TerminalHeader                              │
│ ├── Logo + Title                            │
│ ├── Lens Pill (clickable)                   │
│ ├── Journey Badge                           │
│ └── Streak Counter                          │
├─────────────────────────────────────────────┤
│ .chat-content                               │
│ (flex-1, overflow-y-auto)                   │
│ ├── MessageList                             │
│ │   ├── ModelMessage                        │
│ │   ├── UserMessage                         │
│ │   └── ...                                 │
│ ├── SuggestionChips                         │
│ └── JourneyCard (conditional)               │
├─────────────────────────────────────────────┤
│ CommandInput                                │
│ ├── Input field                             │
│ └── Send button                             │
└─────────────────────────────────────────────┘
```

---

## Token Definitions

### Background Tokens

```css
:root {
  /* Primary background - the main chat area */
  --chat-bg: #1a2421;
  
  /* Elevated surface - cards, panels, raised elements */
  --chat-surface: #243029;
  
  /* Hover state for surfaces */
  --chat-surface-hover: #2d3b32;
  
  /* Input field background */
  --chat-input-bg: #243029;
}
```

**Usage:**
- `.chat-container` → `bg-[var(--chat-bg)]`
- Suggestion chips → `bg-[var(--chat-surface)]`
- Input bar → `bg-[var(--chat-input-bg)]`

### Border Tokens

```css
:root {
  /* Default border - subtle */
  --chat-border: #2d3b32;
  
  /* Strong border - emphasis */
  --chat-border-strong: #3d4b42;
  
  /* Accent border - interactive elements */
  --chat-border-accent: #00D4AA;
  
  /* Focus ring */
  --chat-border-focus: #00D4AA;
}
```

**Usage:**
- Header bottom border → `border-[var(--chat-border)]`
- Chip borders → `border-[var(--chat-border)]`
- Chip hover → `hover:border-[var(--chat-border-accent)]`

### Text Tokens

```css
:root {
  /* Primary text - main content */
  --chat-text: rgba(255, 255, 255, 0.9);
  
  /* Muted text - secondary content */
  --chat-text-muted: rgba(255, 255, 255, 0.6);
  
  /* Dim text - tertiary, hints */
  --chat-text-dim: rgba(255, 255, 255, 0.4);
  
  /* Accent text - links, interactive */
  --chat-text-accent: #00D4AA;
}
```

**Usage:**
- Message content → `text-[var(--chat-text)]`
- Sender labels → `text-[var(--chat-text-muted)]`
- Timestamps → `text-[var(--chat-text-dim)]`
- "The Grove" label → `text-[var(--chat-text-accent)]`

### Accent Tokens

```css
:root {
  /* Primary accent - buttons, links, highlights */
  --chat-accent: #00D4AA;
  
  /* Accent hover */
  --chat-accent-hover: #00E4BA;
  
  /* Muted accent - backgrounds */
  --chat-accent-muted: rgba(0, 212, 170, 0.15);
  
  /* Text on accent background */
  --chat-accent-text: #1a2421;
}
```

**Usage:**
- Send button → `bg-[var(--chat-accent)]`
- User message bubble → `bg-[var(--chat-accent)]`
- Text on user bubble → `text-[var(--chat-accent-text)]`

### Glass Tokens

```css
:root {
  /* Subtle glass - model message bg */
  --chat-glass: rgba(255, 255, 255, 0.05);
  
  /* Glass hover */
  --chat-glass-hover: rgba(255, 255, 255, 0.1);
  
  /* Glass border */
  --chat-glass-border: rgba(255, 255, 255, 0.1);
}
```

**Usage:**
- Model messages → `bg-[var(--chat-glass)] border border-[var(--chat-glass-border)]`

### Semantic Tokens

```css
:root {
  --chat-success: #22c55e;
  --chat-warning: #f59e0b;
  --chat-error: #ef4444;
  --chat-error-bg: rgba(239, 68, 68, 0.15);
  --chat-error-border: rgba(239, 68, 68, 0.3);
}
```

---

## Responsive System

### Container Query Approach

```css
/* Define container */
.chat-container {
  container-type: inline-size;
  container-name: chat;
}

/* Define responsive custom properties */
.chat-content {
  --chat-padding-x: 1rem;
  --chat-message-max-width: 90%;
  --chat-chip-columns: 1;
}

/* Compact: < 360px */
@container chat (max-width: 359px) {
  .chat-content {
    --chat-padding-x: 0.75rem;
    --chat-message-max-width: 95%;
    --chat-chip-columns: 1;
  }
}

/* Narrow: 360-479px */
@container chat (min-width: 360px) and (max-width: 479px) {
  .chat-content {
    --chat-padding-x: 1rem;
    --chat-message-max-width: 92%;
    --chat-chip-columns: 1;
  }
}

/* Standard: 480-639px */
@container chat (min-width: 480px) and (max-width: 639px) {
  .chat-content {
    --chat-padding-x: 1rem;
    --chat-message-max-width: 90%;
    --chat-chip-columns: 1;
  }
}

/* Comfortable: 640px+ */
@container chat (min-width: 640px) {
  .chat-content {
    --chat-padding-x: 1.5rem;
    --chat-message-max-width: 85%;
    --chat-chip-columns: 1;
  }
}
```

### Message Width Calculation

```typescript
// Message component
<div 
  className="max-w-[var(--chat-message-max-width)]"
  style={{ maxWidth: 'var(--chat-message-max-width)' }}
>
  {content}
</div>
```

---

## Migration Strategy

### Phase 1: Token Definition (Non-breaking)

1. Add `--chat-*` tokens to `globals.css`
2. No component changes yet
3. Verify tokens render correctly in DevTools

### Phase 2: Terminal.tsx Embedded Branch

1. Replace hardcoded colors with tokens
2. Add `.chat-container` wrapper
3. Test Genesis - should be pixel-identical

### Phase 3: Child Components

1. TerminalHeader → tokens
2. SuggestionChip → tokens
3. CommandInput → tokens
4. Message rendering → tokens

### Phase 4: Responsive Rules

1. Add container query CSS
2. Test at all breakpoints
3. Adjust values as needed

### Phase 5: ExploreChat Cleanup

1. Remove CSS hack block
2. Simplify to minimal wrapper
3. Verify Workspace chat works

---

## File Changes Summary

### New/Modified CSS

```
styles/globals.css
├── Add :root { --chat-* tokens }
└── Add @container chat { ... } responsive rules
```

### Modified Components

```
components/Terminal.tsx
├── Add .chat-container wrapper
├── Replace bg-[#1a2421] → bg-[var(--chat-bg)]
├── Replace text colors
└── Replace message bubble styles

components/Terminal/TerminalHeader.tsx
├── Replace background colors
├── Replace text colors
└── Replace border colors

components/Terminal/SuggestionChip.tsx
├── Replace all hardcoded colors

components/Terminal/CommandInput/*
├── Replace all hardcoded colors

components/Terminal/JourneyCard.tsx
├── Replace Tailwind dark: variants with tokens

components/Terminal/JourneyNav.tsx
├── Replace mixed styles
```

### Deleted Code

```
src/explore/ExploreChat.tsx
└── Delete 100+ lines of CSS hack
```

---

## Testing Strategy

### Unit Tests

- Token values resolve correctly
- Components render without errors

### Visual Regression

- Genesis baseline (existing)
- Workspace chat baseline (new)

### Manual Testing

| Viewport | Surface | Check |
|----------|---------|-------|
| 1440px | Genesis | Split panel styling |
| 1440px | Workspace | Chat matches Genesis |
| 1024px | Genesis | Tablet split |
| 1024px | Workspace | Narrow chat panel |
| 768px | Both | Responsive behavior |
| 375px | Mobile | Compact mode |

---

## Rollback Plan

If issues arise:

1. Revert `globals.css` token additions
2. Revert component changes
3. Restore ExploreChat CSS hack

Git provides atomic rollback via revert commits.
