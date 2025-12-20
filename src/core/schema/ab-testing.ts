/**
 * A/B Testing Schema Types
 * Used for hook variant testing and CTA optimization
 */

export interface HookVariant {
  id: string;
  text: string;
  weight: number; // 0-100, relative weight for selection
}

export interface ABTest {
  id: string;
  name: string;
  elementType: 'prompt_hook' | 'cta';
  variants: HookVariant[];
  status: 'draft' | 'active' | 'paused' | 'completed';
}

export interface VariantSelection {
  variantId: string;
  experimentId: string;
  sessionId: string;
  selectedAt: number;
}
