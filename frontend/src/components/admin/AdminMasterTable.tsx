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
} from 'lucide-react'
import { cn } from '@/lib/utils'
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
    fetchData,
    handleSearch,
    handleFilterByEtapa,
    handleQuickFilter,
    toggleSort,
    goToPage,
  } = useAdminMasterTable()

  const [expandedRow, setExpandedRow] = useState<string | null>(null)

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
                <th className="text-left px-3 py-2 font-semibold text-[#1C1B18] w-48">
                  <button
                    onClick={() => toggleSort('municipio')}
                    className="flex items-center gap-1 hover:text-[#3B6D11]"
                  >
                    Municipio
                    {sortBy === 'municipio' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </button>
                </th>
                <th className="text-left px-3 py-2 font-semibold text-[#1C1B18] w-32">
                  <button
                    onClick={() => toggleSort('etapa')}
                    className="flex items-center gap-1 hover:text-[#3B6D11]"
                  >
                    Etapa
                    {sortBy === 'etapa' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </button>
                </th>
                <th className="text-center px-3 py-2 font-semibold text-[#1C1B18] w-24">
                  <div className="flex items-center justify-center gap-1">
                    <Users className="h-3 w-3" />
                    Usuarios
                  </div>
                </th>
                <th className="text-center px-3 py-2 font-semibold text-[#1C1B18] w-24">
                  <button
                    onClick={() => toggleSort('dias_en_etapa')}
                    className="flex items-center justify-center gap-1 hover:text-[#3B6D11] w-full"
                  >
                    <Calendar className="h-3 w-3" />
                    Días
                    {sortBy === 'dias_en_etapa' && (sortOrder === 'asc' ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />)}
                  </button>
                </th>
                <th className="text-center px-3 py-2 font-semibold text-[#1C1B18] w-28">Avance</th>
                <th className="text-center px-3 py-2 font-semibold text-[#1C1B18] w-32">Documentos</th>
                <th className="text-center px-3 py-2 font-semibold text-[#1C1B18] w-16"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr
                  key={row.id}
                  className="border-b border-[#E8E4DC] hover:bg-[#FDFCFA] transition-colors cursor-pointer"
                  onClick={() => {
                    setExpandedRow(expandedRow === row.id ? null : row.id)
                    onRowClick?.(row.id)
                  }}
                >
                  <td className="px-3 py-3">
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
                    <span className="text-[#1C1B18] font-medium">
                      {row.documentos_solicitados.entregados}/{row.documentos_solicitados.total}
                    </span>
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
