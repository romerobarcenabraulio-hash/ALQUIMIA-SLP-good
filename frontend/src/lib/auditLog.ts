/**
 * Audit Logging System
 * Tracks all significant operations for compliance, debugging, and accountability
 * Critical for government/municipal use cases
 */

import { getApiUrl } from '@/lib/api'

export type AuditAction =
  | 'simulation_created'
  | 'simulation_loaded'
  | 'simulation_saved'
  | 'simulation_deleted'
  | 'simulation_shared'
  | 'data_modified'
  | 'permission_denied'
  | 'validation_failed'
  | 'error_occurred'
  | 'offline_operation'
  | 'recovery_attempted'
  | 'export_generated'
  | 'import_processed'

export interface AuditLogEntry {
  id: string
  action: AuditAction
  actor: string // User ID/email
  timestamp: Date
  duration?: number // milliseconds
  success: boolean
  message: string
  details?: Record<string, unknown>
  resource?: {
    type: string // 'simulation', 'module', 'scenario', etc.
    id: string
    name?: string
  }
  context?: {
    municipio?: string
    municipality?: string
    tenantId?: string
    sessionId?: string
  }
  ipAddress?: string
  userAgent?: string
  source: 'frontend' | 'backend'
  severity: 'info' | 'warning' | 'error'
}

/**
 * Local audit log buffer (before sync to backend)
 */
class AuditLogBuffer {
  private entries: AuditLogEntry[] = []
  private maxSize = 100
  private syncInterval: NodeJS.Timeout | null = null
  private isSyncing = false

  constructor(private tenantId?: string, private autoSyncInterval = 10000) {
    this.startAutoSync()
  }

  add(entry: AuditLogEntry): void {
    this.entries.push(entry)

    // Keep buffer size reasonable
    if (this.entries.length > this.maxSize) {
      this.entries = this.entries.slice(-this.maxSize)
    }

    // Persist to localStorage for redundancy
    try {
      this.persistToLocal()
    } catch (e) {
      console.warn('[AuditLog] Failed to persist to localStorage:', e)
    }

    console.log(`[AuditLog] ${entry.action}: ${entry.message}`, entry.details)
  }

  private persistToLocal(): void {
    if (typeof window === 'undefined') return

    try {
      const key = `alquimia.audit_log_${this.tenantId || 'local'}`
      localStorage.setItem(key, JSON.stringify(this.entries))
    } catch {
      // localStorage quota exceeded or unavailable
    }
  }

  private startAutoSync(): void {
    this.syncInterval = setInterval(() => {
      void this.syncToBackend()
    }, this.autoSyncInterval)
  }

  private async syncToBackend(): Promise<void> {
    if (this.isSyncing || this.entries.length === 0) return

    this.isSyncing = true
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      if (this.tenantId) {
        headers['x-tenant-id'] = this.tenantId
      }

      const url = `${getApiUrl()}/audit-logs/batch`
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          entries: this.entries.map(e => ({
            ...e,
            timestamp: e.timestamp.toISOString(),
          })),
        }),
      })

      if (response.ok) {
        this.entries = [] // Clear after successful sync
        this.persistToLocal()
      } else {
        console.warn('[AuditLog] Sync failed, entries retained for retry')
      }
    } catch (e) {
      console.warn('[AuditLog] Failed to sync to backend:', e)
      // Keep entries for retry
    } finally {
      this.isSyncing = false
    }
  }

  async flush(): Promise<void> {
    await this.syncToBackend()
  }

  getEntries(): AuditLogEntry[] {
    return [...this.entries]
  }

  clear(): void {
    this.entries = []
    this.persistToLocal()
  }

  destroy(): void {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
  }
}

/**
 * Main audit logger
 */
export class AuditLogger {
  private buffer: AuditLogBuffer
  private sessionId: string
  private actorId: string

  constructor(actorId: string, tenantId?: string) {
    this.actorId = actorId
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.buffer = new AuditLogBuffer(tenantId)
  }

  /**
   * Log a successful operation
   */
  logSuccess(
    action: AuditAction,
    message: string,
    options?: {
      duration?: number
      resource?: AuditLogEntry['resource']
      context?: AuditLogEntry['context']
      details?: Record<string, unknown>
    }
  ): void {
    this.log(action, message, true, options)
  }

  /**
   * Log a failed operation
   */
  logFailure(
    action: AuditAction,
    message: string,
    options?: {
      duration?: number
      resource?: AuditLogEntry['resource']
      context?: AuditLogEntry['context']
      details?: Record<string, unknown>
    }
  ): void {
    this.log(action, message, false, options)
  }

  /**
   * Log a permission denied event
   */
  logPermissionDenied(
    resource: string,
    action: string,
    context?: AuditLogEntry['context']
  ): void {
    this.log('permission_denied', `Attempted ${action} on ${resource} without permission`, false, {
      context,
      details: { resource, action },
    })
  }

  /**
   * Log a validation failure
   */
  logValidationFailure(
    resource: string,
    errors: Array<{ field: string; message: string }>,
    context?: AuditLogEntry['context']
  ): void {
    this.log('validation_failed', `Validation failed for ${resource}`, false, {
      context,
      details: { errors },
    })
  }

  /**
   * Log an error
   */
  logError(
    message: string,
    error: unknown,
    context?: AuditLogEntry['context']
  ): void {
    this.log('error_occurred', message, false, {
      context,
      details: {
        errorMessage: error instanceof Error ? error.message : String(error),
        errorStack: error instanceof Error ? error.stack : undefined,
      },
    })
  }

  /**
   * Log offline operation (queued for retry)
   */
  logOfflineOperation(
    action: AuditAction,
    message: string,
    context?: AuditLogEntry['context']
  ): void {
    this.log(action, `[OFFLINE] ${message}`, false, {
      context,
      details: { offline: true },
    })
  }

  /**
   * Generic log method
   */
  private log(
    action: AuditAction,
    message: string,
    success: boolean,
    options?: {
      duration?: number
      resource?: AuditLogEntry['resource']
      context?: AuditLogEntry['context']
      details?: Record<string, unknown>
    }
  ): void {
    const entry: AuditLogEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      action,
      actor: this.actorId,
      timestamp: new Date(),
      success,
      message,
      duration: options?.duration,
      resource: options?.resource,
      context: {
        sessionId: this.sessionId,
        ...options?.context,
      },
      details: options?.details,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined,
      source: 'frontend',
      severity: success ? 'info' : action === 'error_occurred' ? 'error' : 'warning',
    }

    this.buffer.add(entry)
  }

  /**
   * Flush logs to backend
   */
  async flush(): Promise<void> {
    await this.buffer.flush()
  }

  /**
   * Get all buffered entries
   */
  getEntries(): AuditLogEntry[] {
    return this.buffer.getEntries()
  }

  /**
   * Clear local buffer
   */
  clear(): void {
    this.buffer.clear()
  }

  /**
   * Cleanup
   */
  destroy(): void {
    void this.flush()
    this.buffer.destroy()
  }
}

// Global instance will be created when user is authenticated
let globalAuditLogger: AuditLogger | null = null

export function initializeAuditLogger(userId: string, tenantId?: string): AuditLogger {
  if (globalAuditLogger) {
    globalAuditLogger.destroy()
  }
  globalAuditLogger = new AuditLogger(userId, tenantId)
  return globalAuditLogger
}

export function getAuditLogger(): AuditLogger | null {
  return globalAuditLogger
}

export function logAudit(
  action: AuditAction,
  message: string,
  success: boolean = true,
  options?: Parameters<AuditLogger['log']>[3]
): void {
  if (!globalAuditLogger) {
    console.warn('[AuditLog] Logger not initialized, discarding log entry')
    return
  }

  if (success) {
    globalAuditLogger.logSuccess(action, message, options)
  } else {
    globalAuditLogger.logFailure(action, message, options)
  }
}
