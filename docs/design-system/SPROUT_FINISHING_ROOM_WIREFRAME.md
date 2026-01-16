# Wireframe: Sprout Finishing Room v1.1 (JSON-Render Integration)

**Version:** 1.1
**Status:** Approved with Recommendations
**Designer:** UI/UX Designer Agent
**Date:** 2026-01-15

---

## Design Intent

This wireframe outlines a revised user experience for the Sprout Finishing Room, leveraging the `json-render` library to transform the static document display into a dynamic, interactive workspace. The user will be able to inspect, refine, and direct `ResearchDocument` objects, which are now treated as living artifacts rather than static blobs of text.

---

## Layout Architecture

The three-column layout is retained, but the center column is now powered by `json-render`.

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ╭─ HEADER BAR ─────────────────────────────────────────────────────────╮    │
│  │  🌱 SPROUT FINISHING ROOM          [Sprout Title...]        ✕ Close  │    │
│  ╰──────────────────────────────────────────────────────────────────────╯    │
├────────────────────┬─────────────────────────────────┬───────────────────────┤
│                    │  ╭─ PREVIEW HEADER ────────────╮ │                       │
│   PROVENANCE       │  │ Document                </> │ │   ACTION PANEL        │
│   PANEL            │  ╰────────────────────────────╯ │                       │
│   (280px fixed)    │      (flex: 1)                  │   (320px fixed)       │
│                    │                                 │                       │
│  ┌──────────────┐  │  ┌─────────────────────────┐   │  ┌─────────────────┐  │
│  │ ORIGIN       │  │  │ [Rendered ResearchHeader] │   │  │ PRIMARY ACTION  │  │
│  │ ─────────    │  │  │                         │   │  │                 │  │
│  │ 🔮 Lens      │  │  │ [Rendered AnalysisBlock]  │   │  │  Revise &       │  │
│  │ Academic     │  │  │                         │   │  │  Resubmit       │  │
│  │ Researcher   │  │  │ [Rendered SourceList]     │   │  │                 │  │
│  │              │  │  │                         │   │  │  [textarea]     │  │
│  │ 🧠 COGNITIVE │  │  │ [Rendered Metadata]       │   │  │                 │  │
│  │    ROUTING   │  │  │                         │   │  │  [Submit]       │  │
│  │ ─────────    │  │  └─────────────────────────┘   │  └─────────────────┘  │
│  │ Path: deep-  │  │                                │                       │
│  │ dive → cost  │  │                                │                       │
│  └──────────────┘  │                                │                       │
│                    │                                 │                       │
└────────────────────┴─────────────────────────────────┴───────────────────────┘
```
---

## ResearchObject Component Catalog

This catalog defines the `json-render` components for displaying `ResearchDocument` objects.

### `ResearchHeader`
- **Props:**
  - `position`: `string`
  - `query`: `string`
- **Description:** Displays the main thesis and the original research query.

### `AnalysisBlock`
- **Props:**
  - `content`: `string` (Markdown)
- **Description:** Renders the full analysis section.

### `SourceList`
- **Props:**
  - `sources`: `object[]` (`index`, `title`, `url`, `snippet`, `domain`, `accessedAt`)
- **Description:** Displays the list of citations.

### `LimitationsBlock`
- **Props:**
  - `content`: `string`
- **Description:** Renders the "what couldn't be determined" section.

### `Metadata`
- **Props:**
  - `status`: `enum('complete', 'partial', 'insufficient-evidence')`
  - `confidenceScore`: `number` (0-1)
  - `wordCount`: `number`
- **Description:** Displays key metadata about the research document.

---

*All other sections of the original wireframe (Provenance Panel, Action Panel, Accessibility Checklist, etc.) are retained as is.*