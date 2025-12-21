import * as fs from 'fs'
import * as path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const DATA_DIR = path.join(__dirname, '../../data')

export function loadJson<T>(filePath: string): T {
  const fullPath = path.join(DATA_DIR, filePath)
  return JSON.parse(fs.readFileSync(fullPath, 'utf8'))
}

export interface Hub {
  id: string
  title: string
  thesis: string
  path: string
  primaryFile: string
  status: string
  tags: string[]
}

export interface HubsData {
  version: string
  hubs: Record<string, Hub>
}

export interface Journey {
  id: string
  title: string
  description: string
  entryNode: string
  targetAha: string
  hubId: string
  estimatedMinutes: number
  status: string
}

export interface JourneysData {
  version: string
  journeys: Record<string, Journey>
}

export interface Node {
  id: string
  label: string
  query: string
  contextSnippet: string
  sectionId: string
  journeyId: string
  sequenceOrder: number
  primaryNext?: string
  alternateNext?: string[]
}

export interface NodesData {
  version: string
  nodes: Record<string, Node>
}

export function loadHubs(): HubsData {
  return loadJson<HubsData>('knowledge/hubs.json')
}

export function loadJourneys(): JourneysData {
  return loadJson<JourneysData>('exploration/journeys.json')
}

export function loadNodes(): NodesData {
  return loadJson<NodesData>('exploration/nodes.json')
}
