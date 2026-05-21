import type { EsquemaConcesion } from '@/types'

export interface ClausulaPropuesta {
  id: string
  titulo: string
  texto: string
  variable?: string
}

export function getClausulasPorEsquema(
  esquema: EsquemaConcesion,
  ctx: { pctCuota?: number; pctSocio?: number },
): ClausulaPropuesta[] {
  const base: ClausulaPropuesta[] = [
    {
      id: 'objeto',
      titulo: 'Objeto y alcance del servicio',
      texto: 'Prestación del servicio integral de recolección, transporte, separación y valorización de RSU en la zona de cobertura definida, conforme a NOM-161-SEMARNAT.',
    },
    {
      id: 'calidad',
      titulo: 'Estándares de calidad y KPIs',
      texto: 'Tasa mínima de captura anual, pureza por fracción ≥85%, disponibilidad de flota ≥92%, bitácora digital PER con evidencia fotográfica.',
    },
  ]

  if (esquema === 'A') {
    return [
      ...base,
      {
        id: 'operacion-directa',
        titulo: 'Operación municipal directa',
        texto: 'El municipio opera con personal propio; el concesionario no interviene. SLA interno con metas trimestrales reportadas a Cabildo.',
      },
      {
        id: 'inversion',
        titulo: 'Inversión y mantenimiento',
        texto: 'CAPEX cubierto con recursos municipales / FONADIN; OPEX con presupuesto de servicios públicos. Sin reparto de ingresos a terceros.',
      },
    ]
  }

  if (esquema === 'B') {
    return [
      ...base,
      {
        id: 'cuota',
        titulo: 'Cuota de concesión',
        texto: `Cuota anual del ${ctx.pctCuota ?? 10}% sobre ingresos brutos por valorización, indexada a INPC. Pago trimestral con auditoría de tercero.`,
        variable: `${ctx.pctCuota ?? 10}%`,
      },
      {
        id: 'tonelaje',
        titulo: 'Compromiso de tonelaje',
        texto: 'Mínimo 85% del RSU capturable del área de concesión. Penalización por incumplimiento: 0.5 UMA por tonelada no recolectada.',
      },
      {
        id: 'fianza',
        titulo: 'Fianza de cumplimiento',
        texto: 'Fianza equivalente a 3 meses de cuota estimada. Liberación escalonada: 50% al año 3, 50% al cierre del contrato sin incidencias.',
      },
    ]
  }

  return [
    ...base,
    {
      id: 'participacion',
      titulo: 'Participación público-privada',
      texto: `Socio público ${ctx.pctSocio ?? 51}% / privado ${100 - (ctx.pctSocio ?? 51)}%. Reparto de utilidades proporcional al capital aportado.`,
      variable: `${ctx.pctSocio ?? 51}% municipal`,
    },
    {
      id: 'ingresos',
      titulo: 'Distribución de ingresos por material',
      texto: 'Orgánicos → composta municipal; reciclables → reparto 60% operador / 40% municipio tras deducir OPEX. Transparencia en plataforma de trazabilidad.',
    },
    {
      id: 'salida',
      titulo: 'Condiciones de terminación',
      texto: 'Causas de rescisión: incumplimiento de KPIs 2 trimestres consecutivos, quiebra del operador, o mutuo acuerdo con 180 días de preaviso.',
    },
  ]
}
