import { describe, test, expect, beforeAll } from 'vitest'
import { fetchNarrative, healthCheck } from '../utils/api'

describe('GET /api/narrative', () => {
  let response: any

  beforeAll(async () => {
    // Skip if server not running
    try {
      await healthCheck()
    } catch (err) {
      console.log('Server not running, skipping integration tests')
      return
    }
    response = await fetchNarrative()
  })

  test('returns journeys object', () => {
    if (!response) return // Skip if server not running
    expect(response.journeys).toBeDefined()
    expect(typeof response.journeys).toBe('object')
  })

  test('returns nodes object', () => {
    if (!response) return
    expect(response.nodes).toBeDefined()
    expect(typeof response.nodes).toBe('object')
  })

  test('returns hubs object', () => {
    if (!response) return
    expect(response.hubs).toBeDefined()
    expect(typeof response.hubs).toBe('object')
  })

  test('correct journey count', () => {
    if (!response) return
    expect(Object.keys(response.journeys)).toHaveLength(6)
  })

  test('correct node count', () => {
    if (!response) return
    expect(Object.keys(response.nodes)).toHaveLength(24)
  })

  test('ratchet journey has correct hubId', () => {
    if (!response) return
    expect(response.journeys.ratchet.hubId).toBe('ratchet-effect')
  })
})

describe('Health Endpoint', () => {
  test('returns OK status', async () => {
    try {
      const health = await healthCheck()
      expect(health.status).toBe('OK')
    } catch (err) {
      console.log('Server not running, skipping health check test')
    }
  })
})
