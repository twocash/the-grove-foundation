// src/data/prompts/stage-prompts.ts
// Stage-based suggested prompts configuration
// Sprint: adaptive-engagement-v1

import type { StagePromptsConfig } from '../../core/schema/suggested-prompts';

export const stagePromptsConfig: StagePromptsConfig = {
  defaults: {
    maxDisplay: 3,
    refreshStrategy: 'engagement',
  },
  stages: {
    ARRIVAL: {
      stage: 'ARRIVAL',
      prompts: [
        {
          id: 'what-is-grove',
          text: 'What is The Grove?',
          intent: 'orientation',
          leadsTo: 'grove-overview',
          weight: 1.5,
        },
        {
          id: 'why-distributed',
          text: 'Why does distributed AI matter?',
          intent: 'motivation',
          leadsTo: 'distributed-ai-thesis',
        },
        {
          id: 'show-me',
          text: 'Show me how this works',
          intent: 'demonstration',
          leadsTo: 'interactive-demo',
          lensExclude: ['academic-researcher'],
        },
        {
          id: 'research-basis',
          text: "What's the research basis for distributed AI?",
          intent: 'motivation',
          leadsTo: 'academic-foundation',
          lensAffinity: ['academic-researcher'],
          weight: 1.5,
        },
      ],
    },
    ORIENTED: {
      stage: 'ORIENTED',
      prompts: [
        {
          id: 'explore-topics',
          text: 'What topics can I explore?',
          intent: 'discovery',
          leadsTo: 'hub-overview',
        },
        {
          id: 'deeper-last-topic',
          text: 'Take me deeper on {lastTopic}',
          intent: 'depth',
          dynamic: true,
          variables: ['lastTopic'],
        },
        {
          id: 'relevant-to-lens',
          text: "What's most relevant for a {lensName}?",
          intent: 'personalization',
          dynamic: true,
          variables: ['lensName'],
        },
        {
          id: 'key-concepts',
          text: 'What are the key concepts I should understand?',
          intent: 'discovery',
          leadsTo: 'core-concepts',
        },
      ],
    },
    EXPLORING: {
      stage: 'EXPLORING',
      prompts: [
        {
          id: 'connections',
          text: 'How does {topicA} connect to {topicB}?',
          intent: 'synthesis',
          dynamic: true,
          variables: ['topicA', 'topicB'],
        },
        {
          id: 'capture-insight',
          text: 'I want to save an insight',
          intent: 'contribution',
          command: '/sprout',
        },
        {
          id: 'surprise-me',
          text: 'Show me something unexpected',
          intent: 'serendipity',
        },
        {
          id: 'implications',
          text: 'What are the implications of this approach?',
          intent: 'depth',
        },
      ],
    },
    ENGAGED: {
      stage: 'ENGAGED',
      prompts: [
        {
          id: 'my-garden',
          text: 'Review my captured insights',
          intent: 'reflection',
          command: '/garden',
        },
        {
          id: 'underexplored',
          text: 'I want to explore {underexploredArea}',
          intent: 'depth',
          dynamic: true,
          variables: ['underexploredArea'],
        },
        {
          id: 'contribute',
          text: 'How can I contribute to Grove?',
          intent: 'contribution',
          leadsTo: 'contribution-guide',
        },
        {
          id: 'share-discovery',
          text: 'I found something interesting to share',
          intent: 'contribution',
        },
      ],
    },
  },
};
