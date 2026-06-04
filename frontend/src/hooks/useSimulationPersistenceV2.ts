'use client'

/**
 * Enhanced Simulation Persistence Hook v2
 * Integrates validation, error recovery, and audit logging for production reliability
 */

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
import { validateBeforeSave, validateLoadedState, detectCorruption, type ValidationError } from '@/lib/stateValidation'
import {
  classifyError,
  connectivityMonitor,
  offlineQueue,
  apiCircuitBreaker,
  DataRecovery,
  type RecoveryError,
} from '@/lib/errorRecovery'
import { logAudit, getAuditLogger, type AuditAction } from '@/lib/auditLog'

interface UseSimulationPersistenceV2Options {
  autoSaveInterval?: number
  tenantId?: string
  onValidationError?: (errors: ValidationError[]) => void
  onRecoveryError?: (error: RecoveryError) => void
}

export function useSimulationPersistenceV2(options: UseSimulationPersistenceV2Options = {}) {
  const { autoSaveInterval = 30000, tenantId, onValidationError, onRecoveryError } = options

  // State management
  const [saveStatus, setSaveStatus] = useState<SimulationSaveStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null)
  const [currentSimulationId, setCurrentSimulationId] = useState<string | null>(null)
  const [simulations, setSimulations] = useState<SimulationMetadata[]>([])
  const [versions, setVersions] = useState<SimulationVersionResponse | null>(null)
  const [loadingSimulations, setLoadingSimulations] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [pendingOperations, setPendingOperations] = useState(0)

  const simulatorState = useSimulatorStore()
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const lastStateHashRef = useRef<string>('')
  const auditLogger = useRef(getAuditLogger())

  // Monitor connectivity
  useEffect(() => {
    const unsubscribe = connectivityMonitor.subscribe(online => {
      setIsOnline(online)
      if (online) {
        logAudit('offline_operation', 'Network connection restored')
        // Attempt to flush pending operations
        void flushPendingOperations()
      } else {
        logAudit('offline_operation', 'Network connection lost, switching to offline mode')
      }
    })
    return unsubscribe
  }, [])

  const getStateHash = useCallback(() => {
    try {
      const state = serializeSimulatorState(simulatorState)
      return JSON.stringify(state)
    } catch {
      return ''
    }
  }, [simulatorState])

  /**
   * Save simulation with full validation and error handling
   */
  const saveCurrentSimulation = useCallback(
    async (name?: string, description?: string) => {
      const startTime = Date.now()
      setSaveStatus('saving')
      setError(null)
      setValidationErrors([])

      try {
        // 1. Serialize state
        const state = serializeSimulatorState(simulatorState)

        // 2. Validate before save
        const validation = validateBeforeSave(state as any)
        if (!validation.valid) {
          setValidationErrors(validation.errors)
          onValidationError?.(validation.errors)
          setSaveStatus('error')
          setError('Validation failed: ' + validation.errors[0]?.message)
          logAudit(
            'validation_failed',
            `Save validation failed: ${validation.errors[0]?.message}`,
            false,
            { details: { errors: validation.errors } }
          )
          throw new Error('Validation failed')
        }

        // 3. Attempt to save
        const simulationName = name || `Simulation-${new Date().toISOString().split('T')[0]}`

        const response = await apiCircuitBreaker.execute(async () => {
          return saveSimulation(
            {
              name: simulationName,
              description,
              state,
            },
            tenantId
          )
        })

        // 4. Success
        setCurrentSimulationId(response.id)
        setLastSaveTime(new Date(response.savedAt))
        setSaveStatus('saved')
        lastStateHashRef.current = getStateHash()

        const duration = Date.now() - startTime
        logAudit('simulation_saved', `Saved simulation "${simulationName}"`, true, {
          duration,
          resource: { type: 'simulation', id: response.id, name: simulationName },
          context: { tenantId },
        })

        setTimeout(() => setSaveStatus('idle'), 2000)
        return response.id
      } catch (err) {
        const duration = Date.now() - startTime
        const recoveryError = classifyError(err)

        // Handle based on severity
        if (!recoveryError.recoverable) {
          setError(recoveryError.message)
          setSaveStatus('error')
          logAudit(
            'simulation_saved',
            `Save failed: ${recoveryError.message}`,
            false,
            { duration, details: { error: recoveryError } }
          )
          onRecoveryError?.(recoveryError)
          throw err
        }

        // If offline, queue for retry
        if (!isOnline) {
          const operationId = offlineQueue.enqueue('save', {
            name,
            description,
            state: serializeSimulatorState(simulatorState),
          })
          setPendingOperations(p => p + 1)
          logAudit('offline_operation', `Queued save operation (offline): ${operationId}`, false, {
            details: { operationId },
          })
          setSaveStatus('idle')
          setError('Offline: Changes will be saved when connection restored')
          return operationId
        }

        // Otherwise, show error and allow retry
        setError(recoveryError.message)
        setSaveStatus('error')
        logAudit(
          'error_occurred',
          `Save error: ${recoveryError.message}`,
          false,
          { duration, details: { error: recoveryError } }
        )
        throw err
      }
    },
    [simulatorState, tenantId, isOnline, onValidationError, onRecoveryError, getStateHash]
  )

  /**
   * Load simulation with corruption detection and recovery
   */
  const loadCurrentSimulation = useCallback(
    async (simulationId: string) => {
      const startTime = Date.now()
      setSaveStatus('saving')
      setError(null)

      try {
        const response = await apiCircuitBreaker.execute(async () => {
          return loadSimulation(simulationId, tenantId)
        })

        const { state, metadata } = response

        // Validate loaded state
        const validation = validateLoadedState(state)
        const corruption = detectCorruption(state)

        if (corruption.length > 0) {
          console.warn('[Persistence] Corruption detected in loaded state:', corruption)
          logAudit('recovery_attempted', `Corruption detected, attempting recovery`, false, {
            details: { corruption },
          })

          // Attempt recovery
          const recovered = await DataRecovery.attemptRecovery(state, {
            lastKnownGood: state,
          })

          if (!recovered) {
            throw new Error('Data corruption detected and could not be recovered')
          }

          // Use recovered state
          Object.entries(recovered).forEach(([key, value]) => {
            const stateKey = key as keyof typeof simulatorState
            if (stateKey in simulatorState) {
              simulatorState[stateKey] = value as never
            }
          })

          logAudit('recovery_attempted', 'Successfully recovered from corruption', true, {
            context: { tenantId },
          })
        } else {
          // Restore state normally
          Object.entries(state).forEach(([key, value]) => {
            const stateKey = key as keyof typeof simulatorState
            if (stateKey in simulatorState) {
              simulatorState[stateKey] = value as never
            }
          })
        }

        setCurrentSimulationId(simulationId)
        setLastSaveTime(new Date(metadata.updatedAt))
        setSaveStatus('idle')
        lastStateHashRef.current = getStateHash()

        const duration = Date.now() - startTime
        logAudit('simulation_loaded', `Loaded simulation "${metadata.name}"`, true, {
          duration,
          resource: { type: 'simulation', id: simulationId, name: metadata.name },
          context: { tenantId },
        })

        return response
      } catch (err) {
        const duration = Date.now() - startTime
        const recoveryError = classifyError(err)

        if (!isOnline) {
          const operationId = offlineQueue.enqueue('load', { simulationId })
          setPendingOperations(p => p + 1)
          setSaveStatus('idle')
          setError('Offline: Load queued for when connection restored')
          logAudit('offline_operation', `Queued load operation (offline): ${operationId}`, false)
          return
        }

        setError(recoveryError.message)
        setSaveStatus('error')
        logAudit('error_occurred', `Load error: ${recoveryError.message}`, false, {
          duration,
          details: { error: recoveryError },
        })
        onRecoveryError?.(recoveryError)
        throw err
      }
    },
    [simulatorState, tenantId, isOnline, onRecoveryError, getStateHash]
  )

  /**
   * Load simulations list
   */
  const loadSimulationsList = useCallback(async (page = 1) => {
    setLoadingSimulations(true)
    setError(null)

    try {
      const response = await apiCircuitBreaker.execute(async () => {
        return listSimulations(page, 10, tenantId)
      })

      setSimulations(response.simulations)
      logAudit('simulation_loaded', `Loaded simulations list (page ${page})`, true, {
        context: { tenantId },
      })
      return response
    } catch (err) {
      const recoveryError = classifyError(err)
      setError(recoveryError.message)
      logAudit('error_occurred', `Failed to load simulations list: ${recoveryError.message}`, false)
      throw err
    } finally {
      setLoadingSimulations(false)
    }
  }, [tenantId])

  /**
   * Flush pending offline operations when back online
   */
  const flushPendingOperations = useCallback(async () => {
    const pending = offlineQueue.getAll()
    if (pending.length === 0) return

    console.log(`[Persistence] Flushing ${pending.length} pending operations`)

    for (const operation of pending) {
      try {
        if (operation.type === 'save') {
          const saveOp = operation.data as any
          await saveSimulation(saveOp, tenantId)
          offlineQueue.remove(operation.id)
          setPendingOperations(p => Math.max(0, p - 1))
          logAudit('offline_operation', `Flushed pending save operation`, true)
        } else if (operation.type === 'load') {
          const loadOp = operation.data as any
          await loadSimulation(loadOp.simulationId, tenantId)
          offlineQueue.remove(operation.id)
          setPendingOperations(p => Math.max(0, p - 1))
          logAudit('offline_operation', `Flushed pending load operation`, true)
        }
      } catch (e) {
        const retryCount = offlineQueue.incrementRetry(operation.id)
        if (retryCount > 3) {
          offlineQueue.remove(operation.id)
          setPendingOperations(p => Math.max(0, p - 1))
          logAudit('error_occurred', `Failed to flush operation after 3 retries`, false, {
            details: { operationId: operation.id },
          })
        }
      }
    }
  }, [tenantId])

  // Auto-save with state change detection
  useEffect(() => {
    if (autoSaveInterval === 0 || !currentSimulationId) return

    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current)
    }

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

  // Cleanup and flush on unmount
  useEffect(() => {
    return () => {
      auditLogger.current?.flush()
    }
  }, [])

  return {
    // Status
    saveStatus,
    error,
    validationErrors,
    lastSaveTime,
    currentSimulationId,
    loadingSimulations,
    isOnline,
    pendingOperations,

    // Actions
    saveCurrentSimulation,
    loadCurrentSimulation,
    loadSimulationsList,
    flushPendingOperations,
    clearError: () => setError(null),

    // Data
    simulations,
    versions,
  }
}
