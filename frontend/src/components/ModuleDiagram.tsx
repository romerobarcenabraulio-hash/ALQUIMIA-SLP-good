import type { TenantMetric } from '@/lib/tenantDiagnosticData'

function valueFor(metrics: TenantMetric[], id: string) {
  const metric = metrics.find(item => item.id === id)
  if (!metric || metric.value === null || metric.status === 'brecha_critica') return 'Brecha crítica'
  return `${metric.value}${metric.unit ? ` ${metric.unit}` : ''}`
}

export function ModuleDiagram({ moduleId, metrics }: { moduleId: string; metrics: TenantMetric[] }) {
  if (moduleId === 'city_baseline') {
    return (
      <div className="mt-5 rounded-[8px] border border-[#D8D2C5] bg-[#FDFCFA] p-4">
        <p className="text-[12px] font-semibold uppercase text-[#6B6760]">Figura · Flujo RSU preliminar</p>
        <div className="mt-3 grid gap-2 text-center text-[12px] font-semibold text-[#1C1B18] sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
          <div className="rounded-[8px] border border-[#C9DDB1] bg-[#F2F8EA] p-3">Generación<br />{valueFor(metrics, 'rsu_generation')}</div>
          <span className="text-[#8E8980]">→</span>
          <div className="rounded-[8px] border border-[#D7B56D] bg-[#FFF9EA] p-3">Caracterización<br />{valueFor(metrics, 'field_characterization')}</div>
          <span className="text-[#8E8980]">→</span>
          <div className="rounded-[8px] border border-[#EBC0BA] bg-[#FBEAEA] p-3">Disposición / valorización<br />requiere validación</div>
        </div>
      </div>
    )
  }

  if (moduleId === 'costo_omision') {
    return (
      <div className="mt-5 rounded-[8px] border border-[#D8D2C5] bg-[#FDFCFA] p-4">
        <p className="text-[12px] font-semibold uppercase text-[#6B6760]">Figura · Actuar vs no actuar</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[8px] border border-[#EBC0BA] bg-[#FBEAEA] p-3">
            <p className="font-semibold text-[#1C1B18]">No actuar</p>
            <p className="mt-1 text-[12px] leading-5 text-[#5C574F]">Riesgo de costos acumulados sin línea base local validada.</p>
          </div>
          <div className="rounded-[8px] border border-[#C9DDB1] bg-[#F2F8EA] p-3">
            <p className="font-semibold text-[#1C1B18]">Actuar con evidencia</p>
            <p className="mt-1 text-[12px] leading-5 text-[#5C574F]">Validar datos críticos antes de afirmar ahorro o impacto.</p>
          </div>
        </div>
      </div>
    )
  }

  if (moduleId === 'escenarios_financieros') {
    return (
      <div className="mt-5 rounded-[8px] border border-[#D8D2C5] bg-[#FDFCFA] p-4">
        <p className="text-[12px] font-semibold uppercase text-[#6B6760]">Figura · Escenarios condicionados</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-3">
          {['Conservador', 'Moderado', 'Ambicioso'].map(label => (
            <div key={label} className="rounded-[8px] border border-[#E8E4DC] bg-white p-3">
              <p className="font-semibold text-[#1C1B18]">{label}</p>
              <p className="mt-1 text-[12px] text-[#6B6760]">Requiere presupuesto, rutas y cotizaciones validadas.</p>
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (moduleId === 'riesgos_modelo') {
    return (
      <div className="mt-5 rounded-[8px] border border-[#D8D2C5] bg-[#FDFCFA] p-4">
        <p className="text-[12px] font-semibold uppercase text-[#6B6760]">Figura · Matriz de riesgo</p>
        <div className="mt-3 grid grid-cols-3 gap-1 text-center text-[11px] font-semibold">
          {['Bajo', 'Medio', 'Alto', 'Medio', 'Alto', 'Crítico', 'Alto', 'Crítico', 'Crítico'].map((label, index) => (
            <div key={index} className={`rounded-[6px] p-2 ${label === 'Crítico' ? 'bg-[#FBEAEA] text-[#A8322A]' : label === 'Alto' ? 'bg-[#FFF9EA] text-[#765814]' : 'bg-[#F2F8EA] text-[#2F5B0D]'}`}>
              {label}
            </div>
          ))}
        </div>
      </div>
    )
  }

  if (moduleId === 'expediente_cabildo') {
    return (
      <div className="mt-5 rounded-[8px] border border-[#D8D2C5] bg-[#FDFCFA] p-4">
        <p className="text-[12px] font-semibold uppercase text-[#6B6760]">Figura · Gate documental</p>
        <ol className="mt-3 grid gap-2 text-[12px] font-semibold text-[#1C1B18] sm:grid-cols-3">
          <li className="rounded-[8px] border border-[#E8E4DC] bg-white p-3">1. Fuente y cita</li>
          <li className="rounded-[8px] border border-[#E8E4DC] bg-white p-3">2. Validación humana</li>
          <li className="rounded-[8px] border border-[#E8E4DC] bg-white p-3">3. Claim permitido</li>
        </ol>
      </div>
    )
  }

  if (moduleId === 'risk_dashboard') {
    return (
      <div className="mt-5 rounded-[8px] border border-[#D8D2C5] bg-[#FDFCFA] p-4">
        <p className="text-[12px] font-semibold uppercase text-[#6B6760]">Figura · Gates y dependencias</p>
        <div className="mt-3 grid gap-2 text-[12px] font-semibold text-[#1C1B18] sm:grid-cols-[1fr_auto_1fr_auto_1fr] sm:items-center">
          <div className="rounded-[8px] border border-[#C9DDB1] bg-[#F2F8EA] p-3">Evidencia mínima<br />registrada</div>
          <span className="text-[#8E8980]">→</span>
          <div className="rounded-[8px] border border-[#D7B56D] bg-[#FFF9EA] p-3">Revisión humana<br />pendiente</div>
          <span className="text-[#8E8980]">→</span>
          <div className="rounded-[8px] border border-[#EBC0BA] bg-[#FBEAEA] p-3">Gate bloqueado<br />si falta respaldo</div>
        </div>
        <p className="mt-3 text-[12px] leading-5 text-[#5C574F]">
          El gate no se cierra por automatización: requiere responsable humano, fuente revisable y decisión documentada.
        </p>
      </div>
    )
  }

  return null
}
