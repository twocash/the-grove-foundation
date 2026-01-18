# Repository Audit — v0.12d Welcome Experience

## Stack
- Framework: React 18 + Vite
- Language: TypeScript 5.x
- Build: Vite
- Styling: Tailwind v4 with design tokens
- Package Manager: npm

## Build Commands
```bash
npm run dev      # Development server
npm run build    # Production build
```

## Key Locations

| Concern | File | Lines | Notes |
|---------|------|-------|-------|
| Terminal Component | `components/Terminal.tsx` | 1-1342 | Main Terminal UI |
| LensPicker | `components/Terminal/LensPicker.tsx` | 1-307 | Current lens selection UI |
| TerminalControls | `components/Terminal/TerminalControls.tsx` | — | Pill button for lens switching |
| CustomLensWizard | `components/Terminal/CustomLensWizard/` | — | Create Your Own flow (directory) |
| Feature Flags (config) | `src/core/config/defaults.ts` | 113-152 | Flag definitions |
| Feature Flags (schema) | `data/narratives-schema.ts` | 229-259 | Schema + defaults |
| Feature Flag Hook | `hooks/useFeatureFlags.ts` | — | Flag consumption |
| Default Personas | `data/default-personas.ts` | — | Lens definitions |

## Current Welcome Flow

### FIRST_TIME_WELCOME Constant
**Location:** `components/Terminal.tsx:50-57`
```typescript
const FIRST_TIME_WELCOME = `Welcome to your Grove.

This Terminal is where you interact with your AI village — trained on your data, running on your hardware, owned by you.

Think of it as ChatGPT, but private. Your Grove never leaves your machine. That's **intellectual independence**: AI that enriches *you*, not corporate shareholders.

**One thing to try:** Lenses let you explore the same knowledge from different perspectives — skeptic, enthusiast, or your own custom view.`;
```

### Terminal State Declarations
**Location:** `components/Terminal.tsx:205-213`
```typescript
const [showLensPicker, setShowLensPicker] = useState<boolean>(false);
const [showCustomLensWizard, setShowCustomLensWizard] = useState<boolean>(false);
const [hasShownWelcome, setHasShownWelcome] = useState<boolean>(false);
```

### Feature Flag Hook
**Location:** `components/Terminal.tsx:307`
```typescript
const showCustomLensInPicker = useFeatureFlag('custom-lens-in-picker');
```

### Welcome useEffect
**Location:** `components/Terminal.tsx:361-384`
```typescript
// Check if we should show welcome message and lens picker on first open
useEffect(() => {
  const hasBeenWelcomed = localStorage.getItem('grove-terminal-welcomed') === 'true';

  if (terminalState.isOpen && !hasBeenWelcomed && !hasShownWelcome) {
    // Inject welcome message into chat
    setTerminalState(prev => ({
      ...prev,
      messages: [...prev.messages, {
        id: 'welcome-' + Date.now(),
        role: 'model',
        text: FIRST_TIME_WELCOME
      }]
    }));

    // Small delay before showing LensPicker
    setTimeout(() => {
      setShowLensPicker(true);
    }, 500);

    setHasShownWelcome(true);
    localStorage.setItem('grove-terminal-welcomed', 'true');
  }
}, [terminalState.isOpen, hasShownWelcome, setTerminalState]);
```

### handleLensSelect Handler
**Location:** `components/Terminal.tsx:387-405`
```typescript
const handleLensSelect = (personaId: string | null) => {
  selectLens(personaId);
  setShowLensPicker(false);
  localStorage.setItem('grove-terminal-welcomed', 'true');

  // Track lens activation via analytics
  if (personaId) {
    trackLensActivated(personaId, personaId.startsWith('custom-'));
    emit.lensSelected(personaId, personaId.startsWith('custom-'), currentArchetypeId || undefined);
    emit.journeyStarted(personaId, currentThread.length || 5);
  }

  if (personaId?.startsWith('custom-')) {
    updateCustomLensUsage(personaId);
  }
};
```

### handleCreateCustomLens Handler
**Location:** `components/Terminal.tsx:408-411`
```typescript
const handleCreateCustomLens = () => {
  setShowLensPicker(false);
  setShowCustomLensWizard(true);
};
```

### Render Section - Conditional Components
**Location:** `components/Terminal.tsx:932-951`
```typescript
{/* Show Custom Lens Wizard, Lens Picker, or Main Terminal */}
{showCustomLensWizard ? (
  <CustomLensWizard
    onComplete={handleCustomLensComplete}
    onCancel={handleCustomLensCancel}
  />
) : showLensPicker ? (
  <LensPicker
    personas={enabledPersonas}
    customLenses={customLenses}
    onSelect={handleLensSelect}
    onCreateCustomLens={handleCreateCustomLens}
    onDeleteCustomLens={handleDeleteCustomLens}
    currentLens={session.activeLens}
    showCreateOption={showCustomLensInPicker}
  />
) : (
  // ... Main Terminal UI
)}
```

## LensPicker Component Structure

### Header Section
**Location:** `components/Terminal/LensPicker.tsx:143-157`
```typescript
{/* Header */}
<div className="px-4 py-6 border-b border-ink/5">
  <div className="font-mono text-[10px] text-ink-muted uppercase tracking-widest mb-2">
    THE GROVE TERMINAL [v2.5.0]
  </div>
  <div className="font-mono text-xs text-grove-forest mb-4">
    Connection established.
  </div>
  <h2 className="font-display text-xl text-ink mb-2">
    Welcome to The Grove
  </h2>
  <p className="font-serif text-sm text-ink-muted italic">
    Which lens fits you best?
  </p>
</div>
```

### Icons Definition
**Location:** `components/Terminal/LensPicker.tsx:9-100`
- Inline SVG components for: Home, GraduationCap, Settings, Globe, Building2, Briefcase, Eye, Compass, Sparkles, Plus, Trash2

### Extended Color Mapping
**Location:** `components/Terminal/LensPicker.tsx:103-116`
```typescript
const EXTENDED_PERSONA_COLORS: Record<PersonaColor | 'custom', {...}> = {
  ...PERSONA_COLORS,
  custom: {
    bg: 'bg-[#6B4B56]',       // Fig
    bgLight: 'bg-[#6B4B56]/10',
    text: 'text-[#6B4B56]',
    border: 'border-[#6B4B56]/30',
    dot: 'bg-[#6B4B56]'
  }
};
```

### Custom Lenses Rendering
**Location:** `components/Terminal/LensPicker.tsx:163-222`
- Shows custom lenses section if any exist
- Each lens has delete button on hover
- Displays journey completion count

### Standard Lenses Rendering
**Location:** `components/Terminal/LensPicker.tsx:224-265`
- Maps over personas array
- Shows icon, label, description
- Highlights currently selected lens

### Create Your Own Option
**Location:** `components/Terminal/LensPicker.tsx:267-291`
```typescript
{/* "Create Your Own" Option - subtle placement at end */}
{showCreateOption && onCreateCustomLens && (
  <>
    <div className="border-t border-ink/5 my-3" />
    <button
      onClick={onCreateCustomLens}
      className="w-full text-left p-4 rounded-lg border border-dashed border-ink/20 transition-all duration-200 group hover:border-[#6B4B56]/40 hover:bg-[#6B4B56]/5"
    >
      // ... content
    </button>
  </>
)}
```

### Footer
**Location:** `components/Terminal/LensPicker.tsx:294-302`
```typescript
{/* Footer hint */}
<div className="px-4 py-3 border-t border-ink/5 bg-paper/50">
  <p className="text-[10px] text-ink-muted text-center">
    You can switch your lens anytime by clicking on your lens in the Terminal
  </p>
</div>
```

## Feature Flag Definitions

### In src/core/config/defaults.ts
**Location:** Lines 115-120
```typescript
{
  id: 'custom-lens-in-picker',
  name: 'Show "Create Your Own" in Lens Picker',
  description: 'Users see custom lens option immediately in the lens picker',
  enabled: false
},
```

### In data/narratives-schema.ts
**Location:** Lines 241-246
```typescript
{
  id: 'custom-lens-in-picker',
  name: 'Show "Create Your Own" in Lens Picker',
  description: 'Users see custom lens option immediately in the lens picker',
  enabled: false
},
```

## localStorage Keys

| Key | Purpose |
|-----|---------|
| `grove-terminal-welcomed` | Tracks if user has seen welcome flow |
| `grove-custom-lenses` | Stores user's custom lens definitions |

## Design Tokens (from Tailwind config)

| Token | Value | Usage |
|-------|-------|-------|
| `grove-clay` | #C97B4A | Accent color (orange) |
| `grove-forest` | #355E3B | Secondary accent (green) |
| `ink` | #1a1a1a | Primary text |
| `ink-muted` | #666666 | Secondary text |
| `paper` | #fafaf8 | Background |

## Gaps Identified

1. **Single component serves two purposes** — LensPicker handles both welcome (first open) and switching (pill click) with identical UI
2. **Welcome copy is split** — `FIRST_TIME_WELCOME` in chat + LensPicker header copy
3. **Create Your Own is hidden** — Feature flag disabled by default
4. **No mode differentiation** — LensPicker doesn't know if it's welcoming or switching
5. **Welcome message hidden** — Injected into chat but LensPicker renders over it
6. **Create Your Own styling** — Uses fig purple, should use grove-clay for emphasis
