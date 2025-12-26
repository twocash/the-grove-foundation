# Architecture Decision Records: wizard-engine-v1

**Sprint:** Declarative Wizard Engine

---

## ADR-001: Schema vs. Code for Wizard Definition

**Status:** Accepted  
**Date:** December 2024

### Context

CustomLensWizard currently defines its flow logic in TypeScript:
- Questions hardcoded in STEP_CONFIG
- Flow conditionals in event handlers
- Step rendering in switch statement

We need to decide how new wizards (journeys, onboarding) should be defined.

### Options Considered

**Option A: Copy-paste pattern**
- Duplicate CustomLensWizard for each new wizard
- Customize per wizard needs
- Pros: Simple, no abstraction overhead
- Cons: Code duplication, drift risk, no domain expert access

**Option B: Parameterized component**
- Single component with many configuration props
- Pass questions, options, flow logic as props
- Pros: Some reuse
- Cons: Complex prop interface, still requires code changes

**Option C: JSON Schema + Engine (Selected)**
- Define wizards in JSON files
- Generic engine interprets schema
- Pros: DEX compliant, domain expert accessible, maximum reuse
- Cons: Upfront investment, schema design complexity

### Decision

**Option C: JSON Schema + Engine**

### Rationale

- **DEX Compliance:** Declarative Sovereignty requires domain logic in config
- **Scalability:** New wizards are JSON files, not code changes
- **Maintainability:** Single engine to maintain vs. N wizard components
- **Testability:** Schema is data; test engine once, trust schema

### Consequences

- Must design robust schema specification
- Need condition evaluator for flow logic
- Initial development longer than copy-paste
- Long-term maintenance significantly reduced

---

## ADR-002: Condition Expression Evaluation

**Status:** Accepted  
**Date:** December 2024

### Context

Wizard flow includes conditional navigation (e.g., skip concerns step if motivation isn't "worried"). The schema needs to express these conditions.

### Options Considered

**Option A: eval() with JavaScript expressions**
- Schema: `"if": "motivation === 'worried-about-ai'"`
- Evaluate: `eval(expression)`
- Pros: Full JavaScript power
- Cons: **Security risk**, arbitrary code execution

**Option B: Simple string-based DSL (Selected)**
- Schema: `"if": "motivation === 'worried-about-ai'"`
- Parse: Regex-based extraction, whitelist operators
- Pros: Safe, covers needed cases, readable
- Cons: Limited to equality/inequality checks

**Option C: JSON-based rule engine**
- Schema: `"if": { "field": "motivation", "equals": "worried-about-ai" }`
- Pros: Structured, safe
- Cons: Verbose, less readable

### Decision

**Option B: Simple string-based DSL**

### Rationale

- All current conditional needs are simple equality checks
- Regex parsing is safe (no code execution)
- Syntax is readable and familiar
- Can extend later if needed

### Supported Expressions

```
key                    # truthy check
!key                   # falsy check
key === 'value'        # equality
key !== 'value'        # inequality
```

### Consequences

- Limited to simple conditions (acceptable for wizards)
- No compound conditions (AND/OR) initially
- May need extension for complex future wizards

---

## ADR-003: State Management Approach

**Status:** Accepted  
**Date:** December 2024

### Context

Wizard state includes: current step, inputs, generated options, selected option, loading/error states. Need to decide how to manage this.

### Options Considered

**Option A: useState per field**
- Pros: Simple, React-native
- Cons: Scattered state, no history tracking

**Option B: useReducer with actions (Selected)**
- Pros: Centralized state, action-based updates, step history
- Cons: Slightly more boilerplate

**Option C: XState machine**
- Pros: Formal state transitions, visualization tools
- Cons: Overkill for wizard (linear flow), learning curve

**Option D: External state management (Zustand/Redux)**
- Pros: Persistence, devtools
- Cons: Over-engineering for isolated component

### Decision

**Option B: useReducer with actions**

### Rationale

- Wizard is isolated component (no global state needed)
- useReducer provides clean action-based updates
- Easy to add step history for back navigation
- Pattern familiar from engagement machine

### State Shape

```typescript
interface WizardEngineState {
  currentStep: string;
  stepHistory: string[];      // For back navigation
  inputs: Record<string, unknown>;
  generatedOptions: unknown[];
  selectedOption: unknown | null;
  isGenerating: boolean;
  error: string | null;
}
```

### Consequences

- State is local to WizardEngine instance
- No persistence across page refreshes (acceptable)
- Clear action-based updates for predictability

---

## ADR-004: Card Renderer Strategy

**Status:** Accepted  
**Date:** December 2024

### Context

Selection step displays generated options as cards. Different wizards produce different output types (lenses, journeys) requiring different card renderers.

### Options Considered

**Option A: Schema specifies renderer name, registry lookup**
- Schema: `"cardRenderer": "LensCandidateCard"`
- Engine: Looks up in CARD_RENDERERS registry
- Pros: Clean schema, flexible
- Cons: Registry management

**Option B: Generic card with schema-driven fields (Selected)**
- Schema specifies which fields to display
- Single GenericOptionCard component
- Pros: No registry, works for any output type
- Cons: Less customization

**Option C: Render function passed as prop**
- WizardEngine accepts `renderCard` prop
- Pros: Maximum flexibility
- Cons: Breaks declarative principle

### Decision

**Option B initially, with Option A as enhancement**

Start with generic card that extracts title/description from options. Add registry for custom renderers if needed.

### Generic Card Fields

```typescript
interface GenericOption {
  publicLabel?: string;   // Fallback: name, title
  name?: string;
  title?: string;
  description?: string;
}
```

### Consequences

- Works immediately with lens candidates
- May need custom renderers for complex option types
- Registry can be added incrementally

---

## ADR-005: Analytics Integration

**Status:** Accepted  
**Date:** December 2024

### Context

Current wizard tracks funnel events. Engine needs to maintain analytics while being schema-driven.

### Options Considered

**Option A: Hardcode analytics in engine**
- Engine calls specific tracking functions
- Cons: Couples engine to analytics implementation

**Option B: Schema-defined event names (Selected)**
- Schema specifies event names
- Engine calls generic tracker with schema-defined names
- Pros: Decoupled, configurable per wizard

**Option C: Event emitter pattern**
- Engine emits events, parent subscribes
- Pros: Maximum decoupling
- Cons: Adds complexity

### Decision

**Option B: Schema-defined event names**

### Schema Analytics Config

```json
{
  "analytics": {
    "startEvent": "custom_lens_wizard_started",
    "stepEvent": "custom_lens_step_completed",
    "completeEvent": "custom_lens_created",
    "abandonEvent": "custom_lens_abandoned"
  }
}
```

### Engine Implementation

```typescript
const trackEvent = useCallback((eventType: string, metadata?: Record<string, unknown>) => {
  // Import existing funnel analytics
  trackFunnelEvent(eventType, metadata);
}, []);

// On wizard start
if (schema.analytics?.startEvent) {
  trackEvent(schema.analytics.startEvent);
}
```

### Consequences

- Analytics configurable per wizard
- Existing funnel analytics reused
- Easy to add new event types to schema

---

## ADR-006: Directory Structure

**Status:** Accepted  
**Date:** December 2024

### Context

New wizard engine code needs a home. Multiple options for where to place core types, components, and schemas.

### Decision

```
src/
├── core/wizard/          # Types, evaluator, transforms
├── surface/components/Wizard/  # UI components
└── data/wizards/         # JSON schema files
```

### Rationale

- **core/wizard:** Aligns with existing core/ pattern (schema, engagement)
- **surface/components/Wizard:** Aligns with surface architecture
- **data/wizards:** Keeps schemas near other data files

### Consequences

- Clear separation of concerns
- Follows existing Grove conventions
- Easy to find related code

---

*ADRs finalized: December 2024*
