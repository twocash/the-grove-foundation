import { describe, test, expect } from 'vitest'
import { loadJourneys, loadNodes, type Node } from '../utils/schema-loader'

const journeys = loadJourneys()
const nodes = loadNodes()

function getJourneyNodes(journeyId: string): string[] {
  return Object.entries(nodes.nodes)
    .filter(([_, node]) => node.journeyId === journeyId)
    .map(([id]) => id)
}

function traverseNodeChain(entryNode: string): string[] {
  const visited: string[] = []
  let current: string | undefined = entryNode
  while (current && !visited.includes(current)) {
    visited.push(current)
    const node = nodes.nodes[current]
    // Only follow primaryNext within the same journey
    if (node?.primaryNext && nodes.nodes[node.primaryNext]?.journeyId === node.journeyId) {
      current = node.primaryNext
    } else {
      current = undefined
    }
  }
  return visited
}

describe('Journey Navigation', () => {
  test.each([
    ['simulation', 5],
    ['stakes', 3],
    ['ratchet', 4],
    ['diary', 4],
    ['emergence', 5],
    ['architecture', 3],
  ])('%s journey has %d nodes', (journeyId, expected) => {
    const journeyNodes = getJourneyNodes(journeyId)
    expect(journeyNodes).toHaveLength(expected)
  })

  test('all journeys have complete node chains within their own journey', () => {
    for (const [id, journey] of Object.entries(journeys.journeys)) {
      const expectedNodes = getJourneyNodes(id)
      const chain = traverseNodeChain(journey.entryNode)
      expect(chain.length, `Journey "${id}" chain incomplete: got ${chain.length}, expected ${expectedNodes.length}`).toBe(expectedNodes.length)
    }
  })

  test('ratchet node chain is correct', () => {
    const chain = traverseNodeChain('ratchet-hook')
    expect(chain).toEqual([
      'ratchet-hook',
      'ratchet-gap',
      'ratchet-floor',
      'ratchet-hybrid'
    ])
  })

  test('simulation node chain is correct', () => {
    const chain = traverseNodeChain('sim-hook')
    expect(chain).toEqual([
      'sim-hook',
      'sim-split',
      'sim-observer',
      'sim-recursion',
      'sim-proof'
    ])
  })

  test('stakes node chain is correct', () => {
    const chain = traverseNodeChain('stakes-380b')
    expect(chain).toEqual([
      'stakes-380b',
      'stakes-rental',
      'stakes-dependency'
    ])
  })

  test('diary node chain is correct', () => {
    const chain = traverseNodeChain('diary-hook')
    expect(chain).toEqual([
      'diary-hook',
      'diary-voice',
      'diary-memory',
      'diary-observer'
    ])
  })

  test('emergence node chain is correct', () => {
    const chain = traverseNodeChain('emergence-hook')
    expect(chain).toEqual([
      'emergence-hook',
      'emergence-zero-shot',
      'emergence-scaling',
      'emergence-observer',
      'emergence-grove'
    ])
  })

  test('architecture node chain is correct', () => {
    const chain = traverseNodeChain('arch-hook')
    expect(chain).toEqual([
      'arch-hook',
      'arch-coordination',
      'arch-credit'
    ])
  })

  test('all nodes have valid sequenceOrder for their journey', () => {
    for (const [journeyId, _journey] of Object.entries(journeys.journeys)) {
      const journeyNodes = Object.values(nodes.nodes)
        .filter(n => n.journeyId === journeyId)
        .sort((a, b) => a.sequenceOrder - b.sequenceOrder)

      // Verify sequence starts at 1 and is contiguous
      journeyNodes.forEach((node, index) => {
        expect(node.sequenceOrder,
          `Node "${node.id}" has invalid sequenceOrder ${node.sequenceOrder}, expected ${index + 1}`
        ).toBe(index + 1)
      })
    }
  })

  test('entry nodes have sequenceOrder 1', () => {
    for (const [_id, journey] of Object.entries(journeys.journeys)) {
      const entryNode = nodes.nodes[journey.entryNode]
      expect(entryNode.sequenceOrder,
        `Entry node "${journey.entryNode}" should have sequenceOrder 1`
      ).toBe(1)
    }
  })
})
