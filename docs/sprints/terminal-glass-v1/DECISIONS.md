# DECISIONS.md — terminal-glass-v1

## ADR-001: Glass Theme Application Strategy

**Status:** Accepted

**Context:**
Terminal.tsx uses light-mode Tailwind classes (`bg-white`, `bg-slate-100`, `bg-primary`) that clash with the Quantum Glass design system. Glass CSS classes exist in globals.css but aren't wired.

**Decision:**
Apply glass classes directly in Terminal.tsx rather than creating wrapper components.

**Alternatives Considered:**
| Option | Approach | Verdict |
|--------|----------|---------|
| A | Create `<GlassMessage>` wrapper | ❌ Adds indirection, Terminal already complex |
| B | **Apply glass classes directly** | ✅ Semantic, self-documenting, minimal changes |
| C | Create new token namespace | ❌ Duplicates existing `--glass-*` tokens |

**Consequences:**
- Terminal.tsx gets ~15 class name changes
- No new components needed
- Consistent with Pattern 4 (Token Namespaces)

---

## ADR-002: Dynamic Width Implementation

**Status:** Accepted

**Context:**
Messages are constrained to `max-w-3xl` (768px) which doesn't breathe with the panel. Previous elegant dynamic width behavior was lost.

**Decision:**
Use `max-w-[min(90%, 56rem)]` for responsive container that breathes with available space.

**Alternatives Considered:**
| Option | Approach | Verdict |
|--------|----------|---------|
| A | Remove max-width entirely | ❌ Lines become unreadable |
| B | Use `max-w-[90%]` | ⚠️ Doesn't cap on very wide screens |
| C | **Use `max-w-[min(90%, 56rem)]`** | ✅ Breathes but maintains readability |

**Consequences:**
- Messages expand on wider screens
- Code blocks can utilize more horizontal space
- Readable line length (~65-75 chars) maintained at max

---

## ADR-003: Genesis Context Handling

**Status:** Accepted

**Context:**
Terminal needs to be visually distinct from Genesis paper-textured left rail.

**Decision:**
Terminal always uses glass theme. Update `terminal-panel` CSS to use `var(--glass-void)` instead of hardcoded `#1a2421`.

**Rationale:**
- Terminal panel is an isolated container
- Glass void is close to current color but uses token
- No changes needed to Genesis left rail
- Consistent token usage enables future theme variations

**Consequences:**
- Single CSS change in globals.css
- Terminal inherits glass context automatically
- Clear visual boundary maintained

---

## ADR-004: CommandInput Styling Scope

**Status:** Accepted

**Context:**
CommandInput has `embedded` prop for different contexts. Non-embedded (Terminal) should use glass styling.

**Decision:**
Update CommandInput to use glass classes when `embedded` is false.

**Rationale:**
- Prop already exists for conditional styling
- Non-embedded = Terminal context = glass theme
- Embedded = future Chat Column = keeps current styling

**Consequences:**
- Conditional class logic in CommandInput
- Glass styling only in Terminal context
- Future Chat Column unaffected

---

## ADR-005: Error Message Styling

**Status:** Accepted

**Context:**
System errors need styling consistent with glass theme.

**Decision:**
Add `.glass-message-error` class with red-tinted glass effect.

**Implementation:**
```css
.glass-message-error {
  background: rgba(239, 68, 68, 0.1);
  border: 1px solid rgba(239, 68, 68, 0.3);
  color: #fca5a5;
  border-radius: 12px 12px 12px 4px;
}
```

**Rationale:**
- Maintains glass aesthetic (semi-transparent)
- Red tint clearly indicates error
- Text color readable on dark background

**Consequences:**
- New CSS class in globals.css
- Error styling consistent with glass system
