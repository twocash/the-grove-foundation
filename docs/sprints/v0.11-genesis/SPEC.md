# Grove v0.11 Genesis Experience — Specification

## Overview
Feature-flagged landing page redesign following Jobs-style "Feel → Understand → Believe" progression. Maintains organic, warm, grassroots aesthetic—NOT futuristic/sci-fi.

## The One-Liner
> **"Your own personal AI village: learning, working, and one day—earning. All for you."**

## Goals
1. Create parallel "Genesis" landing experience alongside "Classic"
2. Feature flag toggle in Reality Tuner + URL param support
3. Lead with emotional hook, reveal product, then offer depth
4. Maintain organic/paper/grove-green palette (anti-Big-Brother aesthetic)
5. Track which experience users see for comparison

## Non-Goals
- No A/B testing infrastructure (just side-by-side comparison)
- No changes to Terminal (yet)
- No changes to Classic experience
- No new backend endpoints

## Design Principles
- **Warm, organic, handcrafted** — paper textures, grove-green, earthy tones
- **Anti-futuristic** — no sci-fi, no crypto-bro, no dystopian imagery
- **Garden metaphor** — growth, cultivation, tending, bearing fruit
- **Mass-market approachable** — friendly, grassroots, trustworthy

## Feature Flag
**Location:** `globalSettings.featureFlags` in narratives schema
**Flag ID:** `genesis-landing`
**Name:** "Genesis Landing Experience"
**Description:** "Show the new Jobs-style landing page instead of Classic"
**Default:** `false` (Classic remains default)

**URL Override:** `?experience=genesis` or `?experience=classic`

---

## Screen-by-Screen Specification

### Screen 1: The Hook (Full Viewport)
**Purpose:** Emotional hit. Ownership. Opposition to status quo.

**Visual:**
- Full viewport height
- Paper/cream background (`--color-paper`)
- Subtle organic animation (growing vines? floating leaves? gentle pulse?)
- NOT a constellation/nodes — too techy

**Copy:**
```
YOUR AI.

Not rented. Not surveilled. Not theirs.

Yours.

↓
```

**Styling:**
- "YOUR AI." — Large, grove-forest, serif (Lora)
- Subtext — Smaller, ink color, gentle fade-in sequence
- Scroll indicator — subtle, organic (leaf? seed? simple arrow?)

---

### Screen 2: The Problem (CEO Quotes)
**Purpose:** Establish stakes using their own words.

**Visual:**
- Paper background
- Three quote cards with subtle paper texture/shadow
- Cards feel like note cards or paper scraps

**Copy:**
```
[Card 1]
"AI is the most profound technology humanity has ever worked on... 
People will need to adapt."
— SUNDAR PICHAI, GOOGLE CEO

[Card 2]
"This is the new version of [learning to code]... 
adaptability and continuous learning would be the most valuable skills."
— SAM ALTMAN, OPENAI CEO

[Card 3]
"People have adapted to past technological changes... 
I advise ordinary citizens to learn to use AI."
— DARIO AMODEI, ANTHROPIC CEO
```

**Below quotes:**
```
They're building the future of intelligence.
And they're telling you to get comfortable being a guest in it.

What if there was another way?
```

**Styling:**
- Quote cards — paper-dark background, subtle border
- Attribution — mono font, muted
- "What if..." — grove-orange, slightly larger, question mark as hook

---

### Screen 3: The Product Reveal
**Purpose:** The "thousand songs in your pocket" moment.

**Visual:**
- Centered layout
- Simple illustration: could be abstract village shapes, garden plot, or glowing warmth emanating from a laptop (but organic, not techy)
- Three icons in a row

**Copy:**
```
YOUR GROVE

Your own personal AI village:
learning, working, and one day—earning.
All for you.

🌱 Learning           🔗 Working            🔒 Yours
   while you sleep      with other Groves      entirely
```

**Below (the value teaser, italicized):**
```
Tend your Grove, and one day it might bear fruit—
services and capabilities you can share, trade, or sell.
```

**CTA:**
```
[ See it in action → ]
```

**Styling:**
- "YOUR GROVE" — Large, grove-forest, serif
- One-liner — Medium, ink color
- Icons — Simple, could be emoji or custom SVG in earthy tones
- Value teaser — Italic, smaller, ink-muted
- CTA — grove-green background, paper text

---

### Screen 4: The Aha Demo
**Purpose:** Let them FEEL the product.

**Visual:**
- Simulated Terminal message (simplified, not full Terminal)
- Paper card aesthetic, not dark terminal
- Feels like receiving a handwritten note

**Copy:**
```
Your Grove is thinking...

─────────────────────────────

"Good morning. I've been exploring a few threads 
while you were away.

I found a connection between distributed systems 
and cognitive architecture that might interest you.

Want me to explain, or should I keep digging?"

[ Go deeper → ]  [ Keep exploring ]
```

**Below:**
```
This is what AI feels like when it's yours.
```

**Styling:**
- Message container — paper-dark, handwritten-style font option? Or clean serif
- Buttons — grove-green primary, outline secondary
- Tagline — centered, italic, grove-forest

---

### Screen 5: The Foundation (For Believers)
**Purpose:** Now they're ready for the Ratchet and depth.

**Visual:**
- Clean section
- Simple visualization of the Ratchet concept (timeline? growth curve?)
- Three "go deeper" links

**Copy:**
```
WHY THIS WORKS

AI capability doubles every 7 months.
Today's data center becomes tomorrow's laptop.
We're building the infrastructure to ride that wave.

[ The Ratchet → ]  [ The Economics → ]  [ The Vision → ]

Want to go deeper? Open the Terminal.

[ Explore → ]
```

**Styling:**
- Clean, confident, minimal
- Links open Terminal with specific queries
- Paper background continues

---

### Screen 6: Call to Action
**Purpose:** Convert interest to action.

**Visual:**
- Full viewport
- Centered, single focus
- Subtle background texture (paper grain)

**Copy:**
```
THE GROVE IS GROWING

Join the first Gardeners shaping the future of personal AI.

[ Request Early Access ]

— or —

[ Explore the Terminal ]


───────────────────────────────────────
The Grove Foundation · Research Preview v0.11
```

**Styling:**
- "THE GROVE IS GROWING" — Large, grove-forest, serif
- Primary CTA — grove-green, prominent
- Secondary CTA — outline style
- Footer — muted, mono

---

## Acceptance Criteria

### Infrastructure
- [ ] Feature flag `genesis-landing` exists in Reality Tuner
- [ ] URL param `?experience=genesis` loads Genesis page
- [ ] URL param `?experience=classic` loads Classic page
- [ ] Default (no param) respects Reality Tuner setting
- [ ] Both experiences accessible in production

### Genesis Experience
- [ ] All 6 screens render correctly
- [ ] Scroll behavior smooth between screens
- [ ] Mobile responsive
- [ ] Maintains organic/paper aesthetic throughout
- [ ] "See it in action" opens Terminal
- [ ] "Go deeper" links work
- [ ] CTAs functional

### Telemetry
- [ ] Track which experience loaded
- [ ] Track scroll depth in Genesis
- [ ] Track CTA clicks

### Quality
- [ ] Build passes
- [ ] No console errors
- [ ] Lighthouse performance acceptable
- [ ] Classic experience unchanged
