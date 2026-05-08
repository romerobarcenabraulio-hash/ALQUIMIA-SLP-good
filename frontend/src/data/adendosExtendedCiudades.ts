/**
 * Localización CLC — 14 municipios faltantes (auditoría P0/P1 · 2026-05-07).
 * Se fusiona en `adendos.ts` para poblar `ciudades.<id>.adendoPropuesto`.
 * [BORRADOR PARA REVISIÓN LEGAL — no produce efectos jurídicos]
 */

import type { AdendoCiudadData } from '@/types'

const NOTA =
  '\n\n—\nNOTA DE VIGENCIA (propuesta ALQUIMIA · borrador): lo anterior **no surte efectos jurídicos** hasta aprobación municipal, publicación oficial y dictamen competente; requiere **cotejo** con PDF íntegro.'

const B =
  '[BORRADOR PARA REVISIÓN LEGAL — no produce efectos jurídicos]\n\n'

type PerfilSinRsu = {
  nombre: string
  estado: string
  secretaria: string
  leySupletoria: string
  poa: string
  uma: string
  bando: string
}

type PerfilNlReg = {
  nombre: string
  reg: string
  anio: number
  secretaria: string
  verif: string
  uma: string
  bando: string
}

function packSinRsu(p: PerfilSinRsu): AdendoCiudadData[] {
  const t = `${p.nombre} (${p.estado})`
  const ad1: AdendoCiudadData = {
    nombreReglamento:
      'PROYECTO DE REGLAMENTO MUNICIPAL DE LIMPIA Y GESTIÓN INTEGRAL DE RESIDUOS SÓLIDOS URBANOS — vía nueva expedición',
    anio: 2026,
    numeroArticulo: 'Art. [●] — definiciones (5 fracciones SEMARNAT; condominio; administración; centro de acopio)',
    textoVigente: `Sin reglamento RSU propio verificado en repo ALQUIMIA. Fuente supletoria: ${p.leySupletoria}.`,
    pdfCargado: false,
    adendoPropuesto: `${B}PROYECTO DE REGLAMENTO MUNICIPAL DE LIMPIA Y GESTIÓN INTEGRAL DE RESIDUOS SÓLIDOS URBANOS — vía nueva expedición — ${t}.

Se adicionan fracciones de trabajo al artículo de definiciones [numeración tentativa Art. 3 o [●]; ${p.poa}] para incorporar: condominio horizontal sujeto al esquema; administración del condominio; centro de acopio municipal o autorizado; programa de cinco fracciones de residuos sólidos urbanos; recolección Modelo A (municipalizada) y Modelo B (generador con transportista sustentable).

Sustitución institucional: toda mención operativa queda a cargo de ${p.secretaria}.

UMA: montos expresados en cuotas de ${p.uma}.` + NOTA,
  }
  const ad2: AdendoCiudadData = {
    nombreReglamento: 'PROYECTO — reglamento nuevo (encaje condominios)',
    anio: 2026,
    numeroArticulo: 'Art. [●] Bis — Modelos A y B',
    textoVigente: `No hay precepto vigente local sobre modelos A/B; ${p.poa}`,
    pdfCargado: false,
    adendoPropuesto: `${B}Art. [●] Bis. De los esquemas de recolección en condominios.
Modelo A: recolección diferenciada prestada por ${p.secretaria} con rutas y contenedores homologados.
Modelo B: el condominio contrata transportista autorizado y entrega residuos en centro de acopio o puntos que determine ${p.secretaria}.

${p.poa}` + NOTA,
  }
  const ad3: AdendoCiudadData = {
    nombreReglamento: 'PROYECTO — obligaciones habitantes',
    anio: 2026,
    numeroArticulo: 'Art. [●] — obligaciones de habitantes en condominio',
    textoVigente: `Supletorio ${p.leySupletoria} hasta expedir reglamento; ${p.poa}`,
    pdfCargado: false,
      adendoPropuesto: `${B}Art. [●]. Obligaciones (habitantes en condominios sujetos a cinco fracciones): separar en origen; no mezclar fracciones; presentar residuos en horarios y lugares autorizados; usar contenedor correcto por fracción; permitir acceso razonable a verificación municipal.

Titular operativo: ${p.secretaria}. ${p.poa}` + NOTA,
  }
  const ad4: AdendoCiudadData = {
    nombreReglamento: 'PROYECTO — obligaciones administración',
    anio: 2026,
    numeroArticulo: 'Art. [●] Bis — administraciones',
    textoVigente: `Pendiente reglamento; ${p.poa}`,
    pdfCargado: false,
      adendoPropuesto: `${B}Art. [●] Bis. Obligaciones de las administraciones: infraestructura; contenedores y señalética; información a residentes; facilitar inspección; comunicar incidencias a ${p.secretaria}.

${p.poa}` + NOTA,
  }
  const ad5: AdendoCiudadData = {
    nombreReglamento: 'PROYECTO — sanciones',
    anio: 2026,
    numeroArticulo: 'Art. [●] — fiscalización y multas (UMA)',
    textoVigente: `Sin tabulador RSU verificado en repo; ${p.bando}`,
    pdfCargado: false,
      adendoPropuesto: `${B}Art. [●]. Fiscalización por incumplimiento del esquema en condominios.
Escalera orientativa en ${p.uma}: 4 → 8 → 12 cuotas por evento (tres niveles: aviso; advertencia; multa), sin perjuicio de topes del ${p.bando}.

[REDACCIÓN PENDIENTE — ${p.bando}]

${p.poa}` + NOTA,
  }
  const ad6: AdendoCiudadData = {
    nombreReglamento: 'PROYECTO — decreto con transitorios',
    anio: 2026,
    numeroArticulo: 'Transitorios 1–6 (decreto de expedición)',
    textoVigente: 'Los transitorios acompañarán el decreto que expida el reglamento; no existen en texto vigente hasta publicación.',
    pdfCargado: false,
      adendoPropuesto: `${B}TRANSITORIOS (propuesta ALQUIMIA para el decreto de ${p.nombre}): vigencia escalonada; etapas por tamaño de condominio; 180 días educativos sin multa; programa municipal de implementación; derogatorias; difusión.

${p.secretaria} coordinará publicación en órgano oficial competente.

${p.poa}` + NOTA,
  }
  return [ad1, ad2, ad3, ad4, ad5, ad6]
}

function packNlReg(p: PerfilNlReg): AdendoCiudadData[] {
  const ad1: AdendoCiudadData = {
    nombreReglamento: p.reg,
    anio: p.anio,
    numeroArticulo: 'Art. [●] definiciones [VERIFICAR no. tras PDF]',
    textoVigente: `Instrumento declarado en seed ALQUIMIA; ${p.verif}`,
    pdfCargado: false,
      adendoPropuesto: `${B}ADICIÓN al artículo de definiciones del ${p.reg} (${p.anio}) — ${p.nombre}.
Fracciones: condominio; administración; centro de acopio; programa cinco fracciones conforme a lineamientos SEMARNAT aplicables; fracciones específicas.

Autoridad: ${p.secretaria}. ${p.verif}` + NOTA,
  }
  const ad2: AdendoCiudadData = {
    nombreReglamento: p.reg,
    anio: p.anio,
    numeroArticulo: 'Art. [●] Bis Modelos A/B [VERIFICAR]',
    textoVigente: p.verif,
    pdfCargado: false,
      adendoPropuesto: `${B}Art. [●] Bis. Modelos de recolección en condominios (A municipal / B con transportista autorizado). ${p.secretaria} asigna esquema conforme a densidad e infraestructura.

${p.verif}` + NOTA,
  }
  const ad3: AdendoCiudadData = {
    nombreReglamento: p.reg,
    anio: p.anio,
    numeroArticulo: 'Art. [●] obligaciones habitantes [VERIFICAR]',
    textoVigente: p.verif,
    pdfCargado: false,
      adendoPropuesto: `${B}Adición de obligaciones a habitantes de condominios sujetos a cinco fracciones: separar; no mezclar; cumplir horarios; contenedor correcto.

${p.secretaria}. ${p.verif}` + NOTA,
  }
  const ad4: AdendoCiudadData = {
    nombreReglamento: p.reg,
    anio: p.anio,
    numeroArticulo: 'Art. [●] Bis administraciones [VERIFICAR]',
    textoVigente: p.verif,
    pdfCargado: false,
      adendoPropuesto: `${B}Art. [●] Bis. Cinco obligaciones operativas de administraciones (infraestructura, contenedores, información, inspección, comunicación a ${p.secretaria}).

${p.verif}` + NOTA,
  }
  const ad5: AdendoCiudadData = {
    nombreReglamento: p.reg,
    anio: p.anio,
    numeroArticulo: 'Sanciones — reforma tabulador / arts. [VERIFICAR]',
    textoVigente: `Requiere cotejar supuestos de multas con ${p.bando} y reglamento. ${p.verif}`,
    pdfCargado: false,
      adendoPropuesto: `${B}Integrar escalera 4→8→12 cuotas ${p.uma} en tres niveles para condominios en cinco fracciones, armonizada con tabulador municipal y ${p.bando}.

[REDACCIÓN PENDIENTE — ${p.bando}]

${p.verif}` + NOTA,
  }
  const ad6: AdendoCiudadData = {
    nombreReglamento: `Decreto de reforma — ${p.nombre}`,
    anio: p.anio,
    numeroArticulo: 'Transitorios 1–6',
    textoVigente: 'Transitorios del decreto; verificar Gaceta/POE NL.',
    pdfCargado: false,
      adendoPropuesto: `${B}TRANSITORIOS para reforma al ${p.reg}: vigencia; gradualidad; 180 días educativos; programa implementación; derogatorias; difusión.

Armonizar con orden de publicación NL y ${p.secretaria}. ${p.verif}` + NOTA,
  }
  return [ad1, ad2, ad3, ad4, ad5, ad6]
}

const SOL_P: PerfilSinRsu = {
  nombre: 'Soledad de Graciano Sánchez',
  estado: 'SLP',
  secretaria: 'Secretaría de Servicios Públicos Municipales de Soledad [VERIFICAR]',
  leySupletoria: 'Ley Estatal en materia de residuos sólidos de San Luis Potosí [VERIFICAR título y artículos en fuente oficial]',
  poa: '[VERIFICAR EN FUENTE OFICIAL: POE_SLP_Soledad_reglamento_limpia_o_rsu.pdf]',
  uma: 'UMA INEGI (federal); armonizar con Bando de Soledad',
  bando: 'Bando de Policía y Buen Gobierno de Soledad de Graciano Sánchez',
}
const CSP_P: PerfilSinRsu = {
  nombre: 'Cerro de San Pedro',
  estado: 'SLP',
  secretaria: 'Dirección/Secretaría de Servicios Públicos de Cerro de San Pedro [VERIFICAR]',
  leySupletoria: 'Ley Estatal en materia de residuos sólidos de San Luis Potosí [VERIFICAR]',
  poa: '[VERIFICAR EN FUENTE OFICIAL: POE_SLP_CerroSanPedro_reglamento_rsu.pdf]',
  uma: 'UMA INEGI; Bando Cerro de San Pedro',
  bando: 'Bando de Policía y Buen Gobierno de Cerro de San Pedro',
}
const VIP_P: PerfilSinRsu = {
  nombre: 'Villa de Pozos',
  estado: 'SLP',
  secretaria: 'Titular de Servicios Públicos de Villa de Pozos [VERIFICAR]',
  leySupletoria: 'Ley Estatal en materia de residuos sólidos de San Luis Potosí [VERIFICAR]',
  poa: '[VERIFICAR EN FUENTE OFICIAL: POE_SLP_VillaDePozos_reglamento_rsu.pdf]',
  uma: 'UMA INEGI; Bando Villa de Pozos',
  bando: 'Bando de Policía y Buen Gobierno de Villa de Pozos',
}
const HUI_P: PerfilSinRsu = {
  nombre: 'Huimilpan',
  estado: 'QRO',
  secretaria: 'Secretaría de Servicios Públicos de Huimilpan [VERIFICAR]',
  leySupletoria:
    'Ley Estatal de residuos / Gestión integral aplicable en Querétaro [VERIFICAR nomenclatura exacta en CONGRESO estatal]',
  poa: '[VERIFICAR EN FUENTE OFICIAL: POE_QRO_Huimilpan_reglamento_limpia_rsu.pdf]',
  uma: 'UMA INEGI; Bando Huimilpan',
  bando: 'Bando de Policía y Buen Gobierno del Municipio de Huimilpan',
}
const JUA_P: PerfilSinRsu = {
  nombre: 'Juárez',
  estado: 'N.L.',
  secretaria: 'Secretaría de Servicios Públicos de Juárez NL [VERIFICAR]',
  leySupletoria: 'Ley de Gestión Integral de Residuos del Estado de Nuevo León [VERIFICAR]',
  poa: '[VERIFICAR EN FUENTE OFICIAL: POE_NL_Juarez_reglamento_limpia_rsu.pdf]',
  uma: 'UMA INEGI; Bando Juárez NL',
  bando: 'Bando de Policía y Buen Gobierno de Juárez, Nuevo León',
}
const GDL_P: PerfilSinRsu = {
  nombre: 'Guadalajara',
  estado: 'Jal.',
  secretaria: 'Secretaría de Servicios Públicos de Guadalajara [VERIFICAR competencia RSU]',
  leySupletoria: 'Ley Estatal de Gestión Integral de Residuos de Jalisco [VERIFICAR]',
  poa: '[VERIFICAR EN FUENTE OFICIAL: descarga manual POE_JAL_Guadalajara_reglamento_limpia_rsu.pdf — ALQUIMIA no tiene PDF verificado en repo]',
  uma: 'UMA INEGI; Bando Guadalajara',
  bando: 'Bando de Policía y Buen Gobierno de Guadalajara',
}
const ZAP_P: PerfilSinRsu = {
  nombre: 'Zapopan',
  estado: 'Jal.',
  secretaria: 'Secretaría de Servicios Públicos de Zapopan [VERIFICAR]',
  leySupletoria: 'Ley Estatal de Gestión Integral de Residuos de Jalisco [VERIFICAR]',
  poa: '[VERIFICAR EN FUENTE OFICIAL: POE_JAL_Zapopan_reglamento_limpia_rsu.pdf — ALQUIMIA no tiene PDF verificado en repo]',
  uma: 'UMA INEGI; Bando Zapopan',
  bando: 'Bando de Policía y Buen Gobierno de Zapopan',
}
const TLA_P: PerfilSinRsu = {
  nombre: 'San Pedro Tlaquepaque',
  estado: 'Jal.',
  secretaria: 'Secretaría de Servicios Públicos de Tlaquepaque [VERIFICAR]',
  leySupletoria: 'Ley Estatal de Gestión Integral de Residuos de Jalisco [VERIFICAR]',
  poa: '[VERIFICAR EN FUENTE OFICIAL: POE_JAL_Tlaquepaque_reglamento_limpia_rsu.pdf — ALQUIMIA no tiene PDF verificado en repo]',
  uma: 'UMA INEGI; Bando Tlaquepaque',
  bando: 'Bando de Policía y Buen Gobierno de Tlaquepaque',
}

const SNL = packNlReg({
  nombre: 'San Nicolás de los Garza',
  reg: 'Reglamento de Limpia y Manejo de Residuos Sólidos de San Nicolás de los Garza',
  anio: 2019,
  secretaria: 'Secretaría de Servicios Públicos de San Nicolás de los Garza',
  verif: '[VERIFICAR EN FUENTE OFICIAL: POE_NL_SanNicolas_reglamento_limpia_2019.pdf]',
  uma: 'UMA INEGI (NL)',
  bando: 'Bando municipal de Policía y Buen Gobierno de San Nicolás de los Garza',
})
const GUA = packNlReg({
  nombre: 'Guadalupe',
  reg: 'Reglamento de Limpia Municipal de Guadalupe, NL',
  anio: 2018,
  secretaria: 'Secretaría de Servicios Públicos de Guadalupe',
  verif: '[VERIFICAR EN FUENTE OFICIAL: POE_NL_Guadalupe_reglamento_limpia_2018.pdf]',
  uma: 'UMA INEGI (NL)',
  bando: 'Bando municipal de Policía y Buen Gobierno de Guadalupe',
})
const APO = packNlReg({
  nombre: 'Apodaca',
  reg: 'Reglamento de Servicios de Limpia de Apodaca, NL',
  anio: 2017,
  secretaria: 'Secretaría de Servicios Públicos de Apodaca',
  verif: '[VERIFICAR EN FUENTE OFICIAL: POE_NL_Apodaca_reglamento_limpia_2017.pdf]',
  uma: 'UMA INEGI (NL)',
  bando: 'Bando municipal de Policía y Buen Gobierno de Apodaca',
})
const SCA = packNlReg({
  nombre: 'Santa Catarina',
  reg: 'Reglamento de Gestión de Residuos Sólidos de Santa Catarina, NL',
  anio: 2020,
  secretaria: 'Secretaría de Servicios Públicos de Santa Catarina',
  verif: '[VERIFICAR EN FUENTE OFICIAL: POE_NL_SantaCatarina_reglamento_rsu_2020.pdf]',
  uma: 'UMA INEGI (NL)',
  bando: 'Bando municipal de Policía y Buen Gobierno de Santa Catarina',
})
const GAR = packNlReg({
  nombre: 'García',
  reg: 'Reglamento de Limpia de García, NL',
  anio: 2021,
  secretaria: 'Secretaría de Servicios Públicos de García',
  verif: '[VERIFICAR EN FUENTE OFICIAL: POE_NL_Garcia_reglamento_limpia_2021.pdf]',
  uma: 'UMA INEGI (NL)',
  bando: 'Bando municipal de Policía y Buen Gobierno de García',
})
const ESC = packNlReg({
  nombre: 'General Escobedo',
  reg: 'Reglamento de Servicios de Limpia de General Escobedo, NL',
  anio: 2018,
  secretaria: 'Secretaría de Servicios Públicos de General Escobedo',
  verif: '[VERIFICAR EN FUENTE OFICIAL: POE_NL_GeneralEscobedo_reglamento_limpia_2018.pdf]',
  uma: 'UMA INEGI (NL)',
  bando: 'Bando municipal de Policía y Buen Gobierno de General Escobedo',
})

function byAdendo(
  packs: Record<string, AdendoCiudadData[]>,
): Record<number, Record<string, AdendoCiudadData>> {
  const out: Record<number, Record<string, AdendoCiudadData>> = {}
  for (let id = 1; id <= 6; id += 1) {
    out[id] = {}
    for (const [mid, arr] of Object.entries(packs)) {
      out[id][mid] = arr[id - 1]
    }
  }
  return out
}

const _packs: Record<string, AdendoCiudadData[]> = {
  sol: packSinRsu(SOL_P),
  csp: packSinRsu(CSP_P),
  vip: packSinRsu(VIP_P),
  hui: packSinRsu(HUI_P),
  jua: packSinRsu(JUA_P),
  gdl: packSinRsu(GDL_P),
  zap: packSinRsu(ZAP_P),
  tla: packSinRsu(TLA_P),
  snl: SNL,
  gua: GUA,
  apo: APO,
  sca: SCA,
  gar: GAR,
  esc: ESC,
}

/** Fusionar en cada entrada de `adendos` como `ciudades: { ...base, ...extendedCiudadesPorAdendo[id] }`. */
export const extendedCiudadesPorAdendo: Record<number, Record<string, AdendoCiudadData>> =
  byAdendo(_packs)
