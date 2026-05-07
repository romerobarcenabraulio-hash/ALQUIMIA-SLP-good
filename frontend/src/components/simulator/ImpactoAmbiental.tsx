'use client'
import { useSimulatorStore } from '@/store/simulatorStore'
import { fmt } from '@/lib/utils'
import { GaugeCO2 } from '@/components/charts/GaugeCO2'
import { NarrativeBridge } from '@/components/simulator/NarrativeBridge'
import { ContextoModulo } from '@/components/ui/ContextoModulo'
import { FACTORES_EMISION } from '@/lib/constants'
import { ScopeAnclaKicker } from '@/components/simulator/ScopeAnclaKicker'

function scrollToDecisionModules() {
  document.getElementById('decision-shell-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function ImpactoAmbiental() {
  const { resultados } = useSimulatorStore()
  const r = resultados

  return (
    <div>
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C] mb-3">S15 — Impacto ambiental</p>
      <h2 className="font-serif text-[24px] text-[#1C1B18] mb-2">Planeta y salud pública</h2>
      <ScopeAnclaKicker className="mb-3" />

      <ContextoModulo
        variante="ambiental"
        titulo="¿Cómo se calculan las toneladas de CO₂e evitadas?"
        cuerpo="Los residuos tienen dos tipos de impacto climático: (1) el metano que generan los orgánicos al descomponerse en el relleno sanitario sin gestión, y (2) las emisiones que se evitan cuando reciclamos en lugar de producir material virgen. Ambos se suman para obtener el total de CO₂e evitadas."
        puntos={[
          'CO₂e orgánicos: vol. orgánico × factor CH₄ 0.234 m³/kg × densidad CH₄ × GWP₂₇ (IPCC AR6 2021).',
          `CO₂e reciclables: cada tonelada de PET reciclado evita ${FACTORES_EMISION.plastico.toFixed(2)} tCO₂e de producción virgen; aluminio evita ${FACTORES_EMISION.aluminio.toFixed(2)} tCO₂e/t (factores del motor, consistentes con EPA/IPCC).`,
          'PM2.5: se estima sobre el volumen que se deja de quemar a cielo abierto (0.0043 kg PM2.5/kg quemado).',
          'Casos IRA evitados: PM2.5 evitado × factor epidemiológico 847 casos/ton (OMS LATAM).',
          'Créditos de carbono voluntarios: al precio VCS 2024 ($5 USD/tCO₂e) o SCE México ($10–20 USD).',
        ]}
        fuente="Factor CH₄: SEMARNAT. GWP₁₀₀ = 27: IPCC AR6 2021. Factores virgen: EPA/IPCC por material. PM2.5: OMS-OPS. Créditos: VCS Market 2024 · SEMARNAT SCE."
        advertencia="Las cifras de salud (IRA, dengue, AVAD) son estimados epidemiológicos a escala poblacional, no pronósticos individuales. No sustituyen evaluaciones de impacto ambiental oficiales."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Gauge CO2e */}
        <div className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[14px] p-5 flex flex-col items-center">
          <GaugeCO2 />
        </div>

        {/* Métricas ambientales */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { l: 'PM2.5 evitado',        v: r ? `${r.pm25EvitadoTon.toFixed(1)} ton`        : '—' },
            { l: 'kWh biogás',            v: r ? fmt.kwh(r.kwhBiogas)                       : '—' },
            { l: 'Ext. vida relleno',     v: r ? `+${r.extensionRelleno.toFixed(1)} años`   : '—' },
            { l: 'AVAD evitados',         v: r ? r.avadEvitados.toFixed(0)                   : '—' },
            { l: 'Casos IRA evitados',    v: r ? fmt.num0(r.casosIRAEvitados)               : '—' },
            { l: 'Ahorro hospitalario',   v: r ? fmt.mxnK(r.ahorroSalud)                    : '—' },
          ].map(item => (
            <div key={item.l} className="bg-[#FDFCFA] border border-[#E8E4DC] rounded-[10px] p-3">
              <p className="text-[10px] uppercase text-[#A8A49C] tracking-wide">{item.l}</p>
              <p className="font-mono text-[15px] text-[#1C1B18] mt-1">{item.v}</p>
            </div>
          ))}
        </div>
      </div>

      {r && (
        <NarrativeBridge
          variant="result"
          audience="citizen"
          kicker="Lectura ambiental"
          title="Qué implican los números para tu ciudad"
          summary={`Con los supuestos actuales del simulador, se evitarían ${fmt.co2(r.co2eEvitadasAnualTon)} de emisiones CO₂e al año (como quitar unos ${fmt.num0(r.co2eEvitadasAnualTon / 2.3)} autos típicos de circulación). En el horizonte suman ${fmt.co2(r.co2eEvitadasHorizonteTon)}. El biogás útil estimado es ${fmt.kwh(r.kwhBiogas)} y se gana alrededor de ${r.extensionRelleno.toFixed(1)} años adicionales de vida útil del relleno.`}
          evidence={[
            { label: 'CO₂e / año', value: fmt.co2(r.co2eEvitadasAnualTon) },
            { label: 'CO₂e acumulado', value: fmt.co2(r.co2eEvitadasHorizonteTon) },
            { label: 'PM2.5 evitado', value: `${r.pm25EvitadoTon.toFixed(1)} ton` },
            { label: 'Biogás', value: fmt.kwh(r.kwhBiogas) },
          ]}
          nextStep={{
            label: 'Ir a composición y vivienda',
            onClick: scrollToDecisionModules,
            helper: 'En el panel izquierdo abre el módulo de entradas ciudadanas para ajustar composición o tipo de vivienda.',
          }}
        />
      )}
    </div>
  )
}
