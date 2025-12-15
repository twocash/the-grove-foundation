// BriefingRequest - Various briefing request forms
// Supports: briefing-request, exec-briefing, policy-brief-request, network-briefing, memo-request

import React, { useState } from 'react';

type BriefingType =
  | 'briefing-request'
  | 'exec-briefing'
  | 'policy-brief-request'
  | 'network-briefing'
  | 'memo-request';

interface BriefingRequestProps {
  type: BriefingType;
  onSubmit: () => void;
  onClose: () => void;
}

const BRIEFING_CONFIG: Record<BriefingType, {
  title: string;
  description: string;
  fields: ('name' | 'email' | 'organization' | 'role' | 'context' | 'topics' | 'timeline')[];
  submitLabel: string;
  successMessage: string;
}> = {
  'briefing-request': {
    title: 'Request a Briefing',
    description: 'Schedule a personalized overview of the Grove architecture and thesis.',
    fields: ['name', 'email', 'organization', 'role', 'topics'],
    submitLabel: 'Request Briefing',
    successMessage: "We'll reach out to schedule your briefing."
  },
  'exec-briefing': {
    title: 'Executive Briefing',
    description: 'Request a confidential briefing on strategic implications for your organization.',
    fields: ['name', 'email', 'organization', 'role', 'context', 'timeline'],
    submitLabel: 'Request Executive Briefing',
    successMessage: "We'll contact you shortly to arrange a confidential briefing."
  },
  'policy-brief-request': {
    title: 'Policy Brief',
    description: 'Request analysis on regulatory, governance, or policy implications.',
    fields: ['name', 'email', 'organization', 'role', 'topics', 'context'],
    submitLabel: 'Request Policy Brief',
    successMessage: "We'll prepare relevant policy analysis for your review."
  },
  'network-briefing': {
    title: 'Network Briefing',
    description: 'Learn about capital deployment opportunities within the Grove network.',
    fields: ['name', 'email', 'organization', 'role', 'context'],
    submitLabel: 'Request Network Briefing',
    successMessage: "We'll be in touch regarding network participation."
  },
  'memo-request': {
    title: 'Private Memo',
    description: 'Request a confidential memo on Grove implications for your portfolio.',
    fields: ['name', 'email', 'organization', 'context', 'timeline'],
    submitLabel: 'Request Memo',
    successMessage: "We'll prepare a confidential memo for your review."
  }
};

const BriefingRequest: React.FC<BriefingRequestProps> = ({ type, onSubmit, onClose }) => {
  const config = BRIEFING_CONFIG[type];

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    organization: '',
    role: '',
    context: '',
    topics: [] as string[],
    timeline: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const topicOptions = [
    'Technical architecture',
    'Economic model',
    'Governance structure',
    'Security considerations',
    'Regulatory implications',
    'Investment opportunities',
    'Research collaboration',
    'Implementation roadmap'
  ];

  const timelineOptions = [
    'This week',
    'Next 2 weeks',
    'This month',
    'Flexible'
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const toggleTopic = (topic: string) => {
    setFormData(prev => ({
      ...prev,
      topics: prev.topics.includes(topic)
        ? prev.topics.filter(t => t !== topic)
        : [...prev.topics, topic]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setSubmitted(true);

    setTimeout(() => {
      onSubmit();
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="p-6 text-center">
        <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-grove-forest/10 flex items-center justify-center">
          <svg className="w-6 h-6 text-grove-forest" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h3 className="font-display text-lg text-ink mb-2">Request Received</h3>
        <p className="font-serif text-sm text-ink-muted">
          {config.successMessage}
        </p>
      </div>
    );
  }

  const renderField = (field: typeof config.fields[number]) => {
    switch (field) {
      case 'name':
        return (
          <input
            key="name"
            type="text"
            name="name"
            placeholder="Your name"
            value={formData.name}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-ink/10 rounded-lg font-sans text-sm focus:outline-none focus:border-grove-forest"
          />
        );

      case 'email':
        return (
          <input
            key="email"
            type="email"
            name="email"
            placeholder="Your email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-ink/10 rounded-lg font-sans text-sm focus:outline-none focus:border-grove-forest"
          />
        );

      case 'organization':
        return (
          <input
            key="organization"
            type="text"
            name="organization"
            placeholder="Organization"
            value={formData.organization}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-ink/10 rounded-lg font-sans text-sm focus:outline-none focus:border-grove-forest"
          />
        );

      case 'role':
        return (
          <input
            key="role"
            type="text"
            name="role"
            placeholder="Your role/title"
            value={formData.role}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-ink/10 rounded-lg font-sans text-sm focus:outline-none focus:border-grove-forest"
          />
        );

      case 'context':
        return (
          <textarea
            key="context"
            name="context"
            placeholder="Any context that would help us prepare? (optional)"
            value={formData.context}
            onChange={handleChange}
            rows={3}
            className="w-full px-3 py-2 border border-ink/10 rounded-lg font-sans text-sm focus:outline-none focus:border-grove-forest resize-none"
          />
        );

      case 'topics':
        return (
          <div key="topics" className="space-y-2">
            <p className="text-xs font-sans font-medium text-ink-muted uppercase tracking-wide">
              Topics of interest
            </p>
            <div className="flex flex-wrap gap-2">
              {topicOptions.map(topic => (
                <button
                  key={topic}
                  type="button"
                  onClick={() => toggleTopic(topic)}
                  className={`px-3 py-1.5 rounded-full text-xs font-sans transition-colors ${
                    formData.topics.includes(topic)
                      ? 'bg-grove-forest text-white'
                      : 'bg-ink/5 text-ink-muted hover:bg-ink/10'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>
          </div>
        );

      case 'timeline':
        return (
          <select
            key="timeline"
            name="timeline"
            value={formData.timeline}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-ink/10 rounded-lg font-sans text-sm focus:outline-none focus:border-grove-forest bg-white"
          >
            <option value="">Preferred timeline</option>
            {timelineOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <h3 className="font-display text-lg text-ink mb-2">{config.title}</h3>
      <p className="font-serif text-sm text-ink-muted mb-6">
        {config.description}
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {config.fields.map(renderField)}

        {/* Privacy note for sensitive briefings */}
        {(type === 'exec-briefing' || type === 'memo-request' || type === 'network-briefing') && (
          <p className="text-xs text-ink-muted font-serif">
            All communications are confidential. We do not share contact information.
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-ink/20 rounded-lg font-sans text-sm text-ink-muted hover:bg-ink/5 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 px-4 py-2 bg-grove-forest text-white rounded-lg font-sans text-sm hover:bg-grove-forest/90 transition-colors disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : config.submitLabel}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BriefingRequest;
