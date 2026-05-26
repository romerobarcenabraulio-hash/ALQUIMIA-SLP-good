/**
 * Genera chartBriefCatalog.ts con QHC editorial LOGOS y rotación de 5 ángulos.
 * Ejecutar: node scripts/logos-chart-briefs.mjs
 */
import { writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUT = join(__dirname, '../src/data/chartBriefCatalog.ts')

const ANGLES = ['cifra', 'metodo', 'contraste', 'implicacion', 'pregunta']
let angleIdx = 0
function nextAngle() {
  const a = ANGLES[angleIdx % 5]
  angleIdx++
  return a
}

/** @type {Record<string, {module:string,type:string,label:string,angle:string,q:string,fuente:string,porque:string,cuidado:string,cifras?:string}>} */
const ENTRIES = {
  'volumen-rsu': { module: 'M01', type: 'KPI + barras', label: 'Volumen y derrama económica', cifras: 't/día capturable · ingreso anual MXN',
    q: 'Cientos de toneladas al día y decenas de millones al año: ahí empieza la derrama del programa. RSU total = población × kg/hab/día; lo vendible = captura × (1 − merma) × precio × 365.',
    fuente: 'Población INEGI 2020 · tasa SEMARNAT DBGIR · precios mercado secundario 2025.',
    porque: 'Lea primero volumen y pesos; el desglose por material vive en M05. Sin toneladas defendibles no hay presupuesto creíble.',
    cuidado: 'La curva de captura mueve en cascada toneladas, ingresos y CO₂e: es el primer supuesto que debe auditar Cabildo.' },
  'trayectoria-captura': { module: 'M01', type: 'línea', label: 'Trayectoria de captura', cifras: '% captura por año del horizonte',
    q: 'La curva en S no es adorno: modela arranque lento y masa crítica en años 3–4. Cada punto = pctCapturaPorAño del escenario activo frente a una rampa lineal ingenua.',
    fuente: 'Programas RSU ciudades medias MX 2018–2023 documentados SEMARNAT.',
    porque: 'Una rampa recta suele subestimar comunicación y hábito al inicio; la S obliga a financiar años bajos sin declarar fracaso prematuro.',
    cuidado: 'El % del último año del horizonte ancla ingresos maduros; los primeros años condicionan flujo de caja y quejas ciudadanas.' },
  'composicion-rsu': { module: 'M01', type: 'donut', label: 'Composición del RSU', cifras: '% por fracción · orgánicos ~52%',
    q: 'Más plástico y menos orgánico suben ingreso por kg; más orgánico eleva costo de disposición evitada. El donut traduce composición nacional en toneladas y precio por material.',
    fuente: 'SEMARNAT Diagnóstico Básico GIR 2020 — ciudades medias.',
    porque: 'Sin caracterización local, SEMARNAT es la fuente más defendible y comparable entre municipios.',
    cuidado: 'Un punto porcentual en orgánicos puede mover millones en ingreso potencial — validar con muestreo antes de Cabildo.' },
  'impactos-acumulados': { module: 'M01', type: 'área/línea', label: 'Impactos acumulados', cifras: 'tCO₂e evitadas acumuladas',
    q: 'El proyecto resiste la lectura solo financiera cuando las toneladas desviadas se traducen en CO₂e comparables con metas climáticas municipales.',
    fuente: 'INECC factores RSU 2024 · IPCC AR6 GWP₁₀₀ CH₄ = 27.9.',
    porque: 'CO₂e permite dialogar con financiamiento verde sin mezclarla con ingreso por venta de material.',
    cuidado: 'Si el relleno captura biogás activo, el factor baja y el beneficio ambiental también — declararlo en el expediente.' },

  'diagnostico-juridico': { module: 'M02', type: 'tabla/KPI', label: 'Diagnóstico jurídico', cifras: '% cobertura · vacíos LGPGIR',
    q: '¿Qué obligación del LGPGIR queda sin regla local operable? El % de cobertura separa artículos con resolución vigente de citas sin instrumento de aplicación.',
    fuente: 'LGPGIR DOF 2022 · reglamento municipal cargado.',
    porque: 'Detectar vacíos antes de operar evita multas y convenios sin base — error frecuente en arranques apresurados.',
    cuidado: 'PDF incompleto del reglamento sobreestima cobertura: exija versión consolidada firmada.' },
  'cobertura-normativa': { module: 'M02', type: 'arco/indicador', label: 'Cobertura normativa', cifras: 'meta 85% artículos clave',
    q: '85% es la meta recomendada sobre artículos clave LGPGIR: debajo, el expediente muestra huecos antes de la sesión de Cabildo.',
    fuente: 'Artículos 10, 17, 18, 19, 22, 25, 28, 36, 95–103 LGPGIR.',
    porque: 'Convierte análisis jurídico en KPI comparable entre municipios y años de gobierno.',
    cuidado: '«Operable» exige lineamiento o resolución — la cita sin reglamento de aplicación no cuenta.' },
  'm02-cobertura-normativa': { module: 'M02', type: 'barra', label: 'Cobertura normativa por municipio', cifras: '% por municipio vs 85%',
    q: 'En vista ZM, cada barra conserva jurisdicción propia: mezclar sanción entre municipios invalida el dictamen territorial.',
    fuente: 'Reglamentos cargados · taxonomía ALQUIMIA de obligaciones operables.',
    porque: 'El comparativo obliga a cerrar rezagos municipales antes de acuerdos metropolitanos genéricos.',
    cuidado: 'Reglamento anterior a 2014 puede dejar separación en origen como propuesta, no obligación vigente.' },

  'gantt-maestro': { module: 'M03', type: 'Gantt', label: 'Gantt maestro', cifras: 'duración β-PERT · costo por fase',
    q: 'Semanas en rojo: ruta crítica. El Gantt distribuye CAPEX por fase para ver si el municipio puede financiar el tramo crítico sin desembolso total día uno.',
    fuente: 'Hitos ALQUIMIA · fracciones proyectos SEMARNAT-BID 2018–2023.',
    porque: 'Un calendario único sin fases oculta el momento en que se necesita tesorería y permisos.',
    cuidado: 'Cada centro de acopio suma ~3 semanas a infraestructura: dur = max(8, n_cas × 3).' },
  'm03-gantt-master': { module: 'M03', type: 'Gantt resumen', label: 'Gantt maestro (7 líneas)', cifras: '7 programas · semanas totales',
    q: 'Monte Carlo del calendario no hace falta para la primera lectura: siete líneas muestran si el horizonte del escenario colisiona con capacidad municipal.',
    fuente: 'Catálogo hitos · preset de trayectoria activo.',
    porque: 'Resumen ejecutivo antes de abrir T01–T15 — alcalde ve plazos, PMO abre detalle.',
    cuidado: 'Acortar horizonte concentra hitos y eleva riesgo de colisión de licitación y permisos.' },
  'm03-gantt-detail': { module: 'M03', type: 'Gantt detalle', label: 'Gantt detallado T01–T15', cifras: 't_o / t_m / t_p por tarea',
    q: 'TIR del programa importa, pero aquí importa si T09 (permisos) come el año 1: el detalle habilita negociar plazos con obra y licitación.',
    fuente: 'builder.py · estimados optimista/probable/pesimista.',
    porque: 'Sin tareas nombradas, el Cabildo aprueba un programa sin dueños ni fechas verificables.',
    cuidado: 'Estimado pesimista de trámites — subestimarlo desplaza arranque 4–8 semanas.' },
  'pert-ruta-critica': { module: 'M03', type: 'red PERT', label: 'PERT — Ruta crítica', cifras: 'holgura = LS − ES',
    q: 'Holgura cero: ahí se concentra supervisión. La red cuantifica retraso en permisos en lugar de ignorarlo en un calendario fijo.',
    fuente: 'Dependencias catálogo · estimados documentados.',
    porque: 'El PERT traduce dependencias en semanas de riesgo — lectura que el Gantt solo no da.',
    cuidado: 'Estimados pesimistas de permisos dominan en municipios con capacidad administrativa baja.' },
  'm03-pert-summary': { module: 'M03', type: 'diagrama flujo', label: 'PERT resumido G1–G5', cifras: 'precedencias obligatorias',
    q: '¿Qué bloquea qué antes del detalle técnico? Una pantalla para alcalde: fases G1–G5 y tareas críticas sin abrir la red completa.',
    fuente: 'Gate definitions KRONOS · precedencias Gantt.',
    porque: 'Separa gates políticos de tareas de obra — confusión frecuente en expedientes municipales.',
    cuidado: 'No sustituye holgura numérica: abrir ruta crítica para cifras de semanas.' },
  'm03-pert-full': { module: 'M03', type: 'grafo', label: 'Red PERT completa', cifras: 'T01–T15 · nodos verdes = críticos',
    q: 'Nodos verdes, holgura cero: el equipo de supervisión vive ahí. Clic en nodo: duración esperada y responsable RACI.',
    fuente: 'Estimados β-PERT · RACI organigrama objetivo.',
    porque: 'El grafo completo es la evidencia PMO; el resumen es la narrativa Cabildo.',
    cuidado: 'Varianza del proyecto = Σ(σ²) solo de tareas críticas — no promediar holguras.' },
  'm03-critical-table': { module: 'M03', type: 'tabla', label: 'Ruta crítica (tabla)', cifras: 'impacto si +1 semana',
    q: 'Tabla accionable: tarea, responsable, impacto. Traduce el grafo en checklist con dueño antes de sesión.',
    fuente: 'Cálculo PERT · roles organigrama.',
    porque: 'Sin responsable nombrado, la ruta crítica es diagrama decorativo.',
    cuidado: 'Responsable «por definir» invalida la tabla — cerrar en M07 antes de Cabildo.' },
  'm03-raci': { module: 'M03', type: 'matriz', label: 'Matriz RACI', cifras: 'un Aprobador por fila',
    q: '¿Quién firma bitácora PER y reportes GRI? Un solo A por actividad — ambigüedad mata programas con buena ingeniería.',
    fuente: 'PMBOK 6 · plantilla organigrama programa CA.',
    porque: 'Elimina la respuesta «eso lo ve otra dirección» en incidentes operativos.',
    cuidado: 'Tabulador salarial municipal puede diferir del benchmark — recalcular OPEX nómina.' },
  'm03-bottlenecks': { module: 'M03', type: 'matriz riesgo', label: 'Riesgos de calendario', cifras: 'probabilidad × impacto',
    q: 'El retraso en permisos no es mala suerte: es riesgo modelado con mitigación y dueño, enlazado a gates G2–G3.',
    fuente: 'Registro R01–R06 · holgura PERT activa.',
    porque: 'Conecta calendario con institucional — donde suelen romperse los planes RSU.',
    cuidado: 'Probabilidades sin revisión trimestral quedan obsoletas tras el primer trimestre operativo.' },
  'm03-map': { module: 'M03', type: 'mapa', label: 'Mapa territorial de despliegue', cifras: 'piloto · expansión · cobertura',
    q: '¿Dónde encender el programa primero? Despliegue secuenciado evita colapsar operación y comunicación en día uno.',
    fuente: 'Plan territorial M06 · colonias CONEVAL/INEGI.',
    porque: 'La oleada 1 define credibilidad ciudadana para toda la curva de captura.',
    cuidado: 'Oleada mal elegida invalida la curva S de todo el municipio.' },
  'm03-progression': { module: 'M03', type: 'línea múltiple', label: 'Progresión acumulada', cifras: 'empleos · CO₂e · derrama · captura',
    q: 'Años 3–5: efecto de masa crítica visible. Las series muestran por qué el Cabildo debe sostener inversión antes del «punto cómodo».',
    fuente: 'Motor simulador · serieAnual del escenario.',
    porque: 'Narrativa de retorno político — sin ella, solo se ven costos del año 1.',
    cuidado: 'Empleos directos ≠ formalizados: distinguir en comunicación pública.' },
  'm03-gates': { module: 'M03', type: 'checklist', label: 'Condiciones G1–G5', cifras: 'G1 Cabildo → G5 cobertura',
    q: '¿Qué gate político falta antes de obra? Separar G1–G5 de tareas G01–G14 evita votar inversión sin prerequisitos institucionales.',
    fuente: 'gate_tracker KRONOS · narrative.py.',
    porque: 'Error frecuente: mezclar licitación con aprobación de Cabildo en la misma fecha.',
    cuidado: 'Gate inferido del primer no cruzado; en Fase 0–1 todos pueden estar NO_INICIADO.' },

  'score-riesgo-total': { module: 'M05D/M14', type: 'KPI compuesto', label: 'Score de riesgo total', cifras: 'R_total 0–100 · semáforo',
    q: '40% del score es riesgo político — no porque ignore mercado, sino porque ahí mueren programas técnicamente sanos. R_total = 0.30·mercado + 0.40·político + 0.20·operativo + 0.10·regulatorio.',
    fuente: 'Fracasos programas RSU MX 2010–2023 · inputs M10/M02/M05/M03.',
    porque: 'Jerarquiza antes del expediente: mitigar la dimensión dominante, no todas por igual.',
    cuidado: 'Ponderaciones ajustables si el contexto local invierte la jerarquía típica.' },
  'precio-materiales': { module: 'M05', type: 'barra', label: 'Precios por material', cifras: 'MXN/t · bandas min/max',
    q: 'PET + HDPE ≈ 65–70% del ingreso: −20% en PET ≈ −15% en ingreso total. Barras = ton × precio × (1 − merma).',
    fuente: 'Investigación precios RSU MX 2025 · constants.ts.',
    porque: 'Mercado secundario ±20–35% anual — precio fijo sin rango subestima riesgo de Cabildo.',
    cuidado: 'Validar cotización local antes de anexar a licitación o contrato marco.' },
  'riesgo-mercado': { module: 'M05', type: 'indicador', label: 'Riesgo de mercado', cifras: 'tasa colocación · R_mercado',
    q: 'Volumen sin comprador confirmado pesa más que programa pequeño con contrato: R_mercado usa (1 − colocación) × volumen × precio × 0.35.',
    fuente: 'market/placement.py · benchmarks 2019–2024.',
    porque: 'Traduce offtaker en número — finanzas pregunta por colocación, no por toneladas teóricas.',
    cuidado: 'Default 85% colocación; a 60% el riesgo financiero se triplica.' },
  'm05-risk-matrix': { module: 'M10', type: 'matriz 5×5', label: 'Matriz de riesgo', cifras: '12 riesgos P×I',
    q: '¿Dónde se concentran los rojos antes del Cabildo? Doce riesgos en probabilidad × impacto con color PMBOK.',
    fuente: 'Registro R01–R06 + riesgos mercado y operación.',
    porque: 'Visualiza concentración — celdas vacías no significan cero riesgo.',
    cuidado: 'Riesgos no registrados siguen existiendo aunque la celda esté vacía.' },
  'm05-actors': { module: 'M10', type: 'barra', label: 'Aceptación por actor', cifras: 'IPC · bandas de confianza',
    q: 'La captura de años 1–2 depende más de condominio y vía pública que de tonelaje de planta: IPC por segmento con bandas.',
    fuente: 'Encuesta municipal o benchmark SEMARNAT · mapa actores M02C.',
    porque: 'Sin aceptación medida, el modelo asume adopción optimista.',
    cuidado: 'Sin encuesta local, severidad de comunicación es estimada, no medida.' },
  'm05-donut': { module: 'M10', type: 'donut', label: 'Composición del riesgo', cifras: '% por dimensión',
    q: 'Político 40%, mercado 30%: el donut muestra la dimensión dominante sin leer cuatro tablas.',
    fuente: 'Desglose score compuesto M14.',
    porque: 'Un vistazo para regiduría — prioriza conversación con actores correctos.',
    cuidado: 'Dimensiones correlacionadas: mitigar político puede bajar operativo.' },
  'm05-drivers': { module: 'M10', type: 'barra horizontal', label: 'Drivers de éxito', cifras: 'impacto relativo',
    q: '¿Qué variable, si falla, más reduce probabilidad global? Heurística de sensibilidad sobre el escenario activo.',
    fuente: 'Monte Carlo simplificado · sensibilidad escenario.',
    porque: 'Prioriza variables a asegurar contractualmente: precio, captura, operador.',
    cuidado: 'Correlaciones no modeladas — efecto combinado puede ser mayor.' },
  'm05-prob-dist': { module: 'M10', type: 'histograma', label: 'Monte Carlo éxito', cifras: '500 corridas · P10/P50/P90',
    q: 'Quinientas corridas triangulares: un solo número de éxito oculta la cola. Percentiles obligatorios para inversionista y Cabildo.',
    fuente: 'Perturbación precios y captura ±σ del escenario.',
    porque: 'La mediana no basta si P10 cae bajo umbral político de viabilidad.',
    cuidado: 'Triangular asume simetría — colas reales pueden ser más gruesas.' },
  'm05-buyers': { module: 'M10', type: 'tabla', label: 'Compradores y colocación', cifras: 'estatus contractual',
    q: 'Sin offtaker nombrado, el ingreso es proyección. Tabla: comprador · material · precio · estatus · riesgo rechazo.',
    fuente: 'DENUE/recicladoras · placement rules.',
    porque: 'Finanzas distingue flujo asegurado de «en negociación».',
    cuidado: '«En negociación» no cuenta como colocación para el score de riesgo.' },
  'm05-price-bands': { module: 'M10', type: 'banda', label: 'Bandas de precio', cifras: 'P10/P50/P90 MXN/t',
    q: 'P10 y P90 antes de fijar tarifa con operador: upside y downside por fracción frente al precio del escenario base.',
    fuente: 'Cotizaciones mercado secundario · volatilidad trimestral.',
    porque: 'Evita licitar con precio spot que no se sostiene doce meses.',
    cuidado: 'Spot ≠ contrato anual — validar carta de intención de compra.' },
  'm05-tornado': { module: 'M10', type: 'tornado', label: 'Tornado ingreso', cifras: 'Δ ingreso · Δ probabilidad ±20–30%',
    q: '¿Qué palanca negociar con concesionario primero? Barras = cambio en ingreso anual y probabilidad de éxito por variable ±20–30%.',
    fuente: 'Motor financiero · precio, captura, combustible, WACC.',
    porque: 'Este tornado mide ingreso por materiales — distinto del VPN en M13.',
    cuidado: 'Variables correlacionadas — no sumar impactos como independientes.' },
  'm05-revenue': { module: 'M10', type: 'distribución', label: 'Derrama anual probabilística', cifras: 'P10/P50/P90 ingreso',
    q: 'Distribución de ingreso bruto anual: separa venta de material de ahorro en disposición y externalidades (ver M04).',
    fuente: 'Flujos simulador · precios y captura M01.',
    porque: 'Cabildo necesita rango, no solo cifra central.',
    cuidado: 'No incluye externalidades ni ingreso fiscal indirecto.' },
  'm05-mitigation': { module: 'M10', type: 'matriz', label: 'Mitigación', cifras: 'dueño · plazo · residual',
    q: 'Financiadores exigen dueño y fecha, no lista de miedos. Matriz: dimensión · riesgo · acción · residual documentado.',
    fuente: 'Registro riesgos · planes PMO.',
    porque: 'Cierra el ciclo riesgo → acción verificable.',
    cuidado: 'Residual «aceptado» requiere firma de titular de área.' },
  'm05-trends': { module: 'M10', type: 'lectura cualitativa', label: 'Tendencias T1–T6', cifras: 'presión regulatoria · commodities',
    q: 'Regulación, precios commodity y clima político mueven el score entre trimestres — lectura anticipada, no predicción puntual.',
    fuente: 'Inteligencia ALQUIMIA · SEMARNAT/BANXICO públicos.',
    porque: 'Evita sorpresas en renegociación de contrato año 2.',
    cuidado: 'Intensidad cualitativa — no sustituye monitoreo de mercado en vivo.' },
  'm05-conditions': { module: 'M10', type: 'checklist', label: 'Condiciones para proceder', cifras: '10 condiciones',
    q: '¿Se puede declarar viable sin prerequisitos abiertos? Diez condiciones legal, mercado y operación antes de implementación.',
    fuente: 'Checklist ALQUIMIA pre-Cabildo · gates G1–G2.',
    porque: 'Evita votar inversión con huecos que el síndico detectará en revisión.',
    cuidado: 'Condición cumplida exige evidencia archivada — no autodeclaración.' },

  'mapa-centros-acopio': { module: 'M06', type: 'mapa', label: 'Centros de acopio', cifras: 'radio influencia · lat/lon',
    q: 'Más de 2 km entre generación y CA puede caer participación ~40%: puntos verificados vs propuesta en mapa.',
    fuente: 'Google Places/DENUE · optimización ALQUIMIA.',
    porque: 'Accesibilidad condiciona captura real más que campaña sin infraestructura cercana.',
    cuidado: 'Propuestas son simulación — no predios confirmados ni uso de suelo aprobado.' },
  'm06-phase-deploy': { module: 'M06', type: 'barra/fase', label: 'Despliegue por fase', cifras: 'CAs activos · capacidad · cobertura',
    q: 'Capacidad instalada sin flujo material es el error más común: oleadas alinean CAPEX con toneladas capturables del escenario.',
    fuente: 'CA_CONFIG · plan M03 · toneladas M01.',
    porque: 'Instalar todo el año 1 con captura año 1 baja destruye TIR percibida.',
    cuidado: 'Encender/apagar un CA redistribuye rutas y viabilidad de colonias.' },
  'm06-center-table': { module: 'M06', type: 'tabla', label: 'Centros y gates sitio', cifras: 'score sitio · permisos',
    q: 'Score de sitio bajo 60% raramente obtiene permiso: tabla cruza uso de suelo, conectividad y prioridad antes de Cabildo.',
    fuente: 'Checklist NOM-161 · reglamento uso de suelo.',
    porque: 'Evita desgaste político de predios técnicamente inviables.',
    cuidado: 'Uso de suelo incompatible (30% del score) es criterio no negociable.' },

  'logistica-estacionalidad': { module: 'M08', type: 'línea estacional', label: 'Estacionalidad RSU', cifras: 'dic +15% · ene +12%',
    q: 'Diciembre +15% sobre promedio: diseñar solo para promedio anual deja sin capacidad en picos de escrutinio ciudadano.',
    fuente: 'SEMARNAT DBGIR · ENIGH 2022 · SIDUE/SEMAG 2021–2023.',
    porque: 'La flota y turnos deben sobrevivir diciembre–enero, no solo julio tranquilo.',
    cuidado: 'ZM ±20%; municipio pequeño puede ser ±5% — validar con operador.' },
  'm08-seasonality': { module: 'M08', type: 'línea vs capacidad', label: 'Estacionalidad y capacidad', cifras: 'meses en rojo',
    q: 'RSU mensual vs capacidad t/mes: detecta meses en rojo antes de firmar contrato de recolección.',
    fuente: 'Factores SEMARNAT · flota dimensionada M08.',
    porque: 'Picos dic–ene exigen flota extra — el promedio anual miente.',
    cuidado: 'Capacidad = camiones × viajes × ton/viaje; validar en campo.' },
  'm08-residential-routes': { module: 'M08', type: 'tabla rutas', label: 'Rutas por colonia', cifras: '0.15 km/hogar · 400 hog/ruta',
    q: 'Modelo casa a casa antes de VRP completo: tiempos, combustible y export Cabildo por colonia piloto.',
    fuente: 'Heurística ITDP 2023 · capacidad operadores SLP/NL/QRO.',
    porque: 'Inputs estructurados para OR-Tools o ArcGIS después.',
    cuidado: 'Densidad heterogénea mueve km/ruta ±30% vs modelo.' },
  'm08-routes': { module: 'M08', type: 'mapa', label: 'Mapa de rutas', cifras: 'orgánico · reciclable · mixto',
    q: 'Cobertura real vs colonias sin servicio diferenciado: rutas sobre zonas piloto con distancias y hook Google Routes.',
    fuente: 'Colonias piloto M03 · haversine + Routes API.',
    porque: 'Visualiza brechas antes del primer día de operación.',
    cuidado: 'Haversine subestima desvíos — factor tortuga 1.3× aplicado.' },
  'm08-trucks': { module: 'M08', type: 'barra', label: 'Camiones por material', cifras: 'unidades por fracción',
    q: 'Unidades = volumen_fracción / capacidad / frecuencia: subdimensionar flota genera incumplimiento en temporada alta.',
    fuente: 'Operadores SLP/NL/QRO 2023 · frecuencias SEMARNAT.',
    porque: 'Traduce toneladas en chasis negociables con concesionario.',
    cuidado: 'Disponibilidad real de chasis puede limitar unidades calculadas.' },

  'dictamen-captura-5v3': { module: 'M04 dictamen', type: 'comparativo', label: '5 vs 3 fracciones', cifras: 'contaminación 12% vs 25%',
    q: 'La decisión normativa en pesos: ingreso con 5 fracciones (12% contaminación) vs 3 fracciones (25%) × volumen × precio × 365.',
    fuente: 'materialPriceResearch.ts · volCapturablePorMat.',
    porque: 'Tesorería y regiduría entienden el costo de exigir más fracciones en origen.',
    cuidado: 'Precios documentales — validar localmente antes de presupuesto.' },
  'dictamen-benchmarks': { module: 'M04 dictamen', type: 'tabla', label: 'Benchmarks internacionales', cifras: 'tasa desvío · nota',
    q: 'SNAGA, Bogotá, CDMX: la propuesta adapta lecciones comparables — no invento en vacío, con definiciones distintas de «recuperación».',
    fuente: 'SNAGA · SF Environment · UAESP · SEDEMA.',
    porque: 'Defiende ambición sin prometer paridad 1:1 con ciudades distintas.',
    cuidado: 'Ajustar definiciones antes de comparar porcentajes en público.' },
  'criterios-aptitud': { module: 'M07', type: 'score', label: 'Aptitud del predio', cifras: 'ponderación 20/30/25/15/10',
    q: 'Score < 60%: raramente hay permiso. Suma acceso, uso de suelo, área, servicios y distancia a generación.',
    fuente: 'NOM-161-SEMARNAT-2011 · reglamentos uso de suelo.',
    porque: 'Evaluar antes de proponer al Cabildo evita desgaste sin salida técnica.',
    cuidado: 'Uso de suelo incompatible invalida el predio aunque el resto puntúe alto.' },
  'resumen-ejecutivo': { module: 'M13', type: 'tabla', label: 'Resumen escenarios', cifras: 'TIR · VPN · payback · empleos · CO₂e',
    q: 'Tres escenarios obligan decisión con sensibilidad: TIR y VPN sobre flujos anuales del horizonte — no solo el optimista.',
    fuente: 'Motor financiero ALQUIMIA · inputs M01–M09.',
    porque: 'Cabildo debe ver rango antes de votar un solo número.',
    cuidado: 'WACC default 12% SHCP — tesorería puede usar costo municipal distinto.' },
  'social-risk-matrix': { module: 'M02B', type: 'matriz cualitativa', label: 'Riesgos sociales', cifras: 'severidad bajo/medio/alto',
    q: '¿Cuáles tres riesgos sociales explotan en semanas 1–4 sin encuesta? Fichas cualitativas desde literatura RSU LATAM 2010–2024.',
    fuente: 'CONEVAL · INE · LGPGIR · ENOE 2024.',
    porque: 'Diseño de participación antes de operación — costo de cambio 5–10× después.',
    cuidado: 'Sin encuesta local, riesgo «comunicación» es estimado.' },
  'costo-omision-acumulado': { module: 'M04', type: 'área dual', label: 'Costo de omisión', cifras: 'contrafactual vs programa · INPC',
    q: 'Omisión en pesos comparables: disposición + salud + carbono social acumulados frente a programa con valorización y beneficio capturado.',
    fuente: 'SEMARNAT 2022 · INSP · BANXICO INPC · SCE.',
    porque: 'Cabildo decide también cuánto cuesta no actuar — no solo CAPEX del programa.',
    cuidado: 'Capacidad residual del relleno y tarifa media pueden subestimar costo local.' },
  'social-aceptacion-actores': { module: 'M02B', type: 'barra', label: 'Aceptación por actor', cifras: '% por segmento · IPC',
    q: 'Barras de aceptación: años 1–2 dependen más de ciudadanos y operador que de tonelaje de planta — IPC cuando hay encuesta.',
    fuente: 'Encuesta IPC M02B · benchmarks SEMARNAT 24 municipios.',
    porque: 'Leer antes del score político agregado en M14.',
    cuidado: 'Sin encuesta local, severidad de comunicación es estimada.' },
  'doble-materialidad-grid': { module: 'M11', type: 'matriz 2×2', label: 'Doble materialidad ESRS', cifras: 'posiciones 1–5',
    q: 'Impacto ambiental/social vs relevancia financiera (ESRS E5): prioriza temas para reporte ESG y deuda verde.',
    fuente: 'EFRAG ESRS E5 2023 · GRI 306 · literatura RSU.',
    porque: 'Evita reportar todo con igual peso — enfoque estratégico.',
    cuidado: '«Resistencia ciudadana» se mueve con IPC — revisar tras encuesta M02B.' },
  'm09-source-matrix': { module: 'M09', type: 'tabla', label: 'Matriz fuentes CAPEX/OPEX', cifras: 'monto · confianza · fórmula',
    q: 'Cada peso de inversión con trazabilidad: línea, fuente, fecha y fórmula — Cabildo audita total y detalle.',
    fuente: 'Centros_Acopio_v2.xlsx · marketplaces mayo 2026 · IMSS Rama 37.',
    porque: 'Total CAPEX sin fuente no sobrevive revisión de finanzas municipales.',
    cuidado: 'Precios mayo 2026 son referencia; cotización local ±10%.' },
  'costos-capex-fases': { module: 'M09', type: 'barra', label: 'CAPEX por fase', cifras: 'F1–F6 · M MXN',
    q: 'Desembolso por fases F1–F6 alinea inversión con captura real — evita pagar madurez completa en año 1.',
    fuente: 'Centros_Acopio_v2.xlsx · mix CAs escenario activo.',
    porque: 'Finanzas municipales negocian por fase, no por monolito.',
    cuidado: 'No extrapolar CAPEX de otra ciudad sin recalcular mix M06.' },

  'escenarios-waterfall': { module: 'M13', type: 'waterfall', label: 'Flujo de valor', cifras: 'componentes VPN · M MXN',
    q: 'VPN neto en millones: barras desglosan ahorros, ingresos y costo de implementación antes de la decisión de Cabildo.',
    fuente: 'Motor financiero · proporciones M06/M04.',
    porque: 'Muestra de dónde nace el valor — no solo el total verde.',
    cuidado: 'Proporciones heurísticas — validar con modelo municipal cerrado.' },
  'escenarios-tir': { module: 'M13', type: 'barra horizontal', label: 'TIR por escenario', cifras: 'acelerado · base · conservador · sin intervención',
    q: 'Cuatro barras de TIR comparan captura y precio nominal — multiplicadores del caso central, no recálculo independiente completo.',
    fuente: 'resultados.tir · SCENARIO_DEF.',
    porque: 'Lectura relativa rápida; Monte Carlo y tornado profundizan incertidumbre.',
    cuidado: 'Multiplicadores no capturan correlación precio–captura.' },
  'escenarios-vpn': { module: 'M13', type: 'área', label: 'Ruta de inversión', cifras: 'CAPEX acumulado por fase',
    q: 'Área de inversión acumulada por fase F1–F5: calendario de desembolso que condiciona VPN y payback descontado.',
    fuente: 'FASES_INVERSION · capexTotalSistema.',
    porque: 'Inversión acumulada ≠ erogación anual — ver flujo de caja en expediente.',
    cuidado: 'Fase óptima depende de mix M06 del escenario activo.' },

  'm13-waterfall-valor': { module: 'M13', type: 'waterfall', label: 'Valor acumulado venta base', cifras: 'VPN · TIR · WACC',
    q: 'Componentes positivos y negativos del VPN bajo WACC editable: lectura de si el programa crea valor con supuestos actuales.',
    fuente: 'Venta base = precio × volumen × (1−merma); costos operativos y CAPEX del escenario.',
    porque: 'Puente entre sliders de supuesto y decisión — antes de Monte Carlo.',
    cuidado: 'Externalidades ampliadas requieren verificación aparte antes de comunicación pública.' },
  'm13-monte-carlo-tir': { module: 'M13', type: 'histograma', label: 'Monte Carlo TIR', cifras: '2 000 corridas · P10/P50/P90',
    q: 'Monte Carlo nació donde las fórmulas cerradas no alcanzan: demasiadas variables interactuando. ALQUIMIA corre 2 000 escenarios; en cada uno, precios de PET, aluminio, papel y la trayectoria de captura se sortean en rangos realistas. Salida: distribución de TIR con percentiles 10/50/90 — cuánto resiste el proyecto a la incertidumbre real del mercado.',
    fuente: 'Distribución triangular ±σ en precios y captura · calculator.ts.',
    porque: 'Una TIR puntual es optimista; Cabildo necesita cola inferior y mediana.',
    cuidado: 'Si P10 cruza bajo WACC, revisar captura y precios antes de comprometer CAPEX.' },
  'm13-tornado-vpn': { module: 'M13', type: 'tornado', label: 'Tornado VPN ±20%', cifras: 'rango MXN por variable OAT',
    q: 'WACC y la captura del año 1 suelen encabezar el ranking; PET y vidrio, mucho menos. La tornado revela la jerarquía de palancas ante ±20%: vigilar costo de capital y arranque de campaña en residenciales rinde más que afinar contratos material por material.',
    fuente: 'tornadoAnalysis · calcular() por variable independiente.',
    porque: 'Lectura ejecutiva del reparto de riesgo — la rejilla de combinaciones abajo confirma choques coordinados.',
    cuidado: 'Variables correlacionadas — no sumar barras como si fueran aditivas.' },
  'm13-cashflow': { module: 'M13', type: 'línea múltiple', label: 'Flujo de caja 3 escenarios', cifras: 'acumulado · horizonte',
    q: 'La forma del flujo dice si hace falta refinanciamiento temprano: derrama bruta menos CAPEX y OPEX en tres trayectorias de captura.',
    fuente: 'Flujo anual del escenario · tipo de cambio y precios activos.',
    porque: 'TIR alta con caja negativa año 2 sigue siendo problema de tesorería.',
    cuidado: 'Trayectoria de captura y cobertura de rutas condicionan el acumulado.' },
  'm13-rejilla-stress': { module: 'M13', type: 'rejilla 2×2', label: 'Rejilla de combinaciones', cifras: 'volumen × precio · VPN por celda',
    q: 'La rejilla contrasta choques de volumen y precios respecto al caso base. Mayoría verde: estructura aguanta shocks coordinados; predominio rojo: priorizar contratos indexados o coberturas simples antes de Cabildo.',
    fuente: 'Combinaciones discretas captura × precio ponderado; VPN completo por celda.',
    porque: 'Estándar editorial M13 — complementa tornado univariado con choques coordinados.',
    cuidado: 'Combinaciones discretas; no sustituye Monte Carlo completo.' },
  'm13-monte-carlo-vpn': { module: 'M13', type: 'histograma', label: 'Monte Carlo VPN 20 años', cifras: '2 000 iter · P10/P50/P90 VPN',
    q: 'Dos mil iteraciones sobre el VPN del horizonte: cuando la pregunta es «¿cuántos millones en pesos de hoy?», no solo «¿qué TIR?». Percentiles 10/50/90 del valor presente neto bajo la misma perturbación de precios y captura.',
    fuente: 'monteCarloTriangularSamples · motor calcular().',
    porque: 'Inversionistas y finanzas municipales suelen anclarse al VPN, no a la TIR.',
    cuidado: 'Resultados probabilísticos — no son garantía ni presupuesto autorizado.' },

  'esquema-ingresos-municipio': { module: 'M12', type: 'donut', label: 'Ingresos al municipio', cifras: '% operativo vs fiscal',
    q: 'El donut traduce cláusulas de concesión en flujo verificable: reparto ingreso operativo vs fiscal según % socio público.',
    fuente: 'Parámetros concesión · MARCO_LEGAL_CONCESION.',
    porque: 'Cabildo vota reparto, no siglas contractuales.',
    cuidado: 'Ingresos fiscales dependen de recaudación efectiva — no solo tarifa nominal.' },
  'esquema-derrama-sector': { module: 'M12', type: 'barra', label: 'Derrama por sector', cifras: 'cadena acopio · reciclaje · acero · agro',
    q: 'Derrama regional más allá del ingreso directo municipal: empleos y multiplicadores sectoriales documentados.',
    fuente: 'CANACERO/SAGARPA · empleos mix M06.',
    porque: 'Conecta concesión con argumento económico regional.',
    cuidado: 'Empleos inducidos no incluidos — solo directos en catálogo.' },
  'm07-staff-composition': { module: 'M07', type: 'barra', label: 'Composición de personal', cifras: 'plazas por rol',
    q: 'Plazas directas por rol operativo: traduce capacidad instalada en contratación verificable para Cabildo.',
    fuente: 'ORGANIGRAMA · ratios personal/ton escenario.',
    porque: 'Sin plazas, el organigrama es organigrama de papel.',
    cuidado: 'Indirectos (recicladores) en derrama M01, no aquí.' },
  'inspeccion-completitud': { module: 'M07', type: 'donut', label: 'Índice de completitud', cifras: '% cumplido / parcial / pendiente',
    q: '¿Puede generarse el dictamen? Donut de checklist PER: parcial no cuenta como cumplido para firma.',
    fuente: 'Checklist PER digital · gates M07.',
    porque: 'Expediente incompleto no debe salir del sistema.',
    cuidado: 'Estados «parcial» bloquean firma de dictamen.' },
}

// Assign angles in catalog order, no adjacent same
const keys = Object.keys(ENTRIES)
const anglesAssigned = {}
let prev = null
for (const key of keys) {
  let a = nextAngle()
  while (a === prev) {
    a = nextAngle()
  }
  anglesAssigned[key] = a
  prev = a
  ENTRIES[key].angle = a
}

const header = `import type { ChartBrief } from '@/data/moduleEditorialBriefs'

function brief(
  chart_id: string,
  chart_label: string,
  como_se_calcula: string,
  origen_datos: string,
  por_que_este_enfoque: string,
  supuesto_critico: string,
): ChartBrief {
  return {
    chart_id,
    chart_label,
    metodologia: { como_se_calcula, origen_datos, por_que_este_enfoque, supuesto_critico },
  }
}

/** Catálogo LOGOS — QHC editorial por gráfica (chart_id = data-chart-id en JSX). Ángulos rotados: cifra · método · contraste · implicación · pregunta. */
export const CHART_BRIEF_CATALOG: Record<string, ChartBrief> = {
`

const sections = {
  'M01': ['volumen-rsu', 'trayectoria-captura', 'composicion-rsu', 'impactos-acumulados'],
  'M02': ['diagnostico-juridico', 'cobertura-normativa', 'm02-cobertura-normativa'],
  'M03': ['gantt-maestro', 'm03-gantt-master', 'm03-gantt-detail', 'pert-ruta-critica', 'm03-pert-summary', 'm03-pert-full', 'm03-critical-table', 'm03-raci', 'm03-bottlenecks', 'm03-map', 'm03-progression', 'm03-gates'],
  'M05': ['score-riesgo-total', 'precio-materiales', 'riesgo-mercado', 'm05-risk-matrix', 'm05-actors', 'm05-donut', 'm05-drivers', 'm05-prob-dist', 'm05-buyers', 'm05-price-bands', 'm05-tornado', 'm05-revenue', 'm05-mitigation', 'm05-trends', 'm05-conditions'],
  'M06': ['mapa-centros-acopio', 'm06-phase-deploy', 'm06-center-table'],
  'M08': ['logistica-estacionalidad', 'm08-seasonality', 'm08-residential-routes', 'm08-routes', 'm08-trucks'],
  'Otros': ['dictamen-captura-5v3', 'dictamen-benchmarks', 'criterios-aptitud', 'resumen-ejecutivo', 'social-risk-matrix', 'costo-omision-acumulado', 'social-aceptacion-actores', 'doble-materialidad-grid', 'm09-source-matrix', 'costos-capex-fases'],
  'M13': ['escenarios-waterfall', 'escenarios-tir', 'escenarios-vpn', 'm13-waterfall-valor', 'm13-monte-carlo-tir', 'm13-tornado-vpn', 'm13-cashflow', 'm13-rejilla-stress', 'm13-monte-carlo-vpn'],
  'M12_M07': ['esquema-ingresos-municipio', 'esquema-derrama-sector', 'm07-staff-composition', 'inspeccion-completitud'],
}

function esc(s) {
  return s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")
}

let body = ''
for (const [sec, ids] of Object.entries(sections)) {
  body += `  // ── ${sec} ─────────────────────────────────────────────────────\n`
  for (const id of ids) {
    const e = ENTRIES[id]
    if (!e) throw new Error('missing ' + id)
    body += `  '${id}': brief(\n`
    body += `    '${id}',\n`
    body += `    '${esc(e.label)}',\n`
    body += `    '${esc(e.q)}',\n`
    body += `    '${esc(e.fuente)}',\n`
    body += `    '${esc(e.porque)}',\n`
    body += `    '${esc(e.cuidado)}',\n`
    body += `  ),\n`
  }
  body += '\n'
}

const footer = `}

export function getCatalogChartBrief(chartId: string | null): ChartBrief | null {
  if (!chartId) return null
  return CHART_BRIEF_CATALOG[chartId] ?? null
}
`

writeFileSync(OUT, header + body + footer)
console.log('Wrote', OUT, 'entries:', keys.length)
