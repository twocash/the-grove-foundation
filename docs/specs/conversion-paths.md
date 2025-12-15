# Conversion Paths by Archetype

## Overview

Each archetype has a tailored conversion path designed to feel natural to their worldview. The CTAs are presented after the simulation reveal ("You're already in the Grove").

**Principle:** People share with people like them. The conversion path should make it easy to recruit within their network.

---

## Academic

**Headline:** "You've seen what distributed AI infrastructure could mean for research independence."

**Subheadline:** "The Grove Foundation is building the research council now. Universities that join early shape the architecture."

### CTAs

| Priority | Label | Description | Action |
|----------|-------|-------------|--------|
| Primary | "Nominate a Colleague" | Their email goes into the research council pipeline. Anonymous. | Modal: NominationForm |
| Secondary | "Explore Research Council" | Learn about governance, IP, and compute access | Link: /research-council |
| Tertiary | "Request Faculty Briefing" | 30-min overview for your department or lab | Calendly: faculty-briefing |

### Nomination Form Fields
- Colleague's email
- Their institution
- Their research area (optional)
- Your relationship (optional, for context)
- "Your nomination is anonymous — they won't know who referred them"

### Post-Conversion Flow
- Nominee receives: "A colleague thinks you should see this" + Terminal link
- Original nominator gets: "Thanks. We'll let you know when they join."

---

## Engineer

**Headline:** "The architecture is open. The codebase is live. What would you build?"

**Subheadline:** "The Grove Foundation needs distributed systems engineers who care about infrastructure as public good."

### CTAs

| Priority | Label | Description | Action |
|----------|-------|-------------|--------|
| Primary | "View the Codebase" | GitHub repo with good-first-issues tagged | Link: github.com/twocash/the-grove-foundation (external) |
| Secondary | "Submit an RFC" | Propose a new component or architecture change | Link: /contribute/rfc |
| Tertiary | "Send to an Engineer" | Share the Terminal with someone who should see it | Modal: ShareForm |

### RFC Submission Fields
- RFC Title
- Problem Statement
- Proposed Solution
- Your GitHub handle
- "RFCs are reviewed weekly by the Technical Steering Committee"

### Share Form Fields
- Their email
- Optional message
- "They'll receive: 'An engineer thinks you should see this'"

---

## Concerned Citizen

**Headline:** "You've seen what's at stake — and what the alternative looks like."

**Subheadline:** "The Grove Foundation is building infrastructure for people who want agency in the AI transition."

### CTAs

| Priority | Label | Description | Action |
|----------|-------|-------------|--------|
| Primary | "Share What You Saw" | Generate a shareable card with your lens | Modal: ShareLens |
| Secondary | "Get Updates" | Monthly digest — no spam, just progress | Modal: EmailSignup |
| Tertiary | "Find Local Advocacy" | Connect with others in your region | Link: /community |

### Share Lens Modal
- Auto-generates shareable card with:
  - User's lens name (if custom) or archetype
  - "I explored The Grove Terminal. Here's what I found."
  - Link to Terminal
- Share buttons: Twitter/X, LinkedIn, Copy Link, Email

### Email Signup Fields
- Email address
- "We send one update per month. Unsubscribe anytime."

---

## Geopolitical Analyst

**Headline:** "You understand the systemic risks. Here's the countervailing infrastructure."

**Subheadline:** "The Grove Foundation is building the advisory board now. Policy thinkers who join early shape the governance."

### CTAs

| Priority | Label | Description | Action |
|----------|-------|-------------|--------|
| Primary | "Brief Your Organization" | We'll prepare a custom briefing for your team | Modal: BriefingRequest |
| Secondary | "Explore Advisory Board" | Governance structure, policy research priorities | Link: /advisory-board |
| Tertiary | "Request Policy Brief" | One-pager on distributed AI and national security | Modal: PolicyBriefRequest |

### Briefing Request Fields
- Your name
- Organization
- Role
- Attendee count (estimate)
- Preferred format: Video / In-person / Written + Q&A
- Specific topics of interest (optional)

### Policy Brief Request Fields
- Email address
- Organization (optional)
- Specific angle: National security / Regulatory / Economic / Other

---

## Big AI / Tech Exec

**Headline:** "You see the concentration risk from inside. Here's the hedge."

**Subheadline:** "The Grove Foundation offers strategic optionality for organizations managing AI infrastructure exposure."

### CTAs

| Priority | Label | Description | Action |
|----------|-------|-------------|--------|
| Primary | "Request Confidential Briefing" | NDA available. Direct conversation with Foundation leadership. | Modal: ExecBriefing |
| Secondary | "Explore Partnership" | White-label, licensing, strategic investment options | Link: /partnerships |
| Tertiary | "Share with a Peer (Discreetly)" | Forward to someone who should see this | Modal: DiscreetShare |

### Exec Briefing Modal
- Name
- Title
- Company
- Preferred contact method: Email / Phone / Signal
- "We'll reach out within 48 hours with scheduling options"
- Checkbox: "Request NDA before briefing"

### Discreet Share Modal
- Their email
- Your name (optional — can be anonymous)
- "They'll receive: 'Someone in your network thinks you should see this' — no sender attribution unless you include your name"

---

## Family Office / Investor

**Headline:** "This isn't a VC play. It's infrastructure for patient capital."

**Subheadline:** "The Grove Foundation's Founding Circle is forming. Generational investors who join early shape the economics."

### CTAs

| Priority | Label | Description | Action |
|----------|-------|-------------|--------|
| Primary | "Schedule Private Briefing" | 45-min strategic overview. Your network welcome. | Calendly: investor-briefing |
| Secondary | "Invite Your Network" | Host a briefing for family offices in your circle | Modal: NetworkBriefing |
| Tertiary | "Request Investment Memo" | Detailed analysis of the infrastructure opportunity | Modal: MemoRequest |

### Network Briefing Modal
- Your name
- Number of invitees (estimate)
- Preferred format: Video / In-person (location?)
- "We'll coordinate directly with you on scheduling and materials"

### Investment Memo Request
- Email address
- Name (optional)
- Fund/Office name (optional)
- Specific questions or focus areas (optional)

---

## Universal Elements

### All Conversion Flows Include:

1. **Continue Exploring option** — Never force conversion
2. **Learn About the Foundation** — Link to /about
3. **View the White Paper** — Link to full documentation

### Analytics for Each CTA:

```typescript
trackCTA({
  eventType: 'cta_clicked',
  ctaId: 'academic-nominate',
  archetypeId: 'academic',
  customLensId: user.customLens?.id,
  sessionId: session.id
});
```

### Post-Conversion Behavior:

- Show confirmation message
- Offer next action: "While you wait, continue exploring" or "Create a custom lens"
- Track in funnel analytics

---

## Email Templates

### Nomination Email (Academic)
```
Subject: A colleague thinks you should see this

Someone in your network nominated you to explore The Grove Terminal — 
an interactive experience about distributed AI infrastructure.

They thought you'd find it relevant to your work.

[Experience The Grove Terminal →]

This isn't a pitch. It's a 10-minute experience that might change 
how you think about AI infrastructure.

— The Grove Foundation
```

### Engineer Share Email
```
Subject: An engineer thinks you should see this

Someone forwarded you this: The Grove Terminal.

It's an interactive exploration of distributed AI infrastructure — 
the architecture thesis, the open codebase, and why it matters.

[Experience The Grove Terminal →]

Takes about 10 minutes. The codebase is on GitHub if you want to 
dig deeper.

— The Grove Foundation
```

### Discreet Exec Share Email
```
Subject: Someone in your network thinks you should see this

This was forwarded to you anonymously by someone in your professional 
network.

The Grove Terminal is an interactive experience about distributed AI 
infrastructure — and what it means for organizations managing 
concentration risk.

[Experience The Grove Terminal →]

10 minutes. No pitch. Just the architecture and the thesis.

— The Grove Foundation

P.S. If you'd like to know who sent this, they chose to remain 
anonymous. But you can reply to this email and we'll pass along 
your message.
```
