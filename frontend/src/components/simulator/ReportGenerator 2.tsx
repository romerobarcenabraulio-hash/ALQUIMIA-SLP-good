'use client'

import { useState } from 'react'
import { Download, FileText, Loader2, AlertCircle } from 'lucide-react'
import { getApiUrl } from '@/lib/api'
import { cn } from '@/lib/utils'

interface ReportGeneratorProps {
  simulationId: string
  simulationName: string
  tenantId?: string
  className?: string
}

type ReportFormat = 'json' | 'html' | 'pdf'

export function ReportGenerator({
  simulationId,
  simulationName,
  tenantId,
  className,
}: ReportGeneratorProps) {
  const [format, setFormat] = useState<ReportFormat>('html')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [reportData, setReportData] = useState<string | null>(null)

  const generateReport = async () => {
    setLoading(true)
    setError(null)
    setReportData(null)

    try {
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(tenantId && { 'x-tenant-id': tenantId }),
      }

      const token = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const url = `${getApiUrl()}/reports/${encodeURIComponent(simulationId)}/generate-summary?report_format=${format}`
      const res = await fetch(url, {
        method: 'POST',
        headers,
      })

      if (!res.ok) {
        const error = await res.json().catch(() => ({}))
        throw new Error(error.detail ?? `Failed to generate report: HTTP ${res.status}`)
      }

      const data = await res.json()

      if (format === 'html' && data.html) {
        downloadHtml(data.html)
      } else if (format === 'json') {
        downloadJson(data)
      }

      setReportData(format === 'html' ? 'HTML report generated' : JSON.stringify(data, null, 2))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const downloadHtml = (html: string) => {
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `report-${simulationName}-${new Date().toISOString().split('T')[0]}.html`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const downloadJson = (data: unknown) => {
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `report-${simulationName}-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  return (
    <div className={cn('space-y-3 rounded-lg border border-[#E8E4DC] bg-[#FDFCFA] p-4', className)}>
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-[#3B6D11]" />
        <h3 className="text-sm font-medium text-[#1C1B18]">Generate Report</h3>
      </div>

      <div>
        <label className="block text-xs font-medium text-[#6B6760] mb-2">Report Format</label>
        <div className="flex gap-2">
          {(['html', 'json'] as ReportFormat[]).map((fmt) => (
            <button
              key={fmt}
              onClick={() => setFormat(fmt)}
              className={cn(
                'flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors',
                format === fmt
                  ? 'bg-[#3B6D11] text-white'
                  : 'border border-[#E8E4DC] bg-white text-[#6B6760] hover:bg-[#F4F2ED]',
              )}
            >
              {fmt.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 flex items-start gap-2">
          <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      {reportData && (
        <div className="rounded-lg border border-green-200 bg-green-50 p-3">
          <p className="text-xs text-green-700 font-medium">✓ {reportData}</p>
        </div>
      )}

      <button
        onClick={generateReport}
        disabled={loading}
        className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-[#3B6D11] bg-[#3B6D11] px-4 py-2 text-sm font-medium text-white hover:bg-[#2D5409] disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Generating...
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            Generate & Download
          </>
        )}
      </button>

      <p className="text-xs text-[#8E8980]">
        Reports include simulation parameters, financial data, and operational configuration.
      </p>
    </div>
  )
}
