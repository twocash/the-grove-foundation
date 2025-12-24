const API_URL = process.env.API_URL || 'http://localhost:8080'

export async function fetchNarrative(): Promise<any> {
  const res = await fetch(`${API_URL}/api/narrative`)
  if (!res.ok) {
    throw new Error(`Failed to fetch narrative: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

export async function sendChat(message: string, journeyId?: string): Promise<any> {
  const res = await fetch(`${API_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, journeyId }),
  })
  if (!res.ok) {
    throw new Error(`Failed to send chat: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

export async function healthCheck(): Promise<{ status: string }> {
  const res = await fetch(`${API_URL}/health`)
  if (!res.ok) {
    throw new Error(`Health check failed: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

// Health Dashboard API helpers
export async function fetchHealth(): Promise<any> {
  const res = await fetch(`${API_URL}/api/health`)
  if (!res.ok) {
    throw new Error(`Failed to fetch health: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

export async function fetchHealthConfig(): Promise<any> {
  const res = await fetch(`${API_URL}/api/health/config`)
  if (!res.ok) {
    throw new Error(`Failed to fetch health config: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

export async function fetchHealthHistory(limit = 50): Promise<any> {
  const res = await fetch(`${API_URL}/api/health/history?limit=${limit}`)
  if (!res.ok) {
    throw new Error(`Failed to fetch health history: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

export async function runHealthCheck(): Promise<any> {
  const res = await fetch(`${API_URL}/api/health/run`, { method: 'POST' })
  if (!res.ok) {
    throw new Error(`Failed to run health check: ${res.status} ${res.statusText}`)
  }
  return res.json()
}

export interface HealthReportPayload {
  category: string;
  categoryName?: string;
  checks: Array<{
    id: string;
    name?: string;
    status: 'pass' | 'fail' | 'warn';
    message?: string;
    file?: string;
    duration?: number;
  }>;
  attribution?: {
    triggeredBy?: string;
    commit?: string;
    branch?: string;
  };
}

export async function postHealthReport(payload: HealthReportPayload): Promise<Response> {
  return fetch(`${API_URL}/api/health/report`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
}
