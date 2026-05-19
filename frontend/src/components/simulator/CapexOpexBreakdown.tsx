'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import {
  CAPEX_CA, OPEX_CA, EQUIPOS_CA, PERSONAL_CA,
  RECICLADORAS, FASES_INVERSION, SUPUESTOS_GENERALES,
  BENCHMARKS_EXTERNOS,
  type GiroRecicladora,
} from '@/lib/capexOpexData'
import type { TamañoCA } from '@/types'

// ─── Helpers de formato ────────────────────────────────────────────────────

function fmtMXN(n: number, compact = false): string {
  if (compact) {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
    if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`
    return `$${n.toLocaleString('es-MX')}`
  }
  return `$${n.toLocaleString('es-MX', { maximumFractionDigits: 0 })}`
}

function fmtPct(n: number): string {
  return `${n >= 0 ? '+' : ''}${n.toFixed(1)}%`
}

// ─── Sub-componente: badge de fuente ──────────────────────────────────────

function FuenteBadge({ text }: { text: string }) {
  return (
    <span className="inline-block rounded px-1.5 py-0.5 text-[10px] font-medium bg-[#EAF3DE] text-[#3B6D11] border border-[#3B6D11]/20">
      {text}
    </span>
  )
}

// ─── Sección con título ────────────────────────────────────────────────────

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-[#1A3A1A]">{title}</h3>
        {subtitle && <p className="text-xs text-[#5A7A5A] mt-0.5">{subtitle}</p>}
      </div>
      {children}
    </div>
  )
}

// ─── Panel de escala CA ────────────────────────────────────────────────────

const ESCALA_LABELS: Record<TamañoCA, string> = { P: 'Pequeño (5 t/día)', M: 'Mediano (15 t/día)', G: 'Grande (50 t/día)' }
const ESCALA_CAPS: Record<TamañoCA, string> = { P: '200 m²', M: '500 m²', G: '1,500 m²' }

function CAScalePanel({ escala }: { escala: TamañoCA }) {
  const capex = CAPEX_CA[escala]
  const opex  = OPEX_CA[escala]
  const equip = EQUIPOS_CA[escala]
  const nom   = PERSONAL_CA[escala]

  const capexItems = [
    { label: 'Equipamiento',                                     val: capex.equipamiento },
    { label: 'Adecuación de nave',                               val: capex.adecuacionNave },
    { label: 'Gastos preoperativos',                             val: capex.gastosPreoperativos },
    { label: 'Contingencia 10% (equip. + nave) — EBRD/GIZ',    val: capex.contingencia },
    { label: 'Capital de trabajo (3 meses OPEX) — World Bank',  val: capex.capitalTrabajo },
  ]

  const opexItems = [
    { label: 'Renta zona industrial',              val: opex.rentaMes },
    { label: 'Energía eléctrica',                 val: opex.energiaElectricaMes },
    { label: 'Combustible / gas LP',              val: opex.combustibleGasLPMes },
    { label: 'Nómina con prestaciones (1.35×)',   val: opex.nominaConPrestaciones },
    { label: 'Transporte / combustible vehículos',val: opex.transporteCombustible },
    { label: 'Mantenimiento equipo (2.5% CAPEX/12)', val: opex.mantenimientoEquipo },
    { label: 'Insumos y consumibles de línea',    val: opex.insumosQuimicos + opex.consumiblesLinea },
    { label: 'Agua y servicios',                  val: opex.aguaServicios },
    { label: 'Seguros (0.5% CAPEX total / 12)',   val: opex.seguros },
  ]

  return (
    <div className="space-y-5">
      {/* CAPEX */}
      <div>
        <p className="text-xs font-semibold text-[#3B6D11] uppercase tracking-wide mb-2">CAPEX total</p>
        <table className="w-full text-xs border border-[#E8E4DC] rounded-lg overflow-hidden">
          <thead className="bg-[#F5F3EE]">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-[#4A6741]">Concepto</th>
              <th className="text-right px-3 py-2 font-medium text-[#4A6741]">MXN</th>
              <th className="text-right px-3 py-2 font-medium text-[#4A6741]">%</th>
            </tr>
          </thead>
          <tbody>
            {capexItems.map((it, i) => (
              <tr key={i} className={cn('border-t border-[#F0EDE8]', i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]')}>
                <td className="px-3 py-2 text-[#3A3A3A]">{it.label}</td>
                <td className="px-3 py-2 text-right font-mono text-[#1A3A1A]">{fmtMXN(it.val)}</td>
                <td className="px-3 py-2 text-right text-[#7A8A7A]">{((it.val / capex.totalCAPEX) * 100).toFixed(0)}%</td>
              </tr>
            ))}
            <tr className="border-t-2 border-[#3B6D11] bg-[#EAF3DE]">
              <td className="px-3 py-2 font-semibold text-[#1A3A1A]">CAPEX TOTAL</td>
              <td className="px-3 py-2 text-right font-semibold font-mono text-[#1A3A1A]">{fmtMXN(capex.totalCAPEX)}</td>
              <td className="px-3 py-2 text-right font-semibold text-[#3B6D11]">100%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* OPEX */}
      <div>
        <p className="text-xs font-semibold text-[#1A5FA8] uppercase tracking-wide mb-2">OPEX mensual (sin costo de compra de MP)</p>
        <table className="w-full text-xs border border-[#E8E4DC] rounded-lg overflow-hidden">
          <thead className="bg-[#EBF3FB]">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-[#1A5FA8]">Concepto</th>
              <th className="text-right px-3 py-2 font-medium text-[#1A5FA8]">MXN / mes</th>
              <th className="text-right px-3 py-2 font-medium text-[#1A5FA8]">%</th>
            </tr>
          </thead>
          <tbody>
            {opexItems.map((it, i) => (
              <tr key={i} className={cn('border-t border-[#EBF0F8]', i % 2 === 0 ? 'bg-white' : 'bg-[#FAFCFF]')}>
                <td className="px-3 py-2 text-[#3A3A3A]">{it.label}</td>
                <td className="px-3 py-2 text-right font-mono text-[#1A3A60]">{fmtMXN(it.val)}</td>
                <td className="px-3 py-2 text-right text-[#7A8A9A]">{opex.totalOPEXMes > 0 ? ((it.val / opex.totalOPEXMes) * 100).toFixed(0) : '—'}%</td>
              </tr>
            ))}
            <tr className="border-t-2 border-[#1A5FA8] bg-[#EBF3FB]">
              <td className="px-3 py-2 font-semibold text-[#1A3A60]">OPEX TOTAL / mes</td>
              <td className="px-3 py-2 text-right font-semibold font-mono text-[#1A3A60]">{fmtMXN(opex.totalOPEXMes)}</td>
              <td className="px-3 py-2 text-right font-semibold text-[#1A5FA8]">100%</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Nómina detalle */}
      <div>
        <p className="text-xs font-semibold text-[#5A4A0A] uppercase tracking-wide mb-2">Estructura de personal</p>
        <table className="w-full text-xs border border-[#E8E4DC] rounded-lg overflow-hidden">
          <thead className="bg-[#FEF7E7]">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-[#7A5A0A]">Puesto</th>
              <th className="text-right px-3 py-2 font-medium text-[#7A5A0A]">Cant.</th>
              <th className="text-right px-3 py-2 font-medium text-[#7A5A0A]">Salario bruto / mes</th>
              <th className="text-right px-3 py-2 font-medium text-[#7A5A0A]">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {nom.puestos.map((p, i) => (
              <tr key={i} className={cn('border-t border-[#F5EFD8]', i % 2 === 0 ? 'bg-white' : 'bg-[#FDFBF5]')}>
                <td className="px-3 py-2 text-[#3A3A3A]">{p.puesto}</td>
                <td className="px-3 py-2 text-right text-[#3A3A3A]">{p.cantidad}</td>
                <td className="px-3 py-2 text-right font-mono">{fmtMXN(p.salarioBrutoMes)}</td>
                <td className="px-3 py-2 text-right font-mono">{fmtMXN(p.subtotal)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-[#D4A820] bg-[#FEF7E7]">
              <td className="px-3 py-2 text-xs text-[#7A5A0A]">Subtotal bruto</td>
              <td className="px-3 py-2 text-right font-semibold">{nom.puestos.reduce((s, p) => s + p.cantidad, 0)}</td>
              <td className="px-3 py-2"></td>
              <td className="px-3 py-2 text-right font-semibold font-mono">{fmtMXN(nom.subtotalBruto)}</td>
            </tr>
            <tr className="border-t-2 border-[#D4A820] bg-[#FEF7E7]">
              <td colSpan={3} className="px-3 py-2 font-semibold text-[#5A3A0A]">
                Total con prestaciones <span className="font-normal text-[#8A6A1A]">(factor {nom.factorPrestaciones}× — IMSS patronal + ISN + SAR + Infonavit + aguinaldo + vacaciones)</span>
              </td>
              <td className="px-3 py-2 text-right font-semibold font-mono text-[#5A3A0A]">{fmtMXN(nom.totalConPrestaciones)}</td>
            </tr>
          </tfoot>
        </table>
        <p className="text-[10px] text-[#9A8A5A] mt-1">
          Fuente: Tabulador IMSS Rama 37 (recolección y reciclaje), vigente 2025.
        </p>
      </div>

      {/* Equipos */}
      <div>
        <p className="text-xs font-semibold text-[#4A4A4A] uppercase tracking-wide mb-2">Catálogo de equipos</p>
        <div className="border border-[#E8E4DC] rounded-lg overflow-x-auto">
          <table className="w-full text-xs min-w-[640px]">
            <thead className="bg-[#F5F3EE]">
              <tr>
                <th className="text-left px-3 py-2 font-medium text-[#4A4A4A]">Equipo</th>
                <th className="text-left px-3 py-2 font-medium text-[#4A4A4A]">Marca</th>
                <th className="text-right px-3 py-2 font-medium text-[#4A4A4A]">Cant.</th>
                <th className="text-right px-3 py-2 font-medium text-[#4A4A4A]">Unit. MXN</th>
                <th className="text-right px-3 py-2 font-medium text-[#4A4A4A]">Total</th>
                <th className="text-right px-3 py-2 font-medium text-[#4A4A4A]">kW</th>
                <th className="text-right px-3 py-2 font-medium text-[#4A4A4A]">Costo energía / mes</th>
              </tr>
            </thead>
            <tbody>
              {equip.map((eq, i) => (
                <tr key={i} className={cn('border-t border-[#F0EDE8]', i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]')}>
                  <td className="px-3 py-2 text-[#2A2A2A]">
                    {eq.nombre}
                    {eq.nota && <span className="ml-1 text-[#9A8A5A] text-[10px]">({eq.nota})</span>}
                  </td>
                  <td className="px-3 py-2 text-[#5A5A5A]">{eq.marca}</td>
                  <td className="px-3 py-2 text-right">{eq.cantidad}</td>
                  <td className="px-3 py-2 text-right font-mono">{fmtMXN(eq.precioUnitMXN)}</td>
                  <td className="px-3 py-2 text-right font-mono font-medium">{fmtMXN(eq.totalMXN)}</td>
                  <td className="px-3 py-2 text-right">{eq.potenciaKW > 0 ? eq.potenciaKW : '—'}</td>
                  <td className="px-3 py-2 text-right font-mono">{eq.costoEnergiaMes > 0 ? fmtMXN(eq.costoEnergiaMes) : '—'}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-[#4A4A4A] bg-[#F5F3EE]">
                <td colSpan={4} className="px-3 py-2 font-semibold">Total equipamiento</td>
                <td className="px-3 py-2 text-right font-semibold font-mono">{fmtMXN(equip.reduce((s, e) => s + e.totalMXN, 0))}</td>
                <td></td>
                <td className="px-3 py-2 text-right font-semibold font-mono">{fmtMXN(equip.reduce((s, e) => s + e.costoEnergiaMes, 0))} / mes</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p className="text-[10px] text-[#9A8A5A] mt-1">
          Fuente: Centros_Acopio_v2.xlsx, Bloque B. Tarifa eléctrica {SUPUESTOS_GENERALES.tarifaElectricaSLP} MXN/kWh (CFE GDMTH SLP).
          Factor contingencia energética: {SUPUESTOS_GENERALES.factorContingenciaEnergetica}×.
        </p>
      </div>
    </div>
  )
}

// ─── Panel de recicladora por giro ────────────────────────────────────────

const GIRO_LABELS: Record<GiroRecicladora, string> = {
  pet:      'PET (flake / pellet)',
  papel:    'Papel / Cartón',
  aluminio: 'Aluminio (fundición)',
  vidrio:   'Vidrio (cullet)',
  organicos:'Orgánicos (composta + biodigestor)',
}

const GIRO_COLORS: Record<GiroRecicladora, string> = {
  pet:      'bg-[#EBF3FB] text-[#1A5FA8] border-[#1A5FA8]/30',
  papel:    'bg-[#FEF7E7] text-[#7A5A0A] border-[#D4A820]/40',
  aluminio: 'bg-[#F3EBF8] text-[#6A1A8A] border-[#6A1A8A]/30',
  vidrio:   'bg-[#EBF8F5] text-[#0A6A5A] border-[#0A6A5A]/30',
  organicos:'bg-[#EAF3DE] text-[#3B6D11] border-[#3B6D11]/30',
}

function RecicladorePanel({ giro }: { giro: GiroRecicladora }) {
  const r = RECICLADORAS[giro]

  const capexItems = [
    { label: 'Equipamiento',                                     val: r.capex.equipamiento },
    { label: 'Adecuación de nave',                               val: r.capex.adecuacionNave },
    { label: 'Gastos preoperativos',                             val: r.capex.gastosPreoperativos },
    { label: 'Contingencia 10% (equip. + nave) — EBRD/GIZ',    val: r.capex.contingencia },
    { label: 'Capital de trabajo — World Bank',                  val: r.capex.capitalTrabajo },
  ]

  const opexMostrar = [
    { label: 'CMV — Compra MP en centros de acopio', val: r.opex.cmvCompraMPMes },
    { label: 'Renta zona industrial',                val: r.opex.rentaMes },
    { label: 'Energía eléctrica',                   val: r.opex.energiaElectricaMes },
    { label: 'Combustible / gas LP',                val: r.opex.combustibleGasLPMes },
    { label: 'Nómina con prestaciones',             val: r.opex.nominaConPrestaciones },
    { label: 'Transporte y flete a comprador',      val: r.opex.transporteCombustible + r.opex.fleteComprador },
    { label: 'Mantenimiento + consumibles',         val: r.opex.mantenimientoEquipo + r.opex.consumiblesLinea },
    { label: 'Insumos + agua y servicios',          val: r.opex.insumosQuimicos + r.opex.aguaServicios },
    { label: 'Seguros',                             val: r.opex.seguros },
  ]

  const viable = r.tirProyecto > 0 && r.paybackMeses < 999

  return (
    <div className="space-y-5">
      {/* KPIs de viabilidad */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'CAPEX total', val: fmtMXN(r.capexTotal, true), sub: '' },
          { label: 'OPEX / mes',  val: fmtMXN(r.opexMes, true), sub: '(incl. CMV MP)' },
          { label: 'TIR proyecto', val: viable ? `${r.tirProyecto.toFixed(1)}%` : 'No viable', sub: 'Esc. 40% captura', negative: !viable },
          { label: 'Payback', val: r.paybackMeses >= 999 ? 'No viable' : `${r.paybackMeses.toFixed(1)} meses`, sub: '', negative: r.paybackMeses >= 999 },
        ].map((k, i) => (
          <div key={i} className={cn('rounded-lg border p-3', k.negative ? 'border-red-200 bg-red-50' : 'border-[#E8E4DC] bg-white')}>
            <p className="text-[10px] text-[#6A6A6A] uppercase tracking-wide">{k.label}</p>
            <p className={cn('text-base font-semibold mt-0.5', k.negative ? 'text-red-600' : 'text-[#1A3A1A]')}>{k.val}</p>
            {k.sub && <p className="text-[10px] text-[#9A9A9A]">{k.sub}</p>}
          </div>
        ))}
      </div>

      {!viable && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-800">
          <strong>Nota analítica:</strong> Este giro no es autosustentable como negocio independiente en el escenario base (40% captura).
          Su inclusión en el sistema es estratégica por externalidades ambientales y de empleo, y su viabilidad mejora en el escenario de fondos de impacto (80% captura).
        </div>
      )}

      {/* Compradores ancla */}
      <div>
        <p className="text-xs font-semibold text-[#4A4A4A] mb-1.5">Compradores ancla</p>
        <div className="flex flex-wrap gap-2">
          {r.compradoresAncla.map((c, i) => (
            <span key={i} className="text-xs rounded-full border border-[#D8D4CC] bg-white px-2.5 py-1 text-[#3A3A3A]">{c}</span>
          ))}
        </div>
        <p className="text-[10px] text-[#9A9A9A] mt-1">
          Rendimiento proceso: {(r.rendimientoKgKg * 100).toFixed(0)}% — Precio compra MP en CAs: {fmtMXN(r.precioCompraMPAcopio)}/kg —
          Precio venta procesado: {fmtMXN(r.precioVentaProcesado)}/kg — Nave: {r.naveM2} m²
        </p>
      </div>

      {/* CAPEX */}
      <div className="grid md:grid-cols-2 gap-4">
        <div>
          <p className="text-xs font-semibold text-[#3B6D11] uppercase tracking-wide mb-2">CAPEX</p>
          <table className="w-full text-xs border border-[#E8E4DC] rounded-lg overflow-hidden">
            <tbody>
              {capexItems.map((it, i) => (
                <tr key={i} className={cn('border-t border-[#F0EDE8]', i === 0 ? '' : '', i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]')}>
                  <td className="px-3 py-2 text-[#3A3A3A]">{it.label}</td>
                  <td className="px-3 py-2 text-right font-mono">{fmtMXN(it.val)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-[#3B6D11] bg-[#EAF3DE]">
                <td className="px-3 py-2 font-semibold">CAPEX TOTAL</td>
                <td className="px-3 py-2 text-right font-semibold font-mono">{fmtMXN(r.capexTotal)}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div>
          <p className="text-xs font-semibold text-[#1A5FA8] uppercase tracking-wide mb-2">OPEX mensual</p>
          <table className="w-full text-xs border border-[#E8E4DC] rounded-lg overflow-hidden">
            <tbody>
              {opexMostrar.map((it, i) => (
                <tr key={i} className={cn('border-t border-[#EBF0F8]', i % 2 === 0 ? 'bg-white' : 'bg-[#FAFCFF]')}>
                  <td className="px-3 py-2 text-[#3A3A3A]">{it.label}</td>
                  <td className="px-3 py-2 text-right font-mono">{fmtMXN(it.val)}</td>
                </tr>
              ))}
              <tr className="border-t-2 border-[#1A5FA8] bg-[#EBF3FB]">
                <td className="px-3 py-2 font-semibold">OPEX TOTAL / mes</td>
                <td className="px-3 py-2 text-right font-semibold font-mono">{fmtMXN(r.opex.totalOPEXMes)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Personal */}
      <div>
        <p className="text-xs font-semibold text-[#5A4A0A] uppercase tracking-wide mb-2">Personal</p>
        <div className="flex flex-wrap gap-2">
          {r.nomina.puestos.map((p, i) => (
            <div key={i} className="rounded-lg border border-[#E8E4DC] bg-white px-3 py-2 text-xs">
              <p className="font-medium text-[#2A2A2A]">{p.puesto} <span className="text-[#6A6A6A]">× {p.cantidad}</span></p>
              <p className="text-[#7A7A7A]">{fmtMXN(p.salarioBrutoMes)} bruto/mes</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-[#9A8A5A] mt-2">
          Total con prestaciones 1.35×: <strong>{fmtMXN(r.nomina.totalConPrestaciones)}/mes</strong> —
          Empleos directos por planta: <strong>{r.empleosPorPlanta}</strong>
        </p>
      </div>
    </div>
  )
}

// ─── Tabla sistema integrado por fases ────────────────────────────────────

function SistemaIntegradoTable() {
  return (
    <div>
      <div className="border border-[#E8E4DC] rounded-lg overflow-x-auto">
        <table className="w-full text-xs min-w-[700px]">
          <thead className="bg-[#F5F3EE]">
            <tr>
              <th className="text-left px-3 py-2 font-medium text-[#4A4A4A]">Fase</th>
              <th className="text-left px-3 py-2 font-medium text-[#4A4A4A]">Mix CAs</th>
              <th className="text-right px-3 py-2 font-medium text-[#4A4A4A]">CAs</th>
              <th className="text-right px-3 py-2 font-medium text-[#4A4A4A]">t/día</th>
              <th className="text-right px-3 py-2 font-medium text-[#3B6D11]">CAPEX CAs</th>
              <th className="text-right px-3 py-2 font-medium text-[#1A5FA8]">CAPEX Recicladoras</th>
              <th className="text-right px-3 py-2 font-medium text-[#4A4A4A]">CAPEX Total</th>
              <th className="text-right px-3 py-2 font-medium text-[#4A4A4A]">EBITDA / mes</th>
              <th className="text-right px-3 py-2 font-medium text-[#4A4A4A]">Empleos</th>
            </tr>
          </thead>
          <tbody>
            {FASES_INVERSION.map((f, i) => (
              <tr key={f.fase} className={cn(
                'border-t border-[#F0EDE8]',
                f.nombre.includes('Óptimo') ? 'bg-[#EAF3DE]' : i % 2 === 0 ? 'bg-white' : 'bg-[#FAFAF8]',
              )}>
                <td className="px-3 py-2 font-medium text-[#2A2A2A]">
                  {f.nombre.includes('Óptimo') ? (
                    <span className="flex items-center gap-1">
                      {f.nombre}
                      <span className="text-[10px] bg-[#3B6D11] text-white rounded px-1 py-0.5">IEMPI óptimo</span>
                    </span>
                  ) : f.nombre}
                </td>
                <td className="px-3 py-2 font-mono text-[#5A5A5A]">{f.mixCAs}</td>
                <td className="px-3 py-2 text-right">{f.nCAs}</td>
                <td className="px-3 py-2 text-right">{f.capTonDia}</td>
                <td className="px-3 py-2 text-right font-mono text-[#3B6D11]">{fmtMXN(f.capexCAs, true)}</td>
                <td className="px-3 py-2 text-right font-mono text-[#1A5FA8]">
                  {f.capexRecicladoras > 0 ? fmtMXN(f.capexRecicladoras, true) : '—'}
                </td>
                <td className="px-3 py-2 text-right font-semibold font-mono">{fmtMXN(f.capexTotalSistema, true)}</td>
                <td className="px-3 py-2 text-right font-mono">{fmtMXN(f.ebitdaMesSistema, true)}</td>
                <td className="px-3 py-2 text-right font-semibold">{f.empleosTotales}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-[#9A8A5A] mt-2">
        Fuente: Centros_Acopio_v2.xlsx — Modelo Optimización, Secciones 2–5.
        Modelo IEC multicriterio: α×(EBITDA/CAPEX) + β×(1/Payback) + γ×(VPN/CAPEX) − δ×(OPEX/Ingreso).
        Fase óptima determinada por IEMPI (Eficiencia Marginal por Peso Invertido) máximo en transición 4→5.
      </p>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────

type TabMain = 'cas' | 'recicladoras' | 'sistema'

export function CapexOpexBreakdown() {
  const [tabMain, setTabMain] = useState<TabMain>('cas')
  const [escala, setEscala]   = useState<TamañoCA>('P')
  const [giro, setGiro]       = useState<GiroRecicladora>('pet')

  const TABS_MAIN: Array<{ id: TabMain; label: string }> = [
    { id: 'cas',         label: 'Centros de Acopio' },
    { id: 'recicladoras',label: 'Recicladoras por giro' },
    { id: 'sistema',     label: 'Sistema integrado por fase' },
  ]

  const ESCALAS: TamañoCA[] = ['P', 'M', 'G']
  const GIROS: GiroRecicladora[] = ['pet', 'papel', 'aluminio', 'vidrio', 'organicos']

  return (
    <div className="space-y-6">

      {/* Encabezado */}
      <div className="rounded-xl border border-[#E8E4DC] bg-[#FAFAF8] px-4 py-3">
        <h2 className="text-sm font-semibold text-[#1A3A1A]">Desglose CAPEX / OPEX</h2>
        <p className="text-xs text-[#5A7A5A] mt-0.5">
          Datos verificados desde los modelos financieros CFO. Precios referencia: marzo 2026 (ANIPAC / CEMPRE México).
          Salarios: tabulador IMSS Rama 37, 2025. Factor prestaciones: 1.35×.
        </p>
        <div className="flex flex-wrap gap-2 mt-2">
          <FuenteBadge text="Centros_Acopio_v2.xlsx" />
          <FuenteBadge text="Recicladoras_por_Giro.xlsx" />
          <FuenteBadge text="IMSS Rama 37 · 2025" />
          <FuenteBadge text="CFE GDMTH SLP: $3.00/kWh" />
        </div>
      </div>

      {/* Tabs principales */}
      <div className="flex gap-1 border-b border-[#E8E4DC]">
        {TABS_MAIN.map(t => (
          <button
            key={t.id}
            onClick={() => setTabMain(t.id)}
            className={cn(
              'px-4 py-2 text-xs font-medium rounded-t border-b-2 -mb-px transition-colors',
              tabMain === t.id
                ? 'border-[#3B6D11] text-[#3B6D11] bg-white'
                : 'border-transparent text-[#6A6A6A] hover:text-[#3A3A3A]',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab: Centros de Acopio */}
      {tabMain === 'cas' && (
        <div>
          <div className="flex gap-2 mb-5">
            {ESCALAS.map(e => (
              <button
                key={e}
                onClick={() => setEscala(e)}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-lg border font-medium transition-colors',
                  escala === e
                    ? 'bg-[#3B6D11] text-white border-[#3B6D11]'
                    : 'bg-white text-[#4A4A4A] border-[#D8D4CC] hover:border-[#3B6D11]',
                )}
              >
                {ESCALA_LABELS[e]}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-5">
            {[
              { label: 'Superficie',   val: ESCALA_CAPS[escala] },
              { label: 'CAPEX total',  val: fmtMXN(CAPEX_CA[escala].totalCAPEX) },
              { label: 'OPEX / mes',   val: fmtMXN(OPEX_CA[escala].totalOPEXMes) },
            ].map((k, i) => (
              <div key={i} className="rounded-lg border border-[#E8E4DC] bg-white p-3">
                <p className="text-[10px] text-[#6A6A6A] uppercase tracking-wide">{k.label}</p>
                <p className="text-base font-semibold text-[#1A3A1A] mt-0.5">{k.val}</p>
              </div>
            ))}
          </div>
          <CAScalePanel escala={escala} />
        </div>
      )}

      {/* Tab: Recicladoras */}
      {tabMain === 'recicladoras' && (
        <div>
          <div className="flex flex-wrap gap-2 mb-5">
            {GIROS.map(g => (
              <button
                key={g}
                onClick={() => setGiro(g)}
                className={cn(
                  'px-3 py-1.5 text-xs rounded-full border font-medium transition-colors',
                  giro === g
                    ? GIRO_COLORS[g]
                    : 'bg-white text-[#4A4A4A] border-[#D8D4CC] hover:border-[#3B6D11]',
                )}
              >
                {GIRO_LABELS[g]}
              </button>
            ))}
          </div>
          <RecicladorePanel giro={giro} />
        </div>
      )}

      {/* Tab: Sistema integrado */}
      {tabMain === 'sistema' && (
        <div>
          <Section
            title="Sistema integrado CAs + Recicladoras por fase de escalamiento"
            subtitle="Modelo de optimización multicriterio IEC. Arreglo óptimo determinado por IEMPI máximo (Fase 5: Madurez)."
          >
            <SistemaIntegradoTable />
          </Section>

          <div className="grid md:grid-cols-3 gap-3 mt-4">
            {[
              { label: 'Fase óptima (IEMPI max)', val: 'Fase 5 — Madurez', sub: '10P + 6M + 2G + 4 recicladoras' },
              { label: 'CAPEX sistema Fase 5', val: fmtMXN(48_304_493, true), sub: '$35.5M CAs + $12.8M recicladoras' },
              { label: 'Empleos directos Fase 5', val: '248', sub: '168 en CAs + 80 en recicladoras' },
            ].map((k, i) => (
              <div key={i} className="rounded-lg border border-[#E8E4DC] bg-white p-3">
                <p className="text-[10px] text-[#6A6A6A] uppercase tracking-wide">{k.label}</p>
                <p className="text-base font-semibold text-[#1A3A1A] mt-0.5">{k.val}</p>
                <p className="text-[10px] text-[#9A9A9A] mt-0.5">{k.sub}</p>
              </div>
            ))}
          </div>

          {/* Validación cruzada con benchmarks externos */}
          <div className="mt-6 rounded-xl border border-[#E8E4DC] overflow-hidden">
            <div className="bg-[#F5F3EE] px-4 py-3 border-b border-[#E8E4DC]">
              <h3 className="text-xs font-semibold text-[#3A3A3A]">Validación cruzada — benchmarks externos</h3>
              <p className="text-[10px] text-[#7A7A7A] mt-0.5">
                Fuentes: World Bank MSW Guidelines 2024 · FONADIN/BANOBRAS PRORESOL · EBRD/GIZ Moldova SF · INEGI ENOE T1-2025
              </p>
            </div>
            <div className="divide-y divide-[#F0EDE8]">
              {[
                {
                  concepto: 'CAPEX centro de acopio (rango mercado MX)',
                  benchmarkExterno: `${fmtMXN(BENCHMARKS_EXTERNOS.capexCentroAcopioMXN.min, true)} – ${fmtMXN(BENCHMARKS_EXTERNOS.capexCentroAcopioMXN.max, true)}`,
                  modeloAlquimia: `${fmtMXN(CAPEX_CA.P.totalCAPEX, true)} – ${fmtMXN(CAPEX_CA.G.totalCAPEX, true)}`,
                  estado: 'ok',
                  nota: 'León, Gto. $18M MXN (2024); PRORESOL < $20M MXN. Modelo dentro de rango.',
                },
                {
                  concepto: 'Contingencia recomendada (CAPEX físico)',
                  benchmarkExterno: BENCHMARKS_EXTERNOS.contingenciaFactorPct.rango,
                  modeloAlquimia: '10% sobre equipamiento + nave',
                  estado: 'ok',
                  nota: BENCHMARKS_EXTERNOS.contingenciaFactorPct.fuente,
                },
                {
                  concepto: 'Capital de trabajo mínimo',
                  benchmarkExterno: `${BENCHMARKS_EXTERNOS.capitalTrabajoMesesRecomendados.minMeses}–${BENCHMARKS_EXTERNOS.capitalTrabajoMesesRecomendados.maxMeses} meses OPEX`,
                  modeloAlquimia: '3 meses OPEX (CAs) / 2 meses OPEX (Recicladoras)',
                  estado: 'ok',
                  nota: BENCHMARKS_EXTERNOS.capitalTrabajoMesesRecomendados.nota,
                },
                {
                  concepto: 'Salario operario — promedio nacional INEGI',
                  benchmarkExterno: `$${BENCHMARKS_EXTERNOS.salariosReferencia.operario.promedioNacional.toLocaleString('es-MX')}/mes`,
                  modeloAlquimia: `$${BENCHMARKS_EXTERNOS.salariosReferencia.operario.notaUsoModeloMXN.toLocaleString('es-MX')}/mes`,
                  estado: 'nota',
                  nota: BENCHMARKS_EXTERNOS.salariosReferencia.operario.nota,
                },
                {
                  concepto: 'Permisos + seguros anuales',
                  benchmarkExterno: `${fmtMXN(BENCHMARKS_EXTERNOS.permisosYSegurosAnual.minMXN, true)} – ${fmtMXN(BENCHMARKS_EXTERNOS.permisosYSegurosAnual.maxMXN, true)}/año`,
                  modeloAlquimia: '0.5% CAPEX/año (seguros en OPEX mensual)',
                  estado: 'ok',
                  nota: 'SEMARNAT autorización $5,910; MIA $50K-$300K; Seguro RC Ambiental (LGPGIR Art.50).',
                },
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-[2fr_1fr_1fr] gap-2 px-4 py-3 text-xs">
                  <div>
                    <p className="font-medium text-[#2A2A2A]">{row.concepto}</p>
                    <p className="text-[10px] text-[#8A8A8A] mt-0.5">{row.nota}</p>
                  </div>
                  <div className="text-[#5A5A5A]">
                    <p className="text-[10px] text-[#9A9A9A] mb-0.5">Benchmark externo</p>
                    <p className="font-mono">{row.benchmarkExterno}</p>
                  </div>
                  <div className="flex flex-col">
                    <p className="text-[10px] text-[#9A9A9A] mb-0.5">Modelo ALQUIMIA</p>
                    <span className={cn(
                      'inline-flex items-center gap-1 font-mono',
                      row.estado === 'ok' ? 'text-[#3B6D11]' : 'text-[#7A5A0A]',
                    )}>
                      {row.estado === 'ok' ? '✓' : '⚠'} {row.modeloAlquimia}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
