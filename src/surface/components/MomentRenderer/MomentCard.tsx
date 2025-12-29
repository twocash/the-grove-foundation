// src/surface/components/MomentRenderer/MomentCard.tsx
// Generic Moment Card Renderer
// Sprint: engagement-orchestrator-v1

import React, { Suspense } from 'react';
import type { Moment, MomentAction } from '@core/schema/moment';
import { getMomentComponent } from './component-registry';

// =============================================================================
// Props
// =============================================================================

export interface MomentCardProps {
  moment: Moment;
  onAction: (momentId: string, actionId: string) => void;
  onDismiss: (momentId: string) => void;
  activeLens?: string | null;
}

// =============================================================================
// Action Button Component
// =============================================================================

interface ActionButtonProps {
  key?: React.Key;
  action: MomentAction;
  onClick: () => void;
}

function ActionButton({ action, onClick }: ActionButtonProps) {
  const variantClasses: Record<string, string> = {
    primary: 'bg-grove-forest text-white hover:bg-grove-forest/90',
    secondary: 'bg-ink/10 text-ink hover:bg-ink/20',
    ghost: 'text-ink-muted hover:text-ink hover:bg-ink/5',
    danger: 'bg-red-500 text-white hover:bg-red-600',
  };

  const classes = variantClasses[action.variant || 'ghost'] || variantClasses.ghost;

  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${classes}`}
    >
      {action.icon && <span className="mr-2">{action.icon}</span>}
      {action.label}
    </button>
  );
}

// =============================================================================
// Content Renderers
// =============================================================================

function TextContent({ moment }: { moment: Moment }) {
  const { content } = moment.payload;

  return (
    <div className="flex items-start gap-3">
      {content.icon && (
        <span className="text-2xl flex-shrink-0">{content.icon}</span>
      )}
      <div>
        {content.heading && (
          <h3 className="font-medium text-ink mb-1">{content.heading}</h3>
        )}
        {content.body && (
          <p className="text-ink-muted text-sm">{content.body}</p>
        )}
      </div>
    </div>
  );
}

function CardContent({ moment, activeLens }: { moment: Moment; activeLens?: string | null }) {
  const { content } = moment.payload;

  // Check for lens-specific variants
  const variant = activeLens && content.variants?.[activeLens];
  const heading = variant?.heading || content.heading;
  const body = variant?.body || content.body;

  return (
    <div className="p-4 bg-paper/50 border border-ink/10 rounded-xl">
      {content.icon && (
        <div className="text-3xl mb-3">{content.icon}</div>
      )}
      {heading && (
        <h3 className="font-display text-lg text-ink mb-2">{heading}</h3>
      )}
      {body && (
        <p className="text-ink-muted">{body}</p>
      )}
    </div>
  );
}

function ComponentContent({ moment, activeLens }: { moment: Moment; activeLens?: string | null }) {
  const { content } = moment.payload;

  if (!content.component) {
    console.warn('[MomentCard] Component content missing component key');
    return null;
  }

  const Component = getMomentComponent(content.component);

  if (!Component) {
    // Fall back to card content if component not registered
    console.warn(`[MomentCard] Component "${content.component}" not registered, falling back to card`);
    return <CardContent moment={moment} activeLens={activeLens} />;
  }

  // Get lens-specific props if available
  const variant = activeLens && content.variants?.[activeLens];
  const props = {
    ...content.props,
    ...(variant?.props || {}),
    moment,
  };

  return (
    <Suspense fallback={<div className="animate-pulse bg-ink/5 h-32 rounded-xl" />}>
      <Component {...props} />
    </Suspense>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function MomentCard({ moment, onAction, onDismiss, activeLens }: MomentCardProps) {
  const { content, actions } = moment.payload;

  const handleAction = (actionId: string) => {
    const action = actions.find(a => a.id === actionId);
    if (action?.type === 'dismiss') {
      onDismiss(moment.meta.id);
    } else {
      onAction(moment.meta.id, actionId);
    }
  };

  // Render content based on type
  const renderContent = () => {
    switch (content.type) {
      case 'text':
        return <TextContent moment={moment} />;
      case 'card':
        return <CardContent moment={moment} activeLens={activeLens} />;
      case 'component':
        return <ComponentContent moment={moment} activeLens={activeLens} />;
      default:
        return <CardContent moment={moment} activeLens={activeLens} />;
    }
  };

  return (
    <div
      className="moment-card"
      data-moment-id={moment.meta.id}
      data-surface={moment.payload.surface}
    >
      {/* Content */}
      <div className="mb-4">
        {renderContent()}
      </div>

      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {actions.map((action) => {
            const handleClick = () => handleAction(action.id);
            return (
              <ActionButton
                key={action.id}
                action={action}
                onClick={handleClick}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MomentCard;
