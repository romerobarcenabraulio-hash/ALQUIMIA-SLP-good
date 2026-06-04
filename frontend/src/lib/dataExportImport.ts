/**
 * Data Export/Import System
 * Enables data backup, portability, and recovery
 * Critical feature for data ownership and compliance
 */

import { type SimulatorState } from '@/types'
import { serializeSimulatorState } from '@/lib/simulationPersistence'
import { validateLoadedState, detectCorruption } from '@/lib/stateValidation'
import { logAudit } from '@/lib/auditLog'

export interface ExportFormat {
  version: string
  timestamp: string
  format: 'json' | 'csv' | 'xlsx'
  metadata: {
    simulationId?: string
    simulationName?: string
    municipios: string[]
    horizonte: number
    exportedBy: string
    exportedAt: string
  }
}

export interface ExportPackage extends ExportFormat {
  data: Record<string, unknown>
  checksum: string
}

/**
 * Calculate checksum for data integrity verification
 */
function calculateChecksum(data: Record<string, unknown>): string {
  const json = JSON.stringify(data)
  let hash = 0
  for (let i = 0; i < json.length; i++) {
    const char = json.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16)
}

/**
 * Export simulation state as JSON
 */
export function exportAsJSON(
  state: Partial<SimulatorState>,
  metadata?: { simulationId?: string; simulationName?: string; exportedBy?: string }
): ExportPackage {
  const serialized = serializeSimulatorState(state)
  const checksum = calculateChecksum(serialized)

  const exportPackage: ExportPackage = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    format: 'json',
    metadata: {
      simulationId: metadata?.simulationId,
      simulationName: metadata?.simulationName,
      municipios: (state.municipiosActivos || []) as string[],
      horizonte: (state.horizonte || 0) as number,
      exportedBy: metadata?.exportedBy || 'unknown',
      exportedAt: new Date().toISOString(),
    },
    data: serialized,
    checksum,
  }

  logAudit('export_generated', `Exported simulation as JSON`, true, {
    resource: {
      type: 'export',
      id: metadata?.simulationId || 'local',
      name: metadata?.simulationName,
    },
    details: { format: 'json', size: JSON.stringify(exportPackage).length },
  })

  return exportPackage
}

/**
 * Export as CSV (for spreadsheet analysis)
 */
export function exportAsCSV(
  state: Partial<SimulatorState>,
  metadata?: { simulationId?: string; simulationName?: string; exportedBy?: string }
): string {
  const lines: string[] = []

  // Header with metadata
  lines.push('# ALQUIMIA Simulation Export')
  lines.push(`# Simulation: ${metadata?.simulationName || 'Unnamed'}`)
  lines.push(`# Exported: ${new Date().toISOString()}`)
  lines.push(`# Exported By: ${metadata?.exportedBy || 'unknown'}`)
  lines.push('')

  // Simulation parameters
  lines.push('PARAMETER,VALUE')
  lines.push(`Horizonte,${state.horizonte || ''}`)
  lines.push(`Municipalities,"${(state.municipiosActivos || []).join('; ')}"`)
  lines.push(`Preset Trajectory,${state.presetTrayectoria || ''}`)
  lines.push('')

  // Capture percentages by year
  if (state.pctCapturaPorAño && state.pctCapturaPorAño.length > 0) {
    lines.push('YEAR,CAPTURE_PERCENTAGE')
    state.pctCapturaPorAño.forEach((pct, year) => {
      lines.push(`${year},${pct}`)
    })
    lines.push('')
  }

  // Material prices
  if (state.preciosMaterial) {
    lines.push('MATERIAL,PRICE_MXN')
    Object.entries(state.preciosMaterial).forEach(([material, price]) => {
      lines.push(`${material},${price}`)
    })
    lines.push('')
  }

  // Results if available
  if (state.resultados) {
    lines.push('RESULT_KEY,VALUE')
    Object.entries(state.resultados).forEach(([key, value]) => {
      const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value)
      lines.push(`"${key}","${stringValue}"`)
    })
  }

  logAudit('export_generated', `Exported simulation as CSV`, true, {
    resource: {
      type: 'export',
      id: metadata?.simulationId || 'local',
      name: metadata?.simulationName,
    },
    details: { format: 'csv', lines: lines.length },
  })

  return lines.join('\n')
}

/**
 * Import and validate data from JSON export
 */
export function importFromJSON(
  jsonString: string,
  validateStrict: boolean = true
): { valid: boolean; state: Record<string, unknown> | null; errors: string[] } {
  const errors: string[] = []

  try {
    // 1. Parse JSON
    const parsed = JSON.parse(jsonString) as ExportPackage

    // 2. Validate structure
    if (!parsed.data || !parsed.metadata || !parsed.checksum) {
      errors.push('Invalid export format: missing required fields')
      logAudit('import_processed', `Import failed: invalid format`, false, {
        details: { error: 'Invalid export format' },
      })
      return { valid: false, state: null, errors }
    }

    // 3. Verify checksum
    const expectedChecksum = calculateChecksum(parsed.data)
    if (expectedChecksum !== parsed.checksum) {
      errors.push('Data integrity check failed: checksum mismatch')
      logAudit('import_processed', `Import failed: checksum mismatch`, false)
      return { valid: false, state: null, errors }
    }

    // 4. Validate state
    if (validateStrict) {
      const validation = validateLoadedState(parsed.data)
      if (!validation.valid) {
        errors.push(...validation.errors.map(e => `${e.field}: ${e.message}`))
      }
    }

    // 5. Check for corruption
    const corruption = detectCorruption(parsed.data)
    if (corruption.length > 0) {
      errors.push(...corruption.map(c => `Corruption: ${c.message}`))
    }

    const isValid = errors.length === 0

    logAudit('import_processed', `Imported simulation from JSON`, isValid, {
      resource: {
        type: 'import',
        id: parsed.metadata.simulationId || 'local',
        name: parsed.metadata.simulationName,
      },
      details: { errors: errors.length > 0 ? errors : undefined },
    })

    return {
      valid: isValid,
      state: isValid ? parsed.data : null,
      errors,
    }
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e)
    errors.push(`Failed to parse JSON: ${error}`)
    logAudit('import_processed', `Import failed: JSON parse error`, false, {
      details: { error },
    })
    return { valid: false, state: null, errors }
  }
}

/**
 * Generate download link for JSON export
 */
export function downloadJSON(
  state: Partial<SimulatorState>,
  filename?: string,
  metadata?: { simulationId?: string; simulationName?: string; exportedBy?: string }
): void {
  const exportPackage = exportAsJSON(state, metadata)
  const json = JSON.stringify(exportPackage, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename || `simulation-${Date.now()}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Generate download link for CSV export
 */
export function downloadCSV(
  state: Partial<SimulatorState>,
  filename?: string,
  metadata?: { simulationId?: string; simulationName?: string; exportedBy?: string }
): void {
  const csv = exportAsCSV(state, metadata)
  const blob = new Blob([csv], { type: 'text/csv' })
  const url = URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename || `simulation-${Date.now()}.csv`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Read file from disk and return contents
 */
export async function readFileContents(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = e => resolve(e.target?.result as string)
    reader.onerror = () => reject(new Error('Failed to read file'))
    reader.readAsText(file)
  })
}

/**
 * Create a backup ZIP file (requires additional library)
 * This is a placeholder for future enhancement
 */
export function createBackupZip(
  state: Partial<SimulatorState>,
  auditLogs?: Record<string, unknown>[]
): Blob {
  // TODO: Implement ZIP creation when needed
  // For now, just export JSON
  const exportPackage = exportAsJSON(state)
  return new Blob([JSON.stringify(exportPackage, null, 2)], { type: 'application/json' })
}

/**
 * Compare two exported states to identify differences
 */
export function compareExports(
  export1: ExportPackage,
  export2: ExportPackage
): { differences: Array<{ field: string; value1: unknown; value2: unknown }> } {
  const differences: Array<{ field: string; value1: unknown; value2: unknown }> = []

  // Compare all keys
  const allKeys = new Set([
    ...Object.keys(export1.data),
    ...Object.keys(export2.data),
  ])

  allKeys.forEach(key => {
    const val1 = export1.data[key]
    const val2 = export2.data[key]

    if (JSON.stringify(val1) !== JSON.stringify(val2)) {
      differences.push({ field: key, value1: val1, value2: val2 })
    }
  })

  return { differences }
}
