'use client'

import type { FormEvent } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { SocialAssumptionLogEntry } from '@/types/socialAssumptionsLog'
import {
  appendAssumptionEntry,
  loadAssumptionsState,
} from '@/lib/social/socialAssumptionsStorage'
import { EditorialCallout, MarginalNote, SectionLabel } from '@/components/editorial'

export type SocialAssumptionsLogProps = {
  /** Producto: `local` — localStorage; `session` — sessionStorage (no sobrevive cierre de pestaña). */
  persistence: 'local' | 'session'
  /** Pruebas: almacenamiento in-memory (aisla de `window.*Storage`). */
  _storageOverride?: Storage
}

export function SocialAssumptionsLog({ persistence, _storageOverride }: SocialAssumptionsLogProps) {
  const [entries, setEntries] = useState<SocialAssumptionLogEntry[]>([])
  const [texto, setTexto] = useState('')
  const [origen, setOrigen] = useState('')
  const [manual, setManual] = useState(true)

  const storage = useMemo(() => {
    if (_storageOverride) return _storageOverride
    if (typeof window === 'undefined') return null
    return persistence === 'session' ? window.sessionStorage : window.localStorage
  }, [persistence, _storageOverride])

  const refresh = useCallback(() => {
    if (!storage) return
    setEntries(loadAssumptionsState(storage).entries)
  }, [storage])

  useEffect(() => {
    if (!storage) return
    refresh()
  }, [storage, refresh])

  const onAppend = useCallback(
    (e: FormEvent) => {
      e.preventDefault()
      if (!storage || !texto.trim()) return
      appendAssumptionEntry(storage, {
        texto,
        origen: origen.trim() || undefined,
        manual,
      })
      setTexto('')
      setOrigen('')
      setManual(true)
      refresh()
    },
    [storage, texto, origen, manual, refresh],
  )

  return (
    <section
      data-testid="social-context-assumptions-log"
      data-persistence={persistence}
      className="mt-6 border-t border-[#E8E4DC] pt-6"
      aria-label="Bitácora de supuestos — solo anexión"
    >
      <SectionLabel>Bitácora de supuestos</SectionLabel>
      <h4 className="mt-1 font-serif text-[18px] text-[#1C1B18]">Registro append-only</h4>
      <MarginalNote className="max-w-3xl">
        Las entradas se añaden al final; no se editan ni eliminan desde esta interfaz. Persistencia:{' '}
        <span className="font-medium text-[#1C1B18]">
          {persistence === 'session' ? 'sesión (sessionStorage)' : 'navegador (localStorage)'}
        </span>
        , clave con prefijo <span className="font-mono text-[11px]">alquimia.social.</span>
      </MarginalNote>

      <form
        data-testid="social-context-assumptions-form"
        onSubmit={onAppend}
        className="mt-4 grid gap-3 rounded-[10px] border border-[#E8E4DC] bg-white p-3"
      >
        <label className="grid gap-1">
          <span className="text-[10px] uppercase tracking-wide text-[#6B6760]">Supuesto o nota</span>
          <textarea
            value={texto}
            onChange={e => setTexto(e.target.value)}
            rows={3}
            className="rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] px-3 py-2 text-[13px] text-[#1C1B18]"
            placeholder="Describe el supuesto (no se valida como hecho verificado)."
            data-testid="social-context-assumptions-input-texto"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-[10px] uppercase tracking-wide text-[#6B6760]">Origen (opcional)</span>
          <input
            type="text"
            value={origen}
            onChange={e => setOrigen(e.target.value)}
            className="rounded-[8px] border border-[#E8E4DC] bg-[#FDFCFA] px-3 py-2 text-[13px] text-[#1C1B18]"
            placeholder="Ej. taller interno, minuta, lectura preliminar"
            data-testid="social-context-assumptions-input-origen"
          />
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-[12px] text-[#1C1B18]">
          <input
            type="checkbox"
            checked={manual}
            onChange={e => setManual(e.target.checked)}
            className="h-4 w-4 accent-[#3B6D11]"
            data-testid="social-context-assumptions-input-manual"
          />
          Entrada manual en esta pantalla
        </label>
        <button
          type="submit"
          disabled={!texto.trim()}
          data-testid="social-context-assumptions-append"
          className="w-fit rounded-[8px] bg-[#1C1B18] px-4 py-2 text-[12px] font-medium text-white transition-colors hover:bg-[#3B6D11] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Añadir a la bitácora
        </button>
      </form>

      <div className="mt-4">
        <p className="text-[10px] uppercase tracking-wide text-[#6B6760]">Entradas ({entries.length})</p>
        {entries.length === 0 ? (
          <div data-testid="social-context-assumptions-empty">
            <EditorialCallout className="mt-2 pt-2">
              Sin entradas aún. Los registros aparecen en orden cronológico de alta.
            </EditorialCallout>
          </div>
        ) : (
          <ol className="mt-2 grid list-decimal gap-2 pl-5 text-[12px] text-[#1C1B18]">
            {entries.map(entry => (
              <li
                key={entry.id}
                data-testid="social-context-assumption-row"
                data-entry-id={entry.id}
                className="rounded-[8px] border border-[#E8E4DC] bg-white px-3 py-2 marker:font-mono marker:text-[#6B6760]"
              >
                <p className="whitespace-pre-wrap leading-relaxed">{entry.texto}</p>
                <p className="mt-1 font-mono text-[10px] text-[#6B6760]">
                  {entry.timestamp}
                  {entry.origen ? ` · ${entry.origen}` : ''}
                  {entry.manual ? ' · manual' : ''}
                </p>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  )
}
