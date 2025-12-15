// NominationForm - Academic peer nomination form
// Allows academics to nominate colleagues for Grove exploration

import React, { useState } from 'react';

interface NominationFormProps {
  onSubmit: () => void;
  onClose: () => void;
}

const NominationForm: React.FC<NominationFormProps> = ({ onSubmit, onClose }) => {
  const [formData, setFormData] = useState({
    nominatorName: '',
    nominatorEmail: '',
    nominatorInstitution: '',
    nomineeName: '',
    nomineeEmail: '',
    nomineeInstitution: '',
    relationship: '',
    reason: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API call - in production, this would hit an actual endpoint
    await new Promise(resolve => setTimeout(resolve, 1000));

    setIsSubmitting(false);
    setSubmitted(true);

    // Auto-close after showing success
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
        <h3 className="font-display text-lg text-ink mb-2">Nomination Submitted</h3>
        <p className="font-serif text-sm text-ink-muted">
          Thank you. Your colleague will receive an invitation to explore the Grove.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h3 className="font-display text-lg text-ink mb-2">Nominate a Peer</h3>
      <p className="font-serif text-sm text-ink-muted mb-6">
        Know a colleague who should explore the Grove's approach to distributed AI?
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Your Information */}
        <div className="space-y-3">
          <p className="text-xs font-sans font-medium text-ink-muted uppercase tracking-wide">
            Your Information
          </p>
          <input
            type="text"
            name="nominatorName"
            placeholder="Your name"
            value={formData.nominatorName}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-ink/10 rounded-lg font-sans text-sm focus:outline-none focus:border-grove-forest"
          />
          <input
            type="email"
            name="nominatorEmail"
            placeholder="Your email"
            value={formData.nominatorEmail}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-ink/10 rounded-lg font-sans text-sm focus:outline-none focus:border-grove-forest"
          />
          <input
            type="text"
            name="nominatorInstitution"
            placeholder="Your institution"
            value={formData.nominatorInstitution}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-ink/10 rounded-lg font-sans text-sm focus:outline-none focus:border-grove-forest"
          />
        </div>

        {/* Nominee Information */}
        <div className="space-y-3 pt-2">
          <p className="text-xs font-sans font-medium text-ink-muted uppercase tracking-wide">
            Colleague Information
          </p>
          <input
            type="text"
            name="nomineeName"
            placeholder="Colleague's name"
            value={formData.nomineeName}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-ink/10 rounded-lg font-sans text-sm focus:outline-none focus:border-grove-forest"
          />
          <input
            type="email"
            name="nomineeEmail"
            placeholder="Colleague's email"
            value={formData.nomineeEmail}
            onChange={handleChange}
            required
            className="w-full px-3 py-2 border border-ink/10 rounded-lg font-sans text-sm focus:outline-none focus:border-grove-forest"
          />
          <input
            type="text"
            name="nomineeInstitution"
            placeholder="Colleague's institution"
            value={formData.nomineeInstitution}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-ink/10 rounded-lg font-sans text-sm focus:outline-none focus:border-grove-forest"
          />
        </div>

        {/* Relationship */}
        <select
          name="relationship"
          value={formData.relationship}
          onChange={handleChange}
          required
          className="w-full px-3 py-2 border border-ink/10 rounded-lg font-sans text-sm focus:outline-none focus:border-grove-forest bg-white"
        >
          <option value="">How do you know them?</option>
          <option value="collaborator">Research collaborator</option>
          <option value="colleague">Department colleague</option>
          <option value="mentee">Current/former mentee</option>
          <option value="mentor">Current/former mentor</option>
          <option value="conference">Met at conference</option>
          <option value="other">Other</option>
        </select>

        {/* Reason */}
        <textarea
          name="reason"
          placeholder="Why would they find the Grove interesting? (optional)"
          value={formData.reason}
          onChange={handleChange}
          rows={3}
          className="w-full px-3 py-2 border border-ink/10 rounded-lg font-sans text-sm focus:outline-none focus:border-grove-forest resize-none"
        />

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
            {isSubmitting ? 'Sending...' : 'Send Nomination'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default NominationForm;
