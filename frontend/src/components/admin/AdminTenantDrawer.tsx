'use client'

import { useState, useEffect } from 'react'
import { X, AlertCircle, FileUp, Loader2 } from 'lucide-react'
import { getApiUrl } from '@/lib/api'
import { cn } from '@/lib/utils'
import { AdminDocumentUploadModal } from './AdminDocumentUploadModal'

interface TenantDrawerProps {
  tenantId: string | null
  isOpen: boolean
  onClose: () => void
  className?: string
}

interface TenantResumen {
  id: string
  nombre: string
  estado_mx: string
  inegi_clave: string
  tier_comercial: string
  created_at: string
  updated_at: string
  current_stage: string
}

interface TenantDocument {
  id: string
  document_type: string
  title: string
  status: string
  qa_status: string
  version: number
  created_by: string
  updated_by: string
  created_at: string
  updated_at: string
}

export function AdminTenantDrawer({ tenantId, isOpen, onClose, className }: TenantDrawerProps) {
  const [data, setData] = useState<TenantResumen | null>(null)
  const [documents, setDocuments] = useState<TenantDocument[]>([])
  const [loading, setLoading] = useState(false)
  const [documentsLoading, setDocumentsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'resumen' | 'documentos' | 'usuarios'>('resumen')
  const [uploadModalOpen, setUploadModalOpen] = useState(false)

  useEffect(() => {
    if (!isOpen || !tenantId) return

    loadTenantData()
  }, [isOpen, tenantId])

  useEffect(() => {
    if (activeTab === 'documentos' && tenantId) {
      loadDocuments()
    }
  }, [activeTab, tenantId])

  const loadTenantData = async () => {
    if (!tenantId) return

    setLoading(true)
    setError(null)

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      }

      const response = await fetch(`${getApiUrl()}/admin/tenants/${encodeURIComponent(tenantId)}`, {
        headers,
      })

      if (!response.ok) {
        throw new Error(`Failed to load tenant: HTTP ${response.status}`)
      }

      const tenantData = await response.json()
      setData(tenantData)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load tenant')
    } finally {
      setLoading(false)
    }
  }

  const loadDocuments = async () => {
    if (!tenantId) return

    setDocumentsLoading(true)

    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
      }

      const response = await fetch(`${getApiUrl()}/admin/tenants/${encodeURIComponent(tenantId)}/documents`, {
        headers,
      })

      if (!response.ok) {
        throw new Error(`Failed to load documents: HTTP ${response.status}`)
      }

      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (e) {
      console.error('Failed to load documents:', e)
    } finally {
      setDocumentsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className={cn('fixed inset-0 z-40 bg-black/30', className)}>
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8E4DC] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#1C1B18]">Detalle del Municipio</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[#F4F2ED] rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-[#6B6760]" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-[#E8E4DC] px-6">
          {(['resumen', 'documentos', 'usuarios'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'px-4 py-3 text-sm font-medium border-b-2 transition-colors',
                activeTab === tab
                  ? 'text-[#3B6D11] border-[#3B6D11]'
                  : 'text-[#6B6760] border-transparent hover:text-[#1C1B18]'
              )}
            >
              {tab === 'resumen' && 'Resumen'}
              {tab === 'documentos' && 'Documentos'}
              {tab === 'usuarios' && 'Usuarios'}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-5 w-5 animate-spin text-[#6B6760]" />
              <span className="ml-2 text-sm text-[#6B6760]">Cargando...</span>
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          ) : data ? (
            <>
              {activeTab === 'resumen' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[#8E8980]">Municipio</label>
                    <p className="mt-1 text-sm font-medium text-[#1C1B18]">{data.nombre}</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#8E8980]">Estado</label>
                      <p className="mt-1 text-sm text-[#1C1B18]">{data.estado_mx}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#8E8980]">INEGI</label>
                      <p className="mt-1 text-sm text-[#1C1B18]">{data.inegi_clave}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-[#8E8980]">Etapa</label>
                      <p className="mt-1 text-sm text-[#1C1B18] capitalize">{data.current_stage}</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-[#8E8980]">Tier</label>
                      <p className="mt-1 text-sm text-[#1C1B18] capitalize">{data.tier_comercial}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-xs pt-4 border-t border-[#E8E4DC]">
                    <div>
                      <label className="block font-medium text-[#8E8980]">Creado</label>
                      <p className="mt-1 text-[#6B6760]">{new Date(data.created_at).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <label className="block font-medium text-[#8E8980]">Actualizado</label>
                      <p className="mt-1 text-[#6B6760]">{new Date(data.updated_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'documentos' && (
                <div className="space-y-4">
                  <button
                    onClick={() => setUploadModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[#3B6D11] text-white rounded-lg text-sm font-medium hover:bg-[#2D5409] transition-colors"
                  >
                    <FileUp className="h-4 w-4" />
                    Subir Documento
                  </button>

                  {documentsLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-4 w-4 animate-spin text-[#6B6760] mr-2" />
                      <span className="text-sm text-[#6B6760]">Cargando documentos...</span>
                    </div>
                  ) : documents.length === 0 ? (
                    <p className="text-sm text-[#6B6760]">No hay documentos aún.</p>
                  ) : (
                    <div className="space-y-2">
                      {documents.map(doc => (
                        <div key={doc.id} className="rounded-lg border border-[#E8E4DC] p-3 space-y-1">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-medium text-[#1C1B18]">{doc.title}</p>
                              <p className="text-xs text-[#8E8980]">{doc.document_type}</p>
                            </div>
                            <span className={cn(
                              'px-2 py-1 rounded text-xs font-medium',
                              doc.status === 'finalizado' ? 'bg-green-100 text-green-700' :
                              doc.status === 'en_revision' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-blue-100 text-blue-700'
                            )}>
                              {doc.status === 'finalizado' ? 'Finalizado' :
                               doc.status === 'en_revision' ? 'En revisión' :
                               'Pendiente'}
                            </span>
                          </div>
                          <p className="text-xs text-[#8E8980]">
                            Actualizado: {new Date(doc.updated_at).toLocaleDateString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'usuarios' && (
                <div className="space-y-4">
                  <p className="text-sm text-[#6B6760]">Los usuarios se cargan aquí en Sprint 11.</p>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Upload Modal */}
        {data && (
          <AdminDocumentUploadModal
            tenantId={data.id}
            tenantName={data.nombre}
            documentType="Reglamento"
            isOpen={uploadModalOpen}
            onClose={() => setUploadModalOpen(false)}
            onSuccess={() => loadTenantData()}
          />
        )}
      </div>
    </div>
  )
}
