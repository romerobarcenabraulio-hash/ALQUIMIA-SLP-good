'use client'

/**
 * Fase 22.5 — Containers Provider (perfil empresario).
 *
 * Resuelve el módulo `containers_provider` del journey organization que antes
 * caía en ModuleEmpty. Presenta una promesa controlada: panel "Próximamente"
 * con una NarrativeBridge informativa y CTA a contacto comercial. No simula
 * datos que no tenemos: declara explícitamente el estado del rollout.
 */

import { Boxes, Mail } from 'lucide-react'
import { useSimulatorStore } from '@/store/simulatorStore'
import { NarrativeBridge } from '@/components/simulator/NarrativeBridge'

export function ContainersProvider() {
  const zmActiva = useSimulatorStore(s => s.zmActiva)
  const macroSummary = useSimulatorStore(s => s.macroImpactSummary)
  const totalToneladas = macroSummary?.total_ton_anio ?? null

  return (
    <section className="rounded-[14px] border border-[#E8E4DC] bg-[#FDFCFA] p-6 space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="mt-1 font-serif text-[22px] text-[#1C1B18]">
            Suministro y operación de contenedores · {zmActiva}
          </h3>
          <p className="mt-1 text-[12px] text-[#6B6760]">
            Catálogo de proveedores de contenedores, planes de despliegue y SLAs operativos para empresas
            con flujo recurrente de RSU. En diseño de contrato; cobertura en ronda piloto.
          </p>
        </div>
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F2EEE5] text-[#3B6D11]">
          <Boxes className="h-5 w-5" aria-hidden />
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <Tile label="Estado" value="Próximamente" tone="warning" />
        <Tile
          label="Volumen empresarial estimado"
          value={totalToneladas != null ? `${totalToneladas.toFixed(1)} t/año` : 'Calcula impacto macro'}
        />
        <Tile label="Cobertura piloto" value="2 corredores" />
      </div>

      <NarrativeBridge
        variant="bridge"
        summary={totalToneladas != null
          ? `Tu organización proyecta ${totalToneladas.toFixed(1)} t/año de RSU recuperables. El operador de contenedores se activa cuando se valida la ruta logística (Logística + Macrogeneradores) y la propuesta comercial.`
          : 'Calcula primero el impacto macro de tu organización para dimensionar contenedores y frecuencia de retiro.'}
        evidence={[
          { label: 'Estado', value: 'piloto' },
          { label: 'Cobertura', value: '2 corredores' },
          { label: 'SLA objetivo', value: '48 h respuesta' },
          { label: 'Volumen', value: totalToneladas != null ? `${totalToneladas.toFixed(1)} t/año` : '—' },
        ]}
        nextStep={{
          label: 'Solicitar acceso a la ronda piloto',
          helper: 'Equipo comercial responde en 48 horas hábiles.',
          href: 'mailto:operadores@alquimia.org?subject=Containers%20Provider%20-%20Acceso%20piloto',
        }}
      />

      <a
        href="mailto:operadores@alquimia.org?subject=Containers%20Provider%20-%20Acceso%20piloto"
        className="inline-flex items-center gap-2 rounded-full border border-[#1C1B18] bg-[#1C1B18] px-4 py-2 text-[13px] font-medium text-white transition-colors hover:bg-[#3B6D11] hover:border-[#3B6D11]"
      >
        <Mail className="h-4 w-4" aria-hidden />
        Hablar con un operador
      </a>
    </section>
  )
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: 'warning' }) {
  return (
    <div
      className={`rounded-[10px] border p-3 ${tone === 'warning' ? 'border-amber-200 bg-amber-50' : 'border-[#E8E4DC] bg-white'}`}
    >
      <p className="text-[10px] uppercase tracking-[0.06em] text-[#A8A49C]">{label}</p>
      <p className="mt-1 font-mono text-[14px] text-[#1C1B18]">{value}</p>
    </div>
  )
}
