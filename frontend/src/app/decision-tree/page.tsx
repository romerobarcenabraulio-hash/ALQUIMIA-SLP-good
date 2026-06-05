'use client'

import { useEffect, useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Loader2, CheckCircle2, TrendingUp, FileText } from 'lucide-react'
import { AppShell } from '@/components/layout/AppShell'
import { getApiUrl } from '@/lib/api'

interface Question {
  id: string
  text: string
  tipo: string
  opciones: Array<{ id: string; label: string }>
  condition?: { campo: string; valor: string[] }
}

interface TreeType {
  id: string
  label: string
  questions_count: number
}

function authHdr(): HeadersInit {
  const t = typeof window !== 'undefined' ? localStorage.getItem('alquimia_token') : null
  return t ? { Authorization: `Bearer ${t}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' }
}

function DecisionTreeContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialTreeType = searchParams.get('type')

  const [treeTypes, setTreeTypes] = useState<TreeType[]>([])
  const [selectedType, setSelectedType] = useState(initialTreeType || '')
  const [questions, setQuestions] = useState<Question[]>([])
  const [sessionId, setSessionId] = useState('')
  const [currentStep, setCurrentStep] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [results, setResults] = useState<any>(null)

  // Load tree types
  useEffect(() => {
    async function loadTypes() {
      try {
        const res = await fetch(`${getApiUrl()}/api/v1/decision-tree/types`)
        const data = await res.json()
        setTreeTypes(data.types)
      } catch (e) {
        console.error('Error loading tree types:', e)
      } finally {
        setLoading(false)
      }
    }
    loadTypes()
  }, [])

  // Start tree when type is selected
  async function handleStartTree(type: string) {
    setSelectedType(type)
    setSaving(true)
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/decision-tree/start`, {
        method: 'POST',
        headers: authHdr(),
        body: JSON.stringify({
          tree_type: type,
          municipio: typeof window !== 'undefined' ? sessionStorage.getItem('alquimia_active_tenant_nombre') : null,
        }),
      })
      const data = await res.json()
      setSessionId(data.session_id)
      setQuestions(data.questions)
      setCurrentStep(0)
      setAnswers({})
    } catch (e) {
      console.error('Error starting tree:', e)
    } finally {
      setSaving(false)
    }
  }

  // Submit answers
  async function handleSubmitAnswers() {
    if (!sessionId) return
    setSaving(true)
    try {
      const res = await fetch(`${getApiUrl()}/api/v1/decision-tree/${sessionId}/answers`, {
        method: 'POST',
        headers: authHdr(),
        body: JSON.stringify({ answers }),
      })
      const data = await res.json()
      setResults(data)
    } catch (e) {
      console.error('Error submitting answers:', e)
    } finally {
      setSaving(false)
    }
  }

  // Filter visible questions based on conditions
  const visibleQuestions = questions.filter(q => {
    if (!q.condition) return true
    const condValue = answers[q.condition.campo]
    return q.condition.valor.includes(condValue)
  })

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[#3B6D11]" />
      </div>
    )
  }

  // Results view
  if (results) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6 flex items-center gap-3">
          <Link href="/hub" className="rounded-[8px] p-1.5 text-[#6B6760] hover:bg-[#F0EDE5] hover:text-[#1C1B18] transition-colors">
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="font-serif text-[24px] font-semibold text-[#1C1B18]">Diagnóstico Completado</h1>
            <p className="text-[13px] text-[#6B6760]">Tu perfil y estimaciones de residuos</p>
          </div>
        </div>

        {/* Results cards */}
        <div className="space-y-4">
          {/* ISIC Classification */}
          <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
            <p className="text-[11px] uppercase tracking-wide text-[#8E8980] mb-2">Clasificación</p>
            <p className="text-[16px] font-bold text-[#1C1B18]">{results.sector_desc}</p>
            <p className="text-[12px] text-[#6B6760] mt-1">ISIC: {results.sector_isic}</p>
          </div>

          {/* Residue Estimation */}
          <div className="rounded-[12px] border border-[#C9DDB1] bg-[#EAF3DE] p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] uppercase tracking-wide text-[#2D5409] mb-2">Generación Estimada</p>
                <p className="text-[28px] font-bold text-[#3B6D11]">{results.residue_generation_tons_mes}</p>
                <p className="text-[12px] text-[#2D5409]">toneladas/mes</p>
              </div>
              <div className="text-right">
                <p className="text-[12px] text-[#2D5409] font-semibold">Confianza</p>
                <p className="text-[20px] font-bold text-[#3B6D11]">{results.estimation_confidence_pct}%</p>
              </div>
            </div>
          </div>

          {/* Material Breakdown */}
          {results.residue_breakdown && (
            <div className="rounded-[12px] border border-[#E8E4DC] bg-white p-4">
              <p className="text-[11px] uppercase tracking-wide text-[#8E8980] mb-3">Desglose de materiales</p>
              <div className="space-y-2">
                {Object.entries(results.residue_breakdown).map(([material, tons]: any) => (
                  <div key={material} className="flex items-center justify-between">
                    <span className="text-[12px] text-[#1C1B18] capitalize">{material}</span>
                    <div className="text-right">
                      <span className="text-[12px] font-mono font-bold text-[#3B6D11]">{tons} tons</span>
                      <div className="mt-0.5 h-2 w-48 rounded-full bg-[#EAF3DE]">
                        <div
                          className="h-full rounded-full bg-[#3B6D11]"
                          style={{
                            width: `${((tons / results.residue_generation_tons_mes) * 100)}%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Compliance Guide */}
          {results.compliance_guide && (
            <div className="rounded-[12px] border border-[#E8F0FB] bg-white p-4">
              <p className="text-[11px] uppercase tracking-wide text-[#1A5FA8] mb-3">Guía de Cumplimiento</p>
              <h3 className="text-[14px] font-bold text-[#1C1B18] mb-2">{results.compliance_guide.titulo}</h3>
              <div className="space-y-3">
                {results.compliance_guide.sections.map((section: any) => (
                  <div key={section.id}>
                    <p className="text-[12px] font-semibold text-[#1C1B18]">{section.titulo}</p>
                    {section.regulations && (
                      <ul className="mt-1 space-y-1">
                        {section.regulations.map((reg: string, i: number) => (
                          <li key={i} className="text-[11px] text-[#6B6760]">· {reg}</li>
                        ))}
                      </ul>
                    )}
                    {section.practices && (
                      <ul className="mt-1 space-y-1">
                        {section.practices.map((p: string, i: number) => (
                          <li key={i} className="text-[11px] text-[#6B6760]">✓ {p}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="mt-6 flex gap-2">
            <button
              onClick={() => {
                setResults(null)
                setSelectedType('')
                setSessionId('')
              }}
              className="flex-1 rounded-[8px] border border-[#E8E4DC] px-3 py-2 text-[12px] font-semibold text-[#6B6760] hover:bg-[#F0EDE5] transition-colors"
            >
              Nuevo Diagnóstico
            </button>
            <Link
              href="/hub/generadores"
              className="flex-1 rounded-[8px] bg-[#3B6D11] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#2d5409] transition-colors text-center"
            >
              Crear Generador
            </Link>
          </div>
        </div>
      </div>
    )
  }

  // Tree selection view
  if (!selectedType) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-8">
          <h1 className="font-serif text-[26px] font-semibold text-[#1C1B18]">Diagnóstico Rápido</h1>
          <p className="text-[13px] text-[#6B6760] mt-1">Selecciona tu tipo de negocio para estimar residuos</p>
        </div>

        <div className="space-y-2">
          {treeTypes.map(t => (
            <button
              key={t.id}
              onClick={() => handleStartTree(t.id)}
              disabled={saving}
              className="w-full rounded-[12px] border border-[#E8E4DC] bg-white p-4 text-left hover:border-[#3B6D11] hover:shadow-sm transition-all disabled:opacity-40"
            >
              <p className="text-[13px] font-semibold text-[#1C1B18] capitalize">{t.label}</p>
              <p className="text-[11px] text-[#6B6760] mt-1">{t.questions_count} preguntas</p>
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Questionnaire view
  if (questions.length > 0 && !results) {
    const currentQuestion = visibleQuestions[currentStep]
    const progress = Math.round(((currentStep + 1) / visibleQuestions.length) * 100)

    return (
      <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h1 className="font-serif text-[20px] font-semibold text-[#1C1B18]">Diagnóstico</h1>
            <span className="text-[12px] text-[#6B6760]">{currentStep + 1} de {visibleQuestions.length}</span>
          </div>
          <div className="h-2 rounded-full bg-[#E8E4DC]">
            <div
              className="h-full rounded-full bg-[#3B6D11] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Question */}
        {currentQuestion && (
          <div className="space-y-4">
            <p className="text-[14px] font-semibold text-[#1C1B18]">{currentQuestion.text}</p>

            {/* Options */}
            <div className="space-y-2">
              {currentQuestion.opciones.map(op => (
                <button
                  key={op.id}
                  onClick={() => setAnswers({ ...answers, [currentQuestion.id]: op.id })}
                  className={`w-full rounded-[8px] border px-4 py-3 text-[12px] font-semibold transition-all ${
                    answers[currentQuestion.id] === op.id
                      ? 'border-[#3B6D11] bg-[#EAF3DE] text-[#3B6D11]'
                      : 'border-[#E8E4DC] bg-white text-[#1C1B18] hover:border-[#3B6D11]'
                  }`}
                >
                  {op.label}
                </button>
              ))}
            </div>

            {/* Navigation */}
            <div className="mt-6 flex gap-2">
              <button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                disabled={currentStep === 0}
                className="flex-1 rounded-[8px] border border-[#E8E4DC] px-3 py-2 text-[12px] font-semibold text-[#6B6760] hover:bg-[#F0EDE5] transition-colors disabled:opacity-40"
              >
                Anterior
              </button>
              {currentStep === visibleQuestions.length - 1 ? (
                <button
                  onClick={handleSubmitAnswers}
                  disabled={saving || !answers[currentQuestion.id]}
                  className="flex-1 rounded-[8px] bg-[#3B6D11] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#2d5409] transition-colors disabled:opacity-40"
                >
                  {saving ? <Loader2 size={12} className="inline animate-spin mr-1" /> : ''}Terminar
                </button>
              ) : (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!answers[currentQuestion.id]}
                  className="flex-1 rounded-[8px] bg-[#3B6D11] px-3 py-2 text-[12px] font-semibold text-white hover:bg-[#2d5409] transition-colors disabled:opacity-40"
                >
                  Siguiente
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    )
  }

  return null
}

export default function DecisionTreePage() {
  return (
    <AppShell>
      <Suspense fallback={
        <div className="flex min-h-[60vh] items-center justify-center">
          <Loader2 size={24} className="animate-spin text-[#3B6D11]" />
        </div>
      }>
        <DecisionTreeContent />
      </Suspense>
    </AppShell>
  )
}
