# Living Glass - v2 Design Vision (Post-1.0)

> **Status:** Future Vision - NOT Current Implementation  
> **Current v1.0 Standard:** Quantum Glass (see `DESIGN_SYSTEM.md`)  
> **Migration Sprint:** TBD (post-1.0 MVP)

This document describes the **aspirational design direction** for Grove Foundation's visual language, transitioning from the current Quantum Glass (cyber/technical) aesthetic to a more organic, botanical "Living Glass" system.

**IMPORTANT:** As of January 2026, both `/explore` and `/bedrock` use **Quantum Glass** tokens (`--neon-green`, `--glass-void`, Inter font, etc.). This Living Glass vision is documented for future reference but should NOT be implemented in current sprints.

---

# Updated Vision: The Grove OS - An Interface for a Living Ecology

**Core Metaphor:** The interface is not a *depiction* of a garden; it *is* the garden. It's a living cognitive space where the user acts as the Head Gardener, cultivating a knowledge ecosystem in partnership with AI agents. It is an OS for thought.

**Key Shifts in Vision:**

1.  **From "UI" to "Environment":** Every screen, every panel is a programmable environment for both human and agent. The design must afford control, transparency, and a sense of place. This isn't a webpage; it's a view into the user's sovereign "Grove node."
2.  **Provenance as the Primary Interaction:** The history of an idea is as important as the idea itself. The UI will make "provenance trails" a first-class citizen. Clicking on any "Sprout" will instantly reveal its origin story—the query, the source, the Gardener (human or agent) who captured it. This builds trust and creates a verifiable memory.
3.  **"Living Glass" with Purpose:** The "Living Glass" aesthetic now has a deeper meaning. The glass panels are the "terrariums"—the controlled environments where knowledge grows. The dark, organic background is the "rich soil." The `Grove Forest` and `Grove Clay` accents are the signs of life and intentional cultivation.

---

### **Mood Board: Living Glass**

**Vision:** The interface is a terrarium of living knowledge. Clean glass panels float above a dark, fertile background, revealing glimpses of the ecosystem within. The aesthetic is calm, intelligent, and deeply connected to the natural world.

#### **1. Core Palette: Forest & Firelight**

This palette is drawn directly from the project's design system, grounding the futuristic interface in an organic, earthy feel.

*   `--bg-primary: #0f172a` (Deep Night Soil) - A dark, rich base that allows the content to shine.
*   `--bg-secondary: #1e293b` (Wet Slate) - For the glass panels, cool and solid.
*   `--text-primary: #e2e8f0` (Starlight) - Crisp and clear for primary content.
*   `--text-secondary: #94a3b8` (Misty Morning) - Softer, for metadata and annotations.
*   `--accent-primary: #2F5C3B` (**Grove Forest**) - The color of deep, healthy growth. This is our primary interactive color for buttons, active states, and glows.
*   `--accent-secondary: #D95D39` (**Grove Clay**) - A warm, earthy orange. Used for secondary actions, notifications, or as a highlight, like a spark of insight or a terracotta pot.

#### **2. Typography: Classic & Clean**

We combine a classic serif for storytelling with a clean sans-serif for clarity.

**`Playfair Display`** - For moments of wonder.
> # The Ratchet Effect: A New Model for Intelligence

**`Inter`** - For clear communication.
> ## Research Complete
> The dominant model in current distributed inference networks charges per inference-second or per-token [1].

**`JetBrains Mono`** - For technical precision.
> ```typescript
> interface ResearchDocument { ... }
> ```

#### **3. Component Styling: Tactile & Agentic**

The glassmorphic style remains, but now infused with organic energy.

*   **Buttons:** Soft, rounded rectangles of "wet slate," with text in "starlight." When activated, they fill with a gentle `Grove Forest` green, and the text becomes brighter, as if drawing energy.
*   **Cards (`ResearchResultBlock`):** Floating glass panels with a soft, internal glow of `Grove Forest` around the border, suggesting life within. The "Misty Morning" text for metadata keeps it clean.
*   **Modals (`FullDocumentViewer`):** The "pane of glass" effect is now like looking through a clean window into a calm forest at night. The background is blurred and darkened, and the modal has a crisp, subtly glowing `Grove Forest` edge.

#### **4. Kinetic Feel: Subtle & Alive**

Motion reinforces the living ecosystem metaphor.

*   **Pulsing Glows:** Loading indicators now pulse with a soft `Grove Forest` green, like a gently breathing plant.
*   **Particle Trails:** On a successful action (like adding research), the particles are now warm `Grove Clay` embers that drift and fade, signifying a "spark" being successfully planted in the Grove.

---
*I will now create high-fidelity mockups based on this complete vision.*
