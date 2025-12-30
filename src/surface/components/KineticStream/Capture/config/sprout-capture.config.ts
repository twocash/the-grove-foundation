// src/surface/components/KineticStream/Capture/config/sprout-capture.config.ts
// Sprint: kinetic-cultivation-v1

/**
 * TEMPORARY: Structured for future JSON extraction.
 * Extract to: data/sprout-actions.json when multiple actions needed.
 * See: docs/sprints/kinetic-cultivation-v1/SPEC.md -> Declarative Extraction Roadmap
 */

export const SPROUT_CAPTURE_CONFIG = {
  defaultAction: {
    id: 'sprout',
    label: 'Plant Sprout',
    icon: '\u{1F331}',
    defaultStage: 'tender' as const,
  },

  captureFields: {
    required: ['content', 'provenance.sourceId', 'provenance.sourceType'],
    optional: ['tags', 'notes', 'provenance.lensId', 'provenance.journeyId'],
  },

  ui: {
    selection: {
      minLength: 3,
      debounceMs: 200,
    },
    pill: {
      magneticScale: 1.0,  // Disabled: was causing perceived "jump" on approach
      magneticDistance: 50,
    },
    card: {
      maxPreviewLength: 100,
      maxTags: 10,
    },
    tray: {
      collapsedWidth: 48,
      expandedWidth: 240,
    },
  },

  animation: {
    pillSpring: { stiffness: 400, damping: 30 },
    cardExpand: { duration: 0.2 },
    flight: { duration: 0.5 },
    counterSpring: { stiffness: 500, damping: 15 },
  },
} as const;

export type SproutCaptureConfig = typeof SPROUT_CAPTURE_CONFIG;
