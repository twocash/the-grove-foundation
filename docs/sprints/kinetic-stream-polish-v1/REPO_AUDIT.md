# Repository Audit: kinetic-stream-polish-v1

**Purpose:** Document current animation and styling state, identify gaps for polish implementation.

---

## 1. Current State Analysis

### 1.1 Animation Landscape

```
┌─────────────────────────────────────────────────────────────────┐
│                     CURRENT ANIMATION STATE                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Terminal Chat                                                   │
│       ├── cursor-blink (CSS keyframes)                          │
│       ├── smooth scroll (behavior: smooth)                      │
│       └── No block animations                                   │
│                                                                  │
│  Existing Animations (elsewhere)                                │
│       ├── Loading indicators (pulsing dots)                     │
│       ├── Button hover states (scale, opacity)                  │
│       └── Transition utilities (Tailwind)                       │
│                                                                  │
│  Framer Motion                                                   │
│       └── Installed but minimally used                          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Problems:**
- No entrance animations for messages
- No streaming character reveal
- No glass effects on blocks
- Scroll behavior is basic (just smooth scroll to bottom)
- Input is static (not floating)

### 1.2 Existing Files

| File | Responsibility | Status |
|------|----------------|--------|
| `globals.css` | Base animations, tokens | **WILL EXTEND** |
| `Terminal/Stream/*.tsx` | Block components | **WILL WRAP** with motion |
| `Terminal/TerminalChat.tsx` | Chat container | **WILL MODIFY** for scroll |
| `Terminal/TerminalInput.tsx` | Input component | **WILL MODIFY** for floating |

### 1.3 Tailwind Animation Utilities

Currently available:
```css
/* In tailwind.config.js or globals.css */
.cursor-blink { animation: blink 1s step-end infinite; }
.animate-pulse { /* Tailwind built-in */ }
.transition-all { /* Tailwind built-in */ }
```

### 1.4 Framer Motion Status

```bash
# Package installed
npm list framer-motion
# framer-motion@10.x.x

# Current usage: Minimal
grep -r "motion" components/ --include="*.tsx" | wc -l
# ~5 instances (mostly unused imports)
```

---

## 2. Sprint 2 Components (Dependency)

Sprint 2 (`kinetic-stream-rendering-v1`) creates these components that will receive polish:

### 2.1 Block Components

| Component | Current State | Polish Target |
|-----------|---------------|---------------|
| `QueryBlock` | Static bubble | Slide-in from right |
| `ResponseBlock` | Static bubble | Glass effect + fade-in |
| `NavigationBlock` | Static buttons | Staggered reveal |
| `SystemBlock` | Static pill | Fade in/out |
| `SpanRenderer` | Static highlights | Subtle pulse on hover |

### 2.2 StreamRenderer

```typescript
// Current (Sprint 2)
{allItems.map((item) => (
  <StreamBlock key={item.id} item={item} ... />
))}

// Target (Sprint 3)
<AnimatePresence>
  {allItems.map((item, index) => (
    <motion.div
      key={item.id}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <StreamBlock item={item} ... />
    </motion.div>
  ))}
</AnimatePresence>
```

---

## 3. Target State

### 3.1 Animation Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     TARGET ANIMATION STATE                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  StreamRenderer                                                  │
│       ├── AnimatePresence (exit animations)                     │
│       └── motion.div per block (entrance)                       │
│                                                                  │
│  QueryBlock                                                      │
│       └── Slide from right + fade                               │
│                                                                  │
│  ResponseBlock                                                   │
│       ├── Glass panel effect                                    │
│       ├── Fade in from left                                     │
│       └── StreamingText (character reveal)                      │
│                                                                  │
│  NavigationBlock                                                 │
│       └── Staggered button reveal                               │
│                                                                  │
│  SpanRenderer                                                    │
│       └── Subtle glow pulse on concept spans                    │
│                                                                  │
│  TerminalInput                                                   │
│       ├── Floating at bottom                                    │
│       ├── Glass effect                                          │
│       └── Expand/collapse animation                             │
│                                                                  │
│  ScrollBehavior                                                  │
│       ├── Auto-scroll during streaming                          │
│       ├── Pause on user scroll up                               │
│       └── "New messages" indicator                              │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Component Additions

```
components/Terminal/
├── Stream/
│   ├── StreamRenderer.tsx      [MODIFY] Add AnimatePresence
│   ├── blocks/
│   │   ├── QueryBlock.tsx      [MODIFY] Add motion wrapper
│   │   ├── ResponseBlock.tsx   [MODIFY] Add glass + motion
│   │   └── ...
│   ├── StreamingText.tsx       [NEW] Character reveal animation
│   └── motion/                 [NEW DIRECTORY]
│       ├── index.ts            Barrel export
│       ├── variants.ts         Shared animation variants
│       └── useScrollAnchor.ts  Smart scroll hook
├── TerminalInput.tsx           [MODIFY] Floating + glass
└── FloatingInput.tsx           [NEW] Floating input wrapper
```

---

## 4. Patterns Extended

Per Phase 0 Pattern Check:

| Requirement | Existing Pattern | Extension Approach |
|-------------|------------------|-------------------|
| Glass effects | Pattern 4: Token Namespaces | Add `--glass-*` tokens |
| Motion variants | None | Create shared variants file |
| Scroll behavior | Native smooth scroll | Enhance with Intersection Observer |
| Block styling | `--chat-*` tokens | Add animation tokens |

## 5. Canonical Source Audit

| Capability | Canonical Home | Current Approach | Recommendation |
|------------|----------------|------------------|----------------|
| CSS animations | `globals.css` | cursor-blink | **EXTEND** with new keyframes |
| React animations | Framer Motion | Minimal usage | **USE** properly |
| Scroll control | Browser native | scrollIntoView | **ENHANCE** with hook |
| Glass styling | None | N/A | **CREATE** token system |
| Input position | `TerminalInput.tsx` | Static | **REFACTOR** to floating |

### No Duplication Certification

This sprint does not create parallel implementations. It:
- Wraps existing components with motion (composition)
- Extends existing token system (not new system)
- Creates shared utilities (not per-component)

---

## 6. Gaps Identified

| Gap | Resolution |
|-----|------------|
| No entrance animations | Wrap blocks in motion.div |
| No character streaming | Create StreamingText component |
| No glass effects | Add backdrop-filter + tokens |
| Basic scroll behavior | Create useScrollAnchor hook |
| Static input | Create FloatingInput wrapper |
| No shared variants | Create motion/variants.ts |

---

## 7. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Animation jank | Medium | High | Use GPU-accelerated properties |
| Bundle size increase | Low | Low | Tree-shake Framer Motion |
| Scroll performance | Medium | Medium | Throttle scroll handlers |
| Glass browser compat | Low | Medium | Fallback for no backdrop-filter |
| Motion sickness | Low | High | Respect prefers-reduced-motion |

---

## 8. Dependencies

### Hard Dependencies (Must Exist)

| Dependency | Source | Status |
|------------|--------|--------|
| `StreamRenderer` | Sprint 2 | 📋 Planned |
| Block components | Sprint 2 | 📋 Planned |
| `StreamItem` type | Sprint 1 | 🔄 In Progress |
| Framer Motion | npm | ✅ Installed |

### Soft Dependencies (Enhances)

| Dependency | Purpose | Without It |
|------------|---------|------------|
| `isGenerating` flag | Streaming animation | No character reveal |
| Lens context | Themed glass colors | Default glass only |

---

## 9. Browser Compatibility

### Glass Effects (backdrop-filter)

| Browser | Support | Fallback |
|---------|---------|----------|
| Chrome 76+ | ✅ Full | N/A |
| Firefox 103+ | ✅ Full | N/A |
| Safari 9+ | ✅ With prefix | -webkit-backdrop-filter |
| Edge 79+ | ✅ Full | N/A |
| IE | ❌ None | Solid background |

### Framer Motion

| Browser | Support |
|---------|---------|
| All modern | ✅ Full |
| IE 11 | ❌ None (acceptable) |

---

## 10. Performance Considerations

### Animation Performance

| Property | GPU Accelerated | Use For |
|----------|-----------------|---------|
| `transform` | ✅ Yes | Position, scale |
| `opacity` | ✅ Yes | Fade in/out |
| `filter` | ⚠️ Partial | Blur (sparingly) |
| `backdrop-filter` | ⚠️ Partial | Glass (sparingly) |
| `height/width` | ❌ No | Avoid animating |

### Recommendations

1. **Use transform/opacity** for all motion
2. **Avoid layout-triggering** properties
3. **Debounce scroll handlers** (100ms minimum)
4. **Use will-change** sparingly and only during animation
5. **Respect prefers-reduced-motion** media query

---

*Audit completed: December 2024*
