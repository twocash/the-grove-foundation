# Execution Prompt — Kinetic Cultivation v1

**Sprint:** `kinetic-cultivation-v1`  
**Handoff Date:** 2024-12-29  
**Executor:** Claude Code CLI

---

## Context

You are implementing the Kinetic Cultivation sprint for The Grove Foundation. This sprint adds **Sprout capture** to the Kinetic Stream - enabling users to select text, capture it as a Sprout with full provenance, and watch it land in a visible Tray.

**Core Innovation:** The Sprout Tray creates **object permanence**. Users see their insight become a thing and land in a place.

---

## Pre-Execution Verification

Before starting, verify:

```bash
cd C:\GitHub\the-grove-foundation

# 1. Clean state
git status  # Should be clean or stash changes

# 2. Dependencies present
npm install

# 3. Build passes
npm run build

# 4. Tests pass
npm test
```

---

## Sprint Documents

Read these before implementing:

| Document | Location | Purpose |
|----------|----------|---------|
| REPO_AUDIT.md | `docs/sprints/kinetic-cultivation-v1/` | File locations |
| SPEC.md | `docs/sprints/kinetic-cultivation-v1/` | Requirements |
| ARCHITECTURE.md | `docs/sprints/kinetic-cultivation-v1/` | Component design |
| DECISIONS.md | `docs/sprints/kinetic-cultivation-v1/` | ADRs |
| MIGRATION.md | `docs/sprints/kinetic-cultivation-v1/` | File operations |
| SPRINTS.md | `docs/sprints/kinetic-cultivation-v1/` | Story breakdown |
| PROJECT_PATTERNS.md | Repository root | Pattern compliance |

---

## Epic 1: The Grasp (Day 1)

**Goal:** Text selection triggers Magnetic Pill.

### Step 1.1: Create config file

```bash
mkdir -p src/features/kinetic/config
```

Create `src/features/kinetic/config/sprout-capture.config.ts`:

```typescript
/**
 * TEMPORARY: Structured for future JSON extraction.
 * Extract to: data/sprout-actions.json when multiple actions needed.
 * See: docs/sprints/kinetic-cultivation-v1/SPEC.md → Declarative Extraction Roadmap
 */

export const SPROUT_CAPTURE_CONFIG = {
  defaultAction: {
    id: 'sprout',
    label: 'Plant Sprout',
    icon: '🌱',
    defaultStage: 'tender' as const,
  },
  
  captureFields: {
    required: ['content', 'provenance.sourceId', 'provenance.sourceType'],
    optional: ['tags', 'notes', 'provenance.lensId', 'provenance.journeyId'],
  },
  
  ui: {
    pill: {
      magneticScale: 1.15,
      magneticDistance: 50,
    },
    card: {
      maxPreviewLength: 100,
      maxTags: 10,
    },
    tray: {
      collapsedWidth: 48,
      expandedWidth: 240,
    },
  },
  
  animation: {
    pillSpring: { stiffness: 400, damping: 30 },
    cardExpand: { duration: 0.2 },
    flight: { duration: 0.5 },
    counterSpring: { stiffness: 500, damping: 15 },
  },
} as const;

export type SproutCaptureConfig = typeof SPROUT_CAPTURE_CONFIG;
```

### Step 1.2: Create useTextSelection hook

Create `src/features/kinetic/hooks/useTextSelection.ts`:

```typescript
import { useState, useLayoutEffect, useCallback, RefObject } from 'react';

export interface SelectionState {
  text: string;
  rect: DOMRect;
  messageId: string | null;
  contextSpan: string;
}

interface UseTextSelectionOptions {
  minLength?: number;
  debounceMs?: number;
}

export function useTextSelection(
  containerRef: RefObject<HTMLElement>,
  options: UseTextSelectionOptions = {}
): SelectionState | null {
  const { minLength = 3, debounceMs = 50 } = options;
  const [selection, setSelection] = useState<SelectionState | null>(null);

  const handleSelectionChange = useCallback(() => {
    const sel = window.getSelection();
    
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      setSelection(null);
      return;
    }

    const text = sel.toString().trim();
    if (text.length < minLength) {
      setSelection(null);
      return;
    }

    // Check if selection is within container
    const range = sel.getRangeAt(0);
    const container = containerRef.current;
    if (!container || !container.contains(range.commonAncestorContainer)) {
      setSelection(null);
      return;
    }

    // Find message ID from closest data attribute
    const messageElement = (range.commonAncestorContainer as Element)
      .closest?.('[data-message-id]') || 
      (range.commonAncestorContainer.parentElement as Element)
        ?.closest?.('[data-message-id]');
    
    const messageId = messageElement?.getAttribute('data-message-id') || null;

    // Skip if no message ID (UI chrome selection)
    if (!messageId) {
      setSelection(null);
      return;
    }

    // Get bounding rect for pill positioning
    const rect = range.getBoundingClientRect();

    // Get context span (surrounding paragraph)
    const contextNode = messageElement?.closest('p') || messageElement;
    const contextSpan = contextNode?.textContent?.slice(0, 200) || '';

    setSelection({
      text,
      rect,
      messageId,
      contextSpan,
    });
  }, [containerRef, minLength]);

  useLayoutEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const debouncedHandler = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleSelectionChange, debounceMs);
    };

    document.addEventListener('selectionchange', debouncedHandler);
    
    return () => {
      document.removeEventListener('selectionchange', debouncedHandler);
      clearTimeout(timeoutId);
    };
  }, [handleSelectionChange, debounceMs]);

  // Clear on click outside
  useLayoutEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const sel = window.getSelection();
      if (sel?.isCollapsed) {
        setSelection(null);
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  return selection;
}
```

### Step 1.3: Create MagneticPill component

Create `src/features/kinetic/components/MagneticPill.tsx`:

```typescript
import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { useState, useEffect } from 'react';
import { SPROUT_CAPTURE_CONFIG } from '../config/sprout-capture.config';

interface MagneticPillProps {
  position: { x: number; y: number };
  onActivate: () => void;
  layoutId: string;
}

export function MagneticPill({ position, onActivate, layoutId }: MagneticPillProps) {
  const { magneticScale, magneticDistance } = SPROUT_CAPTURE_CONFIG.ui.pill;
  const { pillSpring } = SPROUT_CAPTURE_CONFIG.animation;
  
  const [isHovered, setIsHovered] = useState(false);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Calculate distance from mouse to pill center
  const distance = useMotionValue(magneticDistance + 1);
  
  // Scale based on proximity
  const scale = useSpring(
    useTransform(distance, [0, magneticDistance], [magneticScale, 1]),
    pillSpring
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - position.x;
      const dy = e.clientY - position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      distance.set(dist);
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [position.x, position.y, distance, mouseX, mouseY]);

  // Clamp to viewport
  const clampedX = Math.min(Math.max(position.x, 30), window.innerWidth - 30);
  const clampedY = Math.min(Math.max(position.y, 30), window.innerHeight - 30);

  return (
    <motion.button
      layoutId={layoutId}
      className="fixed z-50 flex items-center justify-center w-8 h-8 rounded-full 
                 bg-[var(--pill-bg)] hover:bg-[var(--pill-bg-hover)]
                 text-[var(--pill-text)] shadow-[var(--pill-shadow)]
                 backdrop-blur-sm cursor-pointer
                 focus:outline-none focus:ring-2 focus:ring-white/30"
      style={{
        left: clampedX,
        top: clampedY,
        translateX: '-50%',
        translateY: '-50%',
        scale,
      }}
      onClick={onActivate}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      aria-label="Capture as Sprout"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
    >
      <span className="text-sm">🌱</span>
    </motion.button>
  );
}
```

### Step 1.4: Wire into KineticStream

Modify `src/features/kinetic/KineticStream.tsx`:

```typescript
// Add imports
import { useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { useTextSelection } from './hooks/useTextSelection';
import { MagneticPill } from './components/MagneticPill';

// Inside component:
const streamRef = useRef<HTMLDivElement>(null);
const selection = useTextSelection(streamRef);
const [isCapturing, setIsCapturing] = useState(false);

// In JSX, wrap stream content with ref:
<div ref={streamRef} className="...existing classes...">
  {/* existing stream content */}
</div>

// Add pill (outside the scrolling container):
<AnimatePresence>
  {selection && !isCapturing && (
    <MagneticPill
      position={{ x: selection.rect.right, y: selection.rect.bottom }}
      onActivate={() => setIsCapturing(true)}
      layoutId="sprout-capture"
    />
  )}
</AnimatePresence>
```

### Step 1.5: Create E2E tests for Epic 1

Create `tests/e2e/sprout-capture.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Sprout Capture - Selection', () => {
  test('pill appears when text is selected in message', async ({ page }) => {
    await page.goto('/terminal');
    
    const message = page.locator('[data-message-id]').first();
    await message.selectText();
    
    await expect(page.getByLabel('Capture as Sprout')).toBeVisible();
  });

  test('pill does not appear when selecting UI chrome', async ({ page }) => {
    await page.goto('/terminal');
    
    const header = page.locator('header').first();
    await header.selectText();
    
    await expect(page.getByLabel('Capture as Sprout')).not.toBeVisible();
  });

  test('pill dismisses when clicking outside', async ({ page }) => {
    await page.goto('/terminal');
    
    const message = page.locator('[data-message-id]').first();
    await message.selectText();
    await expect(page.getByLabel('Capture as Sprout')).toBeVisible();
    
    await page.locator('body').click({ position: { x: 10, y: 10 } });
    await expect(page.getByLabel('Capture as Sprout')).not.toBeVisible();
  });
});
```

### Build Gate (Epic 1)

```bash
npm run build
npm test
npx playwright test tests/e2e/sprout-capture.spec.ts --grep "Selection"
```

---

## Epic 2: The Seed Packet (Day 2)

**Goal:** Capture card with context auto-fill.

### Step 2.1: Update Sprout schema

Modify `src/core/schema/sprout.ts`:

```typescript
// Add new interface
export interface SproutProvenance {
  sourceId: string;
  sourceType: 'message' | 'journey_node' | 'static_content';
  contextSpan: string;
  selectionRange?: { start: number; end: number };
  lensId?: string;
  journeyId?: string;
  nodeId?: string;
}

// Extend Sprout interface
export interface Sprout {
  id: string;
  type: 'sprout';
  content: string;
  provenance: SproutProvenance;
  tags: string[];
  stage: GrowthStage;
  createdAt: number;
  modifiedAt?: number;
  sessionId: string;
  derivedFrom?: string;
  derivatives?: string[];
  
  // DEPRECATED: Remove after Terminal migration
  /** @deprecated Use provenance.lensId */
  personaId?: string;
  /** @deprecated Use provenance.journeyId */  
  journeyId?: string;
  /** @deprecated Use provenance.contextSpan */
  query?: string;
}
```

### Step 2.2: Create SproutCaptureCard

Create `src/features/kinetic/components/SproutCaptureCard.tsx`:

```typescript
import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { X } from 'lucide-react';
import { SPROUT_CAPTURE_CONFIG } from '../config/sprout-capture.config';
import { SelectionState } from '../hooks/useTextSelection';

interface SproutCaptureCardProps {
  selection: SelectionState;
  lensId?: string;
  journeyId?: string;
  onCapture: (tags: string[]) => void;
  onCancel: () => void;
  layoutId: string;
}

export function SproutCaptureCard({
  selection,
  lensId,
  journeyId,
  onCapture,
  onCancel,
  layoutId,
}: SproutCaptureCardProps) {
  const { maxPreviewLength, maxTags } = SPROUT_CAPTURE_CONFIG.ui.card;
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  const handleTagInput = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newTag = tagInput.trim().replace(',', '');
      if (newTag && tags.length < maxTags && !tags.includes(newTag)) {
        setTags([...tags, newTag]);
        setTagInput('');
      } else if (!newTag && e.key === 'Enter') {
        // Empty input + Enter = submit
        handleSubmit();
      }
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSubmit = () => {
    onCapture(tags);
  };

  const preview = selection.text.slice(0, maxPreviewLength) + 
    (selection.text.length > maxPreviewLength ? '...' : '');

  return (
    <motion.div
      layoutId={layoutId}
      className="fixed z-50 w-80 rounded-xl overflow-hidden
                 bg-[var(--capture-card-bg)] border border-[var(--capture-card-border)]
                 backdrop-blur-[var(--capture-card-backdrop-blur)]
                 shadow-2xl"
      style={{
        left: Math.min(selection.rect.right + 10, window.innerWidth - 340),
        top: Math.min(selection.rect.top, window.innerHeight - 300),
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <span className="text-sm font-medium text-white/90">🌱 Plant Sprout</span>
        <button
          onClick={onCancel}
          className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Preview */}
      <div className="px-4 py-3 border-b border-white/10">
        <p className="text-sm text-white/80 italic">"{preview}"</p>
      </div>

      {/* Lens badge */}
      {lensId && (
        <div className="px-4 py-2 border-b border-white/10">
          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full 
                          bg-white/10 text-xs text-white/70">
            📌 {lensId}
          </span>
        </div>
      )}

      {/* Tags */}
      <div className="px-4 py-3 border-b border-white/10">
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 px-2 py-1 rounded-full
                        bg-emerald-500/20 text-emerald-300 text-xs"
            >
              {tag}
              <button
                onClick={() => removeTag(tag)}
                className="hover:text-white"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <input
          ref={inputRef}
          type="text"
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={handleTagInput}
          placeholder="Add tags (comma or enter)"
          className="w-full bg-transparent text-sm text-white placeholder-white/40
                    focus:outline-none"
        />
      </div>

      {/* Submit */}
      <div className="px-4 py-3">
        <button
          onClick={handleSubmit}
          className="w-full py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500
                    text-white font-medium text-sm transition-colors"
        >
          Plant Sprout 🌱
        </button>
      </div>
    </motion.div>
  );
}
```

### Step 2.3: Create useSproutCapture hook

Create `src/features/kinetic/hooks/useSproutCapture.ts`:

```typescript
import { useState, useCallback } from 'react';
import { SelectionState } from './useTextSelection';

interface CaptureState {
  isCapturing: boolean;
  selection: SelectionState | null;
}

export function useSproutCapture() {
  const [state, setState] = useState<CaptureState>({
    isCapturing: false,
    selection: null,
  });

  const startCapture = useCallback((selection: SelectionState) => {
    setState({ isCapturing: true, selection });
  }, []);

  const cancelCapture = useCallback(() => {
    setState({ isCapturing: false, selection: null });
    window.getSelection()?.removeAllRanges();
  }, []);

  const confirmCapture = useCallback(async (
    tags: string[],
    lensId?: string,
    journeyId?: string
  ): Promise<string> => {
    if (!state.selection) throw new Error('No selection to capture');

    // This will integrate with sproutStore in Epic 3
    const sproutId = crypto.randomUUID();
    
    console.log('Capturing sprout:', {
      id: sproutId,
      content: state.selection.text,
      tags,
      provenance: {
        sourceId: state.selection.messageId,
        sourceType: 'message',
        contextSpan: state.selection.contextSpan,
        lensId,
        journeyId,
      },
    });

    setState({ isCapturing: false, selection: null });
    window.getSelection()?.removeAllRanges();
    
    return sproutId;
  }, [state.selection]);

  return {
    state,
    startCapture,
    confirmCapture,
    cancelCapture,
  };
}
```

### Step 2.4: Add E2E tests for Epic 2

Add to `tests/e2e/sprout-capture.spec.ts`:

```typescript
test.describe('Sprout Capture - Card', () => {
  test('capture card opens when pill is clicked', async ({ page }) => {
    await page.goto('/terminal');
    
    const message = page.locator('[data-message-id]').first();
    await message.selectText();
    await page.getByLabel('Capture as Sprout').click();
    
    await expect(page.getByText('Plant Sprout')).toBeVisible();
    await expect(page.getByRole('button', { name: /Plant Sprout/i })).toBeVisible();
  });

  test('ESC dismisses capture card', async ({ page }) => {
    await page.goto('/terminal');
    
    const message = page.locator('[data-message-id]').first();
    await message.selectText();
    await page.getByLabel('Capture as Sprout').click();
    
    await expect(page.getByText('Plant Sprout')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByText('Plant Sprout')).not.toBeVisible();
  });

  test('tags can be added with comma', async ({ page }) => {
    await page.goto('/terminal');
    
    const message = page.locator('[data-message-id]').first();
    await message.selectText();
    await page.getByLabel('Capture as Sprout').click();
    
    await page.getByPlaceholder('Add tags').fill('insight,');
    await expect(page.getByText('insight').first()).toBeVisible();
  });
});
```

### Build Gate (Epic 2)

```bash
npm run build
npm test
npx playwright test tests/e2e/sprout-capture.spec.ts --grep "Card"
```

---

## Epic 3: The Tray (Day 3)

**Goal:** Visible container with flight animation.

### Step 3.1: Create sproutStore

Create `src/features/kinetic/store/sproutStore.ts`:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Sprout, GrowthStage } from '@/core/schema/sprout';

interface SproutStore {
  sprouts: Sprout[];
  addSprout: (data: Omit<Sprout, 'id' | 'createdAt'>) => string;
  removeSprout: (id: string) => void;
  updateSprout: (id: string, updates: Partial<Sprout>) => void;
  undoRemove: (sprout: Sprout) => void;
}

export const useSproutStore = create<SproutStore>()(
  persist(
    (set, get) => ({
      sprouts: [],

      addSprout: (data) => {
        const id = crypto.randomUUID();
        const sprout: Sprout = {
          ...data,
          id,
          createdAt: Date.now(),
        };
        set((state) => ({
          sprouts: [sprout, ...state.sprouts],
        }));
        return id;
      },

      removeSprout: (id) => {
        set((state) => ({
          sprouts: state.sprouts.filter((s) => s.id !== id),
        }));
      },

      updateSprout: (id, updates) => {
        set((state) => ({
          sprouts: state.sprouts.map((s) =>
            s.id === id ? { ...s, ...updates, modifiedAt: Date.now() } : s
          ),
        }));
      },

      undoRemove: (sprout) => {
        set((state) => ({
          sprouts: [sprout, ...state.sprouts],
        }));
      },
    }),
    {
      name: 'grove-sprouts',
      version: 1,
    }
  )
);
```

### Step 3.2: Add tokens to globals.css

Add to `src/app/globals.css`:

```css
:root {
  /* Tray namespace */
  --tray-width-collapsed: 48px;
  --tray-width-expanded: 240px;
  --tray-bg: rgba(0, 0, 0, 0.6);
  --tray-bg-hover: rgba(0, 0, 0, 0.7);
  --tray-border: rgba(255, 255, 255, 0.1);
  --tray-border-hover: rgba(255, 255, 255, 0.15);
  --tray-backdrop-blur: 12px;
  --tray-shadow: 0 4px 24px rgba(0, 0, 0, 0.3);
  --tray-badge-bg: var(--grove-accent, #10b981);
  --tray-badge-text: white;

  /* Pill namespace */
  --pill-bg: rgba(16, 185, 129, 0.9);
  --pill-bg-hover: rgba(16, 185, 129, 1);
  --pill-text: white;
  --pill-shadow: 0 2px 8px rgba(16, 185, 129, 0.4);

  /* Capture card */
  --capture-card-bg: rgba(0, 0, 0, 0.8);
  --capture-card-border: rgba(255, 255, 255, 0.15);
  --capture-card-backdrop-blur: 16px;
}
```

### Step 3.3: Create SproutCard

Create `src/features/kinetic/components/SproutCard.tsx`:

```typescript
import { motion } from 'framer-motion';
import { Trash2 } from 'lucide-react';
import { Sprout } from '@/core/schema/sprout';

interface SproutCardProps {
  sprout: Sprout;
  onDelete: (id: string) => void;
}

function timeAgo(timestamp: number): string {
  const seconds = Math.floor((Date.now() - timestamp) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function SproutCard({ sprout, onDelete }: SproutCardProps) {
  const preview = sprout.content.slice(0, 60) + 
    (sprout.content.length > 60 ? '...' : '');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="group p-3 rounded-lg bg-white/5 hover:bg-white/10 
                 border border-white/10 transition-colors"
    >
      <p className="text-sm text-white/80 mb-2 line-clamp-2">{preview}</p>
      
      <div className="flex items-center justify-between">
        <div className="flex flex-wrap gap-1">
          {sprout.tags.slice(0, 3).map(tag => (
            <span
              key={tag}
              className="px-1.5 py-0.5 rounded bg-emerald-500/20 
                        text-emerald-300 text-xs"
            >
              {tag}
            </span>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/40">
            {timeAgo(sprout.createdAt)}
          </span>
          <button
            onClick={() => onDelete(sprout.id)}
            className="p-1 rounded opacity-0 group-hover:opacity-100
                      hover:bg-red-500/20 text-white/40 hover:text-red-400
                      transition-all"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
```

### Step 3.4: Create SproutTray

Create `src/features/kinetic/components/SproutTray.tsx`:

```typescript
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sprout } from 'lucide-react';
import { useSproutStore } from '../store/sproutStore';
import { SproutCard } from './SproutCard';
import { SPROUT_CAPTURE_CONFIG } from '../config/sprout-capture.config';

export function SproutTray() {
  const { collapsedWidth, expandedWidth } = SPROUT_CAPTURE_CONFIG.ui.tray;
  const { counterSpring } = SPROUT_CAPTURE_CONFIG.animation;
  
  const [isExpanded, setIsExpanded] = useState(false);
  const sprouts = useSproutStore((s) => s.sprouts);
  const removeSprout = useSproutStore((s) => s.removeSprout);
  const undoRemove = useSproutStore((s) => s.undoRemove);

  const handleDelete = (id: string) => {
    const sprout = sprouts.find(s => s.id === id);
    if (!sprout) return;
    
    removeSprout(id);
    
    // Show undo toast (implement with your toast system)
    // For now, just log
    console.log('Sprout deleted. Undo available for 2s.');
  };

  return (
    <motion.div
      className="fixed right-0 top-0 h-full z-40
                 bg-[var(--tray-bg)] backdrop-blur-[var(--tray-backdrop-blur)]
                 border-l border-[var(--tray-border)]
                 shadow-[var(--tray-shadow)]
                 flex flex-col"
      initial={false}
      animate={{
        width: isExpanded ? expandedWidth : collapsedWidth,
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 35 }}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Sprout className="w-5 h-5 text-emerald-400" />
          {isExpanded && (
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm font-medium text-white/80"
            >
              Sprouts
            </motion.span>
          )}
        </div>
        
        {/* Counter badge */}
        <motion.span
          key={sprouts.length}
          initial={{ scale: 1.5 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', ...counterSpring }}
          className="flex items-center justify-center min-w-[20px] h-5 
                    px-1.5 rounded-full text-xs font-medium
                    bg-[var(--tray-badge-bg)] text-[var(--tray-badge-text)]"
        >
          {sprouts.length}
        </motion.span>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-2">
        <AnimatePresence mode="popLayout">
          {sprouts.length === 0 ? (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-xs text-white/40 text-center py-8"
            >
              {isExpanded ? 'Select text to plant sprouts 🌱' : '🌱'}
            </motion.p>
          ) : (
            <div className="space-y-2">
              {sprouts.map(sprout => (
                <SproutCard
                  key={sprout.id}
                  sprout={sprout}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
```

### Step 3.5: Create flight animation

Create `src/features/kinetic/animations/sproutFlight.ts`:

```typescript
import { Variants } from 'framer-motion';

export interface FlightConfig {
  startRect: DOMRect;
  endRect: DOMRect;
  duration?: number;
}

export const createFlightVariants = (config: FlightConfig): Variants => {
  const { startRect, endRect, duration = 0.5 } = config;
  
  // Calculate bezier control points for natural arc
  const startX = startRect.left + startRect.width / 2;
  const startY = startRect.top + startRect.height / 2;
  const endX = endRect.left + endRect.width / 2;
  const endY = endRect.top + endRect.height / 2;
  
  // Control point creates upward arc
  const controlY = Math.min(startY, endY) - 100;

  return {
    initial: {
      x: startX,
      y: startY,
      scale: 1,
      opacity: 1,
    },
    shrink: {
      scale: 0.3,
      transition: { duration: 0.1 },
    },
    fly: {
      x: endX,
      y: endY,
      transition: {
        duration: duration - 0.15,
        ease: [0.22, 1, 0.36, 1], // Custom ease for arc feel
      },
    },
    land: {
      scale: 0,
      opacity: 0,
      transition: { duration: 0.05 },
    },
  };
};

// Orb component for flight animation
export function FlightOrb({ 
  startRect, 
  endRect, 
  onComplete 
}: FlightConfig & { onComplete: () => void }) {
  // Implementation uses motion.div with variants
  // Called from capture flow when sprout is created
  return null; // Placeholder - implement with motion.div
}
```

### Step 3.6: Wire tray into KineticShell

Modify `src/features/kinetic/KineticShell.tsx`:

```typescript
// Add import
import { SproutTray } from './components/SproutTray';

// In JSX, add as sibling to main content:
<div className="...existing shell classes...">
  {/* Existing content */}
  <SproutTray />
</div>
```

### Step 3.7: Add E2E tests for Epic 3

Add to `tests/e2e/sprout-capture.spec.ts`:

```typescript
test.describe('Sprout Capture - Tray', () => {
  test('sprout appears in tray after capture', async ({ page }) => {
    await page.goto('/terminal');
    
    const message = page.locator('[data-message-id]').first();
    const messageText = await message.textContent();
    await message.selectText();
    await page.getByLabel('Capture as Sprout').click();
    await page.getByRole('button', { name: /Plant Sprout/i }).click();
    
    const tray = page.locator('[data-testid="sprout-tray"]');
    await tray.hover();
    await expect(tray.locator('[data-testid="sprout-card"]')).toBeVisible();
  });

  test('tray expands on hover', async ({ page }) => {
    await page.goto('/terminal');
    
    const tray = page.locator('[data-testid="sprout-tray"]');
    await tray.hover();
    await expect(tray.getByText('Sprouts')).toBeVisible();
  });

  test('sprouts persist after refresh', async ({ page }) => {
    await page.goto('/terminal');
    
    const message = page.locator('[data-message-id]').first();
    await message.selectText();
    await page.getByLabel('Capture as Sprout').click();
    await page.getByRole('button', { name: /Plant Sprout/i }).click();
    
    await page.reload();
    const tray = page.locator('[data-testid="sprout-tray"]');
    await tray.hover();
    await expect(tray.locator('[data-testid="sprout-card"]')).toHaveCount(1);
  });
});
```

### Step 3.8: Create visual baseline tests

Create `tests/e2e/kinetic-baseline.spec.ts`:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Kinetic Visual Baselines', () => {
  test('tray collapsed state', async ({ page }) => {
    await page.goto('/terminal');
    await expect(page.locator('[data-testid="sprout-tray"]')).toHaveScreenshot('tray-collapsed.png');
  });

  test('tray expanded state', async ({ page }) => {
    await page.goto('/terminal');
    await page.locator('[data-testid="sprout-tray"]').hover();
    await expect(page.locator('[data-testid="sprout-tray"]')).toHaveScreenshot('tray-expanded.png');
  });

  test('capture card state', async ({ page }) => {
    await page.goto('/terminal');
    const message = page.locator('[data-message-id]').first();
    await message.selectText();
    await page.getByLabel('Capture as Sprout').click();
    await expect(page.locator('[data-testid="capture-card"]')).toHaveScreenshot('capture-card.png');
  });
});
```

### Build Gate (Epic 3)

```bash
npm run build
npm test
npx playwright test tests/e2e/sprout-capture.spec.ts --grep "Tray"

# Capture visual baselines (first run only)
npx playwright test tests/e2e/kinetic-baseline.spec.ts --update-snapshots
```

---

## Epic 4: Pilot's Controls (Day 4)

**Goal:** Keyboard shortcuts with visual feedback.

### Step 4.1: Create useKineticShortcuts

Create `src/features/kinetic/hooks/useKineticShortcuts.ts`:

```typescript
import { useEffect, useCallback } from 'react';

interface Shortcut {
  key: string;
  modifiers: ('meta' | 'ctrl')[];
  action: () => void;
}

export function useKineticShortcuts(shortcuts: Shortcut[]) {
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const modifier = isMac ? e.metaKey : e.ctrlKey;

    if (!modifier) return;

    const shortcut = shortcuts.find(s => 
      s.key.toLowerCase() === e.key.toLowerCase()
    );

    if (shortcut) {
      e.preventDefault();
      shortcut.action();
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
```

### Step 4.2: Create KeyboardHUD

Create `src/features/kinetic/components/KeyboardHUD.tsx`:

```typescript
import { motion } from 'framer-motion';
import { useEffect } from 'react';

interface KeyboardHUDProps {
  onDismiss: () => void;
}

const shortcuts = [
  { keys: '⌘L', description: 'Switch lens' },
  { keys: '⌘J', description: 'Browse journeys' },
  { keys: '⌘S', description: 'Capture selection' },
  { keys: '⌘/', description: 'Show this help' },
];

export function KeyboardHUD({ onDismiss }: KeyboardHUDProps) {
  useEffect(() => {
    const handleKeyDown = () => onDismiss();
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onDismiss]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-50 flex items-center justify-center
                 bg-black/60 backdrop-blur-sm"
      onClick={onDismiss}
    >
      <motion.div
        className="bg-black/80 border border-white/20 rounded-2xl
                   backdrop-blur-xl p-6 min-w-[280px]"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-medium text-white mb-4 text-center">
          Keyboard Shortcuts
        </h2>
        <div className="space-y-3">
          {shortcuts.map(({ keys, description }) => (
            <div key={keys} className="flex items-center justify-between gap-8">
              <span className="px-2 py-1 rounded bg-white/10 text-white/90 
                             font-mono text-sm">
                {keys}
              </span>
              <span className="text-white/60 text-sm">{description}</span>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
```

### Step 4.3: Add E2E tests for Epic 4

Add to `tests/e2e/sprout-capture.spec.ts`:

```typescript
test.describe('Sprout Capture - Shortcuts', () => {
  test('Cmd+S triggers capture when text selected', async ({ page }) => {
    await page.goto('/terminal');
    
    const message = page.locator('[data-message-id]').first();
    await message.selectText();
    await page.keyboard.press('Meta+s');
    
    await expect(page.getByText('Plant Sprout')).toBeVisible();
  });

  test('Cmd+S shows toast when no selection', async ({ page }) => {
    await page.goto('/terminal');
    await page.keyboard.press('Meta+s');
    
    await expect(page.getByText('Select text first')).toBeVisible();
  });

  test('Cmd+/ shows keyboard HUD', async ({ page }) => {
    await page.goto('/terminal');
    await page.keyboard.press('Meta+/');
    
    await expect(page.getByText('Keyboard Shortcuts')).toBeVisible();
  });

  test('any key dismisses HUD', async ({ page }) => {
    await page.goto('/terminal');
    await page.keyboard.press('Meta+/');
    await expect(page.getByText('Keyboard Shortcuts')).toBeVisible();
    
    await page.keyboard.press('Escape');
    await expect(page.getByText('Keyboard Shortcuts')).not.toBeVisible();
  });
});
```

### Build Gate (Epic 4)

```bash
npm run build
npm test
npx playwright test tests/e2e/sprout-capture.spec.ts --grep "Shortcuts"
```

---

## Epic 5: Polish (Day 5)

### Step 5.1: Create sproutAdapter

Create `src/features/kinetic/utils/sproutAdapter.ts`:

```typescript
import { Sprout, SproutProvenance } from '@/core/schema/sprout';

interface LegacySprout extends Omit<Sprout, 'provenance'> {
  personaId?: string;
  journeyId?: string;
  query?: string;
  nodeId?: string;
}

export function flattenSprout(sprout: Sprout): LegacySprout {
  const { provenance, ...rest } = sprout;
  return {
    ...rest,
    personaId: provenance?.lensId ?? '',
    journeyId: provenance?.journeyId,
    nodeId: provenance?.nodeId,
    query: provenance?.contextSpan ?? '',
  };
}

export function nestSprout(legacy: LegacySprout): Sprout {
  return {
    ...legacy,
    type: 'sprout',
    provenance: {
      sourceId: legacy.id,
      sourceType: 'message',
      contextSpan: legacy.query ?? '',
      lensId: legacy.personaId,
      journeyId: legacy.journeyId,
      nodeId: legacy.nodeId,
    },
  };
}
```

### Final Build Gate

```bash
npm run build
npm test

# Run all E2E tests
npx playwright test tests/e2e/sprout-capture.spec.ts

# Verify visual baselines haven't regressed
npx playwright test tests/e2e/kinetic-baseline.spec.ts

# Full test summary should show:
# - Selection tests: 3 passed
# - Card tests: 3 passed
# - Tray tests: 3 passed
# - Shortcuts tests: 4 passed
# - Visual baselines: 3 passed
```
```

---

## Troubleshooting

### Pill doesn't appear

1. Check if `[data-message-id]` attribute exists on message elements
2. Verify selection is within containerRef bounds
3. Check console for errors in useTextSelection

### Animation jank

1. Use Chrome DevTools Performance tab
2. Look for layout thrashing
3. Ensure transforms use `translate3d` for GPU acceleration

### localStorage errors

1. Check if storage is full (5MB limit)
2. Verify Zustand persist version matches
3. Clear `grove-sprouts` key and retry

### Shortcuts don't work

1. Check if another handler is catching the event
2. Verify meta/ctrl detection for platform
3. Test in incognito (no extensions)

---

## Post-Sprint

After completing all epics:

1. **Document in DEVLOG.md** — Any deviations from plan
2. **Update PROJECT_PATTERNS.md** — If new pattern emerged
3. **Create PR** — With all changes
4. **Tag release** — `kinetic-cultivation-v1`

---

**Execution prompt ready. Hand off to Claude Code.**

Path: `C:\GitHub\the-grove-foundation\docs\sprints\kinetic-cultivation-v1\EXECUTION_PROMPT.md`
