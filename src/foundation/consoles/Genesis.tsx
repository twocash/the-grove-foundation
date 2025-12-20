// src/foundation/consoles/Genesis.tsx
// Genesis Dashboard - Core metrics and variant performance

import React, { useState, useEffect, useMemo } from 'react';
import { aggregateGenesisMetrics, getVariantPerformance, GenesisMetrics, VariantPerformance } from '../../../utils/genesisMetrics';
import { DataPanel } from '../components/DataPanel';
import { GlowButton } from '../components/GlowButton';
import { MetricCard } from '../components/MetricCard';
import {
  Activity,
  TrendingUp,
  Users,
  Zap,
  RefreshCw,
  BarChart2,
  Target,
  MousePointer
} from 'lucide-react';

type TabId = 'overview' | 'variants' | 'funnel';

const Genesis: React.FC = () => {
  const [metrics, setMetrics] = useState<GenesisMetrics | null>(null);
  const [variantData, setVariantData] = useState<VariantPerformance[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Load metrics
  const refreshMetrics = () => {
    setMetrics(aggregateGenesisMetrics());
    setVariantData(getVariantPerformance());
    setLastRefresh(new Date());
  };

  useEffect(() => {
    refreshMetrics();
    // Auto-refresh every 30 seconds
    const interval = setInterval(refreshMetrics, 30000);
    return () => clearInterval(interval);
  }, []);

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Core Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Sessions"
          value={metrics?.totalSessions || 0}
          highlight={metrics?.totalSessions ? metrics.totalSessions > 0 : false}
        />
        <MetricCard
          label="Wizard Starts"
          value={metrics?.wizardStarts || 0}
          highlight={metrics?.wizardStarts ? metrics.wizardStarts > 0 : false}
        />
        <MetricCard
          label="Completions"
          value={metrics?.wizardCompletions || 0}
          highlight={metrics?.wizardCompletions ? metrics.wizardCompletions > 0 : false}
        />
        <MetricCard
          label="Completion Rate"
          value={`${metrics?.completionRate || 0}%`}
          highlight={metrics?.completionRate ? metrics.completionRate > 50 : false}
        />
      </div>

      {/* Top Performing Hooks */}
      <DataPanel title="Top Performing Hooks" icon={MousePointer}>
        {metrics?.topHooks.length === 0 ? (
          <p className="text-gray-500 text-sm font-mono">No hook clicks recorded yet</p>
        ) : (
          <div className="space-y-2">
            {metrics?.topHooks.map((hook, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-obsidian rounded px-3 py-2 border border-holo-cyan/10"
              >
                <span className="text-gray-300 font-mono text-sm truncate max-w-[70%]">
                  {hook.hookText}
                </span>
                <span className="text-holo-lime font-mono text-sm font-bold">
                  {hook.clicks}
                </span>
              </div>
            ))}
          </div>
        )}
      </DataPanel>

      {/* Section Engagement */}
      <DataPanel title="Section Engagement" icon={BarChart2}>
        {metrics?.topSections.length === 0 ? (
          <p className="text-gray-500 text-sm font-mono">No section interactions recorded yet</p>
        ) : (
          <div className="space-y-2">
            {metrics?.topSections.map((section, i) => (
              <div
                key={i}
                className="flex items-center justify-between bg-obsidian rounded px-3 py-2 border border-holo-cyan/10"
              >
                <span className="text-gray-300 font-mono text-sm uppercase">
                  {section.sectionId.replace(/-/g, ' ')}
                </span>
                <span className="text-holo-amber font-mono text-sm font-bold">
                  {section.interactions}
                </span>
              </div>
            ))}
          </div>
        )}
      </DataPanel>
    </div>
  );

  const renderVariants = () => (
    <div className="space-y-6">
      <p className="text-gray-400 text-sm mb-4 font-sans">
        A/B test variant performance. Variants with higher click-through and conversion rates are highlighted.
      </p>

      {variantData.length === 0 ? (
        <DataPanel title="Variant Performance" icon={Target}>
          <p className="text-gray-500 text-sm font-mono">No variant data recorded yet</p>
        </DataPanel>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="border-b border-holo-cyan/20">
                <th className="text-left py-3 px-4 text-gray-500 uppercase tracking-wider">Variant</th>
                <th className="text-left py-3 px-4 text-gray-500 uppercase tracking-wider">Experiment</th>
                <th className="text-right py-3 px-4 text-gray-500 uppercase tracking-wider">Clicks</th>
                <th className="text-right py-3 px-4 text-gray-500 uppercase tracking-wider">Conversions</th>
                <th className="text-right py-3 px-4 text-gray-500 uppercase tracking-wider">Rate</th>
              </tr>
            </thead>
            <tbody>
              {variantData.map((variant, i) => (
                <tr
                  key={i}
                  className="border-b border-holo-cyan/10 hover:bg-holo-cyan/5 transition-colors"
                >
                  <td className="py-3 px-4 text-holo-cyan">{variant.variantId}</td>
                  <td className="py-3 px-4 text-gray-400">{variant.experimentId}</td>
                  <td className="py-3 px-4 text-right text-white">{variant.clicks}</td>
                  <td className="py-3 px-4 text-right text-holo-lime">{variant.conversions}</td>
                  <td className={`py-3 px-4 text-right font-bold ${
                    variant.conversionRate > 10 ? 'text-holo-lime' : 'text-gray-400'
                  }`}>
                    {variant.conversionRate}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Variant Click Distribution */}
      <DataPanel title="Click Distribution" icon={BarChart2}>
        {Object.keys(metrics?.variantClicks || {}).length === 0 ? (
          <p className="text-gray-500 text-sm font-mono">No variant clicks recorded</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(metrics?.variantClicks || {}).map(([vid, clicks], i) => {
              const maxClicks = Math.max(...Object.values(metrics?.variantClicks || {}));
              const width = maxClicks > 0 ? (clicks / maxClicks) * 100 : 0;
              return (
                <div key={i}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-400">{vid}</span>
                    <span className="text-holo-lime">{clicks}</span>
                  </div>
                  <div className="h-2 bg-obsidian rounded overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-holo-cyan to-holo-lime transition-all"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </DataPanel>
    </div>
  );

  const renderFunnel = () => (
    <div className="space-y-6">
      <p className="text-gray-400 text-sm mb-4 font-sans">
        User journey progression through the wizard funnel.
      </p>

      {/* Funnel Visualization */}
      <DataPanel title="Conversion Funnel" icon={TrendingUp}>
        <div className="space-y-4 py-4">
          {/* Stage: Wizard Start */}
          <div className="flex items-center gap-4">
            <div className="w-32 text-right text-sm text-gray-400 font-mono">Wizard Start</div>
            <div className="flex-1 h-8 bg-obsidian rounded overflow-hidden relative">
              <div
                className="h-full bg-holo-cyan/30"
                style={{ width: '100%' }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-sm font-mono text-white">
                {metrics?.wizardStarts || 0}
              </span>
            </div>
          </div>

          {/* Stage: Completion */}
          <div className="flex items-center gap-4">
            <div className="w-32 text-right text-sm text-gray-400 font-mono">Completion</div>
            <div className="flex-1 h-8 bg-obsidian rounded overflow-hidden relative">
              <div
                className="h-full bg-holo-lime/30"
                style={{ width: metrics?.wizardStarts ? `${(metrics.wizardCompletions / metrics.wizardStarts) * 100}%` : '0%' }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-sm font-mono text-white">
                {metrics?.wizardCompletions || 0}
              </span>
            </div>
          </div>

          {/* Stage: Dropoff */}
          <div className="flex items-center gap-4">
            <div className="w-32 text-right text-sm text-gray-400 font-mono">Dropoff</div>
            <div className="flex-1 h-8 bg-obsidian rounded overflow-hidden relative">
              <div
                className="h-full bg-red-500/30"
                style={{ width: metrics?.wizardStarts ? `${(metrics.wizardDropoffs / metrics.wizardStarts) * 100}%` : '0%' }}
              />
              <span className="absolute inset-0 flex items-center justify-center text-sm font-mono text-white">
                {metrics?.wizardDropoffs || 0}
              </span>
            </div>
          </div>
        </div>
      </DataPanel>

      {/* Funnel Metrics */}
      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          label="Conversion Rate"
          value={`${metrics?.completionRate || 0}%`}
          highlight={metrics?.completionRate ? metrics.completionRate > 25 : false}
        />
        <MetricCard
          label="Drop Rate"
          value={`${metrics?.wizardStarts ? Math.round((metrics.wizardDropoffs / metrics.wizardStarts) * 100) : 0}%`}
        />
      </div>
    </div>
  );

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'variants', label: 'Variants' },
    { id: 'funnel', label: 'Funnel' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-sans font-semibold text-white mb-1">
            Genesis Dashboard
          </h1>
          <p className="text-gray-500 text-sm font-mono">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <GlowButton
          variant="secondary"
          icon={RefreshCw}
          onClick={refreshMetrics}
        >
          Refresh
        </GlowButton>
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
      {activeTab === 'overview' && renderOverview()}
      {activeTab === 'variants' && renderVariants()}
      {activeTab === 'funnel' && renderFunnel()}
    </div>
  );
};

export default Genesis;
