import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  FullResult
} from '@playwright/test/reporter';

interface TestHealth {
  id: string;
  name: string;
  file: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
  duration: number;
}

interface HealthReport {
  category: string;
  categoryName: string;
  checks: TestHealth[];
  attribution: {
    triggeredBy: string;
    commit: string | null;
    branch: string | null;
    timestamp: string;
  };
}

class HealthReporter implements Reporter {
  private results: TestHealth[] = [];
  private baseUrl: string;

  constructor(options: { baseUrl?: string } = {}) {
    this.baseUrl = options.baseUrl || 'http://localhost:5173';
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    this.results.push({
      id: this.slugify(test.title),
      name: test.title,
      file: test.location.file.replace(/.*tests[\\/]e2e[\\/]/, ''),
      status: this.mapStatus(result.status),
      message: result.error?.message || 'Passed',
      duration: result.duration
    });
  }

  async onEnd(result: FullResult): Promise<void> {
    if (this.results.length === 0) {
      console.log('[HealthReporter] No test results to report');
      return;
    }

    const report: HealthReport = {
      category: 'e2e-tests',
      categoryName: 'E2E Tests',
      checks: this.results,
      attribution: {
        triggeredBy: 'playwright',
        commit: process.env.GIT_COMMIT || process.env.GITHUB_SHA || null,
        branch: process.env.GIT_BRANCH || process.env.GITHUB_REF_NAME || null,
        timestamp: new Date().toISOString()
      }
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/health/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(report)
      });

      if (response.ok) {
        const data = await response.json();
        console.log(`[HealthReporter] Reported ${this.results.length} tests to Health system`);
        console.log(`[HealthReporter] Entry ID: ${data.id}`);
      } else {
        console.warn(`[HealthReporter] Failed to report: ${response.status}`);
      }
    } catch (error) {
      // Graceful degradation - don't fail tests if Health API unavailable
      console.warn('[HealthReporter] Health API unavailable, skipping report');
    }
  }

  private slugify(text: string): string {
    return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  private mapStatus(status: string): 'pass' | 'fail' | 'warn' {
    switch (status) {
      case 'passed': return 'pass';
      case 'failed':
      case 'timedOut': return 'fail';
      case 'skipped': return 'warn';
      default: return 'warn';
    }
  }
}

export default HealthReporter;
