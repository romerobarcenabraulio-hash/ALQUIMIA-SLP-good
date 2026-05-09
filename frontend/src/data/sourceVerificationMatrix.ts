export type SourceVerificationStatus =
  | 'verificado'
  | 'condicionado'
  | 'corregido'
  | 'pendiente'

export interface SourceVerificationRow {
  id: string
  tema: string
  afirmacion: string
  fuente: string
  urlOrPath: string
  status: SourceVerificationStatus
  formula: string
  unidad: string
  accionCorrectiva: string
  responsable: string
}

export const SOURCE_VERIFICATION_STATUS_LABEL: Record<SourceVerificationStatus, string> = {
  verificado: 'Verificado',
  condicionado: 'Condicionado',
  corregido: 'Corregido',
  pendiente: 'Pendiente',
}

export const SOURCE_VERIFICATION_MATRIX: SourceVerificationRow[] = [
  {
    id: 'poblacion-territorio',
    tema: 'Población y territorio',
    afirmacion: 'La población activa del escenario proviene del municipio o subconjunto municipal seleccionado.',
    fuente: 'INEGI Censo de Población y Vivienda 2020 / auditoría municipal /api/v1/cities/{cve}/inegi-source',
    urlOrPath: 'Poblacion_01.xlsx; https://www.inegi.org.mx/programas/ccpv/2020/',
    status: 'condicionado',
    formula: 'Suma poblacional de municipios activos; si hay municipio explícito se usa su población de catálogo.',
    unidad: 'habitantes',
    accionCorrectiva: 'Mantener CVE_MUN en cada escenario y conectar consulta explícita a INEGI cuando el dato requerido exista en API.',
    responsable: 'Data / producto cívico',
  },
  {
    id: 'vivienda-inegi',
    tema: 'Vivienda INEGI',
    afirmacion: 'Los XLSX cargados validan población, viviendas habitadas y ocupantes promedio, pero no porcentajes casa/departamento.',
    fuente: 'INEGI Censo 2020 / tabulados de vivienda / dataset trazable frontend/src/data/inegiCensus2020StateFacts.ts',
    urlOrPath: 'Poblacion_01.xlsx; Vivienda_01.xlsx; Vivienda_02.xlsx; https://www.inegi.org.mx/programas/ccpv/2020/',
    status: 'verificado',
    formula: 'Viviendas habitadas y ocupantes promedio se muestran como hecho; distribución por tipo queda bloqueada si no existe tabulado.',
    unidad: 'viviendas; ocupantes/vivienda',
    accionCorrectiva: 'Integrar tabulado municipal por clase de vivienda antes de mostrar porcentajes oficiales.',
    responsable: 'Data / UX',
  },
  {
    id: 'vivienda-modelo-operativo',
    tema: 'Vivienda operativa',
    afirmacion: 'Los porcentajes casa/departamento visibles en el módulo de funcionarios son pesos de simulación, no porcentajes oficiales INEGI.',
    fuente: 'Motor ALQUIMIA / constants.ts / viviendaInegi.ts',
    urlOrPath: 'frontend/src/lib/constants.ts; frontend/src/lib/viviendaInegi.ts',
    status: 'condicionado',
    formula: 'peso tipo = mixVivienda × factor operativo ÷ suma de pesos activos',
    unidad: '% del RSU modelado por segmento',
    accionCorrectiva: 'Sustituir pesos operativos por tabulado municipal INEGI cuando exista clase de vivienda por municipio.',
    responsable: 'Modelo / data',
  },
  {
    id: 'generacion-rsu',
    tema: 'Generación RSU',
    afirmacion: 'El RSU doméstico del escenario se recalcula con población activa y generación kg/hab/día.',
    fuente: 'SEMARNAT DBGIR 2020; CAPITULO SAN LUIS POTOSÍ.docx; Modelo_BASED.xlsx',
    urlOrPath: 'SLP ( contexto ) / DOCS / CAPITULO SAN LUIS POTOSÍ.docx',
    status: 'condicionado',
    formula: 'población activa × kg/hab/día ÷ 1000',
    unidad: 't/día',
    accionCorrectiva: 'Registrar fuente exacta de kg/hab/día por ciudad y permitir ajuste trazado por escenario.',
    responsable: 'Modelo / producto',
  },
  {
    id: 'composicion-rsu',
    tema: 'Composición RSU',
    afirmacion: 'La composición material se basa en fracciones documentadas del capítulo y el modelo base.',
    fuente: 'CAPITULO SAN LUIS POTOSÍ.docx; SEMARNAT 2020; Modelo_BASED.xlsx',
    urlOrPath: 'Tabla_Maestra_Fuentes_CapituloSLP.docx; SLP ( contexto ) / DOCS',
    status: 'condicionado',
    formula: 'RSU activo × composición × captura × merma × pureza',
    unidad: 't/día por material',
    accionCorrectiva: 'Separar claramente composición nacional de medición municipal de campo cuando exista.',
    responsable: 'Modelo / auditoría técnica',
  },
  {
    id: 'precio-pet',
    tema: 'Precios de materiales',
    afirmacion: 'PET usa ancla $5.50/kg porque cae en rango medio documentado.',
    fuente: 'Investigacion_Precios_RSU_SLP.xlsx; Recicladoras_por_Giro.xlsx; Capítulo San Luis',
    urlOrPath: 'Investigacion_Precios_RSU_SLP.xlsx / Resumen Precios / PET',
    status: 'verificado',
    formula: 't/día capturable × precio MXN/kg × 1000 × días operativos',
    unidad: 'MXN/año',
    accionCorrectiva: 'Levantar cotización local si se usará para presupuesto o convenio.',
    responsable: 'Comercial / data',
  },
  {
    id: 'precio-vidrio',
    tema: 'Precios de materiales',
    afirmacion: 'Vidrio baja de $2.30/kg a $1.30/kg por discrepancia contra mediana de investigación.',
    fuente: 'Investigacion_Precios_RSU_SLP.xlsx; Tabla_Maestra_Fuentes_CapituloSLP.docx',
    urlOrPath: 'Investigacion_Precios_RSU_SLP.xlsx / Resumen Precios / Vidrio',
    status: 'corregido',
    formula: 't/día capturable × $1.30/kg × 1000 × días operativos',
    unidad: 'MXN/año',
    accionCorrectiva: 'Confirmar comprador local de vidrio y conservar $2.30 solo si hay cotización verificable.',
    responsable: 'Comercial / auditoría de fuentes',
  },
  {
    id: 'precio-aluminio',
    tema: 'Precios de materiales',
    afirmacion: 'Aluminio conserva ancla conservadora $15.10/kg, pero existe discrepancia de unidad en anexos.',
    fuente: 'Investigacion_Precios_RSU_SLP.xlsx; Recicladoras_por_Giro.xlsx',
    urlOrPath: 'Tabla_Maestra_Fuentes_CapituloSLP.docx / observaciones técnicas',
    status: 'condicionado',
    formula: 't/día capturable × precio MXN/kg × 1000 × días operativos',
    unidad: 'MXN/año',
    accionCorrectiva: 'Corregir o descartar valores con probable error de unidad antes de reporte ejecutivo.',
    responsable: 'Auditoría de fuentes',
  },
  {
    id: 'salud-publica',
    tema: 'Salud pública',
    afirmacion: 'El ahorro de salud es estimación de política pública, no dictamen sanitario.',
    fuente: 'CAPITULO SAN LUIS POTOSÍ.docx; bibliografía sanitaria y ambiental del capítulo',
    urlOrPath: 'Tabla_Maestra_Fuentes_CapituloSLP.docx',
    status: 'condicionado',
    formula: 'población × multiplicador anual + casos estimados evitados según modelo',
    unidad: 'MXN/año',
    accionCorrectiva: 'Agregar fuente sanitaria por municipio cuando se use en presentación pública formal.',
    responsable: 'Producto cívico / salud pública',
  },
  {
    id: 'emisiones',
    tema: 'Emisiones',
    afirmacion: 'CO2e evitado se calcula por material recuperado y factores documentados.',
    fuente: 'IPCC AR6; INECC 2024; CAPITULO SAN LUIS POTOSÍ.docx',
    urlOrPath: 'Tabla_Maestra_Fuentes_CapituloSLP.docx / emisiones',
    status: 'condicionado',
    formula: 'material recuperado × factor de emisión; orgánico × CH4 × GWP',
    unidad: 'tCO2e/año',
    accionCorrectiva: 'Conciliar discrepancia 533,178 vs 431,739.90 tCO2e antes de usar cifra única.',
    responsable: 'Modelo / auditoría técnica',
  },
  {
    id: 'reglamento-municipal',
    tema: 'Reglamento municipal',
    afirmacion: 'Cada municipio conserva reglamento y fuente propios; la ZM no sustituye al municipio.',
    fuente: 'Manifest reglamentos 2026-05; reglamentos municipales localizados',
    urlOrPath: 'ADENDOS: LEGAL/MANIFEST_REGLAMENTOS_2026-05.md',
    status: 'condicionado',
    formula: 'municipio_id → fuente municipal → propuesta expositiva, no documento oficial',
    unidad: 'fuente jurídica',
    accionCorrectiva: 'Verificar vigencia competente antes de cualquier acto administrativo.',
    responsable: 'Legaltech / jurista revisor',
  },
  {
    id: 'denue-inegi',
    tema: 'INEGI DENUE',
    afirmacion: 'DENUE puede apoyar establecimientos, giros y actividad económica; no sustituye población ni vivienda.',
    fuente: 'INEGI API DENUE',
    urlOrPath: 'https://www.inegi.org.mx/servicios/api_denue.html',
    status: 'pendiente',
    formula: 'CVE entidad + municipio + actividad económica + token DENUE + acción explícita de usuario',
    unidad: 'establecimientos',
    accionCorrectiva: 'Configurar INEGI_DENUE_TOKEN y crear consulta explícita por municipio/giro; no ejecutar en silencio.',
    responsable: 'Data / backend',
  },
  {
    id: 'gantt-pert',
    tema: 'Implementación',
    afirmacion: 'Gantt/PERT deben ser ruta territorial de decisión, no decoración.',
    fuente: 'Gantt_RSUSLP.xlsx; roadmap 12.2 y componentes de implementación',
    urlOrPath: 'SLP ( contexto ) / DOCS / Gantt_RSUSLP.xlsx',
    status: 'pendiente',
    formula: 'zonas × trimestre × capacidad × meta compatible',
    unidad: 'mes/trimestre',
    accionCorrectiva: 'Conectar ImplementacionEspacioTiempo en el módulo de operaciones y cerrar prueba visual.',
    responsable: 'Frontend / release',
  },
]
