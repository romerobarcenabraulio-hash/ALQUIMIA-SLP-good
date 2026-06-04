import { useState, useCallback, useEffect } from 'react'
import { getApiUrl } from '@/lib/api'

export interface AdminTableRow {
  id: string
  municipio: string
  estado: string
  inegi_clave: string
  etapa: string
  gate_actual: string | null
  usuarios_count: number
  dias_en_etapa: number
  avance_validacion_pct: number
  avance_modulos_count: { completados: number; total: number }
  documentos_solicitados: { entregados: number; total: number }
  hermes_status: string
  facturado: boolean
  pagado: boolean
  ultima_actividad: string
  proxima_accion: string
  created_at: string
  updated_at: string
}

interface UseAdminMasterTableOptions {
  autoLoad?: boolean
}

type QuickFilter = 'urgentes' | 'vencidos' | 'mi_pendientes' | ''

export function useAdminMasterTable(options: UseAdminMasterTableOptions = {}) {
  const { autoLoad = true } = options

  const [rows, setRows] = useState<AdminTableRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [total, setTotal] = useState(0)

  const [search, setSearch] = useState('')
  const [etapaFilter, setEtapaFilter] = useState('')
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('')
  const [sortBy, setSortBy] = useState<'municipio' | 'etapa' | 'dias_en_etapa' | 'avance' | 'updated_at'>('updated_at')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  const [currentPage, setCurrentPage] = useState(0)

  const pageSize = 25

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      }

      const params = new URLSearchParams({
        search,
        etapa: etapaFilter,
        sort_by: sortBy,
        sort_order: sortOrder,
        limit: String(pageSize),
        offset: String(currentPage * pageSize),
      })

      const response = await fetch(`${getApiUrl()}/admin/api/tenants/table?${params}`, {
        headers,
      })

      if (!response.ok) {
        throw new Error(`Failed to load table: HTTP ${response.status}`)
      }

      const data = await response.json()
      setRows(data.rows || [])
      setTotal(data.total || 0)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [search, etapaFilter, sortBy, sortOrder, currentPage, pageSize])

  useEffect(() => {
    if (autoLoad) {
      fetchData()
    }
  }, [fetchData, autoLoad])

  const toggleSort = useCallback((field: typeof sortBy) => {
    setSortBy(field)
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortOrder('desc')
    }
    setCurrentPage(0)
  }, [sortBy, sortOrder])

  const handleSearch = useCallback((query: string) => {
    setSearch(query)
    setCurrentPage(0)
  }, [])

  const handleFilterByEtapa = useCallback((etapa: string) => {
    setEtapaFilter(etapa)
    setCurrentPage(0)
  }, [])

  const handleQuickFilter = useCallback((filter: QuickFilter) => {
    setQuickFilter(filter)
    setCurrentPage(0)
  }, [])

  const goToPage = useCallback((page: number) => {
    const maxPages = Math.ceil(total / pageSize)
    setCurrentPage(Math.min(Math.max(0, page), maxPages - 1))
  }, [total, pageSize])

  // Apply client-side quick filters
  const filteredRows = rows.filter(row => {
    if (quickFilter === 'urgentes') {
      return row.dias_en_etapa >= 60
    }
    if (quickFilter === 'vencidos') {
      return row.dias_en_etapa >= 90
    }
    if (quickFilter === 'mi_pendientes') {
      return row.etapa !== 'expansion'
    }
    return true
  })

  const maxPages = Math.ceil(total / pageSize)

  return {
    // Data
    rows: filteredRows,
    loading,
    error,
    total,

    // Pagination
    currentPage,
    pageSize,
    maxPages,

    // Filters & sorting
    search,
    etapaFilter,
    quickFilter,
    sortBy,
    sortOrder,

    // Actions
    fetchData,
    handleSearch,
    handleFilterByEtapa,
    handleQuickFilter,
    toggleSort,
    goToPage,
  }
}
