'use client'

import { useState, useRef } from 'react'
import { Upload, X, CheckCircle2 } from 'lucide-react'
import { useRBAC } from '@/hooks/useRBAC'
import { AccessDenied } from '@/components/rbac/ProtectedContent'
import { cn } from '@/lib/utils'

interface UploadedDocument {
  id: string
  name: string
  size: number
  uploadedAt: Date
  uploadedBy: string
}

/**
 * Admin-only component for uploading documents
 * Requires 'upload_documents' permission
 */
export function DocumentUploadSection() {
  const { canUploadDocuments } = useRBAC()
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadedDocs, setUploadedDocs] = useState<UploadedDocument[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!canUploadDocuments) {
    return (
      <AccessDenied feature="Solo administradores pueden subir documentos" />
    )
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || [])
    setFiles(prev => [...prev, ...selectedFiles])
  }

  const handleRemoveFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    try {
      // Simulate upload
      await new Promise(resolve => setTimeout(resolve, 1500))

      const newDocs = files.map((file, idx) => ({
        id: `doc-${Date.now()}-${idx}`,
        name: file.name,
        size: file.size,
        uploadedAt: new Date(),
        uploadedBy: 'admin',
      }))

      setUploadedDocs(prev => [...prev, ...newDocs])
      setFiles([])
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Gestor de documentos</h3>
        <p className="mt-1 text-sm text-gray-600">
          Carga y gestiona documentos municipales, reglamentos, y antecedentes
        </p>
      </div>

      {/* Upload Zone */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-8 text-center transition-colors hover:bg-gray-100"
      >
        <Upload className="mx-auto h-8 w-8 text-gray-400" />
        <p className="mt-2 text-sm font-medium text-gray-900">
          Arrastra archivos aquí o haz clic para seleccionar
        </p>
        <p className="text-xs text-gray-600">PDF, DOCX, XLSX - Máx 50MB</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {/* Selected Files */}
      {files.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">{files.length} archivo(s) seleccionado(s)</p>
          {files.map((file, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between rounded-lg bg-gray-50 p-3"
            >
              <span className="text-sm text-gray-600">{file.name}</span>
              <button
                onClick={() => handleRemoveFile(idx)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {files.length > 0 && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className={cn(
            'w-full rounded-lg px-4 py-2 font-medium transition-colors',
            uploading
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          )}
        >
          {uploading ? 'Subiendo...' : 'Subir documentos'}
        </button>
      )}

      {/* Uploaded Documents */}
      {uploadedDocs.length > 0 && (
        <div className="space-y-2 border-t border-gray-200 pt-4">
          <h4 className="text-sm font-medium text-gray-900">Documentos subidos</h4>
          {uploadedDocs.map(doc => (
            <div
              key={doc.id}
              className="flex items-center gap-2 rounded-lg bg-green-50 p-3"
            >
              <CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
              <div className="flex-1 text-sm text-gray-900">
                {doc.name}
                <span className="ml-2 text-xs text-gray-600">
                  ({(doc.size / 1024 / 1024).toFixed(2)}MB)
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
