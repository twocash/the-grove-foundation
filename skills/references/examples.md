# Example Sprints

Real-world examples of the Foundation Loop methodology applied to actual development work.

## Example 1: Knowledge Architecture Refactoring

**Sprint:** `knowledge-architecture-v1`
**Problem:** Monolithic 773-line JSON file mixing 8 different concerns
**Solution:** Split into domain-specific files with schema validation

### REPO_AUDIT Key Findings
- Single file `narratives.json` contained: journeys, nodes, hubs, lenses, feature flags, GCS mappings
- Two different hub concepts (`hubs` vs `topicHubs`) doing similar things
- Orphan journey with `hubId: null`
- Inconsistent path patterns

### Key Decisions (ADRs)
- **ADR-001:** Split by domain (exploration/, knowledge/, presentation/, infrastructure/)
- **ADR-002:** Merge duplicate hub concepts
- **ADR-003:** Standardize paths to `hubs/{id}/` pattern
- **ADR-004:** Require non-null hubId for all journeys
- **ADR-005:** Schema documentation becomes RAG content
- **ADR-006:** Backward compatibility via fallback

### Story Structure
8 epics, 17 stories covering:
1. Directory structure creation
2. Hub extraction with new hub added
3. Journey extraction with hubId fix
4. Node extraction
5. Server integration with fallback
6. Schema validation script
7. GCS content migration
8. Documentation updates

### Lessons Learned
- The split files deployed but `/api/narrative` still read from old file → caught by testing after deploy
- Missing `nodes.json` in loader → would have been caught by schema tests
- Step counter bug → would have been caught by journey navigation tests

---

## Example 2: Automated Testing Infrastructure

**Sprint:** `automated-testing-v1`
**Problem:** Zero automated tests; bugs only found in production
**Solution:** Test framework + health report system

### REPO_AUDIT Key Findings
- No test files anywhere
- `package.json` has no test scripts
- Schema validation script exists but not integrated
- Three bugs in previous sprint would have been caught by basic tests

### Key Decisions (ADRs)
- **ADR-001:** Vitest for unit/integration (Vite-native, fast)
- **ADR-002:** Playwright for E2E (reliable, cross-browser)
- **ADR-003:** Test critical paths, not coverage percentage
- **ADR-004:** Health report as first-class feature
- **ADR-005:** Integration into sprint methodology (update SKILL.md)
- **ADR-006:** No mocking of LLM responses (test routing, not output)
- **ADR-007:** Separate unit and integration test runs

### Story Structure
9 epics, 32 stories covering:
1. Framework setup (Vitest, Playwright, directories)
2. Schema validation tests
3. Journey navigation tests
4. Health report system
5. API contract tests
6. RAG orchestration tests
7. E2E smoke tests
8. CI integration
9. Documentation and methodology update

### Test Categories Created
| Category | Tests | Purpose |
|----------|-------|---------|
| Schema | 7 | Catch broken references |
| Journey | 3 | Validate node chains |
| API | 6 | Verify endpoint contracts |
| RAG | 3 | Confirm hub routing |
| E2E | 3 | Smoke test critical paths |

---

## Example 3: Feature Flag System (Hypothetical)

**Sprint:** `feature-flags-v1`
**Problem:** No way to gradually roll out features
**Solution:** Feature flag infrastructure with admin UI

### REPO_AUDIT Would Cover
- Current hardcoded feature toggles
- Places where conditional logic exists
- Existing admin interfaces
- User session/auth system

### ADRs Would Include
- Flag storage (config file vs database)
- Evaluation strategy (user %, random, specific users)
- Admin interface approach
- SDK vs direct checks
- Default behavior when flag missing

### Stories Would Cover
1. Flag definition schema
2. Flag storage implementation
3. Flag evaluation logic
4. React hook for flag checks
5. Admin UI for flag management
6. Tests for flag evaluation
7. Migration of existing toggles
8. Documentation

---

## Sprint Checklist

Use this checklist when creating a new sprint:

### Planning Phase
- [ ] Created sprint folder: `docs/sprints/{name}/`
- [ ] REPO_AUDIT.md analyzes current state
- [ ] SPEC.md defines clear goals and acceptance criteria
- [ ] ARCHITECTURE.md shows target state
- [ ] MIGRATION_MAP.md has file-by-file plan
- [ ] DECISIONS.md documents key choices
- [ ] SPRINTS.md breaks into executable stories
- [ ] EXECUTION_PROMPT.md is self-contained

### Testing Phase
- [ ] Test requirements identified
- [ ] Test stories included in SPRINTS.md
- [ ] Health checks defined for critical paths
- [ ] CI integration planned

### Execution Phase
- [ ] DEVLOG.md tracking progress
- [ ] Build gates verified after each epic
- [ ] Smoke tests passing
- [ ] Health check passing

### Completion
- [ ] All acceptance criteria met
- [ ] Tests passing: `npm test`
- [ ] Health check passing: `npm run health`
- [ ] Documentation updated
- [ ] Ready for deploy
