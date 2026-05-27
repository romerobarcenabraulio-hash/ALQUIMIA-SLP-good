/**
 * Consumes `docs/architecture/standards_map.json` (fuente canónica).
 * Tras editar el archivo en docs/, sincronizar: `cp docs/architecture/standards_map.json frontend/src/data/standards_map.json`
 */
import standardsMapData from '@/data/standards_map.json'
import { MODULE_NUMBERS, resolveModuleId } from '@/lib/chapterConfig'

export interface StandardEntry {
  code: string
  full_name: string
  url: string
  relevance: string
}

export type ModuleStandardsStatus = 'active' | 'no_aplica' | 'pendiente' | 'preliminar'

export interface ModuleStandardsRecord {
  module_id: string
  standards: StandardEntry[]
  status?: ModuleStandardsStatus
  message?: string
  note?: string
}

export interface StandardsMapFile {
  version: string
  updated: string
  modules: ModuleStandardsRecord[]
}

const MAP = standardsMapData as StandardsMapFile

const BY_M_CODE = new Map<string, ModuleStandardsRecord>(
  MAP.modules.map(m => [m.module_id, m]),
)

/** Canonical simulator module_id → M-code (e.g. city_baseline → M01). */
export function toModuleCode(canonicalId: string): string {
  const id = resolveModuleId(canonicalId)
  const num = MODULE_NUMBERS[id]
  if (!num || num === '??' || num === '·') return canonicalId
  return `M${num}`
}

/** Resolve M-code or canonical module_id to standards record. */
export function resolveModuleStandards(moduleId: string): ModuleStandardsRecord | null {
  const direct = BY_M_CODE.get(moduleId)
  if (direct) return direct

  const mCode = toModuleCode(moduleId)
  return BY_M_CODE.get(mCode) ?? null
}

export function getStandardsMapVersion(): string {
  return MAP.version
}

export const STANDARDS_MODULE_COUNT = MAP.modules.length
