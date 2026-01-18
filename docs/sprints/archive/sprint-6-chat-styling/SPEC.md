# Sprint 6: Chat Styling + Foundation Migration - SPEC

**Version:** 1.0
**Date:** 2025-12-22
**Status:** Ready for Implementation

---

## 1. Overview

This sprint fixes critical chat UX issues and completes Foundation Console visual migration.

### 1.1 Sprint Goals

| Priority | Goal | Status |
|----------|------|--------|
| P0 | Chat messages capped at ~768px width | Not Started |
| P0 | User messages have high contrast (white on blue) | Not Started |
| P0 | AI messages readable in dark mode | Not Started |
| P0 | Input area properly styled | Not Started |
| P1 | Foundation Console uses unified tokens | **DONE** (previous sprint) |
| P1 | Sprout Queue moderation workflow | **DONE** (previous sprint) |

### 1.2 Scope Clarification

**In Scope:**
- Terminal.tsx message styling
- CommandInput.tsx input styling
- Color token updates to tailwind.config.ts
- Dark mode support for chat

**Out of Scope (Do NOT touch):**
- Custom lens wizard
- Reveal overlays
- Modals (Help, Stats, Garden, Journeys)
- Suggestion chips (other than color updates)
- Terminal drawer width (480px is fine)

---

## 2. Design Decision: Primary Color

### 2.1 The Question

The mockups use vibrant blue `#197fe6` as the primary color. The current codebase uses grove green `#4d7c0f`.

### 2.2 Recommendation: **Keep Grove Green**

**Rationale:**
- Grove green is established brand identity
- Blue is generic (every chat app uses blue)
- Green ties to "Grove" nature metaphor
- Foundation Console already migrated to green `primary`

**Action:** Use `#4d7c0f` (grove green) for user message bubbles, keep mockup patterns for layout.

### 2.3 Color Tokens to Add

```typescript
// tailwind.config.ts - ADD these tokens
colors: {
  // Keep existing
  'primary': '#4d7c0f',           // Grove green (user messages)
  'background-light': '#f8f7f5',
  'background-dark': '#0f172a',
  'surface-light': '#ffffff',
  'surface-dark': '#1e293b',
  'border-light': '#e7e5e4',
  'border-dark': '#334155',

  // ADD for chat (from mockups)
  'chat-surface': '#1E293B',      // AI message bg (dark mode)
  'chat-border': '#293038',       // AI message border (dark mode)
}
```

---

## 3. Functional Requirements

### 3.1 Message Container

**FR-MC-001:** Messages MUST be constrained to max-width of 768px (`max-w-3xl`)
**FR-MC-002:** Messages MUST center horizontally when container is wider than 768px
**FR-MC-003:** Messages MUST use full width on mobile (<768px viewport)

**Implementation:**
```tsx
// Wrap message area content
<div className="max-w-3xl mx-auto px-4">
  {messages.map(...)}
</div>
```

### 3.2 User Messages

**FR-UM-001:** User message bubble MUST have `bg-primary text-white`
**FR-UM-002:** User message MUST be right-aligned
**FR-UM-003:** User message MUST have `rounded-2xl rounded-tr-sm` shape
**FR-UM-004:** User message MUST have max-width of 70% on desktop, 85% on mobile

**Target Styling:**
```tsx
<div className="flex justify-end">
  <div className="max-w-[85%] md:max-w-[70%]">
    <div className="bg-primary text-white px-5 py-3.5 rounded-2xl rounded-tr-sm shadow-md">
      <p className="text-sm md:text-base leading-relaxed">
        {content}
      </p>
    </div>
  </div>
</div>
```

### 3.3 AI Messages

**FR-AM-001:** AI message MUST have visible background in both light and dark modes
**FR-AM-002:** AI message MUST be left-aligned
**FR-AM-003:** AI message MUST have `rounded-2xl rounded-tl-sm` shape
**FR-AM-004:** AI message MUST have visible border in dark mode

**Target Styling:**
```tsx
<div className="flex justify-start">
  <div className="max-w-[90%] md:max-w-[85%]">
    <div className="bg-slate-100 dark:bg-surface-dark text-slate-900 dark:text-slate-100
                    px-5 py-3.5 rounded-2xl rounded-tl-sm shadow-sm
                    border border-slate-200 dark:border-border-dark">
      <MarkdownRenderer content={content} />
    </div>
  </div>
</div>
```

### 3.4 Message Labels

**FR-ML-001:** Labels MUST show sender name and timestamp
**FR-ML-002:** User label MUST be right-aligned above user message
**FR-ML-003:** AI label MUST be left-aligned above AI message
**FR-ML-004:** AI name SHOULD use `text-primary` color

**Target Styling:**
```tsx
// User
<div className="flex items-center gap-2 mb-1 justify-end">
  <span className="text-xs text-slate-500">{timestamp}</span>
  <span className="text-xs font-bold text-slate-700 dark:text-slate-300">You</span>
</div>

// AI
<div className="flex items-center gap-2 mb-1">
  <span className="text-xs font-bold text-primary">The Grove AI</span>
  <span className="text-xs text-slate-500">{timestamp}</span>
</div>
```

### 3.5 Input Area

**FR-IN-001:** Input container MUST have visible background
**FR-IN-002:** Input MUST have visible border
**FR-IN-003:** Input MUST have focus ring on focus
**FR-IN-004:** Send button MUST have `bg-primary` background

**Target Styling:**
```tsx
<div className="bg-surface-light dark:bg-surface-dark rounded-xl p-2
                border border-border-light dark:border-border-dark
                focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50
                transition-all shadow-sm">
  <textarea
    className="w-full bg-transparent border-0 text-slate-900 dark:text-white
               placeholder-slate-500 focus:ring-0 resize-none py-2.5"
    placeholder="Type a message..."
  />
  <button className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
    <span className="material-symbols-outlined">send</span>
  </button>
</div>
```

### 3.6 Dark Mode Support

**FR-DM-001:** All chat elements MUST support both light and dark modes
**FR-DM-002:** Dark mode MUST use `dark:` Tailwind prefix
**FR-DM-003:** Text contrast MUST meet WCAG AA (4.5:1 ratio)

---

## 4. Non-Functional Requirements

### 4.1 Performance

**NFR-P-001:** No additional JS bundle size increase beyond styling changes
**NFR-P-002:** No new components required (update existing)

### 4.2 Compatibility

**NFR-C-001:** Changes MUST NOT break existing Terminal functionality
**NFR-C-002:** Changes MUST NOT break Command Palette
**NFR-C-003:** Changes MUST NOT affect Custom Lens Wizard

### 4.3 Maintainability

**NFR-M-001:** Use Tailwind utility classes (no custom CSS)
**NFR-M-002:** Use design token variables where possible

---

## 5. Implementation Plan

### 5.1 Files to Modify

| File | Changes |
|------|---------|
| `tailwind.config.ts` | Add `chat-surface`, `chat-border` tokens |
| `components/Terminal.tsx` | Update lines 1104-1137 (message rendering) |
| `components/Terminal/CommandInput/CommandInput.tsx` | Update input styling |

### 5.2 Files NOT to Modify

- `components/Terminal/CustomLensWizard/*`
- `components/Terminal/Reveals/*`
- `components/Terminal/ConversionCTA/*`
- `components/Terminal/Modals/*`
- Any Foundation Console files (already done)

### 5.3 Implementation Order

1. **Update tailwind.config.ts** - Add missing color tokens
2. **Update Terminal.tsx** - Message container and bubbles
3. **Update CommandInput.tsx** - Input styling
4. **Test light mode** - Verify all elements visible
5. **Test dark mode** - Verify all elements visible and readable

---

## 6. Acceptance Criteria

### 6.1 Chat Readability

- [ ] Messages max out at 768px width on 1920px+ screens
- [ ] Messages center when container is wider than max-width
- [ ] Mobile uses full width with appropriate padding

### 6.2 User Messages

- [ ] White text on green background (`bg-primary text-white`)
- [ ] Right-aligned with proper bubble shape
- [ ] Readable in both light and dark modes

### 6.3 AI Messages

- [ ] Visible background in dark mode (`bg-surface-dark`)
- [ ] Light text on dark background in dark mode
- [ ] Left-aligned with proper bubble shape
- [ ] Border visible in dark mode

### 6.4 Input Area

- [ ] Visible background and border
- [ ] Focus state shows ring
- [ ] Send button is primary color
- [ ] Works in both light and dark modes

### 6.5 No Regressions

- [ ] Command palette still works
- [ ] Suggestion chips still work
- [ ] MarkdownRenderer still works
- [ ] Terminal drawer open/close still works

---

## 7. Test Matrix

| Test | Viewport | Theme | Expected |
|------|----------|-------|----------|
| Message width | 1920px | Any | Max 768px, centered |
| Message width | 375px | Any | Full width with padding |
| User bubble | Any | Light | Green bg, white text |
| User bubble | Any | Dark | Green bg, white text |
| AI bubble | Any | Light | Light gray bg, dark text |
| AI bubble | Any | Dark | Dark surface bg, light text, visible border |
| Input focus | Any | Any | Border changes to primary, ring appears |

---

## 8. Appendix: Current vs Target Comparison

### 8.1 User Message

**Current (Terminal.tsx:1117):**
```tsx
<div className="bg-paper-dark px-4 py-3 rounded-tr-xl rounded-bl-xl rounded-tl-xl text-ink font-serif border border-ink/5">
```

**Target:**
```tsx
<div className="bg-primary text-white px-5 py-3.5 rounded-2xl rounded-tr-sm shadow-md">
```

### 8.2 AI Message

**Current (Terminal.tsx:1121):**
```tsx
<div className={`pl-4 border-l-2 border-grove-forest/30`}>
```

**Target:**
```tsx
<div className="bg-slate-100 dark:bg-surface-dark text-slate-900 dark:text-slate-100
                px-5 py-3.5 rounded-2xl rounded-tl-sm shadow-sm
                border border-slate-200 dark:border-border-dark">
```

### 8.3 Input

**Current (CommandInput.tsx:195):**
```tsx
<input className="w-full bg-white border border-ink/20 p-3 pl-4 pr-10 text-sm font-serif text-ink
                  focus:outline-none focus:border-grove-forest focus:ring-1 focus:ring-grove-forest/20
                  transition-all rounded-sm placeholder:italic" />
```

**Target:**
```tsx
<div className="flex items-end gap-2 bg-surface-light dark:bg-surface-dark rounded-xl p-2
                border border-border-light dark:border-border-dark
                focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50
                transition-all shadow-sm">
  <input className="w-full bg-transparent border-0 text-slate-900 dark:text-white
                    placeholder-slate-500 focus:ring-0 py-2.5" />
  <button className="p-2 bg-primary text-white rounded-lg">...</button>
</div>
```
