# Architectural Decisions: Terminal Quantum Welcome

**Sprint:** terminal-quantum-welcome-v1

---

## ADR-001: Consume Existing Hook vs. Create Terminal-Specific Hook

### Status
**Accepted**

### Context
Terminal needs lens-reactive welcome content. Two approaches:
1. Import and use existing `useQuantumInterface()` hook
2. Create new `useTerminalWelcome()` hook specific to Terminal

### Decision
**Use existing `useQuantumInterface()` hook.**

### Rationale
- Hook already returns `reality.terminal` with correct type
- Creating a new hook would violate Pattern 1 (Quantum Interface) and create parallel systems
- Existing hook handles all complexity (schema vs fallback, custom lens generation)
- DEX compliance: Extend existing patterns, don't duplicate

### Consequences
- Terminal becomes a consumer of the Quantum Interface pattern
- Any improvements to useQuantumInterface benefit Terminal automatically
- Consistent data flow across all surfaces (Genesis, Terminal, Foundation)

---

## ADR-002: Separate TerminalWelcome Component vs. Inline Rendering

### Status
**Accepted**

### Context
Welcome content could be:
1. Rendered inline in Terminal.tsx
2. Extracted to a dedicated TerminalWelcome component

### Decision
**Create dedicated TerminalWelcome.tsx component.**

### Rationale
- Separation of concerns: Welcome is a distinct UI concern
- Testability: Can unit test welcome rendering independently
- Reusability: Could be used in embedded variants, modals
- Terminal.tsx is already 1400+ lines—avoid adding more

### Consequences
- New file to maintain
- Clear component boundary
- Easier to style independently

---

## ADR-003: Use Glass Tokens vs. Create Welcome-Specific Tokens

### Status
**Accepted**

### Context
Welcome card needs styling. Options:
1. Use existing `--glass-*` tokens directly
2. Create `--welcome-*` token namespace
3. Create `--glass-welcome-*` sub-tokens

### Decision
**Use existing `--glass-*` tokens with minimal semantic wrappers.**

### Rationale
- Pattern 4 (Token Namespaces) says: extend existing namespaces
- Glass tokens already provide the visual language
- Semantic classes (`.glass-welcome-card`) provide readability without new tokens
- Matches Lenses page which uses same tokens

### Consequences
- Welcome styling inherits all glass theme improvements
- Consistent visual language across surfaces
- No token proliferation

---

## ADR-004: Visibility Condition (messages.length === 0 AND activeLens)

### Status
**Accepted**

### Context
When should TerminalWelcome show?

Options considered:
1. Always when messages.length === 0
2. Only when messages.length === 0 AND lens selected
3. Only on first load, then never again
4. Controlled by feature flag

### Decision
**Show when messages.length === 0 AND session.activeLens is truthy.**

### Rationale
- Without lens, user sees WelcomeInterstitial (lens picker)
- With lens but no messages, user needs context—welcome provides it
- After first message, welcome disappears naturally
- Matches user journey: select lens → see welcome → start chatting

### Consequences
- Clear state machine: no lens → picker, lens + no messages → welcome, messages → chat
- Welcome reappears if user clears history (acceptable)
- No additional state needed to track "has seen welcome"

---

## ADR-005: Prompt Click Behavior

### Status
**Accepted**

### Context
When user clicks a prompt in TerminalWelcome, what happens?

Options:
1. Fill input field, let user submit
2. Submit immediately as user message
3. Show prompt in a tooltip/preview first

### Decision
**Submit immediately via handleSend.**

### Rationale
- Prompts are conversation starters, not drafts
- Reduces friction (one click vs. two)
- Consistent with suggestion chips elsewhere in Terminal
- Welcome disappears after first message—user sees their prompt in chat history

### Consequences
- Single-click interaction
- User sees their "message" in chat immediately
- Welcome disappears as expected
