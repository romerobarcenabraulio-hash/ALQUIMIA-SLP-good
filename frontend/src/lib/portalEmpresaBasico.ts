import type { OrganizationActivityType } from '@/types'

export const GIRO_OPCIONES: Array<{ value: OrganizationActivityType; label: string }> = [
  { value: 'empresa', label: 'Oficinas / empresa general' },
  { value: 'hotel', label: 'Hotel / hospedaje' },
  { value: 'hospital', label: 'Hospital / clínica' },
  { value: 'industria_ligera', label: 'Industria ligera' },
  { value: 'universidad', label: 'Universidad / campus' },
  { value: 'centro_comercial', label: 'Centro comercial' },
  { value: 'club_deportivo', label: 'Club deportivo' },
  { value: 'estadio', label: 'Estadio / recinto masivo' },
  { value: 'zona_turistica', label: 'Zona turística / eventos' },
  { value: 'espacio_publico', label: 'Espacio público municipal' },
]

export function etiquetaGiro(tipo: OrganizationActivityType): string {
  return GIRO_OPCIONES.find(o => o.value === tipo)?.label ?? tipo
}

export function variablesDefaultGiro(tipo: OrganizationActivityType): Record<string, string | number | boolean> {
  switch (tipo) {
    case 'hotel':
      return { habitaciones: 80, ocupacion_pct: 65, residuos_mixtos: false }
    case 'hospital':
      return { camas: 120, residuos_mixtos: false }
    case 'universidad':
      return { estudiantes: 5000, residuos_mixtos: false }
    case 'centro_comercial':
      return { locales: 45, residuos_mixtos: false }
    case 'club_deportivo':
    case 'estadio':
      return { aforo_evento: 5000, residuos_mixtos: false }
    default:
      return { turnos: 1, residuos_mixtos: false }
  }
}

/** Acciones operativas de referencia si la API devuelve pocas filas — mismo tono GOV, sin prometer datos ficticios. */
export const CHECKLIST_REFERENCIA_POR_GIRO: Record<OrganizationActivityType, string[]> = {
  empresa: [
    'Designar responsable interno de separación y bitácora mensual.',
    'Inventariar corrientes de residuo por zona (oficinas, cafetería, almacén).',
    'Colocar contenedores etiquetados para fracción seca húmeda y reciclables.',
    'Capacitar a personal de limpieza y recepción en 5 fracciones.',
    'Conveniar con centro de acopio o recicladora para retiros programados.',
    'Documentar pesos o volúmenes de salida (ticket o manifiesto).',
    'Revisión trimestral con compras para reducir empaques de un solo uso.',
  ],
  hotel: [
    'Plan de separación en cocina, housekeeping y áreas comunes.',
    'Contenedores en pisos y cocina alineados a la fracción que exige el municipio.',
    'Capacitación breve a housekeepers sobre materiales contaminantes.',
    'Calendario de retiro con recicladora o permisionario.',
    'Registro fotográfico o de peso de cargas salientes.',
    'Meta de reducción de botella de un solo uso en servicio a habitación.',
  ],
  hospital: [
    'Separar RSU de residuos de manejo especial según norma aplicable.',
    'Puntos de acopio diferenciados para no contaminar corrientes reciclables.',
    'Coordinación con servicios de biológicos-infecciosos (fuera de este módulo).',
    'Convenio con gestor autorizado para papel-cartón y plástico no contaminado.',
    'Bitácora de salidas firmada por almacén o mantenimiento.',
  ],
  industria_ligera: [
    'Diagrama de flujo: materia prima → scrap → destinación.',
    'Zona de acopio de residuos reciclables con vía seca.',
    'Compromisos con compras para embalaje retornable donde sea viable.',
    'Contrato o visto bueno con recicladora para PET, cartón y fleje.',
    'Revisiones mensuales de limpieza y seguridad en zona de acopio.',
  ],
  universidad: [
    'Comité ambiental estudiantil + mantenimiento con metas trimestrales.',
    'Puntos verdes en cada facultad con señalética unificada.',
    'Campaña de inicio de ciclo y reforzamiento en exámenes.',
    'Convenio institucional con centro de acopio municipal o aliado.',
  ],
  centro_comercial: [
    'Manual operativo para locatarios (qué va en cada contenedor).',
    'Contrato con servicio de limpieza con métricas de separación.',
    'Retroalimentación mensual a consejo de administración.',
    'Punto limpio o cabecera de acopio para cartón de recibo de mercancía.',
  ],
  zona_turistica: [
    'Plan de limpieza pos-evento con rutas y responsables.',
    'Contención de PET y latas en accesos y salidas.',
    'Coordinación con municipio para volumen pico.',
  ],
  espacio_publico: [
    'Esquema de contenedores en eventos con personal de apoyo.',
    'Comunicación ciudadana sobre qué depositar en cada boca.',
    'Mediciones piloto antes y después del evento.',
  ],
  club_deportivo: [
    'Gestión de PET y latas en gradas y concursos.',
    'Convenio con recolección diferenciada en día de partido.',
  ],
  estadio: [
    'Flujo de residuos por tribuna y zona VIP.',
    'Capacitación a proveedores de food service.',
    'Retiros nocturnos con peso documentado.',
  ],
}
