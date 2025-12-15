// ConversionCTA - Renders archetype-specific call-to-action after reveals
// Routes to appropriate modal or link based on archetype mapping

import React, { useState } from 'react';
import { ArchetypeId, ConversionCTA as CTAType, CTAAction } from '../../../types/lens';
import { CTA_CONFIG, getConversionPath } from './config';
import CTAModal from './CTAModal';
import NominationForm from './NominationForm';
import ShareFlow from './ShareFlow';
import EmailSignup from './EmailSignup';
import BriefingRequest from './BriefingRequest';

// Icons
const ExternalLinkIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
    <polyline points="15 3 21 3 21 9"/>
    <line x1="10" x2="21" y1="14" y2="3"/>
  </svg>
);

const CalendarIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8 2v4"/>
    <path d="M16 2v4"/>
    <rect width="18" height="18" x="3" y="4" rx="2"/>
    <path d="M3 10h18"/>
  </svg>
);

const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 6 6 18"/>
    <path d="m6 6 12 12"/>
  </svg>
);

interface ConversionCTAProps {
  archetypeId: ArchetypeId;
  customLensName?: string;
  onCTAClick?: (ctaId: string) => void;
  onDismiss?: () => void;
}

const ConversionCTAPanel: React.FC<ConversionCTAProps> = ({
  archetypeId,
  customLensName,
  onCTAClick,
  onDismiss
}) => {
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const path = getConversionPath(archetypeId);

  if (!path) return null;

  const handleCTAAction = (cta: CTAType) => {
    onCTAClick?.(cta.id);

    switch (cta.action.type) {
      case 'modal':
        setActiveModal(cta.action.modalId);
        break;
      case 'link':
        if (cta.action.external) {
          window.open(cta.action.url, '_blank', 'noopener,noreferrer');
        } else {
          window.location.href = cta.action.url;
        }
        break;
      case 'calendly':
        window.open(cta.action.url, '_blank', 'noopener,noreferrer');
        break;
      default:
        console.log('Unhandled CTA action:', cta.action);
    }
  };

  const renderModal = () => {
    switch (activeModal) {
      case 'nomination-form':
        return (
          <CTAModal onClose={() => setActiveModal(null)}>
            <NominationForm onSubmit={() => setActiveModal(null)} onClose={() => setActiveModal(null)} />
          </CTAModal>
        );
      case 'share-form':
      case 'share-lens':
        return (
          <CTAModal onClose={() => setActiveModal(null)}>
            <ShareFlow
              lensName={customLensName}
              onSubmit={() => setActiveModal(null)}
              onClose={() => setActiveModal(null)}
            />
          </CTAModal>
        );
      case 'email-signup':
        return (
          <CTAModal onClose={() => setActiveModal(null)}>
            <EmailSignup onSubmit={() => setActiveModal(null)} onClose={() => setActiveModal(null)} />
          </CTAModal>
        );
      case 'briefing-request':
      case 'exec-briefing':
      case 'policy-brief-request':
        return (
          <CTAModal onClose={() => setActiveModal(null)}>
            <BriefingRequest
              type={activeModal as 'briefing-request' | 'exec-briefing' | 'policy-brief-request'}
              onSubmit={() => setActiveModal(null)}
              onClose={() => setActiveModal(null)}
            />
          </CTAModal>
        );
      case 'discreet-share':
        return (
          <CTAModal onClose={() => setActiveModal(null)}>
            <ShareFlow
              lensName={customLensName}
              isDiscreet={true}
              onSubmit={() => setActiveModal(null)}
              onClose={() => setActiveModal(null)}
            />
          </CTAModal>
        );
      case 'network-briefing':
      case 'memo-request':
        return (
          <CTAModal onClose={() => setActiveModal(null)}>
            <BriefingRequest
              type={activeModal as 'network-briefing' | 'memo-request'}
              onSubmit={() => setActiveModal(null)}
              onClose={() => setActiveModal(null)}
            />
          </CTAModal>
        );
      default:
        return null;
    }
  };

  const getPriorityStyles = (priority: 'primary' | 'secondary' | 'tertiary') => {
    switch (priority) {
      case 'primary':
        return 'bg-grove-forest text-white hover:bg-grove-forest/90';
      case 'secondary':
        return 'bg-white border border-ink/20 text-ink hover:bg-ink/5';
      case 'tertiary':
        return 'bg-transparent text-ink-muted hover:text-ink';
    }
  };

  const getCTAIcon = (action: CTAAction) => {
    if (action.type === 'link' && action.external) {
      return <ExternalLinkIcon className="w-4 h-4 ml-1.5" />;
    }
    if (action.type === 'calendly') {
      return <CalendarIcon className="w-4 h-4 ml-1.5" />;
    }
    return null;
  };

  return (
    <>
      <div className="border border-grove-forest/20 rounded-lg bg-grove-forest/5 overflow-hidden">
        <div className="p-6">
          {/* Dismiss button */}
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="float-right p-1 hover:bg-ink/5 rounded transition-colors"
            >
              <XIcon className="w-4 h-4 text-ink-muted" />
            </button>
          )}

          {/* Headline */}
          <h3 className="font-display text-base text-ink mb-2 pr-8">
            {path.headline}
          </h3>

          {/* Subheadline */}
          <p className="font-serif text-sm text-ink-muted mb-6">
            {path.subheadline}
          </p>

          {/* CTAs */}
          <div className="space-y-3">
            {path.ctas.map((cta) => (
              <button
                key={cta.id}
                onClick={() => handleCTAAction(cta)}
                className={`w-full px-4 py-3 rounded-lg font-sans text-sm font-medium transition-colors flex items-center justify-between ${getPriorityStyles(cta.priority)}`}
              >
                <div className="text-left">
                  <span className="block">{cta.label}</span>
                  {cta.description && (
                    <span className={`block text-xs mt-0.5 ${cta.priority === 'primary' ? 'text-white/70' : 'text-ink-muted'}`}>
                      {cta.description}
                    </span>
                  )}
                </div>
                {getCTAIcon(cta.action)}
              </button>
            ))}
          </div>

          {/* Universal options */}
          <div className="mt-6 pt-4 border-t border-ink/10 flex flex-wrap gap-2 text-xs">
            <a href="/about" className="text-ink-muted hover:text-ink">
              Learn About the Foundation
            </a>
            <span className="text-ink/20">|</span>
            <a href="/whitepaper" className="text-ink-muted hover:text-ink">
              View the White Paper
            </a>
          </div>
        </div>
      </div>

      {/* Render active modal */}
      {activeModal && renderModal()}
    </>
  );
};

export default ConversionCTAPanel;
