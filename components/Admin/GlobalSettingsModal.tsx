// GlobalSettingsModal - Modal for editing global narrative settings
import React, { useState } from 'react';
import { GlobalSettings, NoLensBehavior, DEFAULT_LOADING_MESSAGES } from '../../data/narratives-schema';

interface GlobalSettingsModalProps {
  settings: GlobalSettings;
  onUpdate: (settings: GlobalSettings) => void;
  onClose: () => void;
}

const NO_LENS_OPTIONS: { value: NoLensBehavior; label: string; description: string }[] = [
  {
    value: 'nudge-after-exchanges',
    label: 'Nudge After Exchanges',
    description: 'Gently prompt users to pick a lens after N exchanges'
  },
  {
    value: 'never-nudge',
    label: 'Never Nudge',
    description: 'Let users explore freely without suggestions'
  },
  {
    value: 'force-selection',
    label: 'Force Selection',
    description: 'Require lens selection before first message'
  },
];

const GlobalSettingsModal: React.FC<GlobalSettingsModalProps> = ({
  settings,
  onUpdate,
  onClose
}) => {
  const [newMessage, setNewMessage] = useState('');

  const handleFieldChange = (field: keyof GlobalSettings, value: unknown) => {
    onUpdate({ ...settings, [field]: value });
  };

  const loadingMessages = settings.loadingMessages || DEFAULT_LOADING_MESSAGES;

  const addLoadingMessage = () => {
    if (newMessage.trim()) {
      handleFieldChange('loadingMessages', [...loadingMessages, newMessage.trim()]);
      setNewMessage('');
    }
  };

  const removeLoadingMessage = (index: number) => {
    const updated = loadingMessages.filter((_, i) => i !== index);
    handleFieldChange('loadingMessages', updated);
  };

  const resetLoadingMessages = () => {
    handleFieldChange('loadingMessages', DEFAULT_LOADING_MESSAGES);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Global Settings</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Default Tone Guidance */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Default Tone Guidance
            </label>
            <textarea
              value={settings.defaultToneGuidance}
              onChange={(e) => handleFieldChange('defaultToneGuidance', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Base tone applied to all interactions (before persona layer)..."
            />
            <p className="text-xs text-gray-500 mt-1">
              This is injected into every prompt, before any persona-specific guidance.
            </p>
          </div>

          {/* Scholar Mode Addition */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Scholar Mode Prompt Addition
            </label>
            <textarea
              value={settings.scholarModePromptAddition}
              onChange={(e) => handleFieldChange('scholarModePromptAddition', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Text appended when Scholar Mode is active..."
            />
            <p className="text-xs text-gray-500 mt-1">
              Appended to prompts when user enables Scholar Mode (--verbose).
            </p>
          </div>

          {/* No-Lens Behavior */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              No-Lens Behavior
            </label>
            <div className="space-y-2">
              {NO_LENS_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleFieldChange('noLensBehavior', opt.value)}
                  className={`w-full text-left px-4 py-3 rounded-lg border transition-all ${
                    settings.noLensBehavior === opt.value
                      ? 'border-green-500 bg-green-50 ring-2 ring-green-200'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="font-medium text-gray-900">{opt.label}</div>
                  <div className="text-xs text-gray-500 mt-0.5">{opt.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Nudge Threshold */}
          {settings.noLensBehavior === 'nudge-after-exchanges' && (
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Nudge After Exchanges
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={settings.nudgeAfterExchanges}
                  onChange={(e) => handleFieldChange('nudgeAfterExchanges', parseInt(e.target.value))}
                  className="flex-1"
                />
                <span className="text-2xl font-bold text-gray-900 w-12 text-center">
                  {settings.nudgeAfterExchanges}
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Number of user messages before suggesting a lens
              </p>
            </div>
          )}

          {/* Loading Messages */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-semibold text-gray-700">
                Loading Animation Messages
              </label>
              <button
                onClick={resetLoadingMessages}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Reset to defaults
              </button>
            </div>
            <p className="text-xs text-gray-500 mb-3">
              These messages cycle while waiting for AI response (e.g., "asking the villagers...")
            </p>
            <div className="space-y-2 mb-3">
              {loadingMessages.map((msg, idx) => (
                <div key={idx} className="flex items-center space-x-2 bg-gray-50 px-3 py-2 rounded-lg">
                  <span className="flex-1 text-sm font-mono text-gray-700">{msg}</span>
                  <button
                    onClick={() => removeLoadingMessage(idx)}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
            <div className="flex space-x-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addLoadingMessage()}
                placeholder="Add new message..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <button
                onClick={addLoadingMessage}
                className="px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
              >
                Add
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-800 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

export default GlobalSettingsModal;
