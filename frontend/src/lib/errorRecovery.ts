/**
 * Error Recovery & Resilience System
 * Handles network failures, offline mode, and graceful degradation
 * Ensures no data loss even under adverse conditions
 */

export type ErrorSeverity = 'critical' | 'major' | 'minor' | 'info'

export interface RecoveryError {
  id: string
  message: string
  severity: ErrorSeverity
  timestamp: Date
  context?: Record<string, unknown>
  recoverable: boolean
  suggestedAction?: string
}

export interface OfflineState {
  isOffline: boolean
  since?: Date
  pendingOperations: Array<{
    id: string
    type: 'save' | 'load' | 'delete' | 'share'
    timestamp: Date
    data: unknown
    retryCount: number
  }>
}

/**
 * Error categorization and recovery strategy
 */
const ERROR_STRATEGIES: Record<string, { severity: ErrorSeverity; recoverable: boolean; action: string }> = {
  'NetworkError': {
    severity: 'major',
    recoverable: true,
    action: 'Switch to offline mode, queue operation for retry',
  },
  'TimeoutError': {
    severity: 'major',
    recoverable: true,
    action: 'Retry with exponential backoff',
  },
  'ValidationError': {
    severity: 'major',
    recoverable: true,
    action: 'Show validation errors, allow user to fix',
  },
  'AuthenticationError': {
    severity: 'critical',
    recoverable: true,
    action: 'Redirect to login',
  },
  'PermissionError': {
    severity: 'major',
    recoverable: false,
    action: 'Show permission denied message',
  },
  'NotFoundError': {
    severity: 'major',
    recoverable: false,
    action: 'Show item deleted message, offer alternatives',
  },
  'ConflictError': {
    severity: 'major',
    recoverable: true,
    action: 'Show merge dialog, let user choose resolution',
  },
  'ServerError': {
    severity: 'critical',
    recoverable: true,
    action: 'Notify user, queue for retry',
  },
  'DataCorruptionError': {
    severity: 'critical',
    recoverable: false,
    action: 'Show critical error, offer data recovery options',
  },
}

/**
 * Retry strategy with exponential backoff
 */
export function getRetryDelay(attemptNumber: number, maxDelay: number = 30000): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, 16s, 30s, 30s...
  const baseDelay = 1000
  const delay = Math.min(baseDelay * Math.pow(2, attemptNumber - 1), maxDelay)
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.1 * delay
  return delay + jitter
}

/**
 * Classify error and determine recovery strategy
 */
export function classifyError(error: unknown): RecoveryError {
  const errorId = `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  const timestamp = new Date()

  if (error instanceof TypeError && error.message.includes('fetch')) {
    const strategy = ERROR_STRATEGIES['NetworkError']!
    return {
      id: errorId,
      message: 'Network connection failed. Work will be saved when connection restored.',
      severity: strategy.severity,
      timestamp,
      recoverable: strategy.recoverable,
      suggestedAction: strategy.action,
      context: { originalError: error.message },
    }
  }

  if (error instanceof Error) {
    const errorType = error.name || 'UnknownError'
    const strategy = ERROR_STRATEGIES[errorType] || {
      severity: 'major' as const,
      recoverable: true,
      action: 'Retry operation',
    }

    return {
      id: errorId,
      message: error.message || `${errorType} occurred`,
      severity: strategy.severity,
      timestamp,
      recoverable: strategy.recoverable,
      suggestedAction: strategy.action,
      context: { errorType, stack: error.stack },
    }
  }

  return {
    id: errorId,
    message: 'An unexpected error occurred',
    severity: 'major',
    timestamp,
    recoverable: true,
    suggestedAction: 'Retry operation',
    context: { error: String(error) },
  }
}

/**
 * Network connectivity detector
 */
export class ConnectivityMonitor {
  private listeners: Set<(online: boolean) => void> = new Set()
  private isOnline: boolean = typeof navigator !== 'undefined' ? navigator.onLine : true

  constructor() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => this.setOnline(true))
      window.addEventListener('offline', () => this.setOnline(false))
    }
  }

  private setOnline(online: boolean) {
    if (this.isOnline !== online) {
      this.isOnline = online
      this.listeners.forEach(listener => listener(online))
      console.log(`[Connectivity] Network ${online ? 'restored' : 'lost'}`)
    }
  }

  subscribe(listener: (online: boolean) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  getStatus(): boolean {
    return this.isOnline
  }
}

/**
 * Operation queue for offline mode
 */
export class OfflineQueue {
  private queue: Map<string, OfflineState['pendingOperations'][0]> = new Map()

  enqueue(type: 'save' | 'load' | 'delete' | 'share', data: unknown): string {
    const id = `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    this.queue.set(id, {
      id,
      type,
      timestamp: new Date(),
      data,
      retryCount: 0,
    })

    console.log(`[OfflineQueue] Queued ${type} operation: ${id}`)
    return id
  }

  dequeue(id: string): OfflineState['pendingOperations'][0] | undefined {
    return this.queue.get(id)
  }

  remove(id: string): boolean {
    return this.queue.delete(id)
  }

  getAll(): OfflineState['pendingOperations'] {
    return Array.from(this.queue.values())
  }

  incrementRetry(id: string): number {
    const op = this.queue.get(id)
    if (op) {
      op.retryCount++
      return op.retryCount
    }
    return 0
  }

  clear(): void {
    this.queue.clear()
  }

  size(): number {
    return this.queue.size
  }
}

/**
 * Data recovery mechanisms
 */
export class DataRecovery {
  /**
   * Attempt to recover state from backup sources
   */
  static async attemptRecovery(
    corruptedState: Record<string, unknown>,
    backupSources: {
      localStorage?: Record<string, unknown>
      lastKnownGood?: Record<string, unknown>
      snapshot?: Record<string, unknown>
    }
  ): Promise<Record<string, unknown> | null> {
    console.log('[DataRecovery] Attempting to recover from backup')

    // Try most recent backup first
    for (const [sourceName, backup] of Object.entries(backupSources)) {
      if (!backup) continue

      console.log(`[DataRecovery] Trying backup from ${sourceName}`)
      try {
        // Validate backup has required fields
        if (this.isValidBackup(backup)) {
          console.log(`[DataRecovery] Successfully recovered from ${sourceName}`)
          return backup
        }
      } catch (e) {
        console.warn(`[DataRecovery] Backup from ${sourceName} is also corrupted:`, e)
      }
    }

    console.error('[DataRecovery] All backup sources exhausted, recovery failed')
    return null
  }

  private static isValidBackup(data: Record<string, unknown>): boolean {
    // Check for critical fields
    const requiredFields = ['horizonte', 'municipiosActivos']
    return requiredFields.every(field => field in data && data[field] !== null && data[field] !== undefined)
  }

  /**
   * Create emergency backup of current state
   */
  static createEmergencyBackup(state: Record<string, unknown>): string {
    const backupId = `backup_${Date.now()}`
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(`alquimia.emergency_backup_${backupId}`, JSON.stringify(state))
        console.log(`[DataRecovery] Emergency backup created: ${backupId}`)
        return backupId
      }
    } catch (e) {
      console.error('[DataRecovery] Failed to create emergency backup:', e)
    }
    return ''
  }

  /**
   * List available emergency backups
   */
  static listEmergencyBackups(): string[] {
    if (typeof window === 'undefined') return []

    const backups: string[] = []
    for (const [key] of Object.entries(localStorage)) {
      if (key.startsWith('alquimia.emergency_backup_')) {
        const backupId = key.replace('alquimia.emergency_backup_', '')
        backups.push(backupId)
      }
    }
    return backups.sort().reverse() // Most recent first
  }

  /**
   * Restore from emergency backup
   */
  static restoreFromBackup(backupId: string): Record<string, unknown> | null {
    if (typeof window === 'undefined') return null

    try {
      const key = `alquimia.emergency_backup_${backupId}`
      const data = localStorage.getItem(key)
      if (data) {
        return JSON.parse(data) as Record<string, unknown>
      }
    } catch (e) {
      console.error(`[DataRecovery] Failed to restore backup ${backupId}:`, e)
    }
    return null
  }
}

/**
 * Circuit breaker pattern for API calls
 */
export class CircuitBreaker {
  private failureCount = 0
  private lastFailureTime: Date | null = null
  private state: 'closed' | 'open' | 'half_open' = 'closed'

  constructor(
    private failureThreshold = 5,
    private resetTimeout = 60000 // 1 minute
  ) {}

  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state = 'half_open'
      } else {
        throw new Error('Circuit breaker is open. Service unavailable.')
      }
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  private shouldAttemptReset(): boolean {
    return (
      this.lastFailureTime !== null &&
      Date.now() - this.lastFailureTime.getTime() > this.resetTimeout
    )
  }

  private onSuccess(): void {
    this.failureCount = 0
    this.state = 'closed'
    this.lastFailureTime = null
  }

  private onFailure(): void {
    this.failureCount++
    this.lastFailureTime = new Date()

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'open'
      console.warn(`[CircuitBreaker] Opening circuit after ${this.failureCount} failures`)
    }
  }

  getState(): 'closed' | 'open' | 'half_open' {
    return this.state
  }

  reset(): void {
    this.failureCount = 0
    this.lastFailureTime = null
    this.state = 'closed'
  }
}

// Global instances
export const connectivityMonitor = new ConnectivityMonitor()
export const offlineQueue = new OfflineQueue()
export const apiCircuitBreaker = new CircuitBreaker(5, 60000)
