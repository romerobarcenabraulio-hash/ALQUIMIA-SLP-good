/**
 * Organigrama municipal canónico RSU — jerarquía Art. 115 CPEUM + LOM genérica.
 * Plantilla metodológica: validar titulares y fusiones de área en campo por municipio.
 */

import type { VerificacionOrg } from '@/data/organigramaDiagnostico'

export type RamaOrganigrama = 'raiz' | 'legislativo' | 'ejecutivo' | 'operador' | 'interfaz'

export interface NodoOrganigramaJerarquico {
  id: string
  titulo: string
  subtitulo: string
  rama: RamaOrganigrama
  parentId: string | null
  /** Orden entre hermanos (menor = más arriba en la rama). */
  ordenLegal: number
  nivel: number
  rolRsu: string
  baseLegal?: string
  verificacion: VerificacionOrg
  preguntaCampo: string
  /** Nodo agrupador visual (sin titular propio). */
  esGrupo?: boolean
}

/** Fuente normativa mostrada en rail del módulo. */
export const ORGANIGRAMA_BASE_LEGAL =
  'Art. 115 fracc. II CPEUM · LGAM estatal · Reglamento interior de administración municipal (validar por estado)'

export const RAMA_LABEL: Record<RamaOrganigrama, string> = {
  raiz: 'Ayuntamiento',
  legislativo: 'Poder legislativo',
  ejecutivo: 'Poder ejecutivo',
  operador: 'Concesionario',
  interfaz: 'Interfaz contractual',
}

export const RAMA_STYLE: Record<RamaOrganigrama, { header: string; border: string; bg: string; text: string }> = {
  raiz: { header: '#1C2B15', border: '#3B6D11', bg: '#EAF3DE', text: '#23470A' },
  legislativo: { header: '#1A5FA8', border: '#BDD7F5', bg: '#EBF3FB', text: '#0D3B7A' },
  ejecutivo: { header: '#3B6D11', border: '#C9DDB1', bg: '#F4FAEC', text: '#23470A' },
  operador: { header: '#8B6B4A', border: '#E5D5C5', bg: '#FAF6F2', text: '#5A4030' },
  interfaz: { header: '#D4881E', border: '#F5DCA0', bg: '#FEF7E7', text: '#6B4800' },
}

/**
 * Árbol plano — orden de inserción no importa; `buildOrganigramaTree` reconstruye jerarquía.
 * IDs legacy (pres, dsp, …) conservados para persistencia de verificaciones en simulador.
 */
export const ORGANIGRAMA_MUNICIPAL_JERARQUICO: NodoOrganigramaJerarquico[] = [
  {
    id: 'ayunt',
    titulo: 'Ayuntamiento',
    subtitulo: 'Órgano de gobierno municipal',
    rama: 'raiz',
    parentId: null,
    ordenLegal: 0,
    nivel: 0,
    rolRsu: 'Titularidad del servicio público de limpia (Art. 115)',
    baseLegal: 'Art. 115 fracc. II CPEUM',
    verificacion: 'referencia',
    preguntaCampo: '¿Cuál es la LOM aplicable y el reglamento interior vigente?',
    esGrupo: false,
  },
  {
    id: 'leg_root',
    titulo: 'Poder legislativo',
    subtitulo: 'Deliberación, aprobación y fiscalización colegiada',
    rama: 'legislativo',
    parentId: 'ayunt',
    ordenLegal: 1,
    nivel: 1,
    rolRsu: 'Aprueba reglamento, contrato de limpia y presupuesto',
    baseLegal: 'Art. 115 fracc. II inc. a) CPEUM',
    verificacion: 'referencia',
    preguntaCampo: '¿Cuándo sesiona cabildo y qué comisión dictamina RSU?',
    esGrupo: true,
  },
  {
    id: 'cabildo',
    titulo: 'Cabildo (Regidores)',
    subtitulo: 'Sesión de ayuntamiento — decisión colegiada',
    rama: 'legislativo',
    parentId: 'leg_root',
    ordenLegal: 1,
    nivel: 2,
    rolRsu: 'Vota reforma reglamentaria, contrato y egresos RSU',
    verificacion: 'referencia',
    preguntaCampo: '¿Qué indicadores reciben hoy en informe trimestral?',
  },
  {
    id: 'comision_rsu',
    titulo: 'Comisión de Servicios Públicos y Medio Ambiente',
    subtitulo: 'Dictamen previo a sesión de cabildo',
    rama: 'legislativo',
    parentId: 'leg_root',
    ordenLegal: 2,
    nivel: 2,
    rolRsu: 'Opina expediente técnico-jurídico antes del voto',
    verificacion: 'pendiente',
    preguntaCampo: '¿Existe comisión permanente o ad hoc para limpia?',
  },
  {
    id: 'ejec_root',
    titulo: 'Poder ejecutivo',
    subtitulo: 'Administración y operación del servicio',
    rama: 'ejecutivo',
    parentId: 'ayunt',
    ordenLegal: 2,
    nivel: 1,
    rolRsu: 'Implementa política RSU y supervisa al concesionario',
    baseLegal: 'Art. 115 fracc. II inc. b) CPEUM',
    verificacion: 'referencia',
    preguntaCampo: '¿Organigrama ejecutivo firmado ≤ 12 meses?',
    esGrupo: true,
  },
  {
    id: 'pres',
    titulo: 'Presidencia Municipal',
    subtitulo: 'Titular del ejecutivo — rector político del servicio',
    rama: 'ejecutivo',
    parentId: 'ejec_root',
    ordenLegal: 1,
    nivel: 2,
    rolRsu: 'Define prioridad política RSU y encabeza comisión de cabildo',
    verificacion: 'referencia',
    preguntaCampo: '¿Quién encabeza la comisión de limpia en cabildo?',
  },
  {
    id: 'sind',
    titulo: 'Síndico / Procuraduría municipal',
    subtitulo: 'Vigilancia jurídica, contratos y procedimiento sancionador',
    rama: 'ejecutivo',
    parentId: 'pres',
    ordenLegal: 1,
    nivel: 3,
    rolRsu: 'Dictamina addendas, sanciones y convenios',
    verificacion: 'pendiente',
    preguntaCampo: '¿Existe expediente único del contrato de limpia?',
  },
  {
    id: 'tes',
    titulo: 'Tesorería Municipal',
    subtitulo: 'Egresos, pagos al operador y control presupuestal',
    rama: 'ejecutivo',
    parentId: 'pres',
    ordenLegal: 2,
    nivel: 3,
    rolRsu: 'Paga concesión según esquema contractual',
    verificacion: 'pendiente',
    preguntaCampo: '¿Esquema de pago documentado: tonelada, viaje o tarifa fija?',
  },
  {
    id: 'ctrl',
    titulo: 'Contraloría / Auditoría municipal',
    subtitulo: 'Fiscalización de recursos y desempeño',
    rama: 'ejecutivo',
    parentId: 'pres',
    ordenLegal: 3,
    nivel: 3,
    rolRsu: 'Audita cumplimiento de contrato y metas RSU',
    verificacion: 'pendiente',
    preguntaCampo: '¿Audita desempeño del concesionario o solo egresos?',
  },
  {
    id: 'dsp',
    titulo: 'Dirección de Servicios Públicos',
    subtitulo: 'Área usuaria del servicio de limpia',
    rama: 'ejecutivo',
    parentId: 'pres',
    ordenLegal: 4,
    nivel: 3,
    rolRsu: 'Supervisión técnica del servicio y enlace operativo',
    verificacion: 'pendiente',
    preguntaCampo: '¿Nombre y correo del director actual?',
  },
  {
    id: 'jefe_limpia',
    titulo: 'Jefe de Limpia y Recolección',
    subtitulo: 'Coordinación diaria de rutas y quejas',
    rama: 'ejecutivo',
    parentId: 'dsp',
    ordenLegal: 1,
    nivel: 4,
    rolRsu: 'Primer escalón municipal sobre operación de campo',
    verificacion: 'desconocido',
    preguntaCampo: '¿Es servidor público o enlace con concesionario?',
  },
  {
    id: 'sup_concesion',
    titulo: 'Supervisión de concesión',
    subtitulo: 'Actas, KPIs y cumplimiento contractual',
    rama: 'ejecutivo',
    parentId: 'dsp',
    ordenLegal: 2,
    nivel: 4,
    rolRsu: 'Documenta incumplimientos y propone sanciones al síndico',
    verificacion: 'pendiente',
    preguntaCampo: '¿Frecuencia de supervisión en campo?',
  },
  {
    id: 'amb',
    titulo: 'Dirección de Medio Ambiente / Ecología',
    subtitulo: 'Norma ambiental, permisos y reportes',
    rama: 'ejecutivo',
    parentId: 'pres',
    ordenLegal: 5,
    nivel: 3,
    rolRsu: 'Reportes SEMARNAT/estatal, permisos de manejo',
    verificacion: 'desconocido',
    preguntaCampo: '¿Fusionada con limpia o dirección aparte?',
  },
  {
    id: 'ins',
    titulo: 'Inspección y Reglamentos',
    subtitulo: 'Cumplimiento ciudadano y comercio',
    rama: 'ejecutivo',
    parentId: 'pres',
    ordenLegal: 6,
    nivel: 3,
    rolRsu: 'Aplica sanciones por separación en origen',
    verificacion: 'pendiente',
    preguntaCampo: '¿Inspecciona RSU residencial o solo comercio?',
  },
  {
    id: 'com',
    titulo: 'Comunicación Social',
    subtitulo: 'Campañas y atención ciudadana',
    rama: 'ejecutivo',
    parentId: 'pres',
    ordenLegal: 7,
    nivel: 3,
    rolRsu: 'Difusión de separación y canales de queja',
    verificacion: 'desconocido',
    preguntaCampo: '¿Participa en campañas de separación en origen?',
  },
  {
    id: 'op_root',
    titulo: 'Operador del servicio (Concesionario)',
    subtitulo: 'Ejecución contractual del servicio de limpia',
    rama: 'operador',
    parentId: 'ayunt',
    ordenLegal: 3,
    nivel: 1,
    rolRsu: 'Recolección, transporte y disposición según contrato',
    verificacion: 'pendiente',
    preguntaCampo: '¿Quién es el titular del contrato vigente?',
    esGrupo: true,
  },
  {
    id: 'rep',
    titulo: 'Representante legal / Gerente general',
    subtitulo: 'Interlocutor formal con municipio',
    rama: 'operador',
    parentId: 'op_root',
    ordenLegal: 1,
    nivel: 2,
    rolRsu: 'Firma addendas, actas y reportes operativos',
    verificacion: 'pendiente',
    preguntaCampo: '¿Quién firma addendas y actas administrativas?',
  },
  {
    id: 'ops',
    titulo: 'Gerente de operaciones',
    subtitulo: 'Rutas, flota y personal de campo',
    rama: 'operador',
    parentId: 'rep',
    ordenLegal: 1,
    nivel: 3,
    rolRsu: 'Operación diaria de recolección',
    verificacion: 'desconocido',
    preguntaCampo: '¿Marca propia o white-label municipal?',
  },
  {
    id: 'disp',
    titulo: 'Jefe de disposición final',
    subtitulo: 'Relleno, transferencia y costo por tonelada',
    rama: 'operador',
    parentId: 'rep',
    ordenLegal: 2,
    nivel: 3,
    rolRsu: 'Destino final de residuos no valorizables',
    verificacion: 'pendiente',
    preguntaCampo: '¿Relleno propio o tercero?',
  },
  {
    id: 'rec',
    titulo: 'Coordinación de reciclaje',
    subtitulo: 'PEV, acopio y compradores (si existe)',
    rama: 'operador',
    parentId: 'rep',
    ordenLegal: 3,
    nivel: 3,
    rolRsu: 'Valorización y venta de fracciones',
    verificacion: 'desconocido',
    preguntaCampo: '¿Área formal o función marginal?',
  },
  {
    id: 'if1',
    titulo: 'Interfaz: actas de supervisión',
    subtitulo: 'Supervisión de concesión ↔ Representante legal',
    rama: 'interfaz',
    parentId: 'sup_concesion',
    ordenLegal: 1,
    nivel: 5,
    rolRsu: 'Evidencia de cumplimiento operativo',
    verificacion: 'pendiente',
    preguntaCampo: '¿Formato y periodicidad de actas?',
  },
  {
    id: 'if2',
    titulo: 'Interfaz: facturación y KPIs',
    subtitulo: 'Tesorería ↔ Representante legal',
    rama: 'interfaz',
    parentId: 'tes',
    ordenLegal: 1,
    nivel: 4,
    rolRsu: 'Pago condicionado a indicadores contractuales',
    verificacion: 'pendiente',
    preguntaCampo: '¿KPIs en contrato o solo factura por servicio?',
  },
]

export interface OrganigramaTreeNode extends NodoOrganigramaJerarquico {
  children: OrganigramaTreeNode[]
}

export function buildOrganigramaTree(
  nodes: NodoOrganigramaJerarquico[] = ORGANIGRAMA_MUNICIPAL_JERARQUICO,
): OrganigramaTreeNode[] {
  const map = new Map<string, OrganigramaTreeNode>()
  for (const n of nodes) {
    map.set(n.id, { ...n, children: [] })
  }
  const roots: OrganigramaTreeNode[] = []
  for (const n of map.values()) {
    if (n.parentId == null) {
      roots.push(n)
    } else {
      const parent = map.get(n.parentId)
      if (parent) parent.children.push(n)
      else roots.push(n)
    }
  }
  const sortChildren = (list: OrganigramaTreeNode[]) => {
    list.sort((a, b) => a.ordenLegal - b.ordenLegal)
    for (const c of list) sortChildren(c.children)
  }
  sortChildren(roots)
  return roots
}

/** Nodos hoja + nodos operativos (excluye solo grupos vacíos si se desea). */
export function flattenOrganigramaNodes(
  nodes: NodoOrganigramaJerarquico[] = ORGANIGRAMA_MUNICIPAL_JERARQUICO,
  includeGrupos = true,
): NodoOrganigramaJerarquico[] {
  return nodes
    .filter(n => includeGrupos || !n.esGrupo)
    .sort((a, b) => {
      if (a.nivel !== b.nivel) return a.nivel - b.nivel
      return a.ordenLegal - b.ordenLegal
    })
}

export function getRamaRoots(): OrganigramaTreeNode[] {
  const tree = buildOrganigramaTree()
  const ayunt = tree[0]
  if (!ayunt) return tree
  return ayunt.children
}

/** Ancla ejecutiva recomendada para el programa RSU (M07). */
export const ANCLA_PROGRAMA_RSU = {
  nodoId: 'amb',
  titulo: 'Dirección de Medio Ambiente / Ecología',
  alternativaId: 'dsp',
  alternativaTitulo: 'Dirección de Servicios Públicos',
  nota: 'Validar en campo cuál dirección tiene titularidad técnica del programa RSU.',
}
