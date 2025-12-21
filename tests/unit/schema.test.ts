import { describe, test, expect } from 'vitest'
import { loadHubs, loadJourneys, loadNodes } from '../utils/schema-loader'

describe('Knowledge Schema Validation', () => {
  const hubs = loadHubs()
  const journeys = loadJourneys()
  const nodes = loadNodes()

  test('all files parse without errors', () => {
    expect(hubs.hubs).toBeDefined()
    expect(journeys.journeys).toBeDefined()
    expect(nodes.nodes).toBeDefined()
  })

  test('expected counts', () => {
    expect(Object.keys(hubs.hubs)).toHaveLength(6)
    expect(Object.keys(journeys.journeys)).toHaveLength(6)
    expect(Object.keys(nodes.nodes)).toHaveLength(24)
  })

  test('all journey.hubId references exist in hubs', () => {
    for (const [id, journey] of Object.entries(journeys.journeys)) {
      expect(hubs.hubs[journey.hubId],
        `Journey "${id}" references non-existent hub "${journey.hubId}"`
      ).toBeDefined()
    }
  })

  test('all journey.entryNode references exist in nodes', () => {
    for (const [id, journey] of Object.entries(journeys.journeys)) {
      expect(nodes.nodes[journey.entryNode],
        `Journey "${id}" has invalid entryNode "${journey.entryNode}"`
      ).toBeDefined()
    }
  })

  test('all node.journeyId references exist in journeys', () => {
    for (const [id, node] of Object.entries(nodes.nodes)) {
      expect(journeys.journeys[node.journeyId],
        `Node "${id}" references non-existent journey "${node.journeyId}"`
      ).toBeDefined()
    }
  })

  test('all node.primaryNext references exist', () => {
    for (const [id, node] of Object.entries(nodes.nodes)) {
      if (node.primaryNext) {
        expect(nodes.nodes[node.primaryNext],
          `Node "${id}" has invalid primaryNext "${node.primaryNext}"`
        ).toBeDefined()
      }
    }
  })

  test('all node.alternateNext references exist', () => {
    for (const [id, node] of Object.entries(nodes.nodes)) {
      if (node.alternateNext) {
        for (const altId of node.alternateNext) {
          expect(nodes.nodes[altId],
            `Node "${id}" has invalid alternateNext "${altId}"`
          ).toBeDefined()
        }
      }
    }
  })

  test('all hub paths follow hubs/{id}/ pattern', () => {
    for (const [id, hub] of Object.entries(hubs.hubs)) {
      expect(hub.path).toMatch(/^hubs\/[\w-]+\/$/,
        `Hub "${id}" has non-standard path "${hub.path}"`
      )
    }
  })

  test('all hubs have required fields', () => {
    for (const [id, hub] of Object.entries(hubs.hubs)) {
      expect(hub.id, `Hub "${id}" missing id`).toBe(id)
      expect(hub.title, `Hub "${id}" missing title`).toBeTruthy()
      expect(hub.thesis, `Hub "${id}" missing thesis`).toBeTruthy()
      expect(hub.primaryFile, `Hub "${id}" missing primaryFile`).toBeTruthy()
      expect(hub.tags, `Hub "${id}" missing tags`).toBeInstanceOf(Array)
    }
  })

  test('all journeys have required fields', () => {
    for (const [id, journey] of Object.entries(journeys.journeys)) {
      expect(journey.id, `Journey "${id}" missing id`).toBe(id)
      expect(journey.title, `Journey "${id}" missing title`).toBeTruthy()
      expect(journey.description, `Journey "${id}" missing description`).toBeTruthy()
      expect(journey.entryNode, `Journey "${id}" missing entryNode`).toBeTruthy()
      expect(journey.hubId, `Journey "${id}" missing hubId`).toBeTruthy()
      expect(typeof journey.estimatedMinutes).toBe('number')
    }
  })

  test('all nodes have required fields', () => {
    for (const [id, node] of Object.entries(nodes.nodes)) {
      expect(node.id, `Node "${id}" missing id`).toBe(id)
      expect(node.label, `Node "${id}" missing label`).toBeTruthy()
      expect(node.query, `Node "${id}" missing query`).toBeTruthy()
      expect(node.journeyId, `Node "${id}" missing journeyId`).toBeTruthy()
      expect(typeof node.sequenceOrder).toBe('number')
    }
  })
})
