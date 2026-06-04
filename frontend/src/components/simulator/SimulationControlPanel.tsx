'use client'

/**
 * Simulation Control Panel
 * Complete UI for all simulation operations: save, load, export, offline mode
 * Production-ready component with full feature integration
 */

import { useState, useRef } from 'react'
import {
  Save,
  Upload,
  Download,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Wifi,
  WifiOff,
  Clock,
  Eye,
} from 'lucide-react'
import { useSimulationPersistenceV2 } from '@/hooks/useSimulationPersistenceV2'
import { useSimulatorStore } from '@/store/simulatorStore'
import {
  downloadJSON,
  downloadCSV,
  importFromJSON,
  readFileContents,
} from '@/lib/dataExportImport'
import { ReportGenerator } from '@/components/simulator/ReportGenerator'
import { cn } from '@/lib/utils'

interface SimulationControlPanelProps {
  tenantId?: string
  className?: string
}

export function SimulationControlPanel({ tenantId, className }: SimulationControlPanelProps) {
  const {
    saveStatus,
    error,
    validationErrors,
    lastSaveTime,
    currentSimulationId,
    loadingSimulations,
    isOnline,
    pendingOperations,
    saveCurrentSimulation,
    loadCurrentSimulation,
    loadSimulationsList,
    flushPendingOperations,
    clearError,
    simulations,
  } = useSimulationPersistenceV2({ tenantId, autoSaveInterval: 30000 })

  const simulatorState = useSimulatorStore()
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Local UI state
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [showExportMenu, setShowExportMenu] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveDescription, setSaveDescription] = useState('')
  const [importError, setImportError] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)

  // Save handlers
  const handleSaveClick = async () => {
    try {
      await saveCurrentSimulation(saveName, saveDescription)
      setSaveName('')
      setSaveDescription('')
      setShowSaveDialog(false)
      await loadSimulationsList()
    } catch {
      // Error handled by hook
    }
  }

  const handleLoadClick = async (simId: string) => {
    try {
      await loadCurrentSimulation(simId)
      setShowLoadDialog(false)
    } catch {
      // Error handled by hook
    }
  }

  // Export handlers
  const handleExportJSON = () => {
    downloadJSON(simulatorState, undefined, {
      simulationName: simulations.find(s => s.id === currentSimulationId)?.name,
      simulationId: currentSimulationId || undefined,
    })
    setShowExportMenu(false)
  }

  const handleExportCSV = () => {
    downloadCSV(simulatorState, undefined, {
      simulationName: simulations.find(s => s.id === currentSimulationId)?.name,
      simulationId: currentSimulationId || undefined,
    })
    setShowExportMenu(false)
  }

  // Import handler
  const handleImport = async (file: File) => {
    setImporting(true)
    setImportError(null)

    try {
      const contents = await readFileContents(file)
      const result = importFromJSON(contents, true)

      if (!result.valid || !result.state) {
        setImportError(result.errors.join('; '))
        return
      }

      // Apply imported state
      Object.entries(result.state).forEach(([key, value]) => {
        const stateKey = key as keyof typeof simulatorState
        if (stateKey in simulatorState) {
          simulatorState[stateKey] = value as never
        }
      })

      // Save the imported state
      await saveCurrentSimulation(`Imported-${file.name}`, `Imported from ${file.name}`)
      setImportError(null)
    } catch (e) {
      setImportError(e instanceof Error ? e.message : 'Import failed')
    } finally {
      setImporting(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className={cn('space-y-4 rounded-lg border border-[#E8E4DC] bg-white p-5', className)}>
      {/* Header with status indicators */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="font-semibold text-[#1C1B18]">Simulation Management</h3>
          <p className="text-xs text-[#6B6760] mt-1">Save, load, export, and backup your simulations</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Online/Offline indicator */}
          <div className={cn('flex items-center gap-2 px-3 py-2 rounded-lg border text-xs', isOnline ? 'bg-green-50 border-green-200 text-green-700' : 'bg-amber-50 border-amber-200 text-amber-700')}>
            {isOnline ? (
              <>
                <Wifi className="h-4 w-4" />
                <span>Online</span>
              </>
            ) : (
              <>
                <WifiOff className="h-4 w-4" />
                <span>Offline ({pendingOperations} pending)</span>
              </>
            )}
          </div>

          {/* Auto-save status */}
          {saveStatus === 'saving' && (
            <div className="flex items-center gap-2 text-xs text-amber-600 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="flex items-center gap-2 text-xs text-green-600 px-3 py-2 rounded-lg bg-green-50 border border-green-200">
              <CheckCircle2 className="h-4 w-4" />
              <span>Saved</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 text-xs text-red-600 px-3 py-2 rounded-lg bg-red-50 border border-red-200">
              <AlertCircle className="h-4 w-4" />
              <span>Error</span>
            </div>
          )}
        </div>
      </div>

      {/* Last save time */}
      {lastSaveTime && (
        <div className="text-xs text-[#6B6760] flex items-center gap-2 px-3 py-2 bg-[#FDFCFA] rounded border border-[#E8E4DC]">
          <Clock className="h-3 w-3" />
          Last saved: {lastSaveTime.toLocaleTimeString()}
        </div>
      )}

      {/* Error display */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">{error}</p>
            <button
              onClick={clearError}
              className="mt-2 text-xs text-red-700 underline hover:text-red-900"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Validation errors */}
      {validationErrors.length > 0 && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="font-medium text-sm text-amber-900 mb-2">Validation Issues:</p>
          <ul className="text-xs text-amber-800 space-y-1">
            {validationErrors.slice(0, 3).map((err, i) => (
              <li key={i}>
                <strong>{err.field}:</strong> {err.message}
              </li>
            ))}
            {validationErrors.length > 3 && (
              <li>... and {validationErrors.length - 3} more issues</li>
            )}
          </ul>
        </div>
      )}

      {/* Import error */}
      {importError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-sm font-medium text-red-900 mb-1">Import Failed</p>
          <p className="text-xs text-red-700">{importError}</p>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setShowSaveDialog(!showSaveDialog)}
          disabled={saveStatus === 'saving'}
          className="inline-flex items-center gap-2 rounded-lg border border-[#3B6D11] bg-[#3B6D11] px-4 py-2 text-sm font-medium text-white hover:bg-[#2D5409] disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          Save
        </button>

        <button
          onClick={() => {
            setShowLoadDialog(!showLoadDialog)
            void loadSimulationsList()
          }}
          disabled={loadingSimulations}
          className="inline-flex items-center gap-2 rounded-lg border border-[#E8E4DC] bg-white px-4 py-2 text-sm font-medium text-[#1C1B18] hover:border-[#3B6D11] disabled:opacity-50"
        >
          <Upload className="h-4 w-4" />
          Load
        </button>

        <div className="relative">
          <button
            onClick={() => setShowExportMenu(!showExportMenu)}
            className="inline-flex items-center gap-2 rounded-lg border border-[#E8E4DC] bg-white px-4 py-2 text-sm font-medium text-[#1C1B18] hover:border-[#3B6D11]"
          >
            <Download className="h-4 w-4" />
            Export
          </button>
          {showExportMenu && (
            <div className="absolute top-full right-0 mt-2 rounded-lg border border-[#E8E4DC] bg-white shadow-lg z-10 min-w-40">
              <button
                onClick={handleExportJSON}
                className="block w-full text-left px-4 py-2 text-sm text-[#1C1B18] hover:bg-[#F4F2ED]"
              >
                Export as JSON
              </button>
              <button
                onClick={handleExportCSV}
                className="block w-full text-left px-4 py-2 text-sm text-[#1C1B18] hover:bg-[#F4F2ED] border-t border-[#E8E4DC]"
              >
                Export as CSV
              </button>
            </div>
          )}
        </div>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={importing}
          className="inline-flex items-center gap-2 rounded-lg border border-[#E8E4DC] bg-white px-4 py-2 text-sm font-medium text-[#1C1B18] hover:border-[#3B6D11] disabled:opacity-50"
        >
          {importing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" />
              Import
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={e => {
            const file = e.target.files?.[0]
            if (file) void handleImport(file)
          }}
          className="hidden"
        />

        {!isOnline && pendingOperations > 0 && (
          <button
            onClick={() => void flushPendingOperations()}
            className="inline-flex items-center gap-2 rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
          >
            <Eye className="h-4 w-4" />
            Sync ({pendingOperations})
          </button>
        )}
      </div>

      {/* Save dialog */}
      {showSaveDialog && (
        <div className="space-y-3 rounded-lg bg-[#FDFCFA] p-4 border border-[#E8E4DC]">
          <div>
            <label className="block text-sm font-medium text-[#6B6760]">Simulation Name</label>
            <input
              type="text"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              placeholder="e.g., Baseline 2024"
              className="mt-1 w-full rounded-lg border border-[#E8E4DC] px-3 py-2 text-sm focus:border-[#3B6D11] focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#6B6760]">Description (optional)</label>
            <textarea
              value={saveDescription}
              onChange={e => setSaveDescription(e.target.value)}
              placeholder="Add notes about this simulation..."
              className="mt-1 w-full rounded-lg border border-[#E8E4DC] px-3 py-2 text-sm focus:border-[#3B6D11] focus:outline-none"
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveClick}
              disabled={!saveName || saveStatus === 'saving'}
              className="flex-1 rounded-lg bg-[#3B6D11] px-4 py-2 text-sm font-medium text-white hover:bg-[#2D5409] disabled:opacity-50"
            >
              Save
            </button>
            <button
              onClick={() => setShowSaveDialog(false)}
              className="flex-1 rounded-lg border border-[#E8E4DC] bg-white px-4 py-2 text-sm font-medium text-[#1C1B18] hover:bg-[#F4F2ED]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Load dialog */}
      {showLoadDialog && (
        <div className="space-y-3 rounded-lg bg-[#FDFCFA] p-4 border border-[#E8E4DC] max-h-60 overflow-y-auto">
          {loadingSimulations ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : simulations.length === 0 ? (
            <p className="text-sm text-gray-500">No saved simulations yet.</p>
          ) : (
            <div className="space-y-2">
              {simulations.map(sim => (
                <button
                  key={sim.id}
                  onClick={() => handleLoadClick(sim.id)}
                  className={cn(
                    'w-full rounded-lg border p-3 text-left transition-colors text-sm',
                    currentSimulationId === sim.id
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-[#E8E4DC] hover:bg-[#F4F2ED]'
                  )}
                >
                  <p className="font-medium text-[#1C1B18]">{sim.name}</p>
                  {sim.description && (
                    <p className="text-xs text-[#6B6760] line-clamp-1">{sim.description}</p>
                  )}
                  <p className="text-xs text-[#8E8980] mt-1">
                    {new Date(sim.updatedAt).toLocaleString()}
                  </p>
                </button>
              ))}
            </div>
          )}
          <button
            onClick={() => setShowLoadDialog(false)}
            className="w-full rounded-lg border border-[#E8E4DC] bg-white px-4 py-2 text-sm font-medium text-[#1C1B18] hover:bg-[#F4F2ED]"
          >
            Close
          </button>
        </div>
      )}

      {/* Active simulation info */}
      {currentSimulationId && (
        <div className="text-xs text-[#6B6760] bg-green-50 border border-green-200 rounded px-3 py-2">
          <span className="font-medium">Active Simulation:</span>{' '}
          {simulations.find(s => s.id === currentSimulationId)?.name || currentSimulationId}
        </div>
      )}

      {/* Report generation */}
      {currentSimulationId && (
        <ReportGenerator
          simulationId={currentSimulationId}
          simulationName={simulations.find(s => s.id === currentSimulationId)?.name || 'Simulation'}
          tenantId={simulations.find(s => s.id === currentSimulationId)?.tenantId}
        />
      )}
    </div>
  )
}
