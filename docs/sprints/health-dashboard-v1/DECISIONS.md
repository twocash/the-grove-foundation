# Architectural Decision Records — health-dashboard-v1 (Revised)

## ADR-001: Declarative Health Configuration (DEX Standard)

### Status
Accepted

### Context
Per the Trellis Architecture First Order Directive: *"Separation of Exploration Logic from Execution Capability."* The current health check implementation has hardcoded validation logic that would require code changes to adapt to different domains (legal discovery, academic synthesis, etc.).

**DEX Standard Principle II — Declarative Sovereignty:**
> "Domain expertise belongs in configuration, not code."
> "The Test: Can a non-technical lawyer, doctor, or historian alter the behavior of the refinement engine by editing a schema file, without recompiling the application?"

### Options Considered
1. **Keep hardcoded checks** — Faster to implement, violates Trellis Architecture
2. **Declarative JSON config** — Aligns with DEX Standard, enables domain experts
3. **Database-driven config** — Most flexible, but adds complexity

### Decision
Use declarative JSON configuration at `data/infrastructure/health-config.json`

### Rationale
- Direct implementation of DEX Standard Principle II: Declarative Sovereignty
- JSON files are version-controlled alongside code
- Non-developers can define checks (per Trellis: "without becoming software engineers")
- Same pattern will apply to Annotation schemas, Relationship schemas, Processing flows
- Progressive enhancement: system works without config, becomes more powerful with it

### Consequences
**Positive:**
- Domain experts can configure checks without engineering
- New domains (Legal Trellis, Academic Trellis) supported through config, not code
- Establishes DEX pattern for all future Grove configuration

**Negative:**
- More upfront design work for config schema
- Need config validation to fail fast on malformed input
- Check types are still code (but that's Engine layer — appropriate per Trellis)

---

## ADR-002: Engine Checks vs Corpus Checks Separation

### Status
Accepted

### Context
Trellis Architecture specifies three layers with different change velocities:
- **Layer 1: Engine (Trellis Frame)** — Fixed Infrastructure, Low change velocity
- **Layer 2: Corpus (Substrate)** — Variable Input, Medium change velocity  
- **Layer 3: Configuration (Conditions)** — DEX Layer, High change velocity

Health checks span layers—some validate engine infrastructure, others validate domain-specific corpus data.

### Options Considered
1. **Single checks array** — Simpler, but conflates concerns
2. **Separate engineChecks/corpusChecks** — Clear layer separation per Trellis
3. **Category-based separation** — Flexible, but implicit

### Decision
Separate `engineChecks` and `corpusChecks` arrays in health-config.json

### Rationale
- Makes Trellis three-layer separation explicit and visible
- Engine checks are portable across all deployments (Trellis Frame)
- Corpus checks are domain-specific (Substrate)
- Legal Trellis would have different corpusChecks, same engineChecks

### Consequences
**Positive:**
- Clear architectural boundary in config
- Engine checks can be standardized across deployments
- Corpus checks are explicitly domain-specific

**Negative:**
- Slightly more complex config structure
- Some checks might be ambiguous (documented guidelines resolve this)

---

## ADR-003: Attribution Chain on Health Log Entries (Provenance)

### Status
Accepted

### Context
**DEX Standard Principle III — Provenance as Infrastructure:**
> "In the DEX stack, a fact without an origin is a bug."
> "We do not just store what is known; we store how it became known."

Current health log design only tracks `triggeredBy` (manual/api/ci) without full attribution.

### Options Considered
1. **Minimal attribution** — Just triggeredBy, simple
2. **Full attribution chain** — userId, sessionId, configVersion, engineVersion
3. **Blockchain-style provenance** — Immutable, but overkill

### Decision
Full attribution chain with configVersion, engineVersion, triggeredBy, and optional userId/sessionId

### Rationale
- Implements DEX Standard Principle III: Provenance as Infrastructure
- Enables debugging: "which config version caused this failure?"
- Supports future multi-user scenarios (who collapsed this superposition?)
- configVersion tracks which DEX definitions were active
- engineVersion tracks which executor implementations were used

### Consequences
**Positive:**
- Full traceability for debugging
- Supports future Gardener (human) tracking
- Demonstrates DEX provenance principles in practice

**Negative:**
- Slightly larger log entries
- userId/sessionId often null in current implementation

---

## ADR-004: Check Type Executor Pattern (Vine Architecture)

### Status
Accepted

### Context
Per Trellis Architecture:
> "Execution Capability (The Vine): Performed by AI models and humans. Interchangeable and ephemeral."

Declarative config defines *what* to check (Trellis Frame), but *how* to execute checks requires code (Vine). Need a pattern that's extensible without modifying engine core.

### Options Considered
1. **Giant switch statement** — Simple, not extensible
2. **Executor registry pattern** — Extensible, follows Vine philosophy
3. **Dynamic code evaluation** — Maximum flexibility, security risk

### Decision
Executor registry pattern with typed check handlers

### Rationale
- Each check type (`json-exists`, `reference-check`, `chain-valid`) has a registered executor
- New check types can be added by registering new executors
- Config references type by string, engine dispatches to executor
- Follows Trellis philosophy: Vine (execution) is interchangeable

### Consequences
**Positive:**
- Extensible without core engine changes
- Type-safe dispatch
- Clear contract between config (Trellis) and execution (Vine)

**Negative:**
- Need to document available check types
- Custom checks require code (but that's appropriate for Engine layer)

---

## ADR-005: Config-Driven Display Labels (DEX Display Schema)

### Status
Accepted

### Context
Per Trellis Architecture DEX Schemas:
> **Display Schema:** "Defines the 'View'—how the Trellis looks to the gardener."

The HealthDashboard UI needs to display category names, dashboard titles, and other text. Hardcoding these in React components violates Declarative Sovereignty.

### Options Considered
1. **Hardcode in React** — Fast, but not domain-agnostic
2. **Display config section** — Labels defined in health-config.json
3. **Separate i18n system** — Full internationalization, but overkill

### Decision
Add `display` section to health-config.json with dashboardTitle and categoryLabels

### Rationale
- UI becomes domain-agnostic: Legal Trellis shows "Evidence Integrity," Grove shows "Schema Integrity"
- Single source of truth for all display text
- React component reads from /api/health/config endpoint
- Follows DEX Display Schema pattern

### Consequences
**Positive:**
- UI is domain-agnostic
- Labels can be changed without code deployment
- Consistent with Trellis Display Schema concept

**Negative:**
- Extra API call to fetch config on mount
- Need to handle missing labels gracefully

---

## ADR-006: Progressive Enhancement (Organic Scalability)

### Status
Accepted

### Context
**DEX Standard Principle IV — Organic Scalability:**
> "Structure must precede growth, but not inhibit it."
> "A trellis does not dictate exactly where a leaf grows, but it dictates the general direction."

What happens if health-config.json is missing or malformed?

### Options Considered
1. **Fail hard** — Require config, error if missing
2. **Built-in defaults** — Work without config, warn in logs
3. **Config generator** — Auto-create default config if missing

### Decision
Built-in defaults with warning. Engine has hardcoded fallback checks that run if config is missing or unparseable.

### Rationale
- New deployments work immediately without configuration
- Existing deployments don't break if config is temporarily invalid
- Warning in logs alerts operators to configure properly
- Matches DEX Organic Scalability principle: "guided wandering rather than rigid tunnels"

### Consequences
**Positive:**
- Zero-config startup possible
- Graceful degradation
- Explicit warning guides toward proper configuration

**Negative:**
- Need to maintain default checks in code (but minimal set)
- Risk of running on defaults without noticing (mitigated by warning)
