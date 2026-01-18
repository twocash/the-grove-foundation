# Sprint Plan: kinetic-stream-polish-v1

**Sprint:** Glass UX Layer and Motion Design  
**Duration:** 1 week (~40 hours)  
**Epics:** 8  
**Stories:** 24  
**Estimated Hours:** 18-22 hours development + 4-6 hours testing  

---

## Epic Overview

| # | Epic | Stories | Hours | Priority |
|---|------|---------|-------|----------|
| 1 | Motion Infrastructure | 3 | 2.0 | P0 |
| 2 | Glass Token System | 2 | 1.5 | P0 |
| 3 | Glass Components | 2 | 2.0 | P0 |
| 4 | Smart Scroll | 3 | 3.0 | P0 |
| 5 | Streaming Animation | 2 | 2.5 | P1 |
| 6 | Block Animations | 4 | 3.0 | P0 |
| 7 | Container Integration | 3 | 3.0 | P0 |
| 8 | Testing & Validation | 5 | 5.0 | P0 |

**Total:** 24 stories, 22 hours

---

## Epic 1: Motion Infrastructure

**Goal:** Create shared animation utilities and variants.  
**Duration:** 2.0 hours  
**Build Gate:** `npm run typecheck` passes

### Story 1.1: Create motion directory structure

**As a** developer  
**I want** a dedicated motion utilities directory  
**So that** animation code is organized and discoverable

**Tasks:**
- [ ] Create `components/Terminal/Stream/motion/` directory
- [ ] Create `motion/index.ts` barrel export
- [ ] Update `Stream/index.ts` to export motion utilities

**Acceptance Criteria:**
- [ ] Directory exists
- [ ] Barrel exports work

**Estimate:** 0.5 hours

---

### Story 1.2: Implement shared animation variants

**As a** developer  
**I want** reusable animation variants  
**So that** all components animate consistently

**Tasks:**
- [ ] Create `motion/variants.ts`
- [ ] Implement `blockVariants` (standard entrance/exit)
- [ ] Implement `queryVariants` (slide from right)
- [ ] Implement `responseVariants` (slide from left)
- [ ] Implement `systemVariants` (fade only)
- [ ] Implement `staggerContainer` and `staggerItem`
- [ ] Implement `reducedMotionVariants`

**Acceptance Criteria:**
- [ ] All variants export correctly
- [ ] TypeScript types are correct
- [ ] Timing matches spec (300ms entrance, 200ms exit)

**Estimate:** 1.0 hours

---

### Story 1.3: Add Framer Motion type safety

**As a** developer  
**I want** proper TypeScript types for motion props  
**So that** IDE support and type checking work correctly

**Tasks:**
- [ ] Verify Framer Motion types are available
- [ ] Create any custom type augmentations needed
- [ ] Document variant usage patterns

**Acceptance Criteria:**
- [ ] No TypeScript errors in motion files
- [ ] Variants have proper Variants type

**Estimate:** 0.5 hours

---

## Epic 2: Glass Token System

**Goal:** Add CSS custom properties for glass effects.  
**Duration:** 1.5 hours  
**Build Gate:** Glass classes render correctly

### Story 2.1: Add glass tokens to globals.css

**As a** designer  
**I want** glass effect tokens  
**So that** glass styling is consistent and themeable

**Tasks:**
- [ ] Add `--glass-bg`, `--glass-blur`, `--glass-border`, `--glass-shadow`
- [ ] Add `--glass-bg-hover` for interactive states
- [ ] Add animation timing tokens
- [ ] Add streaming cursor token
- [ ] Add floating input tokens

**Acceptance Criteria:**
- [ ] Tokens defined in `:root`
- [ ] Values match spec

**Estimate:** 0.75 hours

---

### Story 2.2: Add glass utility classes

**As a** developer  
**I want** glass panel CSS classes  
**So that** components can apply glass effects declaratively

**Tasks:**
- [ ] Create `.glass-panel` base class
- [ ] Create `.glass-panel-light`, `.glass-panel-medium`, `.glass-panel-heavy`
- [ ] Add `@supports` fallback for browsers without backdrop-filter
- [ ] Add reduced motion media query
- [ ] Add floating input and new messages indicator styles

**Acceptance Criteria:**
- [ ] Glass effects render in Chrome, Firefox, Safari
- [ ] Fallback works in unsupported browsers
- [ ] Reduced motion disables animations

**Estimate:** 0.75 hours

---

## Epic 3: Glass Components

**Goal:** Create reusable glass wrapper components.  
**Duration:** 2.0 hours  
**Build Gate:** Components render without error

### Story 3.1: Implement GlassPanel component

**As a** developer  
**I want** a reusable glass panel wrapper  
**So that** any content can have glass styling

**Tasks:**
- [ ] Create `motion/GlassPanel.tsx`
- [ ] Accept `intensity` prop (light/medium/heavy)
- [ ] Forward motion props for animation
- [ ] Use `cn` utility for class merging

**Acceptance Criteria:**
- [ ] GlassPanel renders with correct classes
- [ ] Intensity prop changes blur amount
- [ ] Motion props pass through

**Estimate:** 1.0 hours

---

### Story 3.2: Implement FloatingInput component

**As a** user  
**I want** the input always visible at the bottom  
**So that** I can type without scrolling

**Tasks:**
- [ ] Create `FloatingInput.tsx`
- [ ] Wrap TerminalInput in GlassPanel
- [ ] Apply sticky positioning
- [ ] Add entrance animation

**Acceptance Criteria:**
- [ ] Input floats at bottom of viewport
- [ ] Glass effect visible
- [ ] Chat content scrolls behind it
- [ ] Animation on mount

**Estimate:** 1.0 hours

---

## Epic 4: Smart Scroll

**Goal:** Implement intelligent scroll behavior.  
**Duration:** 3.0 hours  
**Build Gate:** Hook returns expected state shape

### Story 4.1: Implement useScrollAnchor hook

**As a** developer  
**I want** a hook that tracks scroll position  
**So that** I can implement smart auto-scroll

**Tasks:**
- [ ] Create `motion/useScrollAnchor.ts`
- [ ] Track isAtBottom, isUserScrolling, shouldAutoScroll
- [ ] Track newMessageCount
- [ ] Implement scrollToBottom function
- [ ] Implement onNewMessage callback
- [ ] Add debouncing (100ms)
- [ ] Use passive scroll listener

**Acceptance Criteria:**
- [ ] Detects scroll to bottom within threshold
- [ ] Detects user scroll away from bottom
- [ ] Debounces correctly
- [ ] Returns expected state shape

**Estimate:** 1.5 hours

---

### Story 4.2: Implement NewMessagesIndicator

**As a** user  
**I want** to see when new messages arrive while scrolled up  
**So that** I don't miss anything

**Tasks:**
- [ ] Create `NewMessagesIndicator.tsx`
- [ ] Show count of new messages
- [ ] Add click handler to scroll to bottom
- [ ] Animate entrance/exit with Framer Motion
- [ ] Add hover and tap animations

**Acceptance Criteria:**
- [ ] Shows when count > 0
- [ ] Hides when count = 0 or at bottom
- [ ] Clicking scrolls to bottom
- [ ] Smooth animations

**Estimate:** 1.0 hours

---

### Story 4.3: Wire scroll behavior to state

**As a** developer  
**I want** scroll state integrated with component  
**So that** auto-scroll behavior works correctly

**Tasks:**
- [ ] Connect useScrollAnchor to TerminalChat
- [ ] Call onNewMessage when streamHistory updates
- [ ] Show/hide NewMessagesIndicator based on state

**Acceptance Criteria:**
- [ ] Auto-scrolls during generation
- [ ] Pauses when user scrolls up
- [ ] Indicator appears when paused
- [ ] Resumes when clicked

**Estimate:** 0.5 hours

---

## Epic 5: Streaming Animation

**Goal:** Create character-by-character text reveal.  
**Duration:** 2.5 hours  
**Build Gate:** Characters reveal correctly

### Story 5.1: Implement StreamingText component

**As a** user  
**I want** to see text appear character by character  
**So that** I can read along with generation

**Tasks:**
- [ ] Create `Stream/StreamingText.tsx`
- [ ] Implement character batching (3 chars per tick)
- [ ] Implement configurable timing (50ms default)
- [ ] Add blinking cursor during stream
- [ ] Call onComplete when finished
- [ ] Respect reduced motion preference

**Acceptance Criteria:**
- [ ] Characters appear progressively
- [ ] Cursor blinks during stream
- [ ] Cursor disappears when complete
- [ ] Instant display with reduced motion

**Estimate:** 1.5 hours

---

### Story 5.2: Integrate StreamingText with ResponseBlock

**As a** developer  
**I want** streaming animation in response blocks  
**So that** generation feels alive

**Tasks:**
- [ ] Pass `isGenerating` prop to ResponseBlock
- [ ] Conditionally render StreamingText vs SpanRenderer
- [ ] Handle transition when generation completes

**Acceptance Criteria:**
- [ ] Shows StreamingText during generation
- [ ] Transitions to SpanRenderer when complete
- [ ] No content flash during transition

**Estimate:** 1.0 hours

---

## Epic 6: Block Animations

**Goal:** Add motion wrappers to block components.  
**Duration:** 3.0 hours  
**Build Gate:** Blocks animate on entrance

### Story 6.1: Add motion to QueryBlock

**As a** user  
**I want** my messages to animate in from the right  
**So that** the chat feels responsive

**Tasks:**
- [ ] Import motion and queryVariants
- [ ] Wrap content in motion.div
- [ ] Apply variants

**Acceptance Criteria:**
- [ ] Query blocks slide in from right
- [ ] Animation duration is 300ms

**Estimate:** 0.5 hours

---

### Story 6.2: Add motion and glass to ResponseBlock

**As a** user  
**I want** AI responses to have glass styling and animate from left  
**So that** they feel premium and distinct

**Tasks:**
- [ ] Import motion, GlassPanel, responseVariants
- [ ] Wrap content in GlassPanel with medium intensity
- [ ] Apply responseVariants
- [ ] Add stagger animation for suggested paths

**Acceptance Criteria:**
- [ ] Response blocks have glass effect
- [ ] Slide in from left
- [ ] Paths stagger in

**Estimate:** 1.0 hours

---

### Story 6.3: Add motion to NavigationBlock

**As a** user  
**I want** navigation options to animate in with stagger  
**So that** they feel discoverable

**Tasks:**
- [ ] Import motion, staggerContainer, staggerItem
- [ ] Apply stagger to button container
- [ ] Wrap each button in motion.div with staggerItem

**Acceptance Criteria:**
- [ ] Buttons stagger in (50ms delay each)
- [ ] Smooth entrance animation

**Estimate:** 0.75 hours

---

### Story 6.4: Add motion to SystemBlock

**As a** user  
**I want** system messages to fade in smoothly  
**So that** they don't feel jarring

**Tasks:**
- [ ] Import motion and systemVariants
- [ ] Wrap content in motion.div
- [ ] Apply fade variants

**Acceptance Criteria:**
- [ ] System blocks fade in/out
- [ ] Duration is 200ms

**Estimate:** 0.5 hours

---

## Epic 7: Container Integration

**Goal:** Wire everything together in parent components.  
**Duration:** 3.0 hours  
**Build Gate:** Full integration works E2E

### Story 7.1: Add AnimatePresence to StreamRenderer

**As a** developer  
**I want** exit animations for stream items  
**So that** items animate out as well as in

**Tasks:**
- [ ] Import AnimatePresence from framer-motion
- [ ] Wrap item list in AnimatePresence with mode="popLayout"
- [ ] Ensure items have unique keys
- [ ] Add reduced motion check with useReducedMotion

**Acceptance Criteria:**
- [ ] Items animate in
- [ ] Items animate out on removal
- [ ] Layout is stable during transitions

**Estimate:** 1.0 hours

---

### Story 7.2: Integrate scroll anchor into TerminalChat

**As a** developer  
**I want** scroll anchor integrated with chat container  
**So that** smart scroll behavior works

**Tasks:**
- [ ] Add scrollContainerRef to scroll container
- [ ] Initialize useScrollAnchor hook
- [ ] Call onNewMessage when streamHistory changes
- [ ] Render NewMessagesIndicator

**Acceptance Criteria:**
- [ ] Auto-scroll works
- [ ] Pause on user scroll works
- [ ] New messages indicator appears

**Estimate:** 1.0 hours

---

### Story 7.3: Replace static input with FloatingInput

**As a** developer  
**I want** floating input in TerminalChat  
**So that** input is always visible

**Tasks:**
- [ ] Replace TerminalInput with FloatingInput
- [ ] Pass existing props through
- [ ] Adjust scroll container padding for floating input

**Acceptance Criteria:**
- [ ] Input floats at bottom
- [ ] All functionality preserved
- [ ] Chat content scrolls correctly

**Estimate:** 1.0 hours

---

## Epic 8: Testing & Validation

**Goal:** Verify implementation with tests.  
**Duration:** 5.0 hours  
**Build Gate:** All tests pass

### Story 8.1: Unit test StreamingText

**As a** developer  
**I want** StreamingText tested  
**So that** streaming animation is reliable

**Tasks:**
- [ ] Test character reveal timing
- [ ] Test completion callback
- [ ] Test reduced motion behavior
- [ ] Test cursor visibility
- [ ] Target: ≥90% coverage

**Acceptance Criteria:**
- [ ] All tests pass
- [ ] Coverage ≥90%

**Estimate:** 1.0 hours

---

### Story 8.2: Unit test useScrollAnchor

**As a** developer  
**I want** scroll anchor hook tested  
**So that** scroll behavior is reliable

**Tasks:**
- [ ] Test bottom detection
- [ ] Test user scroll detection
- [ ] Test auto-scroll toggle
- [ ] Test new message count
- [ ] Test debouncing

**Acceptance Criteria:**
- [ ] All tests pass
- [ ] Edge cases covered

**Estimate:** 1.0 hours

---

### Story 8.3: Unit test GlassPanel

**As a** developer  
**I want** GlassPanel tested  
**So that** glass effects work correctly

**Tasks:**
- [ ] Test intensity prop
- [ ] Test motion prop forwarding
- [ ] Test class application

**Acceptance Criteria:**
- [ ] All tests pass

**Estimate:** 0.5 hours

---

### Story 8.4: E2E visual regression tests

**As a** developer  
**I want** visual regression tests  
**So that** polish doesn't regress

**Tasks:**
- [ ] Create baseline screenshots
- [ ] Test glass effect rendering
- [ ] Test animation completion
- [ ] Test floating input position
- [ ] Test new messages indicator

**Acceptance Criteria:**
- [ ] Baselines captured
- [ ] Tests pass in CI

**Estimate:** 1.5 hours

---

### Story 8.5: Accessibility audit

**As a** developer  
**I want** accessibility verified  
**So that** polish is inclusive

**Tasks:**
- [ ] Test reduced motion with system preference
- [ ] Test keyboard navigation
- [ ] Test screen reader announcements
- [ ] Run axe-core audit

**Acceptance Criteria:**
- [ ] No a11y violations
- [ ] Reduced motion works
- [ ] Keyboard accessible

**Estimate:** 1.0 hours

---

## Commit Sequence

| # | Commit Message | Phase |
|---|----------------|-------|
| 1 | `feat(motion): create motion utilities directory` | 1 |
| 2 | `feat(motion): add shared animation variants` | 1 |
| 3 | `style(tokens): add glass and animation tokens` | 2 |
| 4 | `style(tokens): add glass utility classes` | 2 |
| 5 | `feat(motion): implement GlassPanel component` | 3 |
| 6 | `feat(terminal): implement FloatingInput component` | 3 |
| 7 | `feat(motion): implement useScrollAnchor hook` | 4 |
| 8 | `feat(terminal): implement NewMessagesIndicator` | 4 |
| 9 | `feat(stream): implement StreamingText component` | 5 |
| 10 | `feat(stream): add motion to QueryBlock` | 6 |
| 11 | `feat(stream): add glass and motion to ResponseBlock` | 6 |
| 12 | `feat(stream): add stagger to NavigationBlock` | 6 |
| 13 | `feat(stream): add fade to SystemBlock` | 6 |
| 14 | `feat(stream): add AnimatePresence to StreamRenderer` | 7 |
| 15 | `feat(terminal): integrate scroll anchor` | 7 |
| 16 | `feat(terminal): use FloatingInput in TerminalChat` | 7 |
| 17 | `test(stream): add StreamingText unit tests` | 8 |
| 18 | `test(motion): add useScrollAnchor unit tests` | 8 |
| 19 | `test(motion): add GlassPanel unit tests` | 8 |
| 20 | `test(e2e): add polish visual regression tests` | 8 |
| 21 | `test(a11y): verify accessibility compliance` | 8 |

---

## Sprint Schedule

### Day 1-2: Foundation (Epics 1-2)
- Motion infrastructure
- Glass tokens

### Day 3: Components (Epics 3-4)
- GlassPanel
- FloatingInput
- useScrollAnchor
- NewMessagesIndicator

### Day 4: Animation (Epics 5-6)
- StreamingText
- Block animations

### Day 5: Integration (Epic 7)
- StreamRenderer AnimatePresence
- TerminalChat integration
- FloatingInput replacement

### Day 6-7: Testing (Epic 8)
- Unit tests
- E2E tests
- Accessibility audit
- Bug fixes

---

## Risk Mitigation

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Animation jank | Medium | Profile early, use GPU properties only |
| Scroll conflicts | Medium | Test with various content lengths |
| Glass browser compat | Low | Fallback in CSS already implemented |
| Bundle size | Low | Tree-shaking, already using Framer Motion |
| Timing issues | Medium | Make timing configurable via tokens |

---

*Sprint plan complete. Ready for execution prompt.*
