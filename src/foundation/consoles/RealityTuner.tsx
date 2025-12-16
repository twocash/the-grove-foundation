// src/foundation/consoles/RealityTuner.tsx
// Foundation-styled merged console for Feature Flags + Topic Hubs
// Per ADR-006: Consolidate related tuning controls

import React, { useState, useEffect } from 'react';
import { DataPanel } from '../components/DataPanel';
import { GlowButton } from '../components/GlowButton';
import { MetricCard } from '../components/MetricCard';
import {
  Sliders,
  Flag,
  Target,
  Settings,
  Save,
  RefreshCw,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  Search,
  AlertCircle
} from 'lucide-react';
import {
  NarrativeSchemaV2,
  FeatureFlag,
  TopicHub,
  DEFAULT_GLOBAL_SETTINGS,
  isV2Schema
} from '../../../data/narratives-schema';
import { DEFAULT_PERSONAS } from '../../../data/default-personas';
import { testQueryMatch } from '../../../utils/topicRouter';

type TabId = 'flags' | 'routing' | 'settings';

const RealityTuner: React.FC = () => {
  const [schema, setSchema] = useState<NarrativeSchemaV2 | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('');
  const [activeTab, setActiveTab] = useState<TabId>('flags');

  // Topic Hub state
  const [selectedHubId, setSelectedHubId] = useState<string | null>(null);
  const [testQuery, setTestQuery] = useState('');
  const [testResult, setTestResult] = useState<{
    matched: boolean;
    hubTitle: string | null;
    score: number;
    matchedTags: string[];
  } | null>(null);

  useEffect(() => {
    loadSchema();
  }, []);

  const loadSchema = async () => {
    try {
      const res = await fetch('/api/narrative');
      const data = await res.json();

      if (isV2Schema(data)) {
        setSchema(data);
      } else {
        setSchema({
          version: "2.0",
          globalSettings: DEFAULT_GLOBAL_SETTINGS,
          personas: DEFAULT_PERSONAS,
          cards: {}
        });
      }
    } catch (err) {
      console.error('Failed to load schema:', err);
      setStatus('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!schema) return;
    setSaving(true);
    setStatus('Saving...');

    try {
      const res = await fetch('/api/admin/narrative', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schema)
      });
      const data = await res.json();

      if (data.success) {
        setStatus('Saved');
        setTimeout(() => setStatus(''), 3000);
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      setStatus('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Feature Flag operations
  const toggleFlag = (flagId: string, enabled: boolean) => {
    if (!schema) return;
    const flags = schema.globalSettings.featureFlags.map(f =>
      f.id === flagId ? { ...f, enabled } : f
    );
    setSchema({
      ...schema,
      globalSettings: { ...schema.globalSettings, featureFlags: flags }
    });
  };

  // Topic Hub operations
  const updateHubs = (hubs: TopicHub[]) => {
    if (!schema) return;
    setSchema({
      ...schema,
      globalSettings: { ...schema.globalSettings, topicHubs: hubs }
    });
  };

  const createHub = () => {
    if (!schema) return;
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
    updateHubs([...schema.globalSettings.topicHubs, newHub]);
    setSelectedHubId(id);
  };

  const updateHub = (hubId: string, updates: Partial<TopicHub>) => {
    if (!schema) return;
    const hubs = schema.globalSettings.topicHubs.map(h =>
      h.id === hubId ? { ...h, ...updates, updatedAt: new Date().toISOString() } : h
    );
    updateHubs(hubs);
  };

  const deleteHub = (hubId: string) => {
    if (!schema) return;
    if (!confirm('Delete this topic hub?')) return;
    updateHubs(schema.globalSettings.topicHubs.filter(h => h.id !== hubId));
    if (selectedHubId === hubId) setSelectedHubId(null);
  };

  const handleTestQuery = () => {
    if (!testQuery.trim() || !schema) return;
    const result = testQueryMatch(testQuery, schema.globalSettings.topicHubs);
    setTestResult({
      matched: result.matched,
      hubTitle: result.hub?.title || null,
      score: result.score,
      matchedTags: result.matchedTags
    });
  };

  const flags = schema?.globalSettings.featureFlags || [];
  const hubs = schema?.globalSettings.topicHubs || [];
  const selectedHub = selectedHubId ? hubs.find(h => h.id === selectedHubId) : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-holo-cyan animate-pulse font-mono">Loading Reality Tuner...</div>
      </div>
    );
  }

  const tabs: { id: TabId; label: string; icon: typeof Flag }[] = [
    { id: 'flags', label: 'Feature Flags', icon: Flag },
    { id: 'routing', label: 'Topic Routing', icon: Target },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Render Feature Flags Tab
  const renderFlags = () => (
    <div className="space-y-4">
      <p className="text-gray-400 text-sm font-sans mb-6">
        Toggle features on or off without code changes. Changes take effect immediately after saving.
      </p>

      {flags.length === 0 ? (
        <div className="text-center py-8 text-gray-500 text-sm font-mono">
          No feature flags configured
        </div>
      ) : (
        <div className="space-y-3">
          {flags.map(flag => (
            <div
              key={flag.id}
              className={`
                f-panel rounded p-4 border-l-2 transition-colors
                ${flag.enabled ? 'border-l-holo-lime' : 'border-l-gray-700'}
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className={`w-2 h-2 rounded-full ${
                      flag.enabled ? 'bg-holo-lime' : 'bg-gray-600'
                    }`} />
                    <span className="font-medium text-white">{flag.name}</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1 ml-5">{flag.description}</p>
                  <p className="text-xs text-gray-600 font-mono mt-2 ml-5">ID: {flag.id}</p>
                </div>

                <button
                  onClick={() => toggleFlag(flag.id, !flag.enabled)}
                  className={`
                    relative w-12 h-6 rounded-full transition-colors
                    ${flag.enabled ? 'bg-holo-cyan' : 'bg-gray-700'}
                  `}
                >
                  <span
                    className={`
                      absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                      ${flag.enabled ? 'left-7' : 'left-1'}
                    `}
                  />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Render Topic Routing Tab
  const renderRouting = () => (
    <div className="grid grid-cols-2 gap-6">
      {/* Left: Hub List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-mono text-gray-400">Topic Hubs ({hubs.length})</span>
          <GlowButton variant="secondary" size="sm" icon={Plus} onClick={createHub}>
            New Hub
          </GlowButton>
        </div>

        <div className="space-y-2 max-h-[40vh] overflow-y-auto f-scrollbar">
          {hubs.map(hub => (
            <button
              key={hub.id}
              onClick={() => setSelectedHubId(hub.id)}
              className={`
                w-full text-left p-3 rounded border transition-all
                ${selectedHubId === hub.id
                  ? 'bg-holo-cyan/10 border-holo-cyan/50'
                  : 'bg-obsidian border-holo-cyan/10 hover:border-holo-cyan/30'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium text-white text-sm">{hub.title}</span>
                <span className={`w-2 h-2 rounded-full ${hub.enabled ? 'bg-holo-lime' : 'bg-gray-600'}`} />
              </div>
              <div className="text-xs text-gray-500 mt-1 truncate">
                {hub.tags.slice(0, 3).join(', ')}
                {hub.tags.length > 3 && ` +${hub.tags.length - 3}`}
              </div>
            </button>
          ))}
        </div>

        {/* Query Tester */}
        <DataPanel title="Test Query Match" icon={Search}>
          <div className="space-y-3">
            <input
              type="text"
              value={testQuery}
              onChange={(e) => setTestQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleTestQuery()}
              placeholder="Enter a test query..."
              className="
                w-full px-3 py-2 bg-obsidian border border-holo-cyan/20
                rounded text-sm font-mono text-white placeholder-gray-600
                focus:outline-none focus:border-holo-cyan/50
              "
            />
            <GlowButton variant="secondary" size="sm" onClick={handleTestQuery} className="w-full">
              Test Match
            </GlowButton>
            {testResult && (
              <div className={`p-3 rounded text-sm ${
                testResult.matched
                  ? 'bg-holo-lime/10 border border-holo-lime/30 text-holo-lime'
                  : 'bg-gray-800 border border-gray-700 text-gray-400'
              }`}>
                {testResult.matched ? (
                  <>
                    <div className="font-medium">Matched: {testResult.hubTitle}</div>
                    <div className="text-xs mt-1 opacity-75">
                      Score: {testResult.score.toFixed(1)} | Tags: {testResult.matchedTags.join(', ')}
                    </div>
                  </>
                ) : (
                  <div>No hub matched this query</div>
                )}
              </div>
            )}
          </div>
        </DataPanel>
      </div>

      {/* Right: Hub Editor */}
      <div>
        {selectedHub ? (
          <DataPanel
            title={selectedHub.title}
            icon={Target}
            actions={
              <div className="flex items-center gap-2">
                <GlowButton
                  variant={selectedHub.enabled ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => updateHub(selectedHub.id, { enabled: !selectedHub.enabled })}
                >
                  {selectedHub.enabled ? 'Enabled' : 'Disabled'}
                </GlowButton>
                <GlowButton
                  variant="danger"
                  size="sm"
                  icon={Trash2}
                  onClick={() => deleteHub(selectedHub.id)}
                >
                  Delete
                </GlowButton>
              </div>
            }
          >
            <div className="space-y-4 max-h-[60vh] overflow-y-auto f-scrollbar pr-2">
              {/* Title */}
              <div>
                <label className="block text-xs text-gray-500 font-mono uppercase mb-1">Title</label>
                <input
                  type="text"
                  value={selectedHub.title}
                  onChange={(e) => updateHub(selectedHub.id, { title: e.target.value })}
                  className="w-full px-3 py-2 bg-obsidian border border-holo-cyan/20 rounded text-sm font-mono text-white focus:outline-none focus:border-holo-cyan/50"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block text-xs text-gray-500 font-mono uppercase mb-1">Routing Tags</label>
                <textarea
                  value={selectedHub.tags.join('\n')}
                  onChange={(e) => updateHub(selectedHub.id, {
                    tags: e.target.value.split('\n').map(t => t.trim()).filter(Boolean)
                  })}
                  rows={3}
                  className="w-full px-3 py-2 bg-obsidian border border-holo-cyan/20 rounded text-sm font-mono text-white resize-none focus:outline-none focus:border-holo-cyan/50"
                  placeholder="One tag per line"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-xs text-gray-500 font-mono uppercase mb-1">
                  Priority: {selectedHub.priority}
                </label>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={selectedHub.priority}
                  onChange={(e) => updateHub(selectedHub.id, { priority: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>

              {/* Expert Framing */}
              <div>
                <label className="block text-xs text-gray-500 font-mono uppercase mb-1">Expert Framing</label>
                <textarea
                  value={selectedHub.expertFraming}
                  onChange={(e) => updateHub(selectedHub.id, { expertFraming: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 bg-obsidian border border-holo-cyan/20 rounded text-sm font-mono text-white resize-none focus:outline-none focus:border-holo-cyan/50"
                />
              </div>

              {/* Key Points */}
              <div>
                <label className="block text-xs text-gray-500 font-mono uppercase mb-1">Key Points</label>
                <textarea
                  value={selectedHub.keyPoints.join('\n')}
                  onChange={(e) => updateHub(selectedHub.id, {
                    keyPoints: e.target.value.split('\n').map(t => t.trim()).filter(Boolean)
                  })}
                  rows={3}
                  className="w-full px-3 py-2 bg-obsidian border border-holo-cyan/20 rounded text-sm font-mono text-white resize-none focus:outline-none focus:border-holo-cyan/50"
                />
              </div>
            </div>
          </DataPanel>
        ) : (
          <div className="h-full flex items-center justify-center text-gray-500 f-panel rounded">
            <div className="text-center py-12">
              <Target size={40} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm font-mono">Select a hub to edit</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  // Render Settings Tab
  const renderSettings = () => (
    <div className="space-y-6">
      <p className="text-gray-400 text-sm font-sans">
        Global settings that affect the entire system behavior.
      </p>

      <DataPanel title="Nudge Configuration" icon={Settings}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-white font-medium">Lens Nudge Enabled</div>
              <div className="text-xs text-gray-500">Prompt users to select a lens</div>
            </div>
            <button
              onClick={() => {
                if (!schema) return;
                setSchema({
                  ...schema,
                  globalSettings: {
                    ...schema.globalSettings,
                    nudgeConfig: {
                      ...schema.globalSettings.nudgeConfig,
                      enabled: !schema.globalSettings.nudgeConfig?.enabled
                    }
                  }
                });
              }}
              className={`
                relative w-12 h-6 rounded-full transition-colors
                ${schema?.globalSettings.nudgeConfig?.enabled ? 'bg-holo-cyan' : 'bg-gray-700'}
              `}
            >
              <span
                className={`
                  absolute top-1 w-4 h-4 rounded-full bg-white transition-transform
                  ${schema?.globalSettings.nudgeConfig?.enabled ? 'left-7' : 'left-1'}
                `}
              />
            </button>
          </div>

          <div>
            <label className="block text-xs text-gray-500 font-mono uppercase mb-1">
              Nudge Delay (ms)
            </label>
            <input
              type="number"
              value={schema?.globalSettings.nudgeConfig?.delayMs || 3000}
              onChange={(e) => {
                if (!schema) return;
                setSchema({
                  ...schema,
                  globalSettings: {
                    ...schema.globalSettings,
                    nudgeConfig: {
                      ...schema.globalSettings.nudgeConfig,
                      delayMs: parseInt(e.target.value) || 3000
                    }
                  }
                });
              }}
              className="w-full px-3 py-2 bg-obsidian border border-holo-cyan/20 rounded text-sm font-mono text-white focus:outline-none focus:border-holo-cyan/50"
            />
          </div>
        </div>
      </DataPanel>

      <DataPanel title="System Info" icon={AlertCircle}>
        <div className="space-y-2 text-sm font-mono">
          <div className="flex justify-between">
            <span className="text-gray-500">Schema Version</span>
            <span className="text-holo-cyan">{schema?.version || 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Feature Flags</span>
            <span className="text-white">{flags.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Topic Hubs</span>
            <span className="text-white">{hubs.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Active Hubs</span>
            <span className="text-holo-lime">{hubs.filter(h => h.enabled).length}</span>
          </div>
        </div>
      </DataPanel>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-sans font-semibold text-white mb-1">
            Reality Tuner
          </h1>
          <p className="text-gray-500 text-sm font-mono">
            Feature flags, topic routing, and system settings
          </p>
        </div>
        <div className="flex items-center gap-3">
          {status && (
            <span className={`text-xs font-mono px-3 py-1 rounded ${
              status.includes('Error') ? 'bg-holo-red/20 text-holo-red' : 'bg-holo-lime/20 text-holo-lime'
            }`}>
              {status}
            </span>
          )}
          <GlowButton
            variant="primary"
            icon={Save}
            loading={saving}
            onClick={handleSave}
          >
            Save to Production
          </GlowButton>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          label="Feature Flags"
          value={flags.length}
          highlight
        />
        <MetricCard
          label="Active Flags"
          value={flags.filter(f => f.enabled).length}
        />
        <MetricCard
          label="Topic Hubs"
          value={hubs.length}
        />
        <MetricCard
          label="Active Hubs"
          value={hubs.filter(h => h.enabled).length}
        />
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-obsidian-raised rounded-lg p-1">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                flex-1 py-2 px-4 rounded text-sm font-mono uppercase tracking-wider
                transition-colors flex items-center justify-center gap-2
                ${activeTab === tab.id
                  ? 'bg-holo-cyan/20 text-holo-cyan'
                  : 'text-gray-500 hover:text-white hover:bg-white/5'
                }
              `}
            >
              <Icon size={14} />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'flags' && renderFlags()}
      {activeTab === 'routing' && renderRouting()}
      {activeTab === 'settings' && renderSettings()}
    </div>
  );
};

export default RealityTuner;
