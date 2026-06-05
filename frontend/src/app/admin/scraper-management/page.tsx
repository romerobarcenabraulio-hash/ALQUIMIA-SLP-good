'use client'

import { useEffect, useState, Suspense } from 'react'
import Link from 'next/link'
import { ArrowLeft, Loader2, Play, RefreshCw, Clock, CheckCircle2, XCircle } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { getApiUrl } from '@/lib/api'

interface ScraperJob {
  id: string
  source: string
  schedule: string
  activo: boolean
  last_run_at: string | null
  next_run_at: string | null
  ultima_ejecucion_status: string
  documentos_encontrados: number
  documentos_nuevos: number
  documentos_duplicados: number
  intentos_fallidos: number
  ultimo_error: string | null
}

interface ScraperStatus {
  total_jobs: number
  active_jobs: number
  total_documents: number
  jobs: ScraperJob[]
}

function authHdr(): HeadersInit {
  const t = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
  return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

function ScraperManagementContent() {
  const [status, setStatus] = useState<ScraperStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [running, setRunning] = useState<string | null>(null)

  async function loadStatus() {
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/scraper/status`, {
        headers: authHdr(),
      })
      if (res.ok) {
        const data = await res.json()
        setStatus(data)
      }
    } catch (e) {
      console.error('Error loading status:', e)
    } finally {
      setLoading(false)
    }
  }

  async function triggerJob(source: string) {
    setRunning(source)
    try {
      const res = await fetch(
        `${getApiUrl()}/api/v1/scraper/jobs/${source}/trigger`,
        { method: 'POST', headers: authHdr() }
      )
      if (res.ok) {
        loadStatus()
      }
    } finally {
      setRunning(null)
    }
  }

  async function processDueJobs() {
    setRunning('all')
    try {
      const res = await fetch(
        `${getApiUrl()}/api/v1/scraper/process-due-jobs`,
        { method: 'POST', headers: authHdr() }
      )
      if (res.ok) {
        loadStatus()
      }
    } finally {
      setRunning(null)
    }
  }

  useEffect(() => {
    loadStatus()
    const interval = setInterval(loadStatus, 30000) // Auto-refresh every 30s
    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[#3B6D11]" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link href="/hub" className="rounded-[8px] p-1.5 text-[#6B6760] hover:bg-[#F0EDE5] hover:text-[#1C1B18] transition-colors">
          <ArrowLeft size={16} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-[24px] font-semibold text-[#1C1B18]">Gestor de Web Scraper</h1>
          <p className="text-[13px] text-[#6B6760]">Administración de trabajos de scraping automatizados</p>
        </div>
      </div>

      {status && (
        <div className="space-y-6">
          {/* Overview cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
              <p className="text-[11px] uppercase tracking-wide text-[#8E8980]">Trabajos activos</p>
              <p className="text-[24px] font-bold text-[#3B6D11] mt-1">{status.active_jobs}/{status.total_jobs}</p>
            </div>
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
              <p className="text-[11px] uppercase tracking-wide text-[#8E8980]">Documentos</p>
              <p className="text-[24px] font-bold text-[#1C4B8F] mt-1">{status.total_documents}</p>
            </div>
            <div className="rounded-[12px] border border-[#C9DDB1] bg-[#EAF3DE] p-4">
              <button
                onClick={processDueJobs}
                disabled={running === 'all'}
                className="w-full flex items-center justify-center gap-2 rounded-[8px] bg-[#3B6D11] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#2d5409] transition-colors disabled:opacity-40"
              >
                {running === 'all' ? <Loader2 size={12} className="animate-spin" /> : <RefreshCw size={12} />}
                Procesar ahora
              </button>
            </div>
          </div>

          {/* Jobs table */}
          <div className="rounded-[12px] border border-[#E8E4DC] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#FAFAF8] border-b border-[#E8E4DC]">
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#6B6760]">Fuente</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#6B6760]">Frecuencia</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#6B6760]">Último run</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#6B6760]">Próximo run</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#6B6760]">Estado</th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-[#6B6760]">Documentos</th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold text-[#6B6760]">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E4DC]">
                  {status.jobs.map(job => (
                    <tr key={job.id} className="hover:bg-[#FAFAF8] transition-colors">
                      <td className="px-4 py-3">
                        <p className="text-[12px] font-semibold text-[#1C1B18] capitalize">{job.source}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[11px] text-[#6B6760]">{job.schedule}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[11px] text-[#6B6760]">
                          {job.last_run_at ? new Date(job.last_run_at).toLocaleDateString() : '—'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[11px] text-[#6B6760]">
                          {job.next_run_at ? (
                            <span className="flex items-center gap-1">
                              <Clock size={10} />
                              {new Date(job.next_run_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          ) : '—'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {job.ultima_ejecucion_status === 'success' ? (
                            <span className="flex items-center gap-1 text-[11px] text-[#3B6D11]">
                              <CheckCircle2 size={12} /> OK
                            </span>
                          ) : job.ultima_ejecucion_status === 'failed' ? (
                            <span className="flex items-center gap-1 text-[11px] text-[#C0392B]">
                              <XCircle size={12} /> Error
                            </span>
                          ) : (
                            <span className="text-[11px] text-[#A8A49C]">—</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[11px] text-[#6B6760]">
                          <p>+{job.documentos_nuevos} nuevo</p>
                          <p className="text-[10px] text-[#A8A49C]">{job.documentos_duplicados} dup</p>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => triggerJob(job.source)}
                          disabled={running === job.source}
                          className="rounded-[6px] bg-[#EAF3DE] px-2.5 py-1 text-[11px] font-semibold text-[#3B6D11] hover:bg-[#3B6D11] hover:text-white transition-colors disabled:opacity-40"
                        >
                          {running === job.source ? <Loader2 size={10} className="inline animate-spin" /> : <Play size={10} className="inline" />}
                          {running === job.source ? 'Ejecutando...' : 'Ejecutar'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Error messages */}
          {status.jobs.filter(j => j.ultimo_error).length > 0 && (
            <div className="rounded-[12px] border border-[#FBEAEA] bg-white p-4">
              <h3 className="text-[12px] font-semibold text-[#C0392B] mb-2">Errores Recientes</h3>
              <div className="space-y-2">
                {status.jobs
                  .filter(j => j.ultimo_error)
                  .map(job => (
                    <div key={job.id} className="rounded-[8px] bg-[#FBEAEA] p-2 border border-[#FBEAEA]">
                      <p className="text-[11px] font-semibold text-[#7B1F1F]">{job.source}</p>
                      <p className="text-[10px] text-[#C0392B] mt-1 font-mono">{job.ultimo_error}</p>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Documentation */}
          <div className="rounded-[12px] border border-[#E8F0FB] bg-white p-4">
            <h3 className="text-[12px] font-semibold text-[#1A5FA8] mb-2">Información</h3>
            <ul className="space-y-1 text-[11px] text-[#6B6760]">
              <li>• Los trabajos se ejecutan automáticamente según la frecuencia configurada</li>
              <li>• Los documentos duplicados se detectan por hash SHA256</li>
              <li>• El scraper se desactiva después de 3 fallos consecutivos</li>
              <li>• Los documentos se clasifican automáticamente por tema (residuos, construccion, agua, salud)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ScraperManagementPage() {
  return (
    <AppShell>
      <Suspense fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 size={24} className="animate-spin text-[#3B6D11]" />
        </div>
      }>
        <ScraperManagementContent />
      </Suspense>
    </AppShell>
  )
}
