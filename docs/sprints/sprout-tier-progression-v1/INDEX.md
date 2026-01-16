# Sprint Index: S4-SL-TierProgression

## Quick Navigation

| Document | Purpose | Status |
|----------|---------|--------|
| [SPEC.md](./SPEC.md) | Goals, acceptance criteria, live status | ✅ |
| [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md) | Self-contained implementation guide | ✅ |
| [CONTINUATION_PROMPT.md](./CONTINUATION_PROMPT.md) | Resume from fresh context | ✅ |
| [DEVLOG.md](./DEVLOG.md) | Development progress tracking | 🟡 |

---

## Planning Artifacts

| Document | Purpose |
|----------|---------|
| [REPO_AUDIT.md](./REPO_AUDIT.md) | Current state analysis |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Target state design |
| [MIGRATION_MAP.md](./MIGRATION_MAP.md) | File-by-file change plan |
| [DECISIONS.md](./DECISIONS.md) | Architecture decision records |
| [SPRINTS.md](./SPRINTS.md) | Epic and story breakdown |

---

## Design Artifacts

| Document | Purpose |
|----------|---------|
| [DESIGN_SPEC.md](./DESIGN_SPEC.md) | TierBadge component specification |
| [DESIGN_DECISIONS.md](./DESIGN_DECISIONS.md) | 8 design questions answered |
| [DESIGN_SYSTEM_STANDARDS.md](./DESIGN_SYSTEM_STANDARDS.md) | Token usage guidelines |

---

## Requirements

| Document | Purpose |
|----------|---------|
| [USER_STORIES.md](./USER_STORIES.md) | 8 stories with Gherkin acceptance criteria |

---

## Sprint Overview

**Goal:** Make the botanical lifecycle visible and functional in the UI.

**Scope:**
- TierBadge component with emoji indicators
- Tier badges in GardenTray sprout cards
- Tier badge in Finishing Room header
- "Promote to Sapling" action updates sprout stage
- promotedAt timestamp for provenance

**Out of Scope:**
- Tier filtering (Phase 1)
- Auto-advancement (Phase 2)
- Metrics dashboard (Phase 2)
- Living Glass migration (Phase 5)

---

## Getting Started

### For Fresh Context

```
cat docs/sprints/sprout-tier-progression-v1/CONTINUATION_PROMPT.md
```

### For Implementation

```
/grove-execution-protocol S4-SL-TierProgression
```

Then follow [EXECUTION_PROMPT.md](./EXECUTION_PROMPT.md).

---

## Related Links

| Resource | Location |
|----------|----------|
| Epic in Notion | [Sprout Lifecycle v1](https://www.notion.so/2e9780a78eef81fa856cf85f313c722d) |
| Sprint in Notion | [S4-SL-TierProgression](https://www.notion.so/2e9780a78eef81e1be07c2afe30b16da) |
| DEX Compliance | `.agent/status/S4_DEX_COMPLIANCE_REVIEW.md` |
| Product Brief | `.agent/status/S4_PRODUCT_BRIEF.md` |

---

*Sprint index for S4-SL-TierProgression*
*Foundation Loop v2*
