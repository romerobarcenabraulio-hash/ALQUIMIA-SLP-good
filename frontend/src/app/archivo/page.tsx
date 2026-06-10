'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, ArrowLeft, Loader2, ExternalLink, Filter, FolderOpen } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { getApiUrl } from '@/lib/api'

interface Document {
  id: string
  titulo: string
  descripcion: string
  source_type: string
  author_org?: string
  tags: string[]
  ambito?: string
  url?: string
  url_label?: string
  relevance_score?: number
  cluster_id?: string
}

interface Cluster {
  id: string
  nombre: string
  descripcion?: string
  tema_principal: string
  doc_count: number
}

interface SearchResponse {
  total: number
  results: Document[]
  clusters: Cluster[]
  query: string
}

const SOURCE_LABELS: Record<string, string> = {
  iniciativa: 'Iniciativa',
  user_document: 'Documento usuario',
  guide: 'Guía',
  standard: 'Estándar',
  case_study: 'Caso de estudio',
}

const AMBITO_COLORS: Record<string, string> = {
  federal: 'bg-[#E8F0FB] text-[#1A5FA8]',
  estatal: 'bg-[#FEF7E7] text-[#8A4F08]',
  norma_tecnica: 'bg-[#EAF3DE] text-[#2D5409]',
  estandar_internacional: 'bg-[#F3EDFB] text-[#5B2C8A]',
}

function ArchivoContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [results, setResults] = useState<Document[]>([])
  const [clusters, setClusters] = useState<Cluster[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [ambito, setAmbito] = useState(searchParams.get('ambito') || '')
  const [sourceType, setSourceType] = useState(searchParams.get('source') || '')

  useEffect(() => {
    if (!query.trim()) return

    setLoading(true)
    setError('')

    const params = new URLSearchParams()
    params.set('q', query)
    if (ambito) params.set('ambito', ambito)
    if (sourceType) params.set('source_type', sourceType)

    fetch(`${getApiUrl()}/api/v1/archivo/search?${params}`)
      .then(r => r.json())
      .then((d: SearchResponse) => {
        setResults(d.results)
        setClusters(d.clusters)
      })
      .catch(e => setError(e.message || 'Error en búsqueda'))
      .finally(() => setLoading(false))
  }, [query, ambito, sourceType])

  function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!query.trim()) return
    const params = new URLSearchParams()
    params.set('q', query)
    if (ambito) params.set('ambito', ambito)
    if (sourceType) params.set('source', sourceType)
    router.push(`/archivo?${params}`)
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <Link
          href="/hub"
          className="rounded-[8px] p-1.5 text-[#6B6760] hover:bg-[#F0EDE5] hover:text-[#1C1B18] transition-colors"
        >
          <ArrowLeft size={16} />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="font-serif text-[24px] font-semibold text-[#1C1B18]">ARCHIVO</h1>
          <p className="text-[13px] text-[#6B6760]">Búsqueda semántica en catálogo regulatorio y guías</p>
        </div>
      </div>

      {/* Search form */}
      <form onSubmit={handleSearch} className="mb-6 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#A8A49C]" />
          <input
            type="text"
            placeholder="Buscar regulaciones, guías, estándares…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyUp={e => {
              if (e.key === 'Enter') handleSearch(e as any)
            }}
            className="w-full rounded-[12px] border border-[#E8E4DC] bg-white pl-9 pr-4 py-3 sm:py-2.5 text-[14px] sm:text-[13px] placeholder:text-[#A8A49C] outline-none focus:border-[#3B6D11] focus:ring-2 focus:ring-[#3B6D11]/20"
            autoFocus
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          <select
            value={ambito}
            onChange={e => setAmbito(e.target.value)}
            className="rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-2 text-[11px] sm:text-[12px] outline-none focus:border-[#3B6D11]"
          >
            <option value="">Todos los ámbitos</option>
            <option value="federal">Federal</option>
            <option value="estatal">Estatal</option>
            <option value="norma_tecnica">Norma técnica</option>
            <option value="estandar_internacional">Estándar internacional</option>
          </select>

          <select
            value={sourceType}
            onChange={e => setSourceType(e.target.value)}
            className="rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-2 text-[11px] sm:text-[12px] outline-none focus:border-[#3B6D11]"
          >
            <option value="">Todos los tipos</option>
            <option value="iniciativa">Iniciativa</option>
            <option value="guide">Guía</option>
            <option value="standard">Estándar</option>
            <option value="case_study">Caso de estudio</option>
          </select>

          {(ambito || sourceType) && (
            <button
              type="button"
              onClick={() => {
                setAmbito('')
                setSourceType('')
              }}
              className="text-[11px] text-[#A8A49C] hover:text-[#C0392B] transition-colors"
            >
              Limpiar filtros
            </button>
          )}
        </div>
      </form>

      {/* Clusters summary */}
      {clusters.length > 0 && !loading && (
        <div className="mb-6 rounded-[12px] border border-[#E8E4DC] bg-white p-4">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-[#8E8980] mb-2">
            <FolderOpen size={12} className="inline mr-1" />
            Temas relacionados
          </p>
          <div className="flex flex-wrap gap-2">
            {clusters.map(c => (
              <button
                key={c.id}
                onClick={() => setQuery(c.tema_principal)}
                className="rounded-full border border-[#C9DDB1] bg-[#EAF3DE] px-3 py-1.5 text-[11px] font-semibold text-[#2D5409] hover:border-[#3B6D11] hover:bg-white transition-colors"
              >
                {c.nombre}
                <span className="ml-1 text-[10px] opacity-70">({c.doc_count})</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* States */}
      {error && (
        <div className="rounded-[10px] border border-red-200 bg-[#FBEAEA] px-4 py-3 text-[12px] text-[#7B1F1F]">
          {error}
        </div>
      )}

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={22} className="animate-spin text-[#3B6D11]" />
        </div>
      )}

      {!loading && query && results.length === 0 && !error && (
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-5 py-10 text-center">
          <Search size={24} className="mx-auto mb-2 text-[#A8A49C]" />
          <p className="text-[13px] text-[#8E8980]">Sin resultados para "{query}"</p>
          <p className="text-[11px] text-[#A8A49C] mt-1">Intenta con términos más generales</p>
        </div>
      )}

      {!loading && query && results.length > 0 && (
        <div className="space-y-3">
          <p className="text-[12px] text-[#8E8980] mb-4">
            {results.length} resultado{results.length !== 1 ? 's' : ''} para "{query}"
          </p>

          {results.map(doc => {
            const ambitoBg = doc.ambito ? AMBITO_COLORS[doc.ambito] : 'bg-[#F0EDE5] text-[#6B6760]'
            const scorePercent = doc.relevance_score ? Math.round(doc.relevance_score * 100) : 0

            return (
              <div key={doc.id} className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
                <div className="flex items-start gap-3">
                  {scorePercent > 0 && (
                    <div className="shrink-0 text-right">
                      <p className="text-[20px] font-bold text-[#3B6D11]">{scorePercent}</p>
                      <p className="text-[10px] text-[#A8A49C]">relevancia</p>
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <h3 className="text-[13px] font-semibold text-[#1C1B18] leading-snug">
                      {doc.titulo}
                    </h3>

                    <p className="mt-1 text-[12px] text-[#6B6760] leading-snug">
                      {doc.descripcion}
                    </p>

                    {doc.author_org && (
                      <p className="mt-1 text-[10px] text-[#A8A49C]">
                        Autor: {doc.author_org}
                      </p>
                    )}

                    {/* Tags & metadata */}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${ambitoBg}`}>
                        {doc.ambito || 'general'}
                      </span>

                      {doc.source_type && (
                        <span className="rounded-full border border-[#E8E4DC] bg-[#FAFAF8] px-2 py-0.5 text-[10px] text-[#6B6760]">
                          {SOURCE_LABELS[doc.source_type] || doc.source_type}
                        </span>
                      )}

                      {doc.tags.slice(0, 3).map(tag => (
                        <button
                          key={tag}
                          onClick={() => setQuery(tag)}
                          className="rounded-full border border-[#E8E4DC] bg-white px-2 py-0.5 text-[10px] text-[#3B6D11] hover:border-[#3B6D11] hover:bg-[#EAF3DE] transition-colors"
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>

                    {/* Action */}
                    {doc.url && (
                      <div className="mt-3">
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 rounded-[8px] border border-[#C9DDB1] bg-[#EAF3DE] px-3 py-1.5 text-[11px] font-semibold text-[#2D5409] hover:border-[#3B6D11] transition-colors"
                        >
                          <ExternalLink size={11} />
                          {doc.url_label || 'Ir al documento'}
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {!query && !loading && (
        <div className="rounded-[12px] border border-[#E8E4DC] bg-white px-5 py-12 text-center">
          <Search size={32} className="mx-auto mb-3 text-[#A8A49C]" />
          <p className="text-[14px] font-semibold text-[#1C1B18]">Busca en el catálogo regulatorio</p>
          <p className="mt-1 text-[12px] text-[#8E8980]">
            Encuentra regulaciones, guías, estándares y casos de estudio relevantes para tu municipio.
          </p>
        </div>
      )}

      {/* Footer */}
      {query && !loading && (
        <p className="mt-6 text-[10px] text-[#A8A49C]">
          ARCHIVO · búsqueda semántica · Sprint 39
        </p>
      )}
    </div>
  )
}

export default function ArchivoPage() {
  return (
    <AppShell>
      <Suspense fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 size={24} className="animate-spin text-[#3B6D11]" />
        </div>
      }>
        <ArchivoContent />
      </Suspense>
    </AppShell>
  )
}
