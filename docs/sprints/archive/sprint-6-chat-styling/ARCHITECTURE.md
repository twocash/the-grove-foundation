# Sprint 6: Chat Styling - ARCHITECTURE

**Version:** 1.0
**Date:** 2025-12-22

---

## 1. Architectural Decision: Minimal Change Approach

### 1.1 Approach

This sprint uses **surgical updates** to existing components rather than creating new components. The Terminal.tsx is 1469 lines and deeply integrated - creating new message components would require significant refactoring.

**Strategy:** Update Tailwind classes in-place within Terminal.tsx and CommandInput.tsx.

### 1.2 What We're NOT Doing

- NOT creating `src/shared/chat/ChatMessage.tsx`
- NOT creating `src/shared/chat/UserMessage.tsx`
- NOT creating `src/shared/chat/AIMessage.tsx`
- NOT creating `ChatContainer.tsx`
- NOT refactoring Terminal.tsx architecture

---

## 2. Component Structure (Current)

```
components/
├── Terminal.tsx                    # Main terminal drawer (1469 lines)
│   ├── Message rendering           # Lines 1104-1137 ← UPDATE
│   ├── Suggestion chips
│   ├── Lens picker
│   ├── Custom lens wizard trigger
│   └── Reveals
└── Terminal/
    ├── CommandInput/
    │   ├── CommandInput.tsx        # Input component ← UPDATE
    │   ├── CommandAutocomplete.tsx
    │   └── useCommandParser.ts
    ├── CustomLensWizard/           # DO NOT TOUCH
    ├── Reveals/                    # DO NOT TOUCH
    └── Modals/                     # DO NOT TOUCH
```

---

## 3. Color System Architecture

### 3.1 Current Token Structure

```typescript
// tailwind.config.ts - Theme section
theme: {
  extend: {
    colors: {
      // Grove tokens (light/dark aware)
      'primary': '#4d7c0f',
      'background-light': '#f8f7f5',
      'background-dark': '#0f172a',
      'surface-light': '#ffffff',
      'surface-dark': '#1e293b',
      'border-light': '#e7e5e4',
      'border-dark': '#334155',

      // Legacy tokens (to be deprecated)
      'paper': '#F9F8F4',
      'paper-dark': '#F0EFE9',
      'ink': '#1A2421',
      'grove-forest': '#355E3B',
    }
  }
}
```

### 3.2 Token Usage Pattern

**Use this pattern consistently:**

```tsx
// Background
className="bg-surface-light dark:bg-surface-dark"

// Text
className="text-slate-900 dark:text-slate-100"

// Border
className="border-border-light dark:border-border-dark"

// Primary accent
className="bg-primary text-white"
className="text-primary"
className="border-primary"
```

### 3.3 Dark Mode Toggle

The app uses Tailwind's `darkMode: 'class'` strategy. The `<html>` element gets `class="dark"` to enable dark mode.

**Current:** The Terminal doesn't appear to have a dark mode toggle exposed to users. The styling should work if dark mode is ever enabled.

---

## 4. Message Rendering Architecture

### 4.1 Current Flow (Terminal.tsx)

```
terminalState.messages
  ↓
map() over messages
  ↓
Conditional: msg.role === 'user' ? UserBubble : AIBubble
  ↓
MarkdownRenderer for AI messages
```

### 4.2 Target Message Structure

```tsx
// Container with max-width (wrap the messages area)
<div className="max-w-3xl mx-auto">
  {messages.map((msg) => (
    <div className={msg.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>

      {/* Label */}
      <div className={msg.role === 'user' ? 'flex justify-end gap-2 mb-1' : 'flex gap-2 mb-1'}>
        {msg.role === 'user' ? (
          <>
            <span className="text-xs text-slate-500">{formatTime(msg.timestamp)}</span>
            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">You</span>
          </>
        ) : (
          <>
            <span className="text-xs font-bold text-primary">The Grove</span>
            <span className="text-xs text-slate-500">{formatTime(msg.timestamp)}</span>
          </>
        )}
      </div>

      {/* Bubble */}
      <div className={msg.role === 'user' ? 'max-w-[70%]' : 'max-w-[85%]'}>
        <div className={msg.role === 'user'
          ? 'bg-primary text-white px-5 py-3.5 rounded-2xl rounded-tr-sm shadow-md'
          : 'bg-slate-100 dark:bg-surface-dark text-slate-900 dark:text-slate-100 px-5 py-3.5 rounded-2xl rounded-tl-sm border border-slate-200 dark:border-border-dark shadow-sm'
        }>
          {msg.role === 'user' ? msg.text : <MarkdownRenderer content={msg.text} />}
        </div>
      </div>

    </div>
  ))}
</div>
```

---

## 5. Input Area Architecture

### 5.1 Current Structure (CommandInput.tsx)

```tsx
<div className="relative">
  {/* Toast notification */}
  {toast && <div className="...">...</div>}

  {/* Autocomplete dropdown */}
  {showAutocomplete && <CommandAutocomplete ... />}

  {/* Input field */}
  <input className="..." />

  {/* Submit button */}
  <button className="absolute right-3 ...">...</button>
</div>
```

### 5.2 Target Structure

The input should be wrapped in a container that provides the visible background and border:

```tsx
<div className="relative">
  {/* Toast - keep existing */}

  {/* Autocomplete - keep existing */}

  {/* Input container (NEW wrapper) */}
  <div className="flex items-center gap-2 bg-surface-light dark:bg-surface-dark rounded-xl p-2
                  border border-border-light dark:border-border-dark
                  focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50
                  transition-all shadow-sm">

    {/* Input field */}
    <input
      className="flex-1 bg-transparent border-0 text-slate-900 dark:text-white
                 placeholder-slate-500 focus:ring-0 focus:outline-none py-2 px-2"
      ...
    />

    {/* Submit button */}
    <button className="p-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shrink-0">
      <svg ...>...</svg>
    </button>
  </div>
</div>
```

---

## 6. Responsive Design

### 6.1 Breakpoints

```
Mobile:    < 768px   → Full width messages, 85% max per bubble
Tablet:    768-1024px → 768px max container, 70-85% max per bubble
Desktop:   > 1024px   → 768px max container, centered, 70-85% max per bubble
```

### 6.2 Implementation

```tsx
// Container
<div className="max-w-3xl mx-auto px-4 md:px-0">

// User message width
<div className="max-w-[85%] md:max-w-[70%]">

// AI message width
<div className="max-w-[90%] md:max-w-[85%]">
```

---

## 7. CSS Classes Reference

### 7.1 User Message Bubble

```css
/* Before */
bg-paper-dark px-4 py-3 rounded-tr-xl rounded-bl-xl rounded-tl-xl text-ink font-serif border border-ink/5

/* After */
bg-primary text-white px-5 py-3.5 rounded-2xl rounded-tr-sm shadow-md text-sm md:text-base leading-relaxed
```

### 7.2 AI Message Bubble

```css
/* Before */
pl-4 border-l-2 border-grove-forest/30

/* After */
bg-slate-100 dark:bg-surface-dark text-slate-900 dark:text-slate-100 px-5 py-3.5 rounded-2xl rounded-tl-sm border border-slate-200 dark:border-border-dark shadow-sm
```

### 7.3 Input Container

```css
/* Before (on input element) */
w-full bg-white border border-ink/20 p-3 pl-4 pr-10 text-sm font-serif text-ink focus:outline-none focus:border-grove-forest focus:ring-1 focus:ring-grove-forest/20 transition-all rounded-sm placeholder:italic

/* After (wrapper + input) */
/* Wrapper */
flex items-center gap-2 bg-surface-light dark:bg-surface-dark rounded-xl p-2 border border-border-light dark:border-border-dark focus-within:border-primary focus-within:ring-1 focus-within:ring-primary/50 transition-all shadow-sm

/* Input */
flex-1 bg-transparent border-0 text-slate-900 dark:text-white placeholder-slate-500 focus:ring-0 focus:outline-none py-2 px-2 text-sm
```

### 7.4 Label Styling

```css
/* User label */
text-xs text-slate-500 /* timestamp */
text-xs font-bold text-slate-700 dark:text-slate-300 /* "You" */

/* AI label */
text-xs font-bold text-primary /* "The Grove" */
text-xs text-slate-500 /* timestamp */
```

---

## 8. Integration Points

### 8.1 Terminal.tsx Modifications

| Location | Current | Change |
|----------|---------|--------|
| Line ~1104 | Messages container | Add `max-w-3xl mx-auto` wrapper |
| Line ~1111 | Label styling | Update to new format |
| Line ~1117 | User bubble | Replace entire className |
| Line ~1121 | AI bubble | Replace entire className |

### 8.2 CommandInput.tsx Modifications

| Location | Current | Change |
|----------|---------|--------|
| Line ~188-210 | Input container | Wrap in new styled div |
| Line ~195 | Input className | Simplify, remove bg/border |
| Line ~201-209 | Submit button | Update styling |

---

## 9. Testing Strategy

### 9.1 Visual Tests

1. **Open Terminal drawer**
2. **Send a message** → Verify user bubble is green with white text
3. **Receive response** → Verify AI bubble has visible background
4. **Resize window** → Verify max-width constrains properly
5. **Toggle dark mode** (if available) → Verify all elements visible

### 9.2 Functional Tests

1. **Command palette** → Verify `/help` still works
2. **Autocomplete** → Verify suggestions still appear
3. **Markdown rendering** → Verify code blocks, links work
4. **Suggestion chips** → Verify clicking works

### 9.3 Regression Tests

1. **Lens picker** → Still opens
2. **Custom lens flow** → Still works
3. **Reveals** → Still trigger
4. **Drawer open/close** → Animation works

---

## 10. File Change Summary

```
Modified Files:
├── tailwind.config.ts        # Add chat-surface, chat-border tokens (optional)
├── components/Terminal.tsx   # Lines ~1104-1137 (message rendering)
└── components/Terminal/CommandInput/CommandInput.tsx  # Input wrapper and styling
```

No new files created.
