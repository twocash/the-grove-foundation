# Execution Prompt — trellis-terminology-v1

## Context

Complete the terminology migration from "DAIRE" to "Trellis Architecture / DEX Standard." This is a documentation sprint — no functional code changes.

**Canonical terminology source:** The uploaded "Trellis Architecture Kernel Codex" and "First Order Directives" documents.

## Quick Reference: Old → New

| Old | New |
|-----|-----|
| DAIRE | Trellis Architecture |
| DAIRE principles | DEX Standard |
| Declarative Configuration | Declarative Sovereignty |
| Attribution Preservation | Provenance as Infrastructure |
| Three-Layer Separation | DEX Stack / Three-Layer Abstraction |
| Progressive Enhancement | Organic Scalability |

## Phase 1: Production Code (Must Build)

### 1.1 lib/health-validator.js
Find line 4 area, change:
```javascript
// OLD:
* Implements DAIRE principles:
* - Declarative Configuration: checks defined in JSON

// NEW:
* Implements Trellis Architecture / DEX Standard:
* - Declarative Sovereignty: checks defined in JSON
* - Provenance as Infrastructure: full attribution chain
* - Three-Layer DEX Stack: engine vs corpus separation
* - Organic Scalability: works without config
```

### 1.2 server.js
Find ~line 1686, change:
```javascript
// OLD:
// --- Health Dashboard API ---
// DAIRE Architecture Implementation

// NEW:
// --- Health Dashboard API ---
// Trellis Architecture / DEX Standard Implementation
```

### 1.3 src/foundation/consoles/HealthDashboard.tsx
Find ~line 414, change:
```tsx
// OLD:
<DataPanel title="DAIRE Alignment" icon={Activity}>

// NEW:
<DataPanel title="DEX Standard Alignment" icon={Activity}>
```

Also update the list items inside to use DEX terminology:
- "Declarative Sovereignty - Checks defined in JSON"
- "Provenance as Infrastructure - Log entries include attribution"
- "DEX Stack - Engine and corpus checks separated"
- "Organic Scalability - Works with minimal config"

**Verify:** `npm run build`

---

## Phase 2: Sprint Documentation

### 2.1 docs/sprints/health-dashboard-v1/DEVLOG.md
Search/replace "DAIRE" → "Trellis Architecture"

### 2.2 docs/sprints/health-dashboard-v1/MIGRATION_MAP.md
Search/replace "DAIRE" → "Trellis Architecture / DEX Standard"

### 2.3 docs/sprints/health-dashboard-v1/SPRINTS.md
Change "DAIRE Alignment" → "DEX Standard Alignment"

---

## Phase 3: Create Canonical Reference

Create `docs/architecture/TRELLIS.md`:

```markdown
# The Trellis Architecture: First Order Directives

**Implementing the Declarative Exploration (DEX) Standard**

Author: Jim Calhoun
Version: 1.0 (Genesis)
Status: Living Constitution
Context: The Grove Foundation

---

## 1. The Core Philosophy

**Models are seeds. Exploration architecture is soil.**

We reject the "Model Maximalist" thesis that value resides solely in LLM size.
We adhere to the **DEX Thesis**: Value comes from the *structure of exploration*.

We are building the **Trellis**—the support structure that allows organic
intelligence (human and artificial) to climb, branch, and bear fruit without
collapsing into chaos.

## 2. The First Order Directive

**Separation of Exploration Logic from Execution Capability.**

- **Exploration Logic (The Trellis):** Declarative definition of *how* we search,
  *what* constitutes a valid insight, and *where* connections should be made.
  Owned by domain experts. Defined in JSON/YAML.

- **Execution Capability (The Vine):** Raw processing power (LLM, RAG, Code
  Interpreter) that traverses the structure. Interchangeable and ephemeral.

**For Engineers & Agents:** Never hard-code an exploration path. Build the
*engine* that reads the map; do not build the map into the engine.

## 3. The DEX Stack Standards

### I. Declarative Sovereignty
- **Rule:** Domain expertise belongs in configuration, not code.
- **Test:** Can a non-technical expert alter behavior by editing a schema file,
  without recompiling? If no, the feature is incomplete.

### II. Capability Agnosticism
- **Rule:** The architecture must never assume specific AI capabilities.
- **Test:** If the model hallucinates, the Trellis must contain it, not break.

### III. Provenance as Infrastructure
- **Rule:** A fact without an origin is a bug.
- **Test:** Every insight must maintain an unbroken attribution chain.

### IV. Organic Scalability (The Trellis Principle)
- **Rule:** Structure must precede growth, but not inhibit it.
- **Test:** The system must support "guided wandering" not rigid tunnels.

## 4. The Three-Layer Abstraction (DEX Stack)

| Layer | Name | Change Velocity | Purpose |
|-------|------|-----------------|---------|
| 1 | Engine (Trellis Frame) | Low | Invariant physics |
| 2 | Corpus (Substrate) | Medium | Raw information |
| 3 | Configuration (Conditions) | High | DEX definitions |

## 5. Terminology Reference

| Term | Definition |
|------|------------|
| **Trellis** | Structural framework supporting the DEX stack |
| **DEX** | Declarative Exploration — separating intent from inference |
| **Sprout** | Atomic unit of captured insight |
| **Grove** | Accumulated, refined knowledge base |
| **Vine** | Execution capability — interchangeable and ephemeral |
| **Gardener** | Human applying judgment to AI-generated possibilities |
| **Superposition Collapse** | Human attention transforming AI outputs into validated insights |

---

*Build the Trellis. The community brings the seeds.*
```

---

## Phase 4: Standalone Skill Package

Update `C:\GitHub\grove-foundation-loop-skill\SKILL.md` to match `C:\GitHub\the-grove-foundation\SKILL.md` (already updated with Trellis/DEX).

Copy the updated content.

---

## Phase 5: Verification

```bash
# Verify no DAIRE references remain
grep -r "DAIRE" --include="*.md" --include="*.ts" --include="*.tsx" --include="*.js" .
# Expected: 0 results (or only in historical devlogs where appropriate)

# Run tests
npm test

# Run health check
npm run health

# Verify build
npm run build
```

---

## Commit

```bash
git add -A
git commit -m "docs: migrate DAIRE terminology to Trellis Architecture / DEX Standard

- Update production code comments (health-validator, server, HealthDashboard)
- Update sprint documentation
- Create canonical TRELLIS.md reference
- Sync standalone skill package
- Verify all DAIRE references removed"
```

---

## Success Criteria

- [ ] `grep -r "DAIRE"` returns 0 results
- [ ] `npm run build` succeeds
- [ ] `npm test` passes
- [ ] `npm run health` passes
- [ ] `docs/architecture/TRELLIS.md` exists
- [ ] HealthDashboard shows "DEX Standard Alignment"
