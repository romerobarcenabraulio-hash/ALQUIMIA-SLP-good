'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useSimulatorStore } from '@/store/simulatorStore'
import {
  saveSimulation,
  loadSimulation,
  listSimulations,
  getSimulationVersions,
  deleteSimulation,
  restoreSimulationVersion,
  serializeSimulatorState,
  type SimulationSaveStatus,
  type SimulationMetadata,
  type SimulationVersionResponse,
} from '@/lib/simulationPersistence'

interface UseSimulationPersistenceOptions {
  autoSaveInterval?: number // milliseconds, 0 to disable
  tenantId?: string
}

export function useSimulationPersistence(options: UseSimulationPersistenceOptions = {}) {
  const { autoSaveInterval = 30000, tenantId } = options

  const [saveStatus, setSaveStatus] = useState<SimulationSaveStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null)
  const [currentSimulationId, setCurrentSimulationId] = useState<string | null>(null)
  const [simulations, setSimulations] = useState<SimulationMetadata[]>([])
  const [versions, setVersions] = useState<SimulationVersionResponse | null>(null)
  const [loadingSimulations, setLoadingSimulations] = useState(false)

  const simulatorState = useSimulatorStore()
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastStateHashRef = useRef<string>('')

  // Generate hash of current state for change detection
  const getStateHash = useCallback(() => {
    try {
      const state = serializeSimulatorState(simulatorState)
      return JSON.stringify(state)
    } catch {
      return ''
    }
  }, [simulatorState])

  // Save simulation
  const saveCurrentSimulation = useCallback(
    async (name?: string, description?: string) => {
      setSaveStatus('saving')
      setError(null)

      try {
        const state = serializeSimulatorState(simulatorState)
        const simulationName = name || `Simulation-${new Date().toISOString().split('T')[0]}`

        const response = await saveSimulation(
          {
            name: simulationName,
            description,
            state,
          },
          tenantId
        )

        setCurrentSimulationId(response.id)
        setLastSaveTime(new Date(response.savedAt))
        setSaveStatus('saved')
        lastStateHashRef.current = getStateHash()

        // Auto-reset to idle after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000)

        return response.id
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to save simulation'
        setError(errorMessage)
        setSaveStatus('error')
        throw err
      }
    },
    [simulatorState, tenantId, getStateHash]
  )

  // Load simulation
  const loadCurrentSimulation = useCallback(
    async (simulationId: string) => {
      setSaveStatus('saving') // Reusing as loading indicator
      setError(null)

      try {
        const response = await loadSimulation(simulationId, tenantId)
        const { state, metadata } = response

        // Restore state to simulator store
        Object.entries(state).forEach(([key, value]) => {
          const stateKey = key as keyof typeof simulatorState
          if (stateKey in simulatorState) {
            // Type-safe state restoration would require more sophisticated approach
            // For now, use a generic update
            simulatorState[stateKey] = value as never
          }
        })

        setCurrentSimulationId(simulationId)
        setLastSaveTime(new Date(metadata.updatedAt))
        setSaveStatus('idle')
        lastStateHashRef.current = getStateHash()

        return response
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load simulation'
        setError(errorMessage)
        setSaveStatus('error')
        throw err
      }
    },
    [simulatorState, tenantId, getStateHash]
  )

  // List user's simulations
  const loadSimulationsList = useCallback(async (page = 1) => {
    setLoadingSimulations(true)
    setError(null)

    try {
      const response = await listSimulations(page, 10, tenantId)
      setSimulations(response.simulations)
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load simulations'
      setError(errorMessage)
      throw err
    } finally {
      setLoadingSimulations(false)
    }
  }, [tenantId])

  // Get versions for current simulation
  const loadVersionHistory = useCallback(async () => {
    if (!currentSimulationId) return

    try {
      const response = await getSimulationVersions(currentSimulationId, tenantId)
      setVersions(response)
      return response
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load versions'
      setError(errorMessage)
      throw err
    }
  }, [currentSimulationId, tenantId])

  // Restore to previous version
  const restoreVersion = useCallback(
    async (version: number) => {
      if (!currentSimulationId) return

      setSaveStatus('saving')
      setError(null)

      try {
        const response = await restoreSimulationVersion(currentSimulationId, version, tenantId)
        const { state, metadata } = response

        // Restore state
        Object.entries(state).forEach(([key, value]) => {
          const stateKey = key as keyof typeof simulatorState
          if (stateKey in simulatorState) {
            simulatorState[stateKey] = value as never
          }
        })

        setLastSaveTime(new Date(metadata.updatedAt))
        setSaveStatus('idle')
        lastStateHashRef.current = getStateHash()

        return response
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to restore version'
        setError(errorMessage)
        setSaveStatus('error')
        throw err
      }
    },
    [currentSimulationId, simulatorState, tenantId, getStateHash]
  )

  // Delete simulation
  const deleteCurrentSimulation = useCallback(async () => {
    if (!currentSimulationId) return

    try {
      await deleteSimulation(currentSimulationId, tenantId)
      setCurrentSimulationId(null)
      setLastSaveTime(null)
      // Reload simulations list
      await loadSimulationsList()
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete simulation'
      setError(errorMessage)
      throw err
    }
  }, [currentSimulationId, tenantId, loadSimulationsList])

  // Auto-save when state changes
  useEffect(() => {
    if (autoSaveInterval === 0 || !currentSimulationId) return

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

    // Set new timeout
    autoSaveTimeoutRef.current = setTimeout(() => {
      const currentHash = getStateHash()
      if (currentHash !== lastStateHashRef.current) {
        void saveCurrentSimulation()
      }
    }, autoSaveInterval)

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current)
      }
    }
  }, [autoSaveInterval, currentSimulationId, getStateHash, saveCurrentSimulation])

  return {
    // Status
    saveStatus,
    error,
    lastSaveTime,
    currentSimulationId,
    loadingSimulations,

    // Actions
    saveCurrentSimulation,
    loadCurrentSimulation,
    loadSimulationsList,
    loadVersionHistory,
    restoreVersion,
    deleteCurrentSimulation,
    clearError: () => setError(null),

    // Data
    simulations,
    versions,
  }
}
