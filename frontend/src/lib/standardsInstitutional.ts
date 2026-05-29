import standardsMapData from '@/data/standards_map.json'
import type { StandardsMapFile } from '@/lib/standardsMap'

const MAP = standardsMapData as StandardsMapFile

export type InstitutionalBodyId = 'GRI' | 'ISO' | 'PMI' | 'CSRD'

export type InstitutionalBodyMeta = {
  id: InstitutionalBodyId
  sigla: string
  fullName: string
  standardsCount: number
}

function matchesBody(code: string, id: InstitutionalBodyId): boolean {
  const u = code.toUpperCase()
  switch (id) {
    case 'GRI':
      return u.startsWith('GRI') || u.includes('GRI ')
    case 'ISO':
      return u.startsWith('ISO') || u.includes('ISO ')
    case 'PMI':
      return u.startsWith('PMI') || u.includes('PMBOK')
    case 'CSRD':
      return u.startsWith('CSRD') || u.includes('ESRS') || u.includes('EFRAG')
    default:
      return false
  }
}

function countStandardsForBody(id: InstitutionalBodyId): number {
  let n = 0
  for (const mod of MAP.modules) {
    for (const s of mod.standards ?? []) {
      if (matchesBody(s.code, id)) n += 1
    }
  }
  return n
}

/** Cuatro cuerpos normativos visibles en M00 — conteos desde standards_map.json (revisión de estándares). */
export const INSTITUTIONAL_BODIES: InstitutionalBodyMeta[] = (
  [
    {
      id: 'GRI',
      sigla: 'GRI',
      fullName: 'Global Reporting Initiative — estándares de reporte de sostenibilidad',
    },
    {
      id: 'ISO',
      sigla: 'ISO',
      fullName: 'International Organization for Standardization — gestión ambiental y calidad',
    },
    {
      id: 'PMI',
      sigla: 'PMI',
      fullName: 'Project Management Institute — PMBOK y gestión de proyectos',
    },
    {
      id: 'CSRD',
      sigla: 'CSRD',
      fullName: 'Corporate Sustainability Reporting Directive — ESRS (Unión Europea)',
    },
  ] as const
).map(b => ({ ...b, standardsCount: countStandardsForBody(b.id) }))
