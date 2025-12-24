# Grove Foundation Development Roadmap

**Last Updated:** December 24, 2024  
**Current Sprint:** theme-system-foundation-v1

---

## 🗺️ Where We Are

```
                                    ┌─────────────────────────────────────┐
                                    │                                     │
                                    │    FOUNDATION REDESIGN INITIATIVE   │
                                    │                                     │
                                    └─────────────────┬───────────────────┘
                                                      │
                    ┌─────────────────────────────────┼─────────────────────────────────┐
                    │                                 │                                 │
                    ▼                                 ▼                                 ▼
         ┌──────────────────┐            ┌──────────────────┐            ┌──────────────────┐
         │                  │            │                  │            │                  │
         │  THEME SYSTEM    │ ────────►  │   COMPONENT      │ ────────►  │  REALITY TUNER   │
         │  FOUNDATION      │            │   REFACTOR       │            │  (Full UI)       │
         │                  │            │                  │            │                  │
         │  Sprint 1 ◄──YOU ARE HERE     │  Sprint 2        │            │  Sprint 3+       │
         │                  │            │                  │            │                  │
         └──────────────────┘            └──────────────────┘            └──────────────────┘
                    │                                 │                                 │
                    │                                 │                                 │
         ┌──────────┴──────────┐         ┌──────────┴──────────┐         ┌──────────┴──────────┐
         │ • Theme Provider    │         │ • ModuleLayout      │         │ • Live editing      │
         │ • Theme Resolver    │         │ • Inspector pattern │         │ • Export/import     │
         │ • JSON theme files  │         │ • Collection grids  │         │ • Custom themes     │
         │ • CSS integration   │         │ • Narrative refactor│         │ • Component schemas │
         │ • Foundation adopt  │         │ • Health Dashboard  │         │ • Journey editor    │
         └─────────────────────┘         └─────────────────────┘         └─────────────────────┘
```

---

## 📍 Current Sprint: theme-system-foundation-v1

### Goals

1. ✅ Create declarative theme system (JSON → CSS)
2. ✅ Apply Quantum Grove aesthetic to Foundation
3. ✅ Preserve Genesis paper aesthetic completely
4. ✅ Enable runtime theme switching
5. ✅ Lay groundwork for Reality Tuner

### Deliverables

| Artifact | Status | Location |
|----------|--------|----------|
| Vision Document | ✅ Complete | `grove-theme-system-vision.md` |
| REPO_AUDIT.md | ✅ Complete | This folder |
| SPEC.md | ✅ Complete | This folder |
| ARCHITECTURE.md | ✅ Complete | This folder |
| MIGRATION_MAP.md | ✅ Complete | This folder |
| DECISIONS.md | ✅ Complete | This folder |
| SPRINTS.md | ✅ Complete | This folder |
| EXECUTION_PROMPT.md | ✅ Complete | This folder |
| DEVLOG.md | ✅ Template Ready | This folder |

### Execution Status

```
[ ] Pre-sprint: Capture Genesis baseline
[ ] Epic 1: Theme Infrastructure
[ ] Epic 2: Theme JSON Files  
[ ] Epic 3: CSS Integration
[ ] Epic 4: Foundation Component Adoption
[ ] Epic 5: Testing & Validation
[ ] Epic 6: Documentation
```

---

## 📅 Sprint Sequence

### Sprint 1: theme-system-foundation-v1 ◄── CURRENT

**Duration:** ~4 days  
**Risk:** Low (additive changes)

**Scope:**
- Theme infrastructure (ThemeProvider, ThemeResolver)
- Theme JSON files (surface, foundation-quantum, terminal)
- CSS integration (globals.css, Tailwind config)
- Foundation component migration
- Tests and documentation

**Success Metric:** Foundation shows Quantum theme; Genesis unchanged

---

### Sprint 2: foundation-component-refactor-v1 ◄── NEXT

**Duration:** ~5 days  
**Risk:** Medium (refactoring existing components)

**Scope:**
- Extract component grammar (ModuleLayout, Inspector, Collection)
- Refactor Narrative Architect module
- Refactor Health Dashboard module
- Refactor Engagement Console module
- Refactor Knowledge Console module
- Standardize component patterns

**Success Metric:** All Foundation modules use consistent component patterns

**Depends On:** Sprint 1 complete

---

### Sprint 3: terminal-theme-adoption-v1

**Duration:** ~3 days  
**Risk:** Medium (touches active user-facing code)

**Scope:**
- Terminal workspace theming
- Light/dark mode implementation
- Lens color integration
- User preference persistence

**Success Metric:** Terminal supports theme switching

**Depends On:** Sprint 1 complete

---

### Sprint 4: reality-tuner-v1

**Duration:** ~5 days  
**Risk:** Low (new feature, isolated)

**Scope:**
- Full Reality Tuner UI
- Live theme editing
- Token preview panel
- Export/import functionality
- Save to custom themes

**Success Metric:** Can visually edit and save themes

**Depends On:** Sprint 1, Sprint 2 complete

---

### Sprint 5: component-schema-v1 (FUTURE)

**Duration:** TBD  
**Risk:** Medium

**Scope:**
- Card layout schemas
- Grid configuration schemas
- Animation preset schemas
- Component composition via config

**Success Metric:** Non-technical users can alter component layouts

**Depends On:** Sprint 4 complete

---

## 🎯 Long-Term Vision: UI Configuration Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         DECLARATIVE UI STACK                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   LAYER 4: EXPERIENCE SCHEMAS (Future)                                      │
│   └── Journey definitions, lens behaviors, interaction patterns             │
│                                                                             │
│   LAYER 3: COMPONENT SCHEMAS (Sprint 5+)                                    │
│   └── Card layouts, grid configurations, animation presets                  │
│                                                                             │
│   LAYER 2: CONTENT SCHEMAS (Existing)                                       │
│   └── Corpus definitions, node types, relationship definitions              │
│                                                                             │
│   LAYER 1: THEME SCHEMAS (Sprint 1) ◄── BUILDING NOW                        │
│   └── Colors, typography, effects, animations                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### The DEX Promise

When complete, the Grove Foundation will demonstrate the Trellis Architecture's core thesis:

> **"Can a non-technical domain expert alter behavior by editing a schema file, without recompiling the application?"**

| Layer | User Action | System Response |
|-------|-------------|-----------------|
| Theme | Edit JSON colors | UI updates immediately |
| Component | Edit JSON layout | Cards rearrange |
| Content | Edit corpus nodes | Knowledge graph evolves |
| Experience | Edit journey flow | User paths change |

---

## 🚫 Protected Areas (DO NOT MODIFY)

These files/directories are demo-critical and must NOT change without explicit approval:

```
src/surface/pages/GenesisPage.tsx
src/surface/pages/SurfacePage.tsx
src/surface/components/genesis/*
src/surface/components/ActiveGroveLayout.tsx
src/surface/components/ContentRail.tsx
```

**Why:** The Genesis demo is the public face of Grove. Any changes risk breaking carefully crafted animations, timing, and aesthetic.

---

## 🔗 Key Documents Reference

### This Sprint

| Document | Purpose |
|----------|---------|
| `grove-theme-system-vision.md` | Strategic vision, full technical spec |
| `REPO_AUDIT.md` | Current state analysis |
| `SPEC.md` | Goals, non-goals, acceptance criteria |
| `ARCHITECTURE.md` | Target architecture, schemas, data flow |
| `MIGRATION_MAP.md` | File-by-file change plan |
| `DECISIONS.md` | ADRs explaining design choices |
| `SPRINTS.md` | Epic/story breakdown with tests |
| `EXECUTION_PROMPT.md` | Self-contained handoff for Claude Code |
| `DEVLOG.md` | Execution tracking |

### Project Context

| Document | Location |
|----------|----------|
| Trellis Architecture | Project knowledge |
| Grove Foundation Spec | Project knowledge |
| Kinetic Framework | Project knowledge |

---

## ✅ Next Action

**To start the sprint:**

1. Capture Genesis baseline:
   ```bash
   cd C:/GitHub/the-grove-foundation
   npx playwright test --update-snapshots tests/e2e/genesis-baseline.spec.ts
   ```

2. Hand off to Claude Code:
   ```bash
   # In Claude Code CLI, reference EXECUTION_PROMPT.md
   ```

---

## 📞 Decisions Confirmed

| Question | Decision |
|----------|----------|
| Include Space Grotesk font? | **Yes** |
| Terminal theme in Sprint 1 or 3? | **Sprint 3** |
| Reality Tuner scope in Sprint 1? | **Read-only preview** |

---

*Roadmap Updated: December 24, 2024*
