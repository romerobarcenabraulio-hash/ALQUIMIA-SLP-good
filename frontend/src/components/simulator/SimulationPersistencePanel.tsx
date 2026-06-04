'use client'

import { useState, useEffect } from 'react'
import { Check, Clock, Download, Save, Trash2, AlertCircle, Loader2, Upload } from 'lucide-react'
import { useSimulationPersistence } from '@/hooks/useSimulationPersistence'
import { cn } from '@/lib/utils'

interface SimulationPersistencePanelProps {
  tenantId?: string
  autoSaveInterval?: number
}

export function SimulationPersistencePanel({ tenantId, autoSaveInterval = 30000 }: SimulationPersistencePanelProps) {
  const {
    saveStatus,
    error,
    lastSaveTime,
    currentSimulationId,
    loadingSimulations,
    simulations,
    saveCurrentSimulation,
    loadCurrentSimulation,
    loadSimulationsList,
    deleteCurrentSimulation,
    clearError,
  } = useSimulationPersistence({ tenantId, autoSaveInterval })

  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [showLoadDialog, setShowLoadDialog] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveDescription, setSaveDescription] = useState('')

  useEffect(() => {
    void loadSimulationsList()
  }, [loadSimulationsList])

  const handleSaveClick = async () => {
    try {
      await saveCurrentSimulation(saveName, saveDescription)
      setSaveName('')
      setSaveDescription('')
      setShowSaveDialog(false)
      await loadSimulationsList()
    } catch {
      // Error is handled in hook
    }
  }

  const handleLoadClick = async (simulationId: string) => {
    try {
      await loadCurrentSimulation(simulationId)
      setShowLoadDialog(false)
    } catch {
      // Error is handled in hook
    }
  }

  const handleDeleteClick = async (simulationId: string) => {
    if (window.confirm('Delete this simulation permanently?')) {
      try {
        if (currentSimulationId === simulationId) {
          await deleteCurrentSimulation()
        } else {
          // Delete without making it current
          await loadSimulationsList()
        }
      } catch {
        // Error is handled in hook
      }
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-[#E8E4DC] bg-white p-4">
      {/* Status Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          {saveStatus === 'saving' && (
            <div className="flex items-center gap-2 text-sm text-amber-600">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Saving...</span>
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="flex items-center gap-2 text-sm text-green-600">
              <Check className="h-4 w-4" />
              <span>Saved</span>
            </div>
          )}
          {saveStatus === 'error' && (
            <div className="flex items-center gap-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              <span>Save failed</span>
            </div>
          )}
          {saveStatus === 'idle' && lastSaveTime && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="h-4 w-4" />
              <span>Last saved: {lastSaveTime.toLocaleTimeString()}</span>
            </div>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowSaveDialog(!showSaveDialog)}
            disabled={saveStatus === 'saving'}
            className="inline-flex items-center gap-2 rounded-lg border border-[#3B6D11] bg-[#3B6D11] px-3 py-2 text-sm font-medium text-white hover:bg-[#2D5409] disabled:opacity-50"
          >
            <Save className="h-4 w-4" />
            Save
          </button>
          <button
            onClick={() => setShowLoadDialog(!showLoadDialog)}
            disabled={loadingSimulations}
            className="inline-flex items-center gap-2 rounded-lg border border-[#E8E4DC] bg-white px-3 py-2 text-sm font-medium text-[#1C1B18] hover:border-[#3B6D11] disabled:opacity-50"
          >
            <Upload className="h-4 w-4" />
            Load
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3">
          <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-900">{error}</p>
            <button
              onClick={clearError}
              className="mt-1 text-xs text-red-700 hover:text-red-900 underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Save Dialog */}
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

      {/* Load Dialog */}
      {showLoadDialog && (
        <div className="space-y-3 rounded-lg bg-[#FDFCFA] p-4 border border-[#E8E4DC]">
          <p className="text-sm font-medium text-[#6B6760]">Your Simulations</p>
          {loadingSimulations ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
            </div>
          ) : simulations.length === 0 ? (
            <p className="text-sm text-gray-500">No saved simulations yet.</p>
          ) : (
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {simulations.map(sim => (
                <div
                  key={sim.id}
                  className={cn(
                    'rounded-lg border p-3 cursor-pointer transition-colors',
                    currentSimulationId === sim.id
                      ? 'bg-green-50 border-green-200'
                      : 'bg-white border-[#E8E4DC] hover:bg-[#F4F2ED]'
                  )}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[#1C1B18] truncate">{sim.name}</p>
                      {sim.description && (
                        <p className="text-xs text-[#6B6760] line-clamp-1">{sim.description}</p>
                      )}
                      <p className="text-xs text-[#8E8980] mt-1">
                        Updated: {new Date(sim.updatedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button
                        onClick={() => handleLoadClick(sim.id)}
                        className="p-2 rounded text-[#3B6D11] hover:bg-green-100"
                        title="Load"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                      {sim.canEdit && (
                        <button
                          onClick={() => handleDeleteClick(sim.id)}
                          className="p-2 rounded text-red-600 hover:bg-red-100"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
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

      {/* Current Simulation Info */}
      {currentSimulationId && (
        <div className="text-xs text-[#6B6760] bg-green-50 border border-green-200 rounded px-3 py-2">
          <span className="font-medium">Active Simulation:</span> {simulations.find(s => s.id === currentSimulationId)?.name || currentSimulationId}
        </div>
      )}
    </div>
  )
}
