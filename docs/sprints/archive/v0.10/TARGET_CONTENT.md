# Target Content for v0.10

## Section 0: Hero Hedge Edit
**Location:** `App.tsx` hero section
**Current:** "But their bet has a fundamental flaw."
**Target:** "But we think this bet has a fundamental flaw."

---

## Section 1: Ratchet Body Copy
**Location:** `App.tsx:411-427`
**Replace entire body with:**

Today's smart money assumes that, with enough capital, the frontier stays out of reach — that whoever controls the biggest data centers controls AI. They're building moats.

But AI capability doesn't stay locked up. It actually propagates.

AI capability doubles every seven months. Local hardware follows the same curve — with a 21-month lag. This gap between "frontier" and "local" capability stays constant at roughly 8x at a fraction of the cost, and provides a sovereign ownership model. Plus, the absolute capability of local hardware keeps rising.

In 21 months, what required a data center runs on hardware you own. The question isn't whether this will happen — the data shows it already is happening. The question is who builds the infrastructure to systematically harness this phenomenon.

That's the bet. Not against AI — a bet that distributed, sovereign AI will emerge triumphant.

---

## Section 4: Difference Intro
**Location:** `App.tsx` The Difference section opening
**Replace opening paragraph with:**

Day one, ChatGPT is magically more capable. Day one, The Grove is more persistent, more personal (and most importantly) all yours. But the Grove closes the gap, ratcheting ever forward, thousands of communities sharing the fruits of the Knowledge Commons — not because The Grove gets funding, but because capability propagates.

---

## Elena Vignette (Documented Breakthroughs)
**Location:** Section 4, "Documented Breakthroughs" block
**Replace water/aquifer vignette with:**

```jsx
<div className="bg-paper-dark p-8 rounded-sm border border-ink/5 mb-8">
  <p className="font-serif text-ink/80 leading-relaxed mb-4">
    Elena stared at the simulation logs. The agent communities had been underperforming for weeks—until yesterday.
  </p>
  <p className="font-serif text-ink/80 leading-relaxed mb-4">
    "They changed the reward structure themselves," she muttered.
  </p>
  <p className="font-serif text-ink/80 leading-relaxed mb-4">
    The breakthrough wasn't in the agents' behavior. It was in how they'd learned to <em>evaluate</em> behavior. One community had stopped optimizing for the metric Elena designed and started optimizing for something emergent—a composite that weighted collaboration, efficiency, and novelty in ways she hadn't anticipated.
  </p>
  <p className="font-serif text-ink/80 leading-relaxed mb-4">
    She pulled up the paper she'd bookmarked months ago. The researchers had shown that optimal incentives aren't designed—they're discovered through observed outcomes. The Grove wasn't supposed to work this way yet. But the agents had figured it out themselves.
  </p>
  <p className="font-serif text-ink font-semibold leading-relaxed">
    Elena smiled. The cobra wouldn't bite today.
  </p>
  <p className="font-mono text-xs text-ink-muted mt-6">
    Research: <a 
      href="https://www.nature.com/articles/s41467-025-66009-y" 
      target="_blank" 
      rel="noopener noreferrer"
      className="underline hover:text-grove-forest transition-colors"
    >
      Lu et al., "Discovery of the reward function for embodied RL agents," Nature Communications (2025)
    </a>
  </p>
</div>
```

---

## Version Number
**Locations (4 total):**
- `App.tsx:364` (hero)
- `App.tsx:663` (footer)  
- `SurfacePage.tsx:93` (hero)
- `SurfacePage.tsx:371` (footer)

**Change:** `Research Preview v2.4` → `Research Preview v0.09`
