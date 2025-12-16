// FeatureFlagPanel - Admin interface for managing feature flags
import React from 'react';
import { FeatureFlag } from '../../data/narratives-schema';

interface FeatureFlagPanelProps {
  flags: FeatureFlag[];
  onToggle: (flagId: string, enabled: boolean) => void;
}

const FeatureFlagPanel: React.FC<FeatureFlagPanelProps> = ({ flags, onToggle }) => {
  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-900">Feature Flags</h2>
        <p className="text-sm text-gray-500 mt-1">
          Toggle features on or off without code changes. Changes take effect immediately.
        </p>
      </div>

      <div className="space-y-4">
        {flags.map(flag => (
          <div
            key={flag.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      flag.enabled ? 'bg-green-500' : 'bg-gray-300'
                    }`}
                  />
                  <h3 className="font-semibold text-gray-900">{flag.name}</h3>
                </div>
                <p className="text-sm text-gray-500 mt-1 ml-5">{flag.description}</p>
                <p className="text-xs text-gray-400 font-mono mt-2 ml-5">ID: {flag.id}</p>
              </div>

              <button
                onClick={() => onToggle(flag.id, !flag.enabled)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 ${
                  flag.enabled ? 'bg-green-600' : 'bg-gray-200'
                }`}
                role="switch"
                aria-checked={flag.enabled}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                    flag.enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        ))}
      </div>

      {flags.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          No feature flags configured
        </div>
      )}

      <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <h4 className="text-sm font-semibold text-gray-700 mb-2">How Feature Flags Work</h4>
        <ul className="text-xs text-gray-600 space-y-1">
          <li>• Flags control Terminal behavior without code deployment</li>
          <li>• Changes save to production when you click "Save to Production"</li>
          <li>• Users see changes on their next page load</li>
          <li>• Use flags for A/B testing and gradual rollouts</li>
        </ul>
      </div>
    </div>
  );
};

export default FeatureFlagPanel;
