# v0.11 Genesis Experience — Development Log

## Session Info
- **Date:** 2024-12-19
- **Sprint:** v0.11 Genesis Landing Experience
- **Status:** Ready for execution

## Planning Artifacts
- [x] SPEC.md — Full specification
- [x] TARGET_CONTENT.md — All copy
- [x] SPRINTS.md — Story breakdown
- [x] EXECUTION_PROMPT.md — Claude Code instructions

## Key Decisions

### ADR-001: Feature Flag Approach
**Decision:** Use existing `globalSettings.featureFlags` infrastructure
**Rationale:** No new schema changes needed, Reality Tuner integration automatic

### ADR-002: Aesthetic Direction
**Decision:** Organic/paper/garden — NOT futuristic
**Rationale:** Mass-market approachable, anti-Big-Brother, grassroots feel

### ADR-003: URL Parameter Override
**Decision:** `?experience=genesis` overrides feature flag
**Rationale:** Easy side-by-side comparison without touching Reality Tuner

### ADR-004: Screen Component Structure
**Decision:** Separate component per screen in `genesis/` directory
**Rationale:** Modular, easy to iterate, clear ownership

## Execution Log

### Epic 1: Infrastructure
- [ ] Story 1.1: Add feature flag
- [ ] Story 1.2: Create SurfaceRouter
- [ ] Story 1.3: Create GenesisPage shell
- [ ] Story 1.4: Update route registration
- [ ] Story 1.5: Verify Classic unchanged
- **Build:** Pending

### Epic 2: Screens 1-2
- [ ] Story 2.1: HeroHook component
- [ ] Story 2.2: ProblemStatement component
- [ ] Story 2.3: Wire into GenesisPage
- **Build:** Pending

### Epic 3: Screens 3-4
- [ ] Story 3.1: ProductReveal component
- [ ] Story 3.2: AhaDemo component
- [ ] Story 3.3: Wire into GenesisPage
- **Build:** Pending

### Epic 4: Screens 5-6
- [ ] Story 4.1: Foundation component
- [ ] Story 4.2: CallToAction component
- [ ] Story 4.3: Wire into GenesisPage
- **Build:** Pending

### Epic 5: Polish
- [ ] Story 5.1: Scroll animations
- [ ] Story 5.2: Mobile responsiveness
- [ ] Story 5.3: Telemetry
- [ ] Story 5.4: Reality Tuner verification
- **Build:** Pending

## Testing URLs
- Classic: `https://thegrove.foundation/?experience=classic`
- Genesis: `https://thegrove.foundation/?experience=genesis`

## Notes
[Session notes will be added during execution]
