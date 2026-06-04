'use client'

import { useState } from 'react'
import {
  Search,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Users,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Download,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getApiUrl } from '@/lib/api'
import { useAdminMasterTable } from '@/hooks/useAdminMasterTable'

interface AdminMasterTableProps {
  onRowClick?: (tenantId: string) => void
  className?: string
}

const ETAPA_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  validation: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Validación' },
  planning: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Planeación' },
  execution: { bg: 'bg-green-100', text: 'text-green-700', label: 'Ejecución' },
  expansion: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Expansión' },
}

const URGENCY_COLORS = (days: number) => {
  if (days < 30) return 'text-green-600'
  if (days < 60) return 'text-yellow-600'
  return 'text-red-600'
}

export function AdminMasterTable({ onRowClick, className }: AdminMasterTableProps) {
  const {
    rows,
    loading,
    error,
    total,
    currentPage,
    pageSize,
    maxPages,
    search,
    etapaFilter,
    quickFilter,
    sortBy,
    sortOrder,
    selectedIds,
    selectedCount,
    isAllSelected,
    fetchData,
    handleSearch,
    handleFilterByEtapa,
    handleQuickFilter,
    toggleSort,
    goToPage,
    toggleRowSelection,
    toggleSelectAll,
    clearSelection,
  } = useAdminMasterTable()

  const [expandedRow, setExpandedRow] = useState<string | null>(null)
  const [exporting, setExporting] = useState(false)
  const [bulkExporting, setBulkExporting] = useState(false)
  const [bulkStatusModalOpen, setBulkStatusModalOpen] = useState(false)
  const [bulkStatusUpdating, setBulkStatusUpdating] = useState(false)
  const [selectedNewStage, setSelectedNewStage] = useState<string>('')

  const handleExport = async () => {
    setExporting(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
      const headers: HeadersInit = {
        ...(token && { Authorization: `Bearer ${token}` }),
      }

      const params = new URLSearchParams({
        search,
        etapa: etapaFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
      })

      const response = await fetch(`${getApiUrl()}/admin/api/tenants/table/export?${params}`, {
        headers,
      })

      if (!response.ok) {
        throw new Error(`Export failed: HTTP ${response.status}`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `municipios_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (e) {
      console.error('Export failed:', e)
    } finally {
      setExporting(false)
    }
  }

  const handleBulkExport = async () => {
    if (selectedIds.size === 0) return

    setBulkExporting(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      }

      const response = await fetch(`${getApiUrl()}/admin/api/tenants/bulk/export`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tenant_ids: Array.from(selectedIds),
        }),
      })

      if (!response.ok) {
        throw new Error(`Bulk export failed: HTTP ${response.status}`)
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `municipios_bulk_${new Date().toISOString().split('T')[0]}.zip`
      document.body.appendChild(a)
      a.click()
      URL.revokeObjectURL(url)
      document.body.removeChild(a)

      clearSelection()
    } catch (e) {
      console.error('Bulk export failed:', e)
    } finally {
      setBulkExporting(false)
    }
  }

  const handleBulkStatusUpdate = async () => {
    if (selectedIds.size === 0 || !selectedNewStage) return

    setBulkStatusUpdating(true)
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      }

      const response = await fetch(`${getApiUrl()}/admin/api/tenants/bulk/update-status`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          tenant_ids: Array.from(selectedIds),
          new_stage: selectedNewStage,
        }),
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: 'Failed to update status' }))
        throw new Error(error.detail || `Update failed: HTTP ${response.status}`)
      }

      setBulkStatusModalOpen(false)
      setSelectedNewStage('')
      clearSelection()
      fetchData()
    } catch (e) {
      console.error('Bulk status update failed:', e)
    } finally {
      setBulkStatusUpdating(false)
    }
  }

  return (
    <div className={cn('space-y-4 rounded-lg border border-[#E8E4DC] bg-white p-5', className)}>
      {/* Toolbar */}
      <div className="space-y-3">
        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#8E8980]" />
              <input
                type="text"
                placeholder="Buscar municipio, estado, INEGI..."
                value={search}
                onChange={e => handleSearch(e.target.value)}
                className="w-full rounded-lg border border-[#E8E4DC] px-3 py-2 pl-10 text-sm focus:border-[#3B6D11] focus:outline-none"
              />
            </div>
          </div>

          <select
            value={etapaFilter}
            onChange={e => handleFilterByEtapa(e.target.value)}
            className="rounded-lg border border-[#E8E4DC] px-3 py-2 text-sm focus:border-[#3B6D11] focus:outline-none bg-white"
          >
            <option value="">Todas las etapas</option>
            <option value="validation">Validación</option>
            <option value="planning">Planeación</option>
            <option value="execution">Ejecución</option>
            <option value="expansion">Expansión</option>
          </select>

          <button
            onClick={() => fetchData()}
            className="px-3 py-2 rounded-lg border border-[#E8E4DC] text-[#6B6760] hover:bg-[#F4F2ED] transition-colors"
            title="Refresh"
          >
            <Loader2 className={cn('h-4 w-4', loading && 'animate-spin')} />
          </button>

          <button
            onClick={handleExport}
            disabled={exporting}
            className="px-3 py-2 rounded-lg border border-[#E8E4DC] text-[#6B6760] hover:bg-[#F4F2ED] transition-colors disabled:opacity-50 flex items-center gap-2"
            title="Export to Excel"
          >
            <Download className="h-4 w-4" />
            {exporting ? 'Exportando...' : 'Exportar'}
          </button>
        </div>

        {/* Quick filters */}
        <div className="flex gap-2 flex-wrap">
          {[
            { key: '', label: 'Todos' },
            { key: 'urgentes', label: '🔴 Urgentes (60+ días)' },
            { key: 'vencidos', label: '⚠️ Vencidos (90+ días)' },
            { key: 'mi_pendientes', label: '📋 Pendientes' },
          ].map(filter => (
            <button
              key={filter.key}
              onClick={() => handleQuickFilter(filter.key as any)}
              className={cn(
                'px-3 py-1.5 rounded-full text-xs font-medium transition-colors',
                quickFilter === filter.key
                  ? 'bg-[#3B6D11] text-white'
                  : 'border border-[#E8E4DC] text-[#6B6760] hover:border-[#3B6D11] hover:text-[#3B6D11]'
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedCount > 0 && (
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 flex items-center justify-between">
          <p className="text-sm font-medium text-blue-900">
            {selectedCount} municipio{selectedCount !== 1 ? 's' : ''} seleccionado{selectedCount !== 1 ? 's' : ''}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setBulkStatusModalOpen(true)}
              className="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 transition-colors rounded inline-flex items-center gap-1"
            >
              Actualizar etapa
            </button>
            <button
              onClick={handleBulkExport}
              disabled={bulkExporting}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors rounded disabled:opacity-50 inline-flex items-center gap-1"
            >
              <Download className="h-3 w-3" />
              {bulkExporting ? 'Exportando...' : 'Exportar ZIP'}
            </button>
            <button
              onClick={clearSelection}
              className="px-3 py-1.5 text-xs font-medium text-blue-700 hover:text-blue-900 transition-colors"
            >
              Deseleccionar
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-[#6B6760]" />
          <span className="ml-2 text-sm text-[#6B6760]">Cargando tabla...</span>
        </div>
      ) : rows.length === 0 ? (
        <p className="text-center py-8 text-sm text-[#6B6760]">No hay municipios</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E8E4DC]">
                <th className="text-center px-3 py-2 font-semibold text-[#1C1B18] w-12">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    onChange={toggleSelectAll}
                    className="rounded border-[#E8E4DC] text-[#3B6D11]"
                  />
                </th>
                <th className="text-left px-3 py-2 font-semibold text-[#1C1B18] w-40">
                  <button
                    onClick={() => toggleSort('municipio')}
                    className="flex items-center gap-1 hover:text-[#3B6D11]"
                  >
                    Municipio
                    {sortBy === 'municipio' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </button>
                </th>
                <th className="text-left px-3 py-2 font-semibold text-[#1C1B18] w-28">
                  <button
                    onClick={() => toggleSort('etapa')}
                    className="flex items-center gap-1 hover:text-[#3B6D11]"
                  >
                    Etapa
                    {sortBy === 'etapa' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </button>
                </th>
                <th className="text-center px-3 py-2 font-semibold text-[#1C1B18] w-20">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="h-3 w-3" />
                  </div>
                </th>
                <th className="text-center px-3 py-2 font-semibold text-[#1C1B18] w-20">
                  <button
                    onClick={() => toggleSort('dias_en_etapa')}
                    className="flex items-center justify-center gap-1 hover:text-[#3B6D11] w-full"
                  >
                    <Calendar className="h-3 w-3" />
                  </button>
                </th>
                <th className="text-center px-3 py-2 font-semibold text-[#1C1B18] w-20">Avance</th>
                <th className="text-center px-3 py-2 font-semibold text-[#1C1B18] w-24">Docs</th>
                <th className="text-center px-3 py-2 font-semibold text-[#1C1B18] w-20">HERMES</th>
                <th className="text-center px-3 py-2 font-semibold text-[#1C1B18] w-20">Fac.</th>
                <th className="text-center px-3 py-2 font-semibold text-[#1C1B18] w-20">Pago</th>
                <th className="text-left px-3 py-2 font-semibold text-[#1C1B18] w-32">Próxima acción</th>
                <th className="text-center px-3 py-2 font-semibold text-[#1C1B18] w-16"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr
                  key={row.id}
                  className={cn(
                    'border-b border-[#E8E4DC] transition-colors',
                    selectedIds.has(row.id) ? 'bg-blue-50' : 'hover:bg-[#FDFCFA]'
                  )}
                >
                  <td className="px-3 py-3 text-center" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.has(row.id)}
                      onChange={() => toggleRowSelection(row.id)}
                      className="rounded border-[#E8E4DC] text-[#3B6D11]"
                    />
                  </td>
                  <td
                    className="px-3 py-3 cursor-pointer"
                    onClick={() => {
                      setExpandedRow(expandedRow === row.id ? null : row.id)
                      onRowClick?.(row.id)
                    }}
                  >
                    <div>
                      <p className="font-medium text-[#1C1B18]">{row.municipio}</p>
                      <p className="text-xs text-[#8E8980]">{row.estado} · {row.inegi_clave}</p>
                    </div>
                  </td>
                  <td className="px-3 py-3">
                    {row.etapa && (
                      <span className={cn('px-2 py-1 rounded-full text-xs font-medium', ETAPA_COLORS[row.etapa]?.bg, ETAPA_COLORS[row.etapa]?.text)}>
                        {ETAPA_COLORS[row.etapa]?.label || row.etapa}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="text-[#1C1B18] font-medium">{row.usuarios_count}</span>
                  </td>
                  <td className={cn('px-3 py-3 text-center font-medium', URGENCY_COLORS(row.dias_en_etapa))}>
                    {row.dias_en_etapa}
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex items-center justify-center">
                      <div className="w-20">
                        <div className="bg-[#E8E4DC] rounded-full h-2 overflow-hidden">
                          <div
                            className="bg-[#3B6D11] h-full transition-all"
                            style={{ width: `${row.avance_validacion_pct}%` }}
                          />
                        </div>
                        <p className="text-xs text-[#8E8980] mt-1 text-center">{row.avance_validacion_pct}%</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className="text-xs text-[#1C1B18]">
                      {row.documentos_solicitados.entregados}/{row.documentos_solicitados.total}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <span className={cn(
                      'px-2 py-1 rounded text-xs font-medium',
                      row.hermes_status === 'ready' ? 'bg-green-100 text-green-700' :
                      row.hermes_status === 'partially_mapped' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    )}>
                      {row.hermes_status === 'ready' ? '✓' : row.hermes_status === 'partially_mapped' ? '◐' : '○'}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-center">
                    {row.facturado ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-gray-300 mx-auto" />
                    )}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {row.pagado ? (
                      <CheckCircle2 className="h-4 w-4 text-green-600 mx-auto" />
                    ) : (
                      <AlertTriangle className="h-4 w-4 text-gray-300 mx-auto" />
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <p className="text-xs text-[#6B6760]">{row.proxima_accion}</p>
                  </td>
                  <td className="px-3 py-3 text-center">
                    <ChevronRight className={cn('h-4 w-4 text-[#8E8980] transition-transform', expandedRow === row.id && 'rotate-90')} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Bulk Status Update Modal */}
      {bulkStatusModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-[#1C1B18] mb-4">Actualizar etapa</h3>
            <p className="text-sm text-[#6B6760] mb-4">
              Cambiar etapa para {selectedCount} municipio{selectedCount !== 1 ? 's' : ''}
            </p>

            <div className="space-y-3 mb-6">
              {[
                { value: 'validation', label: 'Validación', color: 'blue' },
                { value: 'planning', label: 'Planeación', color: 'yellow' },
                { value: 'execution', label: 'Ejecución', color: 'green' },
                { value: 'expansion', label: 'Expansión', color: 'purple' },
              ].map(stage => (
                <button
                  key={stage.value}
                  onClick={() => setSelectedNewStage(stage.value)}
                  className={cn(
                    'w-full px-4 py-2 rounded-lg border-2 transition-all text-left',
                    selectedNewStage === stage.value
                      ? `border-${stage.color}-500 bg-${stage.color}-50`
                      : 'border-[#E8E4DC] hover:border-[#3B6D11]'
                  )}
                >
                  <p className="font-medium text-[#1C1B18]">{stage.label}</p>
                </button>
              ))}
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setBulkStatusModalOpen(false)
                  setSelectedNewStage('')
                }}
                className="flex-1 px-4 py-2 rounded-lg border border-[#E8E4DC] text-[#6B6760] hover:bg-[#F4F2ED] transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleBulkStatusUpdate}
                disabled={!selectedNewStage || bulkStatusUpdating}
                className="flex-1 px-4 py-2 rounded-lg bg-[#3B6D11] text-white hover:bg-[#2D5209] disabled:opacity-50 transition-colors font-medium"
              >
                {bulkStatusUpdating ? 'Actualizando...' : 'Actualizar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!loading && rows.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-[#8E8980]">
            Página {currentPage + 1} de {maxPages} · Total: {total}
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 0}
              className="p-2 rounded-lg border border-[#E8E4DC] text-[#6B6760] hover:bg-[#F4F2ED] disabled:opacity-50 transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage >= maxPages - 1}
              className="p-2 rounded-lg border border-[#E8E4DC] text-[#6B6760] hover:bg-[#F4F2ED] disabled:opacity-50 transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
