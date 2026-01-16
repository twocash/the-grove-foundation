# Wireframe: JSON-Render Custom Lens Creator

**Version:** 1.1
**Status:** Approved with Recommendations
**Designer:** UI/UX Designer Agent
**Date:** 2026-01-14

---

## Design Intent

This wireframe outlines a new user experience for the Custom Lens Creator, leveraging the `json-render` library to transform the existing multi-step form into a dynamic, conversational interface. The user will co-create their lens with an AI assistant, with a live preview rendering in real-time.

---

## User Flow

1.  **Initiation:** The user starts the lens creation process.
2.  **Conversation:** The user describes their desired lens in natural language.
3.  **Live Generation:** The AI assistant generates a `json-render`-compatible JSON object, which is rendered as a live preview.
4.  **Refinement:** The user provides feedback in the chat, and the AI updates the JSON and the preview.
5.  **Confirmation:** Once satisfied, the user confirms the lens, and the valid JSON is saved.

---

## Layout Architecture

```
┌──────────────────────────────────────────────────────────────────────────────┐
│  ╭─ HEADER BAR ─────────────────────────────────────────────────────────╮    │
│  │  🔮 CUSTOM LENS CREATOR                 [Lens Name...]         ✕ Close  │    │
│  ╰──────────────────────────────────────────────────────────────────────╯    │
├─────────────────────────────────┬────────────────────────────────────────────┤
│                                 │  ╭─ PREVIEW HEADER ────────────────────╮    │
│   CONVERSATION PANEL            │  │ Live Preview                  </>   │    │
│                                 │  ╰────────────────────────────────────╯    │
│   (flex: 1)                     │      (flex: 1)                             │
│                                 │                                            │
│  ┌─────────────────────────┐    │  ┌────────────────────────────────────┐    │
│  │                         │    │  │                                    │    │
│  │   Chat history...       │    │  │   [Rendered HeroSection]           │    │
│  │                         │    │  │                                    │    │
│  │   User: "Create a lens  │    │  │   [Rendered ProblemFrame]          │    │
│  │   for skeptical         │    │  │                                    │    │
│  │   engineers..."         │    │  │   [Rendered NavigationPrompt]      │    │
│  │                         │    │  │                                    │    │
│  │   AI: "Here's a draft..."│    │  │                                    │    │
│  │                         │    │  │                                    │    │
│  └─────────────────────────┘    │  └────────────────────────────────────┘    │
│                                 │                                            │
├─────────────────────────────────┴────────────────────────────────────────────┤
│  ╭─ INPUT BAR ───────────────────────────────────────────────────────────╮    │
│  │  [Chat input...]                                         [Send] Button │    │
│  ╰────────────────────────────────────────────────────────────────────────╯    │
└──────────────────────────────────────────────────────────────────────────────┘
```
---

## Component Catalog

This catalog defines the vocabulary of components that the AI can use to generate the lens configuration.

### Content Blocks

#### `HeroSection`
- **Props:**
  - `headline`: `string`
  - `subtext`: `string[]`
  - `tone`: `enum('urgent', 'contemplative', 'technical', 'accessible')`
- **Description:** A prominent header section to set the tone of the lens.

#### `ProblemFrame`
- **Props:**
  - `quotes`: `object[]` (`text`, `author`, `title`)
  - `tension`: `string[]`
- **Description:** A section to frame the problem space with quotes and points of tension.

#### `MarkdownBlock`
- **Props:**
  - `content`: `string` (Markdown)
- **Description:** A flexible block for rendering arbitrary Markdown content.

#### `SourceList`
- **Props:**
  - `sources`: `object[]` (`index`, `title`, `url`, `snippet`, `domain`, `accessedAt`)
- **Description:** A list of sources, rendered in a consistent format.

### Interactive Blocks

#### `NavigationPrompt`
- **Props:**
  - `label`: `string`
  - `target`: `enum('journey', 'hub', 'commons', 'terminal')`
  - `action`: `ActionSchema`
- **Description:** A prompt that triggers a navigation action.

#### `EngagementTrigger`
- **Props:**
  - `condition`: `enum('low_entropy', 'high_entropy', 'first_visit', 'returning')`
  - `message`: `string`
  - `action`: `ActionSchema`
- **Description:** A trigger that fires based on the user's engagement state.

### Quantum-Reactive Blocks

#### `LensReactiveContent`
- **Props:**
  - `variants`: `Record<string, string>` (lensId → content)
  - `fallback`: `string`
- **Description:** A block that renders different content based on the active lens.

---

## Validation Error Flow

- **If the AI generates invalid JSON:**
  1.  The system will attempt to self-correct by sending an error message back to the AI.
  2.  The user will see a non-intrusive message in the chat: "I've made a mistake in the output. I'm correcting it now..."
  3.  If self-correction fails, the user will see a "Generation Failed" message with an option to retry.

---

## Accessibility Checklist

- [x] **Keyboard Navigable:** All interactive elements are focusable and operable with a keyboard.
- [x] **Screen Reader Compatible:** All elements have appropriate ARIA roles, labels, and states.
- [x] **Sufficient Color Contrast:** All text and UI elements meet WCAG AA contrast ratios.
- [x] **Clear Focus States:** All focusable elements have a clear and consistent focus indicator.
- [x] **Semantic HTML:** The rendered output uses semantic HTML elements.
- [x] **Reduced Motion:** All animations respect the `prefers-reduced-motion` media query.
- [x] **Text Resizing:** The UI remains usable when the user resizes the text.
- [x] **Accessible Forms:** The chat input and any other form elements are properly labeled.