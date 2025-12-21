# Architectural Decision Records — health-dashboard-v1

## ADR-001: Health Log Storage Format

### Status
Accepted

### Context
Need to persist health check results for trend analysis. Options for storage:
1. JSON file in data/infrastructure/
2. SQLite database
3. Cloud storage (GCS)

### Options Considered
1. **JSON file** — Simple, versionable, no dependencies
2. **SQLite** — More queryable, but adds dependency
3. **GCS** — Persistent across deploys, but adds latency and complexity

### Decision
Use JSON file at `data/infrastructure/health-log.json`

### Rationale
- Matches existing data patterns (hubs.json, journeys.json, etc.)
- No new dependencies
- Version controlled alongside code
- Simple FIFO implementation for cap
- Can migrate to database later if needed

### Consequences
**Positive:**
- Zero new dependencies
- Works offline
- Instant reads

**Negative:**
- Concurrent writes need care (unlikely in practice)
- Lost on fresh deploys (acceptable for v1)

---

## ADR-002: Shared Validation Logic Location

### Status
Accepted

### Context
Health check validation logic is duplicated:
- `scripts/health-check.js` — CLI tool
- `tests/unit/schema.test.ts` — Test file

Need single source of truth.

### Options Considered
1. **lib/health-validator.js** — Dedicated validation module
2. **Keep in scripts/, import in tests** — Less refactoring
3. **Put in tests/utils/, import in scripts** — Tests as source of truth

### Decision
Create `lib/health-validator.js` as dedicated module

### Rationale
- `lib/` is standard location for shared logic
- Clear separation from scripts and tests
- Can be imported by server.js for API
- Tests and CLI both consume same source

### Consequences
**Positive:**
- Single source of truth
- Easier to maintain
- API can reuse validation

**Negative:**
- Requires refactoring existing code

---

## ADR-003: Health API Authentication

### Status
Proposed (deferred to future sprint)

### Context
Health endpoints expose internal system state. Should they be protected?

### Options Considered
1. **No auth** — Health data is not sensitive
2. **Admin token check** — Require Foundation admin access
3. **Rate limiting only** — Prevent abuse without auth

### Decision
No authentication for v1, add in future if needed

### Rationale
- Health data reveals counts, not content
- Foundation UI already requires admin access conceptually
- Simplifies initial implementation
- Can add auth middleware later without API changes

### Consequences
**Positive:**
- Faster to implement
- Easier debugging

**Negative:**
- Public health endpoint (acceptable risk)

---

## ADR-004: Health Log Entry Cap

### Status
Accepted

### Context
Unbounded log growth is a risk. Need to cap entries.

### Options Considered
1. **Fixed count (100)** — FIFO when exceeded
2. **Time-based (30 days)** — Delete old entries
3. **Size-based (1MB)** — Delete when file exceeds size

### Decision
Fixed count of 100 entries, FIFO

### Rationale
- Predictable file size
- Simple implementation
- 100 entries = ~2 weeks of daily checks + ad-hoc
- Easy to increase later

### Consequences
**Positive:**
- Bounded storage
- Simple logic

**Negative:**
- Loses old history (acceptable)

---

## ADR-005: UI Pattern for Health Dashboard

### Status
Accepted

### Context
Health Dashboard needs to match existing Foundation console aesthetics.

### Options Considered
1. **Copy Genesis console pattern** — Cards with glow effects
2. **Table-based layout** — Dense information display
3. **Custom design** — Optimized for health data

### Decision
Follow Genesis console pattern with status cards

### Rationale
- Consistent UX across Foundation
- Existing components (MetricCard, GlowButton) can be reused
- Users already understand the visual language

### Consequences
**Positive:**
- Consistent UI
- Faster implementation

**Negative:**
- May need custom components for history list
