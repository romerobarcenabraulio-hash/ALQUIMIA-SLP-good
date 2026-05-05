'use client'

/**
 * ProvenanceBadge — badge inline que muestra el tier de confianza de un dato.
 *
 * Reglas de presentación (espejo exacto del contrato backend):
 *   oficial      → verde oscuro  — dato verificado de organismo autorizado en esta sesión
 *   certificado  → verde claro   — publicación oficial, no live API
 *   estimado     → amarillo      — proyección o modelo; badge con nota de incertidumbre
 *   manual       → naranja       — ingresado por equipo; requiere validación
 *   no_disponible → rojo         — bloquea lenguaje de certeza
 *
 * Props:
 *   tipo       — FuenteTipo del KPI
 *   confianza  — float 0-1, opcional; muestra barra si se provee
 *   fuente     — nombre corto de la fuente (se muestra en tooltip)
 *   advertencia — texto de advertencia (se muestra en tooltip si presente)
 *   compact    — si true, muestra solo el ícono sin label de texto
 */

import React, { useState } from 'react'
import type { FuenteTipo, DataProvenance } from '@/types'

// ─── Configuración visual por tier ───────────────────────────────────────────

interface TierConfig {
  label:     string
  icon:      string
  bg:        string
  text:      string
  border:    string
  tooltip:   string
}

const TIER_CONFIG: Record<FuenteTipo, TierConfig> = {
  oficial: {
    label:   'Oficial',
    icon:    '✓',
    bg:      'bg-green-800',
    text:    'text-green-100',
    border:  'border-green-700',
    tooltip: 'Dato verificado de organismo autorizado en esta sesión.',
  },
  certificado: {
    label:   'Certificado',
    icon:    '✓',
    bg:      'bg-green-600',
    text:    'text-green-50',
    border:  'border-green-500',
    tooltip: 'Publicación oficial verificable, no API en tiempo real.',
  },
  estimado: {
    label:   'Estimado',
    icon:    '~',
    bg:      'bg-yellow-500',
    text:    'text-yellow-950',
    border:  'border-yellow-400',
    tooltip: 'Proyección o valor derivado de modelo. Verificar antes de presentar como oficial.',
  },
  manual: {
    label:   'Manual',
    icon:    '!',
    bg:      'bg-orange-500',
    text:    'text-orange-50',
    border:  'border-orange-400',
    tooltip: 'Ingresado manualmente por el equipo. Requiere validación con fuente externa.',
  },
  no_disponible: {
    label:   'Sin dato',
    icon:    '✗',
    bg:      'bg-red-600',
    text:    'text-red-50',
    border:  'border-red-500',
    tooltip: 'Dato no disponible. No presentar como valor confirmado.',
  },
}

// ─── Componente principal ─────────────────────────────────────────────────────

interface ProvenanceBadgeProps {
  tipo:        FuenteTipo
  confianza?:  number
  fuente?:     string
  advertencia?: string | null
  compact?:    boolean
  className?:  string
}

export function ProvenanceBadge({
  tipo,
  confianza,
  fuente,
  advertencia,
  compact = false,
  className = '',
}: ProvenanceBadgeProps) {
  const [open, setOpen] = useState(false)
  const cfg = TIER_CONFIG[tipo]

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className={[
          'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-semibold border',
          'cursor-help select-none transition-opacity hover:opacity-80',
          cfg.bg, cfg.text, cfg.border, className,
        ].join(' ')}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        aria-label={`Fuente: ${cfg.label}${fuente ? ` — ${fuente}` : ''}`}
      >
        <span aria-hidden="true">{cfg.icon}</span>
        {!compact && <span>{cfg.label}</span>}
        {confianza !== undefined && !compact && (
          <span className="opacity-75 ml-1">
            {Math.round(confianza * 100)}%
          </span>
        )}
      </button>

      {open && (
        <div
          role="tooltip"
          className={[
            'absolute z-50 bottom-full left-0 mb-1.5 w-64',
            'bg-gray-900 text-gray-100 text-xs rounded-lg shadow-xl p-3',
            'border border-gray-700',
          ].join(' ')}
        >
          <p className="font-semibold mb-1">{cfg.label}</p>
          <p className="text-gray-300 mb-1">{cfg.tooltip}</p>
          {fuente && (
            <p className="text-gray-400 mt-1">
              <span className="font-medium">Fuente:</span> {fuente}
            </p>
          )}
          {confianza !== undefined && (
            <div className="mt-2">
              <div className="flex justify-between text-gray-400 mb-0.5">
                <span>Confianza</span>
                <span>{Math.round(confianza * 100)}%</span>
              </div>
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all"
                  style={{ width: `${Math.round(confianza * 100)}%` }}
                />
              </div>
            </div>
          )}
          {advertencia && (
            <p className="mt-2 text-yellow-300 border-t border-gray-700 pt-2">
              ⚠ {advertencia}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Variante para uso con DataProvenance completo ────────────────────────────

interface ProvenanceFromDataProps {
  provenance: DataProvenance
  compact?:   boolean
  className?: string
}

export function ProvenanceFromData({
  provenance,
  compact,
  className,
}: ProvenanceFromDataProps) {
  return (
    <ProvenanceBadge
      tipo={provenance.tipo}
      confianza={provenance.confianza}
      fuente={provenance.fuente_nombre}
      advertencia={provenance.advertencia}
      compact={compact}
      className={className}
    />
  )
}
