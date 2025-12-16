// TopicHubPanel - Admin interface for managing topic hubs
import React, { useState } from 'react';
import { TopicHub } from '../../data/narratives-schema';
import { testQueryMatch } from '../../utils/topicRouter';

interface TopicHubPanelProps {
  hubs: TopicHub[];
  onUpdate: (hubs: TopicHub[]) => void;
}

const TopicHubPanel: React.FC<TopicHubPanelProps> = ({ hubs, onUpdate }) => {
  const [selectedHubId, setSelectedHubId] = useState<string | null>(null);
  const [testQuery, setTestQuery] = useState('');
  const [testResult, setTestResult] = useState<{
    matched: boolean;
    hubTitle: string | null;
    score: number;
    matchedTags: string[];
  } | null>(null);

  const selectedHub = selectedHubId ? hubs.find(h => h.id === selectedHubId) : null;

  const handleToggleEnabled = (hubId: string) => {
    const updated = hubs.map(h =>
      h.id === hubId ? { ...h, enabled: !h.enabled, updatedAt: new Date().toISOString() } : h
    );
    onUpdate(updated);
  };

  const handleUpdateHub = (hubId: string, updates: Partial<TopicHub>) => {
    const updated = hubs.map(h =>
      h.id === hubId ? { ...h, ...updates, updatedAt: new Date().toISOString() } : h
    );
    onUpdate(updated);
  };

  const handleDeleteHub = (hubId: string) => {
    if (!confirm('Delete this topic hub? This cannot be undone.')) return;
    onUpdate(hubs.filter(h => h.id !== hubId));
    if (selectedHubId === hubId) setSelectedHubId(null);
  };

  const handleCreateHub = () => {
    const id = `hub-${Date.now()}`;
    const newHub: TopicHub = {
      id,
      title: 'New Topic Hub',
      tags: [],
      priority: 5,
      enabled: false,
      primarySource: '',
      supportingSources: [],
      expertFraming: '',
      keyPoints: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    onUpdate([...hubs, newHub]);
    setSelectedHubId(id);
  };

  const handleTestQuery = () => {
    if (!testQuery.trim()) return;
    const result = testQueryMatch(testQuery, hubs);
    setTestResult({
      matched: result.matched,
      hubTitle: result.hub?.title || null,
      score: result.score,
      matchedTags: result.matchedTags
    });
  };

  return (
    <div className="flex h-full">
      {/* Hub List */}
      <div className="w-1/3 border-r border-gray-200 p-4 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-900">Topic Hubs</h3>
          <button
            onClick={handleCreateHub}
            className="px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 rounded-lg hover:bg-green-100"
          >
            + New Hub
          </button>
        </div>

        <div className="space-y-2">
          {hubs.map(hub => (
            <button
              key={hub.id}
              onClick={() => setSelectedHubId(hub.id)}
              className={`w-full text-left p-3 rounded-lg border transition-all ${
                selectedHubId === hub.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-sm text-gray-900">{hub.title}</span>
                <span className={`w-2 h-2 rounded-full ${hub.enabled ? 'bg-green-500' : 'bg-gray-300'}`} />
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {hub.tags.slice(0, 3).join(', ')}
                {hub.tags.length > 3 && ` +${hub.tags.length - 3} more`}
              </div>
              <div className="text-[10px] text-gray-400 mt-1">
                Priority: {hub.priority}
              </div>
            </button>
          ))}
        </div>

        {/* Query Tester */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
            Test Query Matching
          </h4>
          <div className="space-y-2">
            <input
              type="text"
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTestQuery()}
              placeholder="Enter a test query..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
            />
            <button
              onClick={handleTestQuery}
              className="w-full px-3 py-2 text-sm font-semibold bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Test Match
            </button>
            {testResult && (
              <div className={`p-3 rounded-lg text-sm ${
                testResult.matched ? 'bg-green-50 border border-green-200' : 'bg-gray-50 border border-gray-200'
              }`}>
                {testResult.matched ? (
                  <>
                    <div className="font-semibold text-green-700">
                      Matched: {testResult.hubTitle}
                    </div>
                    <div className="text-xs text-green-600 mt-1">
                      Score: {testResult.score.toFixed(1)} | Tags: {testResult.matchedTags.join(', ')}
                    </div>
                  </>
                ) : (
                  <div className="text-gray-600">No hub matched this query</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hub Editor */}
      <div className="flex-1 p-6 overflow-y-auto">
        {selectedHub ? (
          <div className="space-y-6">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold text-gray-900">{selectedHub.title}</h3>
                <p className="text-xs font-mono text-gray-500">{selectedHub.id}</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => handleToggleEnabled(selectedHub.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-lg ${
                    selectedHub.enabled
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {selectedHub.enabled ? 'Enabled' : 'Disabled'}
                </button>
                <button
                  onClick={() => handleDeleteHub(selectedHub.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100"
                >
                  Delete
                </button>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Title
              </label>
              <input
                type="text"
                value={selectedHub.title}
                onChange={(e) => handleUpdateHub(selectedHub.id, { title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Routing Tags (one per line)
              </label>
              <textarea
                value={selectedHub.tags.join('\n')}
                onChange={(e) => handleUpdateHub(selectedHub.id, {
                  tags: e.target.value.split('\n').map(t => t.trim()).filter(Boolean)
                })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-green-500"
                placeholder="ratchet&#10;capability propagation&#10;21 months"
              />
              <p className="text-xs text-gray-500 mt-1">
                Multi-word phrases score higher when matched
              </p>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Priority (1-10)
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={selectedHub.priority}
                  onChange={(e) => handleUpdateHub(selectedHub.id, { priority: parseInt(e.target.value) })}
                  className="flex-1"
                />
                <span className="text-lg font-bold text-gray-900 w-8 text-center">
                  {selectedHub.priority}
                </span>
              </div>
            </div>

            {/* Primary Source */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Primary Source (Knowledge Base Path)
              </label>
              <input
                type="text"
                value={selectedHub.primarySource}
                onChange={(e) => handleUpdateHub(selectedHub.id, { primarySource: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-green-500"
                placeholder="Grove_Ratchet_Deep_Dive"
              />
            </div>

            {/* Supporting Sources */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Supporting Sources (one per line)
              </label>
              <textarea
                value={selectedHub.supportingSources.join('\n')}
                onChange={(e) => handleUpdateHub(selectedHub.id, {
                  supportingSources: e.target.value.split('\n').map(t => t.trim()).filter(Boolean)
                })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Expert Framing */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Expert Framing
              </label>
              <textarea
                value={selectedHub.expertFraming}
                onChange={(e) => handleUpdateHub(selectedHub.id, { expertFraming: e.target.value })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                placeholder="You are explaining the Ratchet Effect..."
              />
              <p className="text-xs text-gray-500 mt-1">
                This text is injected into the system prompt when this hub matches
              </p>
            </div>

            {/* Key Points */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Key Points (one per line)
              </label>
              <textarea
                value={selectedHub.keyPoints.join('\n')}
                onChange={(e) => handleUpdateHub(selectedHub.id, {
                  keyPoints: e.target.value.split('\n').map(t => t.trim()).filter(Boolean)
                })}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
                placeholder="7-month capability doubling cycle&#10;21-month frontier-to-edge lag"
              />
              <p className="text-xs text-gray-500 mt-1">
                Must-hit points for responses on this topic
              </p>
            </div>

            {/* Common Misconceptions */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-2">
                Common Misconceptions (one per line)
                <span className="text-gray-400 font-normal ml-2">(optional)</span>
              </label>
              <textarea
                value={(selectedHub.commonMisconceptions || []).join('\n')}
                onChange={(e) => handleUpdateHub(selectedHub.id, {
                  commonMisconceptions: e.target.value.split('\n').map(t => t.trim()).filter(Boolean)
                })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Timestamps */}
            <div className="pt-4 border-t border-gray-200 text-xs text-gray-500">
              <div>Created: {new Date(selectedHub.createdAt).toLocaleString()}</div>
              <div>Updated: {new Date(selectedHub.updatedAt).toLocaleString()}</div>
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              <div className="text-4xl mb-2">🎯</div>
              <div className="text-sm">Select a hub to edit or create a new one</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopicHubPanel;
