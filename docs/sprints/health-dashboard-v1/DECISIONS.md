# Architectural Decision Records — health-dashboard-v1 (Revised)

## ADR-001: Declarative Health Configuration

### Status
Accepted

### Context
Per DAIRE Architecture Specification, "domain-specific behavior belongs in configuration, not code." The current health check implementation has hardcoded validation logic that would require code changes to adapt to different domains (legal discovery, academic synthesis, etc.).

### Options Considered
1. **Keep hardcoded checks** — Faster to implement, creates tech debt
2. **Declarative JSON config** — Aligns with DAIRE, enables domain experts to configure
3. **Database-driven config** — Most flexible, but adds complexity

### Decision
Use declarative JSON configuration at `data/infrastructure/health-config.json`

### Rationale
- Direct implementation of DAIRE Principle 2: Declarative Configuration
- JSON files are version-controlled alongside code
- Non-developers can define checks (per DAIRE: "without becoming software engineers")
- Same pattern will apply to annotation schemas, relationship schemas, processing flows
- Progressive enhancement: system works without config, becomes more powerful with it

### Consequences
**Positive:**
- Domain experts can configure checks without engineering
- New domains supported through config, not code
- Establishes pattern for all future Grove configuration

**Negative:**
- More upfront design work for config schema
- Need config validation to fail fast on malformed input
- Check types are still code (but extensible via registry)

---

## ADR-002: Engine Checks vs Corpus Checks Separation

### Status
Accepted

### Context
DAIRE specifies three layers: Engine (fixed), Corpus (variable), Configuration (declarative). Health checks span layers—some validate engine infrastructure, others validate domain-specific corpus data.

### Options Considered
1. **Single checks array** — Simpler, but conflates concerns
2. **Separate engineChecks/corpusChecks** — Clear layer separation
3. **Category-based separation** — Flexible, but implicit

### Decision
Separate `engineChecks` and `corpusChecks` arrays in health-config.json

### Rationale
- Makes DAIRE layer separation explicit and visible
- Engine checks are portable across all deployments
- Corpus checks are domain-specific, would differ for legal/academic/enterprise
- Enables future tooling to extract engine checks as shared config

### Consequences
**Positive:**
- Clear architectural boundary in config
- Engine checks can be standardized across deployments
- Corpus checks are explicitly domain-specific

**Negative:**
- Slightly more complex config structure
- Some checks might be ambiguous (solved by documenting guidelines)

---

## ADR-003: Attribution Chain on Health Log Entries

### Status
Accepted

### Context
DAIRE Principle 3: "Every piece of refined knowledge must maintain provenance." Current health log design only tracks `triggeredBy` (manual/api/ci) without full attribution.

### Options Considered
1. **Minimal attribution** — Just triggeredBy, simple
2. **Full attribution chain** — userId, sessionId, configVersion, engineVersion
3. **Blockchain-style provenance** — Immutable, but overkill

### Decision
Full attribution chain with configVersion, engineVersion, triggeredBy, and optional userId/sessionId

### Rationale
- Implements DAIRE attribution preservation principle
- Enables debugging: "which config version caused this failure?"
- Supports future multi-user scenarios (who ran this check?)
- configVersion tracks which check definitions were active
- engineVersion tracks which executor implementations were used

### Consequences
**Positive:**
- Full traceability for debugging
- Supports future multi-user, multi-deployment scenarios
- Demonstrates DAIRE principles in practice

**Negative:**
- Slightly larger log entries
- userId/sessionId often null in current implementation

---

## ADR-004: Check Type Executor Pattern

### Status
Accepted

### Context
Declarative config defines *what* to check, but *how* to execute checks requires code. Need a pattern that's extensible without modifying engine core.

### Options Considered
1. **Giant switch statement** — Simple, not extensible
2. **Executor registry pattern** — Extensible, follows engine philosophy
3. **Dynamic code evaluation** — Maximum flexibility, security risk

### Decision
Executor registry pattern with typed check handlers

### Rationale
- Each check type (`json-exists`, `reference-check`, `chain-valid`) has a registered executor
- New check types can be added by registering new executors
- Config references type by string, engine dispatches to executor
- Follows DAIRE engine layer philosophy: fixed mechanics, extensible through defined interfaces

### Consequences
**Positive:**
- Extensible without core engine changes
- Type-safe dispatch
- Clear contract between config and engine

**Negative:**
- Need to document available check types
- Custom checks require code (but that's appropriate for engine layer)

---

## ADR-005: Config-Driven Display Labels

### Status
Accepted

### Context
The HealthDashboard UI needs to display category names, dashboard titles, and other text. Hardcoding these in React components violates DAIRE's declarative configuration principle.

### Options Considered
1. **Hardcode in React** — Fast, but not domain-agnostic
2. **Display config section** — Labels defined in health-config.json
3. **Separate i18n system** — Full internationalization, but overkill

### Decision
Add `display` section to health-config.json with dashboardTitle and categoryLabels

### Rationale
- UI becomes domain-agnostic: legal deployment shows "Evidence Integrity," Grove shows "Schema Integrity"
- Single source of truth for all display text
- React component reads from /api/health/config endpoint
- Follows DAIRE Phase 3 vision: admin interface for configuration

### Consequences
**Positive:**
- UI is domain-agnostic
- Labels can be changed without code deployment
- Consistent with DAIRE display schema concept

**Negative:**
- Extra API call to fetch config on mount
- Need to handle missing labels gracefully

---

## ADR-006: Progressive Enhancement for Config Loading

### Status
Accepted

### Context
DAIRE Principle 5: "Work with minimal configuration and become more powerful with additional configuration." What happens if health-config.json is missing or malformed?

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
- Matches DAIRE progressive enhancement principle

### Consequences
**Positive:**
- Zero-config startup possible
- Graceful degradation
- Explicit warning guides toward proper configuration

**Negative:**
- Need to maintain default checks in code (but minimal set)
- Risk of running on defaults without noticing (mitigated by warning)
