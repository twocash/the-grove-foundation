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
