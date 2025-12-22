// src/foundation/consoles/HealthDashboard.tsx
// Health Dashboard - System health monitoring with declarative checks

import React, { useState, useEffect } from 'react';
import { DataPanel } from '../components/DataPanel';
import { GlowButton } from '../components/GlowButton';
import { MetricCard } from '../components/MetricCard';
import {
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  History,
  Settings,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';

// Types for health API responses
interface HealthCheckResult {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  impact?: string;
  inspect?: string;
  details?: any;
}

interface HealthCategory {
  id: string;
  name: string;
  status: 'pass' | 'fail' | 'warn';
  checks: HealthCheckResult[];
}

interface HealthReport {
  timestamp: string;
  configVersion: string;
  engineVersion: string;
  categories: HealthCategory[];
  summary: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

interface HealthConfig {
  version: string;
  display: {
    dashboardTitle: string;
    categoryLabels: Record<string, string>;
  };
  checkCount: {
    engine: number;
    corpus: number;
  };
}

interface HealthLogEntry extends HealthReport {
  id: string;
  attribution: {
    triggeredBy: string;
    timestamp: string;
  };
}

type TabId = 'status' | 'history' | 'config';

const HealthDashboard: React.FC = () => {
  const [config, setConfig] = useState<HealthConfig | null>(null);
  const [report, setReport] = useState<HealthReport | null>(null);
  const [history, setHistory] = useState<HealthLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>('status');
  const [loading, setLoading] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [expandedChecks, setExpandedChecks] = useState<Set<string>>(new Set());
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Load config and initial data
  useEffect(() => {
    loadConfig();
    loadHealth();
    loadHistory();
  }, []);

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/health/config');
      if (res.ok) {
        setConfig(await res.json());
      }
    } catch (err) {
      console.error('Failed to load health config:', err);
    }
  };

  const loadHealth = async () => {
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setReport(data);
        setLastRefresh(new Date());
        // Auto-expand failed categories
        const failedCategories = data.categories
          .filter((c: HealthCategory) => c.status === 'fail')
          .map((c: HealthCategory) => c.id);
        setExpandedCategories(new Set(failedCategories));
      }
    } catch (err) {
      console.error('Failed to load health status:', err);
    }
  };

  const loadHistory = async () => {
    try {
      const res = await fetch('/api/health/history?limit=20');
      if (res.ok) {
        const data = await res.json();
        setHistory(data.entries);
      }
    } catch (err) {
      console.error('Failed to load health history:', err);
    }
  };

  const runHealthCheck = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/health/run', { method: 'POST' });
      if (res.ok) {
        await loadHealth();
        await loadHistory();
      }
    } catch (err) {
      console.error('Failed to run health check:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleCategory = (categoryId: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(categoryId)) {
        next.delete(categoryId);
      } else {
        next.add(categoryId);
      }
      return next;
    });
  };

  const toggleCheck = (checkId: string) => {
    setExpandedChecks(prev => {
      const next = new Set(prev);
      if (next.has(checkId)) {
        next.delete(checkId);
      } else {
        next.add(checkId);
      }
      return next;
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle size={16} className="text-holo-lime" />;
      case 'fail':
        return <XCircle size={16} className="text-holo-red" />;
      case 'warn':
        return <AlertTriangle size={16} className="text-holo-amber" />;
      default:
        return null;
    }
  };

  const renderStatus = () => (
    <div className="space-y-6">
      {/* Summary Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Checks"
          value={report?.summary.total || 0}
        />
        <MetricCard
          label="Passed"
          value={report?.summary.passed || 0}
          highlight={report?.summary.passed === report?.summary.total}
        />
        <MetricCard
          label="Failed"
          value={report?.summary.failed || 0}
          highlight={report?.summary.failed ? report.summary.failed > 0 : false}
        />
        <MetricCard
          label="Warnings"
          value={report?.summary.warnings || 0}
        />
      </div>

      {/* Categories */}
      {report?.categories.map(category => (
        <DataPanel
          key={category.id}
          title={config?.display.categoryLabels?.[category.id] || category.name}
          icon={Activity}
          actions={getStatusIcon(category.status)}
        >
          <div className="space-y-2">
            {/* Category Header - Clickable */}
            <button
              onClick={() => toggleCategory(category.id)}
              className="w-full flex items-center gap-2 text-left text-gray-400 hover:text-white transition-colors"
            >
              {expandedCategories.has(category.id) ? (
                <ChevronDown size={16} />
              ) : (
                <ChevronRight size={16} />
              )}
              <span className="font-mono text-sm">
                {category.checks.length} checks - {category.checks.filter(c => c.status === 'pass').length} passed
              </span>
            </button>

            {/* Expanded Checks */}
            {expandedCategories.has(category.id) && (
              <div className="space-y-2 mt-3 pl-4 border-l border-holo-cyan/10">
                {category.checks.map(check => (
                  <div
                    key={check.id}
                    className={`
                      bg-obsidian rounded p-3 border
                      ${check.status === 'pass' ? 'border-holo-cyan/10' : ''}
                      ${check.status === 'fail' ? 'border-holo-red/30' : ''}
                      ${check.status === 'warn' ? 'border-holo-amber/30' : ''}
                    `}
                  >
                    {/* Check Header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getStatusIcon(check.status)}
                        <span className="font-mono text-sm text-white">{check.name}</span>
                      </div>
                      {(check.impact || check.inspect) && (
                        <button
                          onClick={() => toggleCheck(check.id)}
                          className="text-gray-500 hover:text-holo-cyan"
                        >
                          {expandedChecks.has(check.id) ? (
                            <ChevronDown size={14} />
                          ) : (
                            <ChevronRight size={14} />
                          )}
                        </button>
                      )}
                    </div>

                    {/* Check Message */}
                    <p className="text-gray-400 text-xs mt-1 font-mono">{check.message}</p>

                    {/* Expanded Details */}
                    {expandedChecks.has(check.id) && (check.impact || check.inspect) && (
                      <div className="mt-3 pt-3 border-t border-white/5 space-y-2">
                        {check.impact && (
                          <div className="text-xs">
                            <span className="text-holo-red font-semibold">IMPACT: </span>
                            <span className="text-gray-400">{check.impact}</span>
                          </div>
                        )}
                        {check.inspect && (
                          <div className="text-xs">
                            <span className="text-holo-amber font-semibold">INSPECT: </span>
                            <span className="text-gray-400">{check.inspect}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </DataPanel>
      ))}

      {/* Empty State */}
      {!report && (
        <DataPanel title="Loading..." icon={Activity}>
          <p className="text-gray-500 text-sm font-mono animate-pulse">
            Fetching health status...
          </p>
        </DataPanel>
      )}
    </div>
  );

  const renderHistory = () => (
    <div className="space-y-6">
      <p className="text-gray-400 text-sm font-sans">
        Health check history with attribution. Most recent checks appear first.
      </p>

      {history.length === 0 ? (
        <DataPanel title="No History" icon={History}>
          <p className="text-gray-500 text-sm font-mono">
            No health checks have been logged yet. Run a health check to create history.
          </p>
        </DataPanel>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm font-mono">
            <thead>
              <tr className="border-b border-holo-cyan/20">
                <th className="text-left py-3 px-4 text-gray-500 uppercase tracking-wider">Timestamp</th>
                <th className="text-left py-3 px-4 text-gray-500 uppercase tracking-wider">Triggered By</th>
                <th className="text-right py-3 px-4 text-gray-500 uppercase tracking-wider">Passed</th>
                <th className="text-right py-3 px-4 text-gray-500 uppercase tracking-wider">Failed</th>
                <th className="text-right py-3 px-4 text-gray-500 uppercase tracking-wider">Warnings</th>
                <th className="text-center py-3 px-4 text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((entry) => (
                <tr
                  key={entry.id}
                  className="border-b border-holo-cyan/10 hover:bg-holo-cyan/5 transition-colors"
                >
                  <td className="py-3 px-4 text-gray-400">
                    {new Date(entry.timestamp).toLocaleString()}
                  </td>
                  <td className="py-3 px-4 text-holo-cyan">
                    {entry.attribution?.triggeredBy || 'unknown'}
                  </td>
                  <td className="py-3 px-4 text-right text-holo-lime">
                    {entry.summary.passed}
                  </td>
                  <td className="py-3 px-4 text-right text-holo-red">
                    {entry.summary.failed}
                  </td>
                  <td className="py-3 px-4 text-right text-holo-amber">
                    {entry.summary.warnings}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {entry.summary.failed > 0 ? (
                      <XCircle size={16} className="text-holo-red inline" />
                    ) : entry.summary.warnings > 0 ? (
                      <AlertTriangle size={16} className="text-holo-amber inline" />
                    ) : (
                      <CheckCircle size={16} className="text-holo-lime inline" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderConfig = () => (
    <div className="space-y-6">
      <p className="text-gray-400 text-sm font-sans">
        Health check configuration. Checks are defined declaratively in health-config.json.
      </p>

      <div className="grid grid-cols-2 gap-4">
        <MetricCard
          label="Config Version"
          value={config?.version || 'Loading...'}
        />
        <MetricCard
          label="Engine Version"
          value={report?.engineVersion || 'Loading...'}
        />
        <MetricCard
          label="Engine Checks"
          value={config?.checkCount.engine || 0}
        />
        <MetricCard
          label="Corpus Checks"
          value={config?.checkCount.corpus || 0}
        />
      </div>

      <DataPanel title="Display Settings" icon={Settings}>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-gray-400 text-sm">Dashboard Title</span>
            <span className="text-white font-mono text-sm">
              {config?.display.dashboardTitle || 'System Health'}
            </span>
          </div>
          <div className="border-t border-white/5 pt-3">
            <span className="text-gray-400 text-sm block mb-2">Category Labels</span>
            <div className="space-y-1">
              {Object.entries(config?.display.categoryLabels || {}).map(([key, label]) => (
                <div key={key} className="flex justify-between items-center text-xs">
                  <span className="text-gray-500 font-mono">{key}</span>
                  <span className="text-holo-cyan font-mono">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </DataPanel>

      <DataPanel title="DAIRE Alignment" icon={Activity}>
        <ul className="space-y-2 text-sm text-gray-400">
          <li className="flex items-center gap-2">
            <CheckCircle size={14} className="text-holo-lime" />
            Declarative Configuration - Checks defined in JSON
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle size={14} className="text-holo-lime" />
            Attribution Preservation - Log entries include provenance
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle size={14} className="text-holo-lime" />
            Three-Layer Separation - Engine vs Corpus checks
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle size={14} className="text-holo-lime" />
            Progressive Enhancement - Works without config file
          </li>
        </ul>
      </DataPanel>
    </div>
  );

  const tabs: { id: TabId; label: string }[] = [
    { id: 'status', label: 'Status' },
    { id: 'history', label: 'History' },
    { id: 'config', label: 'Config' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-sans font-semibold text-white mb-1">
            {config?.display.dashboardTitle || 'System Health'}
          </h1>
          <p className="text-gray-500 text-sm font-mono">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <GlowButton
          variant="primary"
          icon={RefreshCw}
          onClick={runHealthCheck}
          loading={loading}
        >
          Run Health Check
        </GlowButton>
      </div>

      {/* Overall Status Banner */}
      {report && (
        <div
          className={`
            rounded p-4 flex items-center gap-3
            ${report.summary.failed > 0
              ? 'bg-holo-red/10 border border-holo-red/30'
              : report.summary.warnings > 0
              ? 'bg-holo-amber/10 border border-holo-amber/30'
              : 'bg-holo-lime/10 border border-holo-lime/30'
            }
          `}
        >
          {report.summary.failed > 0 ? (
            <XCircle size={24} className="text-holo-red" />
          ) : report.summary.warnings > 0 ? (
            <AlertTriangle size={24} className="text-holo-amber" />
          ) : (
            <CheckCircle size={24} className="text-holo-lime" />
          )}
          <div>
            <p
              className={`
                font-mono text-sm font-semibold
                ${report.summary.failed > 0
                  ? 'text-holo-red'
                  : report.summary.warnings > 0
                  ? 'text-holo-amber'
                  : 'text-holo-lime'
                }
              `}
            >
              {report.summary.failed > 0
                ? `${report.summary.failed} Critical Issue${report.summary.failed > 1 ? 's' : ''} Detected`
                : report.summary.warnings > 0
                ? `${report.summary.warnings} Warning${report.summary.warnings > 1 ? 's' : ''}`
                : 'All Systems Operational'
              }
            </p>
            <p className="text-gray-400 text-xs font-mono mt-1">
              Config: {report.configVersion} | Engine: {report.engineVersion}
            </p>
          </div>
        </div>
      )}

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
      {activeTab === 'status' && renderStatus()}
      {activeTab === 'history' && renderHistory()}
      {activeTab === 'config' && renderConfig()}
    </div>
  );
};

export default HealthDashboard;
