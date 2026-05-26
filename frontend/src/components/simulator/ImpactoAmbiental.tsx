'use client'
import { useSimulatorStore } from '@/store/simulatorStore'
import { fmt } from '@/lib/utils'
import { GaugeCO2 } from '@/components/charts/GaugeCO2'
import { NarrativeBridge } from '@/components/simulator/NarrativeBridge'
import { ContextoModulo } from '@/components/ui/ContextoModulo'
import { KpiAnchorGrid } from '@/components/editorial/KpiAnchorGrid'
import { FACTORES_EMISION } from '@/lib/constants'

function scrollToDecisionModules() {
  document.getElementById('decision-shell-title')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

export function ImpactoAmbiental() {
  const { resultados } = useSimulatorStore()
  const r = resultados

  return (
    <div>
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div className="flex flex-col items-center justify-center py-4">
          <GaugeCO2 />
        </div>

        {r && (
          <KpiAnchorGrid
            items={[
              { label: 'PM2.5 evitado', value: `${r.pm25EvitadoTon.toFixed(1)} ton` },
              { label: 'kWh biogás', value: fmt.kwh(r.kwhBiogas) },
              { label: 'Ext. vida relleno', value: `+${r.extensionRelleno.toFixed(1)} años` },
              { label: 'AVAD evitados', value: r.avadEvitados.toFixed(0) },
              { label: 'Casos IRA evitados', value: fmt.num0(r.casosIRAEvitados) },
              { label: 'Ahorro hospitalario', value: fmt.mxnK(r.ahorroSalud) },
            ]}
            columns={2}
          />
        )}
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
