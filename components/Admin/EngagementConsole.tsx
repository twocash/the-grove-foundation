// components/Admin/EngagementConsole.tsx - Bridge UI for Engagement Bus
// Sprint 7: Operator interface for monitoring and configuring engagement

import React, { useState, useEffect, useMemo } from 'react';
import {
  useEngagementBus,
  useEngagementState,
  useRevealQueue
} from '../../hooks/useEngagementBus';
import { DEFAULT_TRIGGERS } from '../../utils/engagementTriggers';
import { EngagementEvent, TriggerConfig, RevealType } from '../../types/engagement';

const EngagementConsole: React.FC = () => {
  const bus = useEngagementBus();
  const state = useEngagementState();
  const queue = useRevealQueue();

  const [eventLog, setEventLog] = useState<EngagementEvent[]>([]);
  const [triggers, setTriggers] = useState<TriggerConfig[]>(DEFAULT_TRIGGERS);
  const [activeTab, setActiveTab] = useState<'monitor' | 'triggers' | 'simulate'>('monitor');

  // Subscribe to events for live log
  useEffect(() => {
    setEventLog(bus.getEventHistory());

    return bus.onEvent((event) => {
      setEventLog(prev => [...prev.slice(-49), event]);
    });
  }, [bus]);

  // --- Monitor Tab ---
  const renderMonitor = () => (
    <div className="space-y-6">
      {/* Live Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard label="Exchanges" value={state.exchangeCount} />
        <MetricCard label="Journeys" value={state.journeysCompleted} />
        <MetricCard label="Topics" value={state.topicsExplored.length} />
        <MetricCard label="Minutes" value={state.minutesActive} />
      </div>

      {/* Reveal Queue Status */}
      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-mono text-slate-400 mb-3">REVEAL QUEUE</h3>
        {queue.length === 0 ? (
          <p className="text-slate-500 text-sm">No reveals queued</p>
        ) : (
          <div className="space-y-2">
            {queue.map((item, i) => (
              <div key={i} className="flex items-center justify-between bg-slate-700 rounded px-3 py-2">
                <span className="text-emerald-400 font-mono">{item.type}</span>
                <span className="text-slate-400 text-xs">Priority: {item.priority}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reveals Shown */}
      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-mono text-slate-400 mb-3">REVEALS SHOWN</h3>
        <div className="flex flex-wrap gap-2">
          {state.revealsShown.length === 0 ? (
            <span className="text-slate-500 text-sm">None yet</span>
          ) : (
            state.revealsShown.map(reveal => (
              <span key={reveal} className="px-2 py-1 bg-emerald-900/50 text-emerald-400 rounded text-xs font-mono">
                {reveal}
              </span>
            ))
          )}
        </div>
      </div>

      {/* Event Log */}
      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-mono text-slate-400 mb-3">EVENT LOG (Last 50)</h3>
        <div className="h-64 overflow-y-auto space-y-1 font-mono text-xs">
          {eventLog.slice().reverse().map((event, i) => (
            <div key={i} className="flex items-start gap-2 text-slate-300">
              <span className="text-slate-500 w-20 flex-shrink-0">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
              <span className="text-amber-400 w-32 flex-shrink-0">{event.type}</span>
              <span className="text-slate-400 truncate">
                {JSON.stringify(event.payload)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  // --- Triggers Tab ---
  const renderTriggers = () => (
    <div className="space-y-4">
      <p className="text-slate-400 text-sm mb-4">
        Configure when reveals are triggered. Changes apply immediately.
      </p>

      {triggers.map((trigger, index) => (
        <TriggerEditor
          key={trigger.id}
          trigger={trigger}
          state={state}
          onUpdate={(updated) => {
            const newTriggers = [...triggers];
            newTriggers[index] = updated;
            setTriggers(newTriggers);
          }}
        />
      ))}
    </div>
  );

  // --- Simulate Tab ---
  const renderSimulate = () => (
    <div className="space-y-6">
      <p className="text-slate-400 text-sm mb-4">
        Manually emit events to test trigger logic.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        <SimulateButton
          label="Send Exchange"
          onClick={() => bus.emit('EXCHANGE_SENT', { query: 'test', responseLength: 100 })}
        />
        <SimulateButton
          label="Complete Journey"
          onClick={() => bus.emit('JOURNEY_COMPLETED', {
            lensId: 'test',
            durationMinutes: 5,
            cardsVisited: 3
          })}
        />
        <SimulateButton
          label="Explore Topic"
          onClick={() => bus.emit('TOPIC_EXPLORED', {
            topicId: `topic-${Date.now()}`,
            topicLabel: 'Test Topic'
          })}
        />
        <SimulateButton
          label="+3 Minutes"
          onClick={() => bus.emit('TIME_MILESTONE', { minutes: state.minutesActive + 3 })}
        />
        <SimulateButton
          label="Select Custom Lens"
          onClick={() => bus.emit('LENS_SELECTED', {
            lensId: 'custom-test',
            isCustom: true
          })}
        />
        <SimulateButton
          label="Reset All"
          onClick={() => bus.reset()}
          variant="danger"
        />
      </div>

      {/* Quick state override */}
      <div className="bg-slate-800 rounded-lg p-4">
        <h3 className="text-sm font-mono text-slate-400 mb-3">STATE SNAPSHOT</h3>
        <pre className="text-xs text-slate-300 overflow-auto max-h-64">
          {JSON.stringify(state, null, 2)}
        </pre>
      </div>
    </div>
  );

  return (
    <div className="bg-slate-900 text-white p-6 rounded-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-emerald-400 font-mono">
            ENGAGEMENT BRIDGE
          </h2>
          <p className="text-slate-400 text-sm">
            Session: {state.sessionId.slice(0, 20)}...
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
          <span className="text-emerald-400 text-sm font-mono">LIVE</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-800 rounded-lg p-1">
        {(['monitor', 'triggers', 'simulate'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-mono transition-colors ${
              activeTab === tab
                ? 'bg-emerald-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            {tab.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Content */}
      {activeTab === 'monitor' && renderMonitor()}
      {activeTab === 'triggers' && renderTriggers()}
      {activeTab === 'simulate' && renderSimulate()}
    </div>
  );
};

// --- Helper Components ---

const MetricCard: React.FC<{ label: string; value: number }> = ({ label, value }) => (
  <div className="bg-slate-800 rounded-lg p-4">
    <div className="text-3xl font-bold text-emerald-400 font-mono">{value}</div>
    <div className="text-slate-400 text-sm">{label}</div>
  </div>
);

const SimulateButton: React.FC<{
  label: string;
  onClick: () => void;
  variant?: 'default' | 'danger';
}> = ({ label, onClick, variant = 'default' }) => (
  <button
    onClick={onClick}
    className={`py-2 px-4 rounded-md text-sm font-mono transition-colors ${
      variant === 'danger'
        ? 'bg-red-900/50 text-red-400 hover:bg-red-900'
        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
    }`}
  >
    {label}
  </button>
);

const TriggerEditor: React.FC<{
  trigger: TriggerConfig;
  state: any;
  onUpdate: (trigger: TriggerConfig) => void;
}> = ({ trigger, state, onUpdate }) => {
  // Simplified trigger editor - could be expanded
  const isTriggered = useMemo(() => {
    // Basic check - would use evaluateTriggers in production
    return false; // Placeholder
  }, [trigger, state]);

  return (
    <div className={`bg-slate-800 rounded-lg p-4 border-l-4 ${
      trigger.enabled ? 'border-emerald-500' : 'border-slate-600'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <span className={`text-lg font-mono ${
            trigger.enabled ? 'text-emerald-400' : 'text-slate-500'
          }`}>
            {trigger.reveal}
          </span>
          <span className="text-slate-500 text-xs">
            Priority: {trigger.priority}
          </span>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={trigger.enabled}
            onChange={(e) => onUpdate({ ...trigger, enabled: e.target.checked })}
            className="w-4 h-4 rounded"
          />
          <span className="text-slate-400 text-sm">Enabled</span>
        </label>
      </div>
      <div className="text-slate-400 text-xs font-mono">
        {JSON.stringify(trigger.conditions, null, 0).slice(0, 100)}...
      </div>
    </div>
  );
};

export default EngagementConsole;
