'use client'

/**
 * Simulation Control Panel
 * Complete UI for all simulation operations: save, load, export, offline mode
 * Production-ready component with full feature integration
 */

import { useState, useRef, useEffect } from 'react'
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
  Copy,
  Trash2,
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
import { SimulationVersionTimeline } from '@/components/simulator/SimulationVersionTimeline'
import { SimulationHelp } from '@/components/simulator/SimulationHelp'
import { SimulationActivityLog } from '@/components/simulator/SimulationActivityLog'
import { SimulationStats } from '@/components/simulator/SimulationStats'
import { SimulationContextMenu } from '@/components/simulator/SimulationContextMenu'
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
  const [searchQuery, setSearchQuery] = useState('')
  const [duplicating, setDuplicating] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [selectedForExport, setSelectedForExport] = useState<Set<string>>(new Set())
  const [showBulkExport, setShowBulkExport] = useState(false)
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'name'>('recent')

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad|iPod/.test(navigator.platform)
      const isCtrlOrCmd = isMac ? e.metaKey : e.ctrlKey

      if (!isCtrlOrCmd) return

      switch (e.key.toLowerCase()) {
        case 's':
          e.preventDefault()
          setShowSaveDialog(true)
          break
        case 'o':
          e.preventDefault()
          setShowLoadDialog(true)
          void loadSimulationsList()
          break
        case 'e':
          e.preventDefault()
          setShowExportMenu(!showExportMenu)
          break
        case '?':
          e.preventDefault()
          // Open help - would need to pass ref to help button
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showExportMenu, loadSimulationsList])

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

  const handleDuplicateSimulation = async (simId: string) => {
    setDuplicating(simId)
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      if (tenantId) {
        headers['x-tenant-id'] = tenantId
      }

      const response = await fetch(`/api/simulations/${encodeURIComponent(simId)}/duplicate`, {
        method: 'POST',
        headers,
      })

      if (!response.ok) {
        throw new Error('Failed to duplicate simulation')
      }

      await loadSimulationsList()
    } catch (e) {
      console.error('Duplication failed:', e)
    } finally {
      setDuplicating(null)
    }
  }

  const handleDeleteSimulation = async (simId: string) => {
    if (!confirm('Are you sure you want to delete this simulation? This action cannot be undone.')) {
      return
    }

    setDeleting(simId)
    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      if (tenantId) {
        headers['x-tenant-id'] = tenantId
      }

      const response = await fetch(`/api/simulations/${encodeURIComponent(simId)}`, {
        method: 'DELETE',
        headers,
      })

      if (!response.ok) {
        throw new Error('Failed to delete simulation')
      }

      await loadSimulationsList()
      if (currentSimulationId === simId) {
        // TODO: Reset current simulation
      }
    } catch (e) {
      console.error('Deletion failed:', e)
    } finally {
      setDeleting(null)
    }
  }

  const handleBulkExport = () => {
    if (selectedForExport.size === 0) return

    const selectedSims = simulations.filter(s => selectedForExport.has(s.id))
    const bulkData = {
      exportDate: new Date().toISOString(),
      simulations: selectedSims.map(sim => ({
        id: sim.id,
        name: sim.name,
        description: sim.description,
        createdAt: sim.createdAt,
        updatedAt: sim.updatedAt,
      })),
      count: selectedSims.length,
    }

    const dataStr = JSON.stringify(bulkData, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `simulations-export-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)

    setSelectedForExport(new Set())
    setShowBulkExport(false)
  }

  const toggleSimulationSelection = (simId: string) => {
    const newSelected = new Set(selectedForExport)
    if (newSelected.has(simId)) {
      newSelected.delete(simId)
    } else {
      newSelected.add(simId)
    }
    setSelectedForExport(newSelected)
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
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-[#1C1B18]">Simulation Management</h3>
            <SimulationHelp />
          </div>
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

      {/* Statistics */}
      <SimulationStats tenantId={tenantId} />

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
        <div className="space-y-3 rounded-lg bg-[#FDFCFA] p-4 border border-[#E8E4DC]">
          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Search simulations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="flex-1 rounded-lg border border-[#E8E4DC] px-3 py-2 text-sm focus:border-[#3B6D11] focus:outline-none"
            />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as typeof sortBy)}
              className="rounded-lg border border-[#E8E4DC] px-3 py-2 text-xs focus:border-[#3B6D11] focus:outline-none bg-white"
            >
              <option value="recent">Recent</option>
              <option value="oldest">Oldest</option>
              <option value="name">Name (A-Z)</option>
            </select>
            {selectedForExport.size > 0 && (
              <button
                onClick={() => setShowBulkExport(!showBulkExport)}
                className="px-3 py-2 rounded-lg bg-blue-50 border border-blue-200 text-xs font-medium text-blue-700 hover:bg-blue-100"
              >
                Export {selectedForExport.size}
              </button>
            )}
          </div>

          {searchQuery && (
            <p className="text-xs text-[#6B6760] px-1">
              Found {simulations.filter(sim =>
                sim.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sim.description?.toLowerCase().includes(searchQuery.toLowerCase())
              ).length} simulation{simulations.filter(sim =>
                sim.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                sim.description?.toLowerCase().includes(searchQuery.toLowerCase())
              ).length !== 1 ? 's' : ''}
            </p>
          )}

          <div className="max-h-60 overflow-y-auto">
            {loadingSimulations ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
              </div>
            ) : simulations.length === 0 ? (
              <p className="text-sm text-gray-500">No saved simulations yet.</p>
            ) : simulations.filter(sim =>
              sim.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
              sim.description?.toLowerCase().includes(searchQuery.toLowerCase())
            ).length === 0 ? (
              <p className="text-sm text-gray-500">No simulations match your search.</p>
            ) : (
              <div className="space-y-2">
                {simulations
                  .filter(sim =>
                    sim.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    sim.description?.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .sort((a, b) => {
                    if (sortBy === 'recent') {
                      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                    } else if (sortBy === 'oldest') {
                      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
                    } else if (sortBy === 'name') {
                      return a.name.localeCompare(b.name)
                    }
                    return 0
                  })
                  .map(sim => (
                    <div
                      key={sim.id}
                      className={cn(
                        'rounded-lg border p-3 transition-colors',
                        selectedForExport.has(sim.id)
                          ? 'bg-blue-50 border-blue-200'
                          : currentSimulationId === sim.id
                          ? 'bg-green-50 border-green-200'
                          : 'bg-white border-[#E8E4DC]'
                      )}
                    >
                      <div className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={selectedForExport.has(sim.id)}
                          onChange={() => toggleSimulationSelection(sim.id)}
                          className="mt-1"
                        />
                        <button
                          onClick={() => {
                            handleLoadClick(sim.id)
                            setSearchQuery('')
                          }}
                          className="flex-1 text-left hover:opacity-80"
                        >
                          <p className="font-medium text-[#1C1B18] text-sm">{sim.name}</p>
                          {sim.description && (
                            <p className="text-xs text-[#6B6760] line-clamp-1">{sim.description}</p>
                          )}
                          <div className="flex gap-3 text-xs text-[#8E8980] mt-1 flex-wrap">
                            {(sim.municipios as string[])?.length > 0 && (
                              <span>📍 {(sim.municipios as string[]).length} municipio{(sim.municipios as string[]).length !== 1 ? 's' : ''}</span>
                            )}
                            {(sim.horizonte as number) > 0 && (
                              <span>📅 {sim.horizonte}y horizon</span>
                            )}
                            <span>{new Date(sim.updatedAt).toLocaleDateString()}</span>
                          </div>
                        </button>
                        <SimulationContextMenu
                          simulationId={sim.id}
                          simulationName={sim.name}
                          onDuplicate={handleDuplicateSimulation}
                          onDelete={handleDeleteSimulation}
                          onExport={() => handleExportJSON()}
                          disabled={duplicating === sim.id || deleting === sim.id}
                        />
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {showBulkExport && selectedForExport.size > 0 && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 space-y-2">
              <p className="text-xs font-medium text-blue-900">
                Export {selectedForExport.size} simulation{selectedForExport.size !== 1 ? 's' : ''}?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handleBulkExport}
                  className="flex-1 rounded-lg bg-blue-600 text-white px-3 py-1.5 text-xs font-medium hover:bg-blue-700"
                >
                  Export
                </button>
                <button
                  onClick={() => setShowBulkExport(false)}
                  className="flex-1 rounded-lg bg-white border border-blue-200 text-blue-700 px-3 py-1.5 text-xs font-medium hover:bg-blue-50"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <button
            onClick={() => {
              setShowLoadDialog(false)
              setSearchQuery('')
              setSelectedForExport(new Set())
              setShowBulkExport(false)
            }}
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

      {/* Version history and timeline */}
      {currentSimulationId && (
        <SimulationVersionTimeline
          simulationId={currentSimulationId}
          tenantId={simulations.find(s => s.id === currentSimulationId)?.tenantId}
        />
      )}

      {/* Activity log */}
      {currentSimulationId && (
        <SimulationActivityLog
          simulationId={currentSimulationId}
          tenantId={simulations.find(s => s.id === currentSimulationId)?.tenantId}
          maxEntries={20}
        />
      )}
    </div>
  )
}
