// src/foundation/consoles/EngagementBridge.tsx
// Foundation-styled Engagement monitoring console

import React, { useState, useEffect, useMemo } from 'react';
import {
  useEngagementBus,
  useEngagementState,
  useRevealQueue
} from '../../../hooks/useEngagementBus';
import { DEFAULT_TRIGGERS } from '../../../utils/engagementTriggers';
import { EngagementEvent, TriggerConfig } from '../../../types/engagement';
import { DataPanel } from '../components/DataPanel';
import { GlowButton } from '../components/GlowButton';
import { MetricCard } from '../components/MetricCard';
import {
  Activity,
  Zap,
  RefreshCw,
  Trash2,
  Play,
  Settings,
  Eye
} from 'lucide-react';

type TabId = 'monitor' | 'triggers' | 'simulate';

const EngagementBridge: React.FC = () => {
  const bus = useEngagementBus();
  const state = useEngagementState();
  const queue = useRevealQueue();

  const [eventLog, setEventLog] = useState<EngagementEvent[]>([]);
  const [triggers, setTriggers] = useState<TriggerConfig[]>(DEFAULT_TRIGGERS);
  const [activeTab, setActiveTab] = useState<TabId>('monitor');

  // Subscribe to events for live log
  useEffect(() => {
    setEventLog(bus.getEventHistory());

    return bus.onEvent((event) => {
      setEventLog(prev => [...prev.slice(-49), event]);
    });
  }, [bus]);

  // Tab content render functions
  const renderMonitor = () => (
    <div className="space-y-6">
      {/* Live Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Exchanges"
          value={state.exchangeCount}
          highlight={state.exchangeCount > 0}
        />
        <MetricCard
          label="Journeys"
          value={state.journeysCompleted}
          highlight={state.journeysCompleted > 0}
        />
        <MetricCard
          label="Topics"
          value={state.topicsExplored.length}
        />
        <MetricCard
          label="Minutes Active"
          value={state.minutesActive}
        />
      </div>

      {/* Reveal Queue */}
      <DataPanel title="Reveal Queue" icon={Eye}>
        {queue.length === 0 ? (
          <p className="text-gray-500 text-sm font-mono">No reveals queued</p>
        ) : (
          <div className="space-y-2">
            {queue.map((item, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-obsidian rounded px-3 py-2 border border-holo-cyan/10"
              >
                <span className="text-holo-lime font-mono text-sm">{item.type}</span>
                <span className="text-gray-500 text-xs">Priority: {item.priority}</span>
              </div>
            ))}
          </div>
        )}
      </DataPanel>

      {/* Reveals Shown */}
      <DataPanel title="Reveals Shown" icon={Zap}>
        <div className="flex flex-wrap gap-2">
          {state.revealsShown.length === 0 ? (
            <span className="text-gray-500 text-sm font-mono">None yet</span>
          ) : (
            state.revealsShown.map(reveal => (
              <span
                key={reveal}
                className="px-2 py-1 bg-holo-lime/10 text-holo-lime rounded text-xs font-mono border border-holo-lime/20"
              >
                {reveal}
              </span>
            ))
          )}
        </div>
      </DataPanel>

      {/* Event Log */}
      <DataPanel
        title="Event Log"
        icon={Activity}
        actions={
          <GlowButton
            variant="ghost"
            size="sm"
            icon={Trash2}
            onClick={() => setEventLog([])}
          >
            Clear
          </GlowButton>
        }
      >
        <div className="h-64 overflow-y-auto space-y-1 f-scrollbar">
          {eventLog.length === 0 ? (
            <p className="text-gray-500 text-sm font-mono">No events yet</p>
          ) : (
            eventLog.slice().reverse().map((event, i) => (
              <div key={i} className="flex items-start gap-2 text-xs font-mono py-1">
                <span className="text-gray-600 w-20 flex-shrink-0">
                  {new Date(event.timestamp).toLocaleTimeString()}
                </span>
                <span className="text-holo-amber w-36 flex-shrink-0">{event.type}</span>
                <span className="text-gray-400 truncate">
                  {JSON.stringify(event.payload)}
                </span>
              </div>
            ))
          )}
        </div>
      </DataPanel>
    </div>
  );

  const renderTriggers = () => (
    <div className="space-y-4">
      <p className="text-gray-400 text-sm mb-4 font-sans">
        Configure when reveals are triggered. Changes apply immediately.
      </p>

      {triggers.map((trigger, index) => (
        <div
          key={trigger.id}
          className={`f-panel rounded p-4 border-l-2 ${
            trigger.enabled ? 'border-l-holo-cyan' : 'border-l-gray-700'
          }`}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <span className={`text-sm font-mono ${
                trigger.enabled ? 'text-holo-cyan' : 'text-gray-500'
              }`}>
                {trigger.reveal}
              </span>
              <span className="text-gray-600 text-xs font-mono">
                Priority: {trigger.priority}
              </span>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={trigger.enabled}
                onChange={(e) => {
                  const newTriggers = [...triggers];
                  newTriggers[index] = { ...trigger, enabled: e.target.checked };
                  setTriggers(newTriggers);
                }}
                className="w-4 h-4 rounded bg-obsidian border-holo-cyan/30 text-holo-cyan focus:ring-holo-cyan"
              />
              <span className="text-gray-400 text-sm">Enabled</span>
            </label>
          </div>
          <div className="text-gray-500 text-xs font-mono">
            {JSON.stringify(trigger.conditions, null, 0).slice(0, 100)}...
          </div>
        </div>
      ))}
    </div>
  );

  const renderSimulate = () => (
    <div className="space-y-6">
      <p className="text-gray-400 text-sm mb-4 font-sans">
        Manually emit events to test trigger logic.
      </p>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
        <GlowButton
          variant="secondary"
          icon={Play}
          onClick={() => bus.emit('EXCHANGE_SENT', { query: 'test', responseLength: 100 })}
        >
          Send Exchange
        </GlowButton>
        <GlowButton
          variant="secondary"
          icon={Play}
          onClick={() => bus.emit('JOURNEY_COMPLETED', {
            lensId: 'test',
            durationMinutes: 5,
            cardsVisited: 3
          })}
        >
          Complete Journey
        </GlowButton>
        <GlowButton
          variant="secondary"
          icon={Play}
          onClick={() => bus.emit('TOPIC_EXPLORED', {
            topicId: `topic-${Date.now()}`,
            topicLabel: 'Test Topic'
          })}
        >
          Explore Topic
        </GlowButton>
        <GlowButton
          variant="secondary"
          icon={Play}
          onClick={() => bus.emit('TIME_MILESTONE', { minutes: state.minutesActive + 3 })}
        >
          +3 Minutes
        </GlowButton>
        <GlowButton
          variant="secondary"
          icon={Play}
          onClick={() => bus.emit('LENS_SELECTED', {
            lensId: 'custom-test',
            isCustom: true
          })}
        >
          Select Custom Lens
        </GlowButton>
        <GlowButton
          variant="danger"
          icon={RefreshCw}
          onClick={() => bus.reset()}
        >
          Reset All
        </GlowButton>
      </div>

      {/* State Snapshot */}
      <DataPanel title="State Snapshot" icon={Settings}>
        <pre className="text-xs text-gray-400 font-mono overflow-auto max-h-64 f-scrollbar">
          {JSON.stringify(state, null, 2)}
        </pre>
      </DataPanel>
    </div>
  );

  const tabs: { id: TabId; label: string }[] = [
    { id: 'monitor', label: 'Monitor' },
    { id: 'triggers', label: 'Triggers' },
    { id: 'simulate', label: 'Simulate' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-sans font-semibold text-white mb-1">
            Engagement Bridge
          </h1>
          <p className="text-gray-500 text-sm font-mono">
            Session: {state.sessionId.slice(0, 24)}...
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-holo-lime rounded-full animate-pulse" />
          <span className="text-holo-lime text-sm font-mono">LIVE</span>
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-1 bg-obsidian-raised rounded-lg p-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`
              flex-1 py-2 px-4 rounded text-sm font-mono uppercase tracking-wider
              transition-colors
              ${activeTab === tab.id
                ? 'bg-holo-cyan/20 text-holo-cyan'
                : 'text-gray-500 hover:text-white hover:bg-white/5'
              }
            `}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'monitor' && renderMonitor()}
      {activeTab === 'triggers' && renderTriggers()}
      {activeTab === 'simulate' && renderSimulate()}
    </div>
  );
};

export default EngagementBridge;
