# S0-SKIN-QuantumAudit Execution Contract

**Codename:** `S0-SKIN-QuantumAudit`
**Status:** Execution Contract for Claude Code CLI
**Protocol:** Grove Execution Protocol v1.5
**Baseline:** `main` (post S15-Federation)
**Date:** 2026-01-19

---

## Live Status

| Field | Value |
|-------|-------|
| **Current Phase** | Phase 0 - Setup |
| **Status** | 🚀 Executing |
| **Blocking Issues** | None |
| **Last Updated** | 2026-01-19T00:00:00Z |
| **Next Action** | Capture Playwright baselines |

---

## Attention Anchor

**We are building:** A data extraction layer that creates a "digital twin" of the current Quantum Glass styling with provenance metadata.

**Success looks like:** App looks EXACTLY the same (zero visual regression), but we have structured data files (TypeScript map + JSON) that describe all CSS variables.

---

## Hard Constraints

### Strangler Fig Compliance

```
FROZEN ZONE — DO NOT TOUCH
├── /terminal route
├── /foundation route (except Foundation consoles)
├── src/surface/components/Terminal/*
└── src/workspace/* (legacy GroveWorkspace)

ACTIVE BUILD ZONE — WHERE WE WORK
├── /explore route
├── /bedrock route
├── src/explore/*
├── src/bedrock/*
├── src/core/schema/*
└── src/theme/* (NEW - theme infrastructure)
```

### DEX Compliance Matrix

| Feature | Declarative | Agnostic | Provenance | Scalable |
|---------|-------------|----------|------------|----------|
| quantum-glass.map.ts | ✅ Config-driven | ✅ No model deps | ✅ Source tracked | ✅ Extensible |
| quantum-glass.json | ✅ Pure data | ✅ No model deps | ✅ Full provenance | ✅ Versioned |
| GlassPanel density | ✅ Prop-based | ✅ No model deps | N/A | ✅ Non-breaking |

---

## S0 Tasks (from Notion)

### Task 0.1: Create quantum-glass.map.ts
- Location: `src/theme/mappings/quantum-glass.map.ts`
- Purpose: TypeScript mapping of CSS variable names to semantic keys
- Export: `QUANTUM_GLASS_MAP` constant

### Task 0.2: Create quantum-glass.json
- Location: `src/bedrock/themes/quantum-glass.json`
- Purpose: Digital twin with full provenance metadata
- Structure: GroveSkin schema compliant

### Task 0.3: Add density prop to GlassPanel
- Location: `src/bedrock/primitives/GlassPanel.tsx`
- Change: Add `density?: 'compact' | 'comfortable' | 'spacious'` prop
- Behavior: Non-breaking, defaults to current behavior

### Task 0.4: Audit globals.css
- Location: `styles/globals.css`
- Action: Document any gaps with TODO comments
- Output: Gap analysis in DEVLOG.md

---

## Execution Architecture

### Phase 0: Setup
- [x] Create sprint folder structure
- [x] Read globals.css (CSS variable inventory)
- [ ] Capture Playwright baselines on main
- [ ] Create feature branch

### Phase 1: Data Extraction (Tasks 0.1, 0.2)
- [ ] Create quantum-glass.map.ts
- [ ] Create quantum-glass.json with provenance
- [ ] Verify TypeScript compiles

### Phase 2: Component Enhancement (Task 0.3)
- [ ] Add density prop to GlassPanel
- [ ] Ensure non-breaking (default behavior unchanged)
- [ ] Test all density variants

### Phase 3: Audit & Documentation (Task 0.4)
- [ ] Audit globals.css for gaps
- [ ] Document missing variables with TODOs
- [ ] Update DEVLOG with gap analysis

### Phase 4: Verification
- [ ] Run Playwright visual comparison
- [ ] Verify zero visual regression
- [ ] Run E2E console monitoring
- [ ] Complete REVIEW.html

---

## CSS Variables Inventory (from globals.css)

### Backgrounds
- `--glass-void: #030712`
- `--glass-panel: rgba(17, 24, 39, 0.6)`
- `--glass-solid: #111827`
- `--glass-elevated: rgba(30, 41, 59, 0.4)`

### Borders
- `--glass-border: #1e293b`
- `--glass-border-hover: #334155`
- `--glass-border-active: rgba(16, 185, 129, 0.5)`
- `--glass-border-selected: rgba(6, 182, 212, 0.5)`

### Neon Accents
- `--neon-green: #10b981`
- `--neon-cyan: #06b6d4`
- `--neon-amber: #f59e0b`
- `--neon-violet: #8b5cf6`

### Text Scale
- `--glass-text-primary: #ffffff`
- `--glass-text-secondary: #e2e8f0`
- `--glass-text-body: #cbd5e1`
- `--glass-text-muted: #94a3b8`
- `--glass-text-subtle: #64748b`
- `--glass-text-faint: #475569`

### Glows
- `--glow-green: 0 0 20px -5px rgba(16, 185, 129, 0.4)`
- `--glow-cyan: 0 0 20px -5px rgba(6, 182, 212, 0.4)`
- `--glow-ambient: 0 8px 32px rgba(0, 0, 0, 0.4)`

### Motion
- `--ease-out-expo: cubic-bezier(0.16, 1, 0.3, 1)`
- `--duration-fast: 150ms`
- `--duration-normal: 300ms`
- `--duration-slow: 500ms`

---

## Success Criteria

### Sprint Complete When:
- [ ] All phases completed with verification
- [ ] All DEX compliance gates pass
- [ ] All screenshots captured and embedded in REVIEW.html
- [ ] REVIEW.html complete with all sections
- [ ] E2E test with console monitoring passes
- [ ] Zero visual regression (Playwright comparison)
- [ ] Build and lint pass
- [ ] User notified with REVIEW.html path

### Sprint Failed If:
- ❌ Any FROZEN ZONE file modified
- ❌ Visual regression detected (app looks different)
- ❌ DEX compliance test fails
- ❌ REVIEW.html not created or incomplete
- ❌ TypeScript compilation fails

---

*This contract is binding. Deviation requires explicit human approval.*
