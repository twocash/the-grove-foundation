# Sprint 6: Chat Styling + Foundation Migration - REPO_AUDIT

**Date:** 2025-12-22
**Auditor:** Claude Code
**Scope:** Chat/Terminal components, color systems, Foundation Console status

---

## Executive Summary

The chat experience has **critical UX issues**:
1. No max-width on messages - unreadable on wide screens
2. No dark mode support - invisible user messages in dark mode
3. Inconsistent styling - user bubbles vs AI border-left style
4. Multiple competing color systems - maintenance nightmare

The Foundation Console is **partially migrated** but the Sprout Queue workflow is already complete.

---

## 1. Mockup Analysis (Target Styling)

### 1.1 Design Tokens from Mockups

```typescript
// From mockup_4_dark.html
colors: {
  "primary": "#197fe6",           // Vibrant blue (user messages, buttons)
  "background-light": "#f6f7f8",  // Light mode page bg
  "background-dark": "#111921",   // Dark mode page bg
  "surface-dark": "#1E293B",      // Cards, AI bubbles (dark)
  "border-dark": "#293038",       // Subtle borders (dark)
}
```

### 1.2 Message Styling from Mockups

**User Message (Dark Mode):**
```html
<div class="p-4 rounded-2xl rounded-tr-sm bg-primary text-white shadow-md">
  <p class="text-sm md:text-base font-medium leading-relaxed">...</p>
</div>
```

**AI Message (Dark Mode):**
```html
<div class="p-4 rounded-2xl rounded-tl-sm bg-surface-dark text-slate-100 border border-border-dark shadow-sm">
  <p class="text-sm md:text-base font-normal leading-relaxed">...</p>
</div>
```

**User Message (Light Mode):**
```html
<div class="bg-primary text-white px-5 py-3.5 rounded-2xl rounded-tr-none shadow-md text-[15px] leading-relaxed max-w-[600px]">
```

**AI Message (Light Mode):**
```html
<div class="bg-[#f1f5f9] dark:bg-slate-800 text-[#0e141b] dark:text-slate-200 px-5 py-3.5 rounded-2xl rounded-tl-none shadow-sm text-[15px] leading-relaxed max-w-[600px]">
```

### 1.3 Container Layout from Mockups

**Message Container:**
```html
<!-- Light mode mockup uses max-w-4xl (896px) -->
<div class="flex items-start gap-4 max-w-4xl mx-auto w-full">

<!-- Messages have individual max-width -->
<!-- User: max-w-[85%] md:max-w-[70%] -->
<!-- AI: max-w-[90%] md:max-w-[85%] -->
```

**Input Area (Dark Mode):**
```html
<div class="max-w-[960px] mx-auto relative flex items-end gap-2 p-2 rounded-xl bg-surface-dark border border-border-dark focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50 transition-all shadow-lg">
  <textarea class="w-full bg-transparent border-0 text-white placeholder-slate-500 focus:ring-0 resize-none py-2.5 max-h-32"></textarea>
  <button class="p-2 bg-primary text-white rounded-lg hover:bg-blue-600 transition-colors shadow-md">
    <span class="material-symbols-outlined">send</span>
  </button>
</div>
```

**Input Area (Light Mode):**
```html
<div class="flex items-end gap-2 bg-[#f8fafc] dark:bg-slate-800 rounded-xl p-2 border border-[#e2e8f0] dark:border-slate-700 focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-sm">
```

---

## 2. Current Implementation Analysis

### 2.1 Core Files

| File | Lines | Purpose |
|------|-------|---------|
| `components/Terminal.tsx` | 1469 | Main terminal drawer |
| `components/Terminal/CommandInput/CommandInput.tsx` | 215 | Input with command palette |
| `components/Terminal/SuggestionChip.tsx` | ~50 | Clickable suggestion buttons |

### 2.2 Current Message Styling vs Target

| Element | Current | Target (Mockup) |
|---------|---------|-----------------|
| **Container max-width** | None | `max-w-4xl mx-auto` or `max-w-3xl mx-auto` |
| **User bubble bg** | `bg-paper-dark` (#F0EFE9) | `bg-primary` (#197fe6) |
| **User bubble text** | `text-ink` (dark) | `text-white` |
| **User bubble shape** | `rounded-tr-xl rounded-bl-xl rounded-tl-xl` | `rounded-2xl rounded-tr-sm` |
| **AI bubble bg** | None (border-left only) | `bg-surface-dark dark:bg-slate-800` |
| **AI bubble shape** | `border-l-2` | `rounded-2xl rounded-tl-sm` |
| **Input bg** | `bg-white` (hardcoded) | `bg-[#f8fafc] dark:bg-slate-800` |
| **Input focus** | `focus:border-grove-forest` | `focus-within:border-primary focus-within:ring-1` |

### 2.3 Current User Message Code (Terminal.tsx:1117)

```tsx
<div className="bg-paper-dark px-4 py-3 rounded-tr-xl rounded-bl-xl rounded-tl-xl text-ink font-serif border border-ink/5">
  {msg.text.replace(' --verbose', '')}
</div>
```

**Problems:**
- `bg-paper-dark` = #F0EFE9 (light tan) - NO DARK MODE
- `text-ink` = #1A2421 - invisible on dark backgrounds
- `rounded-br-xl` missing (inconsistent)
- Uses `font-serif` - mockups use `font-display` (Manrope)

### 2.4 Current AI Message Code (Terminal.tsx:1121)

```tsx
<div className={`pl-4 border-l-2 ${isSystemError ? 'border-red-500 text-red-700 bg-red-50/50 py-2 pr-2' : 'border-grove-forest/30'}`}>
  <MarkdownRenderer content={msg.text} onPromptClick={handleSuggestion} />
</div>
```

**Problems:**
- Uses border-left style instead of bubble
- No background color - relies on white container
- `border-grove-forest/30` = very light green, hard to see
- No dark mode handling

### 2.5 Current Input Code (CommandInput.tsx:195)

```tsx
<input
  className="w-full bg-white border border-ink/20 p-3 pl-4 pr-10 text-sm font-serif text-ink
             focus:outline-none focus:border-grove-forest focus:ring-1 focus:ring-grove-forest/20
             transition-all rounded-sm placeholder:italic"
/>
```

**Problems:**
- `bg-white` hardcoded - NO DARK MODE
- `rounded-sm` inconsistent with message bubbles (should be `rounded-xl`)
- `text-ink` needs dark mode variant
- Focus uses `grove-forest` instead of `primary`

---

## 3. Color System Analysis

### 3.1 Three Competing Systems

#### System A: Surface/Terminal (Light only) - CURRENT
```css
--color-paper: #F9F8F4;
--color-paper-dark: #F0EFE9;
--color-ink: #1A2421;
--color-grove-forest: #355E3B;
--color-grove-clay: #D95D39;
```

#### System B: Foundation (Dark only) - DEPRECATED
```css
--color-obsidian: #0D0D0D;
--color-holo-cyan: #00D4FF;
```

#### System C: Grove Workspace (Light/Dark) - RECOMMENDED
```css
// tailwind.config.ts
primary: '#4d7c0f',           // Current grove green
'background-light': '#f8f7f5',
'background-dark': '#0f172a',
'surface-light': '#ffffff',
'surface-dark': '#1e293b',
```

### 3.2 Mockup Color System - NEW TARGET
```css
primary: '#197fe6',           // Vibrant blue (CHANGE from green)
'background-light': '#f6f7f8',
'background-dark': '#111921',
'surface-dark': '#1E293B',
'border-dark': '#293038',
```

### 3.3 Decision Required

**Option A:** Keep green primary (`#4d7c0f`), add mockup surface colors
**Option B:** Switch to blue primary (`#197fe6`) from mockups

The mockups use vibrant blue `#197fe6` for user messages and buttons. This is a significant visual change from the current grove green `#4d7c0f`.

---

## 4. Foundation Console Status

### 4.1 Already Completed (Previous Sprint)

| Component | File | Status |
|-----------|------|--------|
| Workspace Shell | `FoundationWorkspace.tsx` | Unified tokens |
| Navigation | `FoundationNav.tsx` | Unified tokens |
| Header | `FoundationHeader.tsx` | Unified tokens |
| Inspector | `FoundationInspector.tsx` | Unified tokens |
| DataPanel | `components/DataPanel.tsx` | Unified tokens |
| GlowButton | `components/GlowButton.tsx` | Unified tokens |
| MetricCard | `components/MetricCard.tsx` | Unified tokens |
| SproutQueue | `consoles/SproutQueue.tsx` | Unified tokens |
| SproutReviewInspector | `inspectors/SproutReviewInspector.tsx` | Unified tokens |
| JourneyInspector | `inspectors/JourneyInspector.tsx` | Unified tokens |
| NodeInspector | `inspectors/NodeInspector.tsx` | Unified tokens |
| useNarrativeSchema | `hooks/useNarrativeSchema.ts` | New hook |
| useSproutQueue | `hooks/useSproutQueue.ts` | New hook |

### 4.2 Sprout Queue - COMPLETE

The Sprout Queue moderation workflow is already implemented:
- `src/core/schema/sprout-queue.ts` - Type definitions
- `src/foundation/hooks/useSproutQueue.ts` - Data hook with mock data
- `src/foundation/consoles/SproutQueue.tsx` - Full UI with filtering
- `src/foundation/consoles/SproutSubmissionCard.tsx` - Card component
- `src/foundation/inspectors/SproutReviewInspector.tsx` - Review panel with approve/reject/flag

---

## 5. Gap Analysis

### 5.1 Chat Styling (Priority 1)

| Gap | Severity | Effort |
|-----|----------|--------|
| No message max-width | Critical | Low |
| User bubble wrong colors | Critical | Low |
| AI bubble wrong style | Critical | Medium |
| No dark mode support | Critical | Medium |
| Input wrong styling | Medium | Low |
| Font mismatch | Low | Low |

### 5.2 Color Token Updates

| Gap | Action |
|-----|--------|
| Missing `surface-dark` | Add `#1E293B` to tailwind.config.ts |
| Missing `border-dark` | Add `#293038` to tailwind.config.ts |
| Primary color decision | Decide: keep green or switch to blue |

### 5.3 Foundation Console (Priority 2)

Already complete from previous sprint. No additional work needed for core functionality.

---

## 6. Implementation Approach

### 6.1 Recommended: Minimal Change

Focus ONLY on chat message styling without changing:
- Terminal drawer width (480px is fine)
- Lens picker
- Custom lens wizard
- Reveal overlays
- Command palette

### 6.2 Files to Modify

1. **`tailwind.config.ts`** - Add missing color tokens
2. **`components/Terminal.tsx`** - Update message styling (lines 1104-1137)
3. **`components/Terminal/CommandInput/CommandInput.tsx`** - Update input styling

### 6.3 Files NOT to Touch

- `components/Terminal/CustomLensWizard/*`
- `components/Terminal/Reveals/*`
- `components/Terminal/ConversionCTA/*`
- `components/Terminal/Modals/*`

---

## 7. Test Matrix

### 7.1 Chat Tests

| Test | Viewport | Theme | Expected |
|------|----------|-------|----------|
| Message container | 1920px | Light | Messages centered, max ~768px |
| User bubble | Any | Light | Blue bg, white text, rounded-2xl |
| User bubble | Any | Dark | Blue bg, white text, rounded-2xl |
| AI bubble | Any | Light | Light gray bg, dark text, rounded-2xl |
| AI bubble | Any | Dark | Dark surface bg, light text, rounded-2xl |
| Input | Any | Light | Light bg, focus ring |
| Input | Any | Dark | Dark bg, focus ring |

---

## 8. Next Steps

1. **Phase 0.2: SPEC.md** - Finalize primary color decision (green vs blue)
2. **Phase 0.3: ARCHITECTURE.md** - Component structure for message bubbles
3. **Phase 0.4: STORIES.md** - Prioritized implementation tasks
4. **Phase 0.5: Execute** - Implement changes

---

## Appendix A: Key Code Locations

### Terminal Message Rendering (Terminal.tsx:1104-1137)

```tsx
{terminalState.messages.map((msg) => (
  <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
    <div className="text-[10px] font-mono text-ink-muted mb-2 uppercase tracking-widest">
      {msg.role === 'user' ? 'You' : 'The Grove'}
    </div>
    <div className={`max-w-[95%] text-sm ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
      {msg.role === 'user' ? (
        <div className="bg-paper-dark px-4 py-3 rounded-tr-xl rounded-bl-xl rounded-tl-xl text-ink font-serif border border-ink/5">
          {msg.text}
        </div>
      ) : (
        <div className={`pl-4 border-l-2 border-grove-forest/30`}>
          <MarkdownRenderer content={msg.text} />
        </div>
      )}
    </div>
  </div>
))}
```

### Target Message Rendering (from mockups)

```tsx
{messages.map((msg) => (
  <div className={`flex items-start gap-4 ${msg.role === 'user' ? 'justify-end' : ''} max-w-4xl mx-auto w-full`}>
    <div className={`flex flex-col gap-1 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
      <div className="flex items-center gap-2 mb-1">
        <p className={`text-sm font-bold ${msg.role === 'user' ? 'text-slate-700 dark:text-slate-300' : 'text-primary'}`}>
          {msg.role === 'user' ? 'You' : 'The Grove AI'}
        </p>
        <span className="text-xs text-slate-500">{msg.timestamp}</span>
      </div>
      <div className={`px-5 py-3.5 rounded-2xl shadow-sm text-[15px] leading-relaxed max-w-[600px] ${
        msg.role === 'user'
          ? 'bg-primary text-white rounded-tr-sm'
          : 'bg-slate-100 dark:bg-surface-dark text-slate-900 dark:text-slate-100 border border-slate-200 dark:border-border-dark rounded-tl-sm'
      }`}>
        {msg.text}
      </div>
    </div>
  </div>
))}
```
