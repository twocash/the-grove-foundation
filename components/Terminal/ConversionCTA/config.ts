// config.ts — CTA configurations by archetype
// Each archetype has tailored conversion paths designed for their worldview

import { ArchetypeId, ConversionPath, ConversionCTA } from '../../../types/lens';

export const CTA_CONFIG: Record<ArchetypeId, ConversionPath> = {
  'academic': {
    archetypeId: 'academic',
    headline: "You've seen what distributed AI infrastructure could mean for research independence.",
    subheadline: "The Grove Foundation is building the research council now. Universities that join early shape the architecture.",
    ctas: [
      {
        id: 'academic-nominate',
        label: 'Nominate a Colleague',
        description: 'Anonymous peer nomination',
        priority: 'primary',
        action: { type: 'modal', modalId: 'nomination-form' }
      },
      {
        id: 'academic-council',
        label: 'Explore Research Council',
        description: 'Governance and compute access',
        priority: 'secondary',
        action: { type: 'link', url: '/research-council' }
      },
      {
        id: 'academic-briefing',
        label: 'Request Faculty Briefing',
        description: '30-min overview for your department',
        priority: 'tertiary',
        action: { type: 'calendly', url: 'https://calendly.com/grove/faculty-briefing' }
      }
    ]
  },

  'engineer': {
    archetypeId: 'engineer',
    headline: "The architecture is open. The codebase is live. What would you build?",
    subheadline: "The Grove Foundation needs distributed systems engineers who care about infrastructure as public good.",
    ctas: [
      {
        id: 'engineer-github',
        label: 'View the Codebase',
        description: 'Good first issues tagged',
        priority: 'primary',
        action: { type: 'link', url: 'https://github.com/twocash/the-grove-foundation', external: true }
      },
      {
        id: 'engineer-rfc',
        label: 'Submit an RFC',
        description: 'Propose architecture changes',
        priority: 'secondary',
        action: { type: 'link', url: '/contribute/rfc' }
      },
      {
        id: 'engineer-share',
        label: 'Send to an Engineer',
        description: 'Share the Terminal',
        priority: 'tertiary',
        action: { type: 'modal', modalId: 'share-form' }
      }
    ]
  },

  'concerned-citizen': {
    archetypeId: 'concerned-citizen',
    headline: "You've seen what's at stake — and what the alternative looks like.",
    subheadline: "The Grove Foundation is building infrastructure for people who want agency in the AI transition.",
    ctas: [
      {
        id: 'citizen-share',
        label: 'Share What You Saw',
        description: 'Generate a shareable card',
        priority: 'primary',
        action: { type: 'modal', modalId: 'share-lens' }
      },
      {
        id: 'citizen-updates',
        label: 'Get Updates',
        description: 'Monthly digest, no spam',
        priority: 'secondary',
        action: { type: 'modal', modalId: 'email-signup' }
      },
      {
        id: 'citizen-community',
        label: 'Find Local Advocacy',
        description: 'Connect with others',
        priority: 'tertiary',
        action: { type: 'link', url: '/community' }
      }
    ]
  },

  'geopolitical': {
    archetypeId: 'geopolitical',
    headline: "You understand the systemic risks. Here's the countervailing infrastructure.",
    subheadline: "The Grove Foundation is building the advisory board now. Policy thinkers who join early shape the governance.",
    ctas: [
      {
        id: 'geo-brief',
        label: 'Brief Your Organization',
        description: 'Custom briefing for your team',
        priority: 'primary',
        action: { type: 'modal', modalId: 'briefing-request' }
      },
      {
        id: 'geo-advisory',
        label: 'Explore Advisory Board',
        description: 'Governance and research priorities',
        priority: 'secondary',
        action: { type: 'link', url: '/advisory-board' }
      },
      {
        id: 'geo-policy',
        label: 'Request Policy Brief',
        description: 'One-pager on distributed AI',
        priority: 'tertiary',
        action: { type: 'modal', modalId: 'policy-brief-request' }
      }
    ]
  },

  'big-ai-exec': {
    archetypeId: 'big-ai-exec',
    headline: "You see the concentration risk from inside. Here's the hedge.",
    subheadline: "The Grove Foundation offers strategic optionality for organizations managing AI infrastructure exposure.",
    ctas: [
      {
        id: 'exec-briefing',
        label: 'Request Confidential Briefing',
        description: 'NDA available',
        priority: 'primary',
        action: { type: 'modal', modalId: 'exec-briefing' }
      },
      {
        id: 'exec-partner',
        label: 'Explore Partnership',
        description: 'White-label and licensing options',
        priority: 'secondary',
        action: { type: 'link', url: '/partnerships' }
      },
      {
        id: 'exec-share',
        label: 'Share with a Peer (Discreetly)',
        description: 'Anonymous forwarding',
        priority: 'tertiary',
        action: { type: 'modal', modalId: 'discreet-share' }
      }
    ]
  },

  'family-office': {
    archetypeId: 'family-office',
    headline: "This isn't a VC play. It's infrastructure for patient capital.",
    subheadline: "The Grove Foundation's Founding Circle is forming. Generational investors who join early shape the economics.",
    ctas: [
      {
        id: 'investor-briefing',
        label: 'Schedule Private Briefing',
        description: '45-min strategic overview',
        priority: 'primary',
        action: { type: 'calendly', url: 'https://calendly.com/grove/investor-briefing' }
      },
      {
        id: 'investor-network',
        label: 'Invite Your Network',
        description: 'Host a briefing for your circle',
        priority: 'secondary',
        action: { type: 'modal', modalId: 'network-briefing' }
      },
      {
        id: 'investor-memo',
        label: 'Request Investment Memo',
        description: 'Detailed analysis',
        priority: 'tertiary',
        action: { type: 'modal', modalId: 'memo-request' }
      }
    ]
  }
};

/**
 * Get conversion path for a given archetype
 */
export function getConversionPath(archetypeId: ArchetypeId): ConversionPath {
  return CTA_CONFIG[archetypeId];
}

/**
 * Get primary CTA for an archetype
 */
export function getPrimaryCTA(archetypeId: ArchetypeId): ConversionCTA | null {
  const path = CTA_CONFIG[archetypeId];
  return path?.ctas.find(cta => cta.priority === 'primary') || null;
}
