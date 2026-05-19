/**
 * Glosario de términos técnicos de ALQUIMIA.
 * Se usa con GlosarioTooltip para ofrecer definiciones instantáneas
 * a cualquier usuario, sin importar su nivel de conocimiento.
 *
 * Fuentes: SEMARNAT LGPGIR, INEGI, vocabulario del sector RSU en México.
 */

export type GlosarioEntry = {
  termino: string        // texto exacto a subrayar (case-insensitive)
  definicion: string     // explicación breve, máx 40 palabras
  fuente?: string        // institución o documento de referencia
  url?: string           // link opcional a fuente oficial
}

export const GLOSARIO: GlosarioEntry[] = [
  {
    termino: 'RSU',
    definicion: 'Residuos Sólidos Urbanos. Todo material de desecho generado en hogares, comercios e industrias dentro de un municipio.',
    fuente: 'LGPGIR Art. 5, SEMARNAT',
    url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LGPGIR.pdf',
  },
  {
    termino: 'tasa de captura',
    definicion: 'Porcentaje de los RSU generados que efectivamente llega a un centro de acopio o recicladora. Rango real en México: 3%–18% (SEMARNAT DBGIR 2020).',
    fuente: 'SEMARNAT DBGIR 2020',
  },
  {
    termino: 'generación per cápita',
    definicion: 'Kilogramos de residuo que produce un habitante por día. Referencia nacional: 0.86–1.05 kg/hab/día según tamaño de ciudad.',
    fuente: 'SEMARNAT Diagnóstico Básico 2020',
  },
  {
    termino: 'CAPEX',
    definicion: 'Capital Expenditure — inversión inicial en infraestructura: terreno, construcción, equipamiento y capital de trabajo para arrancar el programa.',
    fuente: 'Modelo financiero ALQUIMIA',
  },
  {
    termino: 'OPEX',
    definicion: 'Operational Expenditure — costo mensual de operar: personal, energía, mantenimiento y administración del centro de acopio.',
    fuente: 'Modelo financiero ALQUIMIA',
  },
  {
    termino: 'TIR',
    definicion: 'Tasa Interna de Retorno. Rendimiento anual del proyecto. Si TIR > WACC, el programa crea valor económico.',
    fuente: 'Evaluación de proyectos — SHCP',
  },
  {
    termino: 'VPN',
    definicion: 'Valor Presente Neto. Suma de flujos futuros descontados a hoy. VPN > 0 significa que el proyecto vale más de lo que cuesta.',
    fuente: 'Evaluación de proyectos — SHCP',
  },
  {
    termino: 'WACC',
    definicion: 'Costo promedio ponderado del capital. Tasa de descuento que representa el costo de financiarse. Referencia municipal México: 10%–14%.',
    fuente: 'SHCP tasa de descuento social',
  },
  {
    termino: 'ZM',
    definicion: 'Zona Metropolitana. Conjunto de municipios con continuidad urbana que comparten infraestructura y mercado laboral.',
    fuente: 'CONAPO Delimitación Zonas Metropolitanas 2020',
  },
  {
    termino: 'merma',
    definicion: 'Porcentaje del material recuperado que se pierde en procesamiento por contaminación, humedad o mezcla incorrecta. Rango típico: 8%–20%.',
    fuente: 'INECC benchmarks sector reciclaje',
  },
  {
    termino: 'CA',
    definicion: 'Centro de Acopio. Instalación donde se reciben, clasifican y compactan materiales reciclables antes de venderlos a la industria.',
    fuente: 'SEMARNAT NOM-161-SEMARNAT-2011',
  },
  {
    termino: 'PERT',
    definicion: 'Program Evaluation and Review Technique. Método de planificación que estima duración = (optimista + 4×probable + pesimista) ÷ 6 para considerar incertidumbre.',
    fuente: 'PMBOK 6ª ed.',
  },
  {
    termino: 'ruta crítica',
    definicion: 'Secuencia de tareas con holgura cero. Cualquier retraso en ella desplaza directamente la fecha de entrega final del proyecto.',
    fuente: 'CPM — Project Management',
  },
  {
    termino: 'pepenadores',
    definicion: 'Trabajadores informales que recuperan materiales reciclables en sitios de disposición o rutas de recolección. Estimado nacional: 110,000–150,000 personas (ENIGH 2022).',
    fuente: 'INEGI ENIGH 2022',
  },
  {
    termino: 'PET',
    definicion: 'Polietileno tereftalato. Plástico de botellas de agua y refresco. Material de alta demanda en mercado secundario. Precio referencia: $4–$7/kg.',
    fuente: 'Mercado secundario México 2025',
  },
  {
    termino: 'HDPE',
    definicion: 'Polietileno de alta densidad. Plástico de garrafones y envases de limpieza. Precio referencia: $6–$10/kg.',
    fuente: 'Mercado secundario México 2025',
  },
  {
    termino: 'toneladas desviadas',
    definicion: 'RSU que se separa y recupera en lugar de enterrarse en el relleno sanitario. Base de cálculo de ingresos y ahorro de disposición.',
    fuente: 'Modelo ALQUIMIA',
  },
  {
    termino: 'costo de disposición',
    definicion: 'Tarifa que paga el municipio por enterrar una tonelada de RSU en relleno sanitario. Rango México: $150–$600/ton dependiendo del estado.',
    fuente: 'SEMARNAT contratos públicos 2024',
  },
  {
    termino: 'CO₂e',
    definicion: 'CO₂ equivalente. Unidad que permite comparar distintos gases de efecto invernadero. GWP del CH₄ = 27.9 (IPCC AR6 2021).',
    fuente: 'IPCC Sixth Assessment Report 2021',
  },
  {
    termino: 'composición RSU',
    definicion: 'Distribución porcentual por tipo de material: orgánicos ~52%, plásticos ~13%, papel/cartón ~12%, vidrio ~4%, metales ~3%, otros ~16% (SEMARNAT 2020).',
    fuente: 'SEMARNAT DBGIR 2020',
  },
  {
    termino: 'LGPGIR',
    definicion: 'Ley General para la Prevención y Gestión Integral de los Residuos. Marco federal que obliga a municipios a separar, recolectar y disponer correctamente los RSU.',
    fuente: 'DOF 2003, última reforma 2022',
    url: 'https://www.diputados.gob.mx/LeyesBiblio/pdf/LGPGIR.pdf',
  },
  {
    termino: 'NOM-083',
    definicion: 'Norma Oficial Mexicana que establece los requisitos para sitios de disposición final de RSU. Aplica a rellenos sanitarios y sitios controlados.',
    fuente: 'SEMARNAT NOM-083-SEMARNAT-2003',
  },
  {
    termino: 'plan de manejo',
    definicion: 'Documento que describe cómo se manejarán residuos especiales. Obligatorio para grandes generadores según LGPGIR Art. 28.',
    fuente: 'LGPGIR + NOM-161-SEMARNAT-2011',
  },
  {
    termino: 'DBGIR',
    definicion: 'Diagnóstico Básico para la Gestión Integral de Residuos. Publicación SEMARNAT con datos nacionales de generación, composición y gestión municipal.',
    fuente: 'SEMARNAT 2020',
  },
  {
    termino: 'derrama económica',
    definicion: 'Suma de ingresos directos (venta materiales) + ahorro de disposición + empleo generado. Mide el impacto económico local del programa.',
    fuente: 'Modelo ALQUIMIA — Bootstrap §2.8',
  },

  // ── Social / Demográfico ────────────────────────────────────────────────────
  {
    termino: 'rezago social',
    definicion: 'Índice CONEVAL que agrega carencias en educación, salud, vivienda y servicios básicos. Classifica municipios en 5 grados: muy bajo a muy alto.',
    fuente: 'CONEVAL Índice de Rezago Social 2020',
    url: 'https://www.coneval.org.mx/Medicion/IRS/Paginas/Indice_Rezago_Social_2020.aspx',
  },
  {
    termino: 'CONEVAL',
    definicion: 'Consejo Nacional de Evaluación de la Política de Desarrollo Social. Organismo autónomo que mide la pobreza y evalúa programas sociales en México.',
    fuente: 'DOF Ley General de Desarrollo Social',
    url: 'https://www.coneval.org.mx',
  },
  {
    termino: 'ENOE',
    definicion: 'Encuesta Nacional de Ocupación y Empleo. Publicada trimestralmente por INEGI; es la fuente oficial de estimaciones del sector informal de recuperación.',
    fuente: 'INEGI ENOE 2024',
    url: 'https://www.inegi.org.mx/programas/enoe/15ymas/',
  },
  {
    termino: 'ENIGH',
    definicion: 'Encuesta Nacional de Ingresos y Gastos de los Hogares. Bienal, INEGI. Fuente del 35% de hogares sin espacio para contenedores diferenciados.',
    fuente: 'INEGI ENIGH 2022',
    url: 'https://www.inegi.org.mx/programas/enigh/nc/2022/',
  },
  {
    termino: 'sector informal de recuperación',
    definicion: 'Trabajadores sin contrato que recolectan materiales reciclables. ENOE 2024 estima 110,000–150,000 en México; su integración al programa es clave para evitar resistencia operativa.',
    fuente: 'INEGI ENOE T1 2024',
  },
  {
    termino: 'separación en origen',
    definicion: 'Práctica de clasificar los residuos por tipo (orgánico, inorgánico) en el hogar o negocio antes de entregarlos al recolector. Base de cualquier programa de reciclaje efectivo.',
    fuente: 'LGPGIR Art. 10, SEMARNAT',
  },

  // ── Planeación / PERT ──────────────────────────────────────────────────────
  {
    termino: 'holgura',
    definicion: 'Tiempo de retraso máximo que puede absorber una tarea sin afectar la fecha de entrega del proyecto. Tareas con holgura = 0 forman la ruta crítica.',
    fuente: 'CPM — Project Management Institute',
  },
  {
    termino: 'hito de proyecto',
    definicion: 'Evento clave de cero duración que marca el inicio o fin de una fase importante. Ejemplo: "Permiso de uso de suelo obtenido" es un hito en la fase de habilitación legal.',
    fuente: 'PMBOK 6ª edición',
  },
  {
    termino: 'horizonte de evaluación',
    definicion: 'Número de años sobre el que se calculan los flujos de efectivo del proyecto. ALQUIMIA permite 3–7 años; BANOBRAS recomienda mínimo 5 años para infraestructura municipal.',
    fuente: 'BANOBRAS Guía de Evaluación de Proyectos 2022',
  },

  // ── Financiero avanzado ────────────────────────────────────────────────────
  {
    termino: 'BCR',
    definicion: 'Benefit-Cost Ratio — cociente entre el valor presente de beneficios y costos. BCR ≥ 1.006 es el umbral mínimo viable para proyectos RSU según Al-Salem et al. (2024).',
    fuente: 'Al-Salem et al. (2024), Sustainability 16(3):1127',
  },
  {
    termino: 'Monte Carlo',
    definicion: 'Método de simulación que corre miles de escenarios con variables aleatorias para estimar rangos de resultados (TIR P10/P50/P90). No es garantía, sino rango de posibilidades.',
    fuente: 'Al-Salem et al. (2024); PMBOK 6ª ed.',
  },
  {
    termino: 'distribución triangular',
    definicion: 'Distribución de probabilidad definida por tres puntos: mínimo, moda y máximo. Usada en Monte Carlo cuando no hay datos históricos suficientes para una distribución normal.',
    fuente: 'Al-Salem et al. (2024) — parámetros estándar para RSU',
  },
  {
    termino: 'payback descontado',
    definicion: 'Tiempo para recuperar la inversión considerando el valor del dinero en el tiempo (con tasa de descuento). Siempre mayor al payback simple; más conservador y riguroso.',
    fuente: 'Evaluación financiera de proyectos — SHCP',
  },
  {
    termino: 'tasa de descuento social',
    definicion: 'Tasa que el gobierno usa para evaluar el costo de oportunidad del dinero público. SHCP México: 10% en términos reales para proyectos de inversión pública.',
    fuente: 'SHCP Lineamientos de Análisis Costo-Beneficio 2021',
  },
  {
    termino: 'multiplicador económico',
    definicion: 'Efecto amplificador de cada peso invertido en la economía local. Un centro de acopio genera $1.40 en actividad económica indirecta por cada $1 de ingreso directo (MULTIPLICADORES ALQUIMIA).',
    fuente: 'Modelo ALQUIMIA — Bootstrap §2.8',
  },

  // ── Ambiental ─────────────────────────────────────────────────────────────
  {
    termino: 'biogás',
    definicion: 'Gas combustible producido por la digestión anaeróbica de residuos orgánicos. Compuesto principalmente de metano (CH₄). Se puede convertir en electricidad o calor.',
    fuente: 'INECC Manual de biogás municipal 2019',
  },
  {
    termino: 'factor de emisión',
    definicion: 'Toneladas de CO₂e evitadas al reciclar una tonelada de material específico. Ejemplo: reciclaje de aluminio evita ~9 t CO₂e/t; papel ~1 t CO₂e/t.',
    fuente: 'INECC Factores de emisión 2024',
  },
  {
    termino: 'relleno sanitario',
    definicion: 'Sitio de disposición final de RSU que opera con técnica sanitaria: impermeabilización, captación de lixiviados y biogás. Alternativa al tiradero a cielo abierto.',
    fuente: 'SEMARNAT NOM-083-SEMARNAT-2003',
  },
  {
    termino: 'economía circular',
    definicion: 'Modelo económico que mantiene materiales en uso el mayor tiempo posible, reduciendo residuos. Tasa de circularidad de México: 9.63% (INECC 2024, meta OCDE: ≥30%).',
    fuente: 'INECC Diagnóstico Circularidad México 2024',
  },
]

/** Busca una entrada del glosario por término exacto o parcial (case-insensitive). */
export function buscarTermino(texto: string): GlosarioEntry | undefined {
  const lower = texto.toLowerCase()
  return GLOSARIO.find(e =>
    e.termino.toLowerCase() === lower ||
    lower.includes(e.termino.toLowerCase())
  )
}
