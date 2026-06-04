/**
 * Simulation Persistence Layer
 * Handles saving, loading, and syncing simulation state with backend
 */

import { getApiUrl } from '@/lib/api'
import type { SimulatorState } from '@/types'

export type SimulationSaveStatus = 'idle' | 'saving' | 'saved' | 'error'

export interface SimulationMetadata {
  id: string
  name: string
  description?: string
  municipios: string[]
  horizonte: number
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
  isOwner: boolean
  canEdit: boolean
  tenantId?: string
}

export interface SimulationSnapshot {
  id: string
  version: number
  state: Record<string, unknown>
  metadata: SimulationMetadata
  createdAt: string
}

export interface SaveSimulationRequest {
  name: string
  description?: string
  state: Record<string, unknown>
}

export interface SaveSimulationResponse {
  id: string
  version: number
  savedAt: string
}

export interface LoadSimulationResponse {
  id: string
  version: number
  state: Record<string, unknown>
  metadata: SimulationMetadata
  loadedAt: string
}

export interface SimulationListResponse {
  simulations: SimulationMetadata[]
  total: number
  page: number
  pageSize: number
}

export interface SimulationVersionResponse {
  versions: Array<{
    version: number
    createdAt: string
    createdBy: string
    description?: string
  }>
}

/**
 * Serializable state subset - excludes non-serializable fields
 */
export function serializeSimulatorState(state: Partial<SimulatorState>): Record<string, unknown> {
  return {
    // Geographic
    zmActiva: state.zmActiva,
    municipiosActivos: state.municipiosActivos,
    tiposVivienda: state.tiposVivienda,

    // Plan
    horizonte: state.horizonte,
    presetTrayectoria: state.presetTrayectoria,
    pctCapturaPorAño: state.pctCapturaPorAño,
    mesInicio: state.mesInicio,
    journeyMode: state.journeyMode,

    // Financial & Prices
    precios: state.precios,
    wacc: state.wacc,
    tipoCambio: state.tipoCambio,

    // Operational
    mermaLogPct: state.mermaLogPct,
    rechazoPorMat: state.rechazoPorMat,
    mixCAs: state.mixCAs,
    capCamionTon: state.capCamionTon,

    // Module progression
    moduleProgression: state.moduleProgression,

    // Other important fields
    clientSetupComplete: state.clientSetupComplete,
    encuestaResultados: state.encuestaResultados,
  }
}

/**
 * Save simulation state to backend
 */
export async function saveSimulation(
  request: SaveSimulationRequest,
  tenantId?: string
): Promise<SaveSimulationResponse> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(tenantId && { 'x-tenant-id': tenantId }),
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const url = `${getApiUrl()}/simulations/save`
  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(request),
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.detail ?? `Failed to save simulation: HTTP ${res.status}`)
  }

  return res.json()
}

/**
 * Load simulation state from backend
 */
export async function loadSimulation(
  simulationId: string,
  tenantId?: string
): Promise<LoadSimulationResponse> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(tenantId && { 'x-tenant-id': tenantId }),
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const url = `${getApiUrl()}/simulations/${encodeURIComponent(simulationId)}`
  const res = await fetch(url, {
    method: 'GET',
    headers,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.detail ?? `Failed to load simulation: HTTP ${res.status}`)
  }

  return res.json()
}

/**
 * List user's simulations
 */
export async function listSimulations(
  page: number = 1,
  pageSize: number = 20,
  tenantId?: string
): Promise<SimulationListResponse> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(tenantId && { 'x-tenant-id': tenantId }),
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const url = new URL(`${getApiUrl()}/simulations`)
  url.searchParams.append('page', String(page))
  url.searchParams.append('page_size', String(pageSize))

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.detail ?? `Failed to list simulations: HTTP ${res.status}`)
  }

  return res.json()
}

/**
 * Get version history for a simulation
 */
export async function getSimulationVersions(
  simulationId: string,
  tenantId?: string
): Promise<SimulationVersionResponse> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(tenantId && { 'x-tenant-id': tenantId }),
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const url = `${getApiUrl()}/simulations/${encodeURIComponent(simulationId)}/versions`
  const res = await fetch(url, {
    method: 'GET',
    headers,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.detail ?? `Failed to get versions: HTTP ${res.status}`)
  }

  return res.json()
}

/**
 * Delete simulation
 */
export async function deleteSimulation(
  simulationId: string,
  tenantId?: string
): Promise<void> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(tenantId && { 'x-tenant-id': tenantId }),
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const url = `${getApiUrl()}/simulations/${encodeURIComponent(simulationId)}`
  const res = await fetch(url, {
    method: 'DELETE',
    headers,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.detail ?? `Failed to delete simulation: HTTP ${res.status}`)
  }
}

/**
 * Restore simulation to a previous version
 */
export async function restoreSimulationVersion(
  simulationId: string,
  version: number,
  tenantId?: string
): Promise<LoadSimulationResponse> {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(tenantId && { 'x-tenant-id': tenantId }),
  }

  const token = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const url = `${getApiUrl()}/simulations/${encodeURIComponent(simulationId)}/restore/${version}`
  const res = await fetch(url, {
    method: 'POST',
    headers,
  })

  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.detail ?? `Failed to restore version: HTTP ${res.status}`)
  }

  return res.json()
}
