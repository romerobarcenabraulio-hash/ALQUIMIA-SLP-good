'use client'

import { useState, useRef } from 'react'
import { X, Upload, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface AdminDocumentUploadModalProps {
  tenantId: string
  tenantName: string
  documentType: string
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  className?: string
}

type DocumentSource = 'founder_research' | 'client_email' | 'perplexity_download'

export function AdminDocumentUploadModal({
  tenantId,
  tenantName,
  documentType,
  isOpen,
  onClose,
  onSuccess,
  className,
}: AdminDocumentUploadModalProps) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [source, setSource] = useState<DocumentSource>('client_email')
  const [notes, setNotes] = useState('')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const files = e.dataTransfer.files
    if (files.length > 0) {
      setFile(files[0])
      setError(null)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      const selectedFile = files[0]
      if (selectedFile.type !== 'application/pdf') {
        setError('Solo se permiten archivos PDF')
        return
      }
      if (selectedFile.size > 50 * 1024 * 1024) {
        setError('El archivo no puede exceder 50 MB')
        return
      }
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleSubmit = async () => {
    if (!file) {
      setError('Por favor selecciona un archivo')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('document_type', documentType)
      formData.append('source', source)
      formData.append('notes', notes)

      const token = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
      const headers: HeadersInit = {
        ...(token && { Authorization: `Bearer ${token}` }),
      }

      const { getApiUrl } = await import('@/lib/api')
      const response = await fetch(`${getApiUrl()}/admin/tenants/${encodeURIComponent(tenantId)}/documents/upload`, {
        method: 'POST',
        headers,
        body: formData,
      })

      if (!response.ok) {
        throw new Error(`Upload failed: HTTP ${response.status}`)
      }

      setSuccess(true)
      setTimeout(() => {
        setFile(null)
        setSource('client_email')
        setNotes('')
        setSuccess(false)
        onSuccess?.()
        onClose()
      }, 1500)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error al subir el archivo')
    } finally {
      setUploading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className={cn('fixed inset-0 z-50 bg-black/50 flex items-center justify-center', className)}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#E8E4DC] px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-[#1C1B18]">Subir Documento</h2>
            <p className="text-xs text-[#6B6760] mt-1">{documentType} • {tenantName}</p>
          </div>
          <button
            onClick={onClose}
            disabled={uploading}
            className="p-2 hover:bg-[#F4F2ED] rounded-lg transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5 text-[#6B6760]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {success ? (
            <div className="flex flex-col items-center justify-center py-8 space-y-3">
              <CheckCircle2 className="h-12 w-12 text-green-600" />
              <p className="text-sm font-medium text-[#1C1B18]">Documento subido exitosamente</p>
              <p className="text-xs text-[#6B6760] text-center">Se procesa el PDF y se sugiere integración</p>
            </div>
          ) : (
            <>
              {/* File Upload Area */}
              <div
                onDragOver={handleDragOver}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-[#E8E4DC] rounded-lg p-6 text-center hover:border-[#3B6D11] transition-colors cursor-pointer bg-[#FDFCFA]"
              >
                <Upload className="h-8 w-8 text-[#6B6760] mx-auto mb-2" />
                <p className="text-sm font-medium text-[#1C1B18]">Arrastra el PDF o haz click</p>
                <p className="text-xs text-[#8E8980] mt-1">Tamaño máximo: 50 MB</p>
                {file && <p className="text-xs text-green-600 mt-2 font-medium">{file.name}</p>}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf"
                onChange={handleFileSelect}
                className="hidden"
              />

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2">
                  <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700">{error}</p>
                </div>
              )}

              {/* Source */}
              <div>
                <label className="block text-xs font-medium text-[#8E8980] mb-2">Fuente del documento</label>
                <div className="space-y-2">
                  {[
                    { value: 'founder_research' as const, label: 'Lo aporté yo desde investigación previa' },
                    { value: 'client_email' as const, label: 'Lo aportó el cliente por email' },
                    { value: 'perplexity_download' as const, label: 'Identificado vía Perplexity y descargado' },
                  ].map(option => (
                    <label key={option.value} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="source"
                        value={option.value}
                        checked={source === option.value}
                        onChange={e => setSource(e.target.value as DocumentSource)}
                        className="rounded border-[#E8E4DC] text-[#3B6D11]"
                      />
                      <span className="text-xs text-[#6B6760]">{option.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-medium text-[#8E8980] mb-2">Notas internas (no visibles al cliente)</label>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Añade contexto sobre este documento..."
                  className="w-full rounded-lg border border-[#E8E4DC] px-3 py-2 text-xs focus:border-[#3B6D11] focus:outline-none resize-none"
                  rows={3}
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-[#E8E4DC] px-6 py-4 flex gap-2">
          <button
            onClick={onClose}
            disabled={uploading || success}
            className="flex-1 px-4 py-2 rounded-lg border border-[#E8E4DC] text-[#1C1B18] font-medium hover:bg-[#F4F2ED] transition-colors disabled:opacity-50"
          >
            {success ? 'Cerrado' : 'Cancelar'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!file || uploading || success}
            className="flex-1 px-4 py-2 rounded-lg bg-[#3B6D11] text-white font-medium hover:bg-[#2D5409] transition-colors disabled:opacity-50 inline-flex items-center justify-center gap-2"
          >
            {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
            {success ? 'Listo' : 'Subir y procesar'}
          </button>
        </div>
      </div>
    </div>
  )
}
