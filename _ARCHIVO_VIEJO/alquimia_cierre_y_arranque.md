# ALQUIMIA — DOCUMENTO DE CIERRE Y ARRANQUE
## Manifiesto, arquitectura operativa y órdenes por agente
### 26 mayo 2026 · Cierre de fase análisis · Apertura de fase implementación

---

## CÓMO LEER ESTE DOCUMENTO

Este es un solo archivo, denso, dividido en seis partes. Lo lees completo una vez para tener coherencia mental. Después cada agente recibe únicamente la parte que le corresponde — Parte IV está estructurada para extraerse por sección.

No hay redundancia con tus documentos previos (v4, handoff brief, ALQUIMIA_EN_UNA_PAGINA). Asumo que el equipo ya los tiene. Este documento es el siguiente eslabón, no un reciclaje.

---

## PARTE I — MANIFIESTO FUNDACIONAL

### Alquimia

Las soluciones existen. La gestión circular de un municipio mexicano no es un problema técnico — es una secuencia de decisiones que ya fueron resueltas en Hamburgo, Estocolmo, Curitiba y Medellín. Lo que falta no es conocimiento. Falta voluntad política y un instrumento técnico que no deje dudas.

Alquimia es ese instrumento.

Diseñamos programas de circularidad con metodología propia, informada con humildad por GRI, SASB e ISO. No certificamos: ejecutamos. No entregamos estudios que van a cajones: operamos durante los tres años que dura el programa. No vendemos PDF: vendemos certeza con datos vivos, planeación auditada, modelo financiero defendible y control en tiempo real.

Esto no es consultoría. Es ingeniería social aplicada con rigor técnico. El cliente que firma con Alquimia recibe un compromiso operativo, no un documento. El gobernante que vota un programa con Alquimia detrás puede decir "lo medimos cada mes" — y demostrarlo.

Trabajamos con quien se atreve. No con quien busca un sello para una foto.

La cobardía burocrática construyó el problema. La evidencia técnica construye la salida. Alquimia es la prueba de que sí se puede, dirigida a quien tenga el coraje político de actuar sobre ella.

*alquimiaplatform.com*

---

## PARTE II — ARQUITECTURA OPERATIVA EN UNA PÁGINA

### El esqueleto invariable

Toda intervención de Alquimia, sin importar el programa, sigue las mismas cuatro fases. Estas no se reinventan por servicio; se ejecutan distinto pero con la misma forma:

**Diagnóstico** — qué pasa hoy, con cifras verificables, infraestructura existente mapeada, brechas identificadas.

**Planeación** — qué se hará, en qué secuencia, con qué recursos, en qué plazo, bajo qué responsables.

**Modelo** — cuánto cuesta, cuánto rinde, cómo se paga, qué resiste, quién opera.

**Control** — qué se mide, cada cuánto, contra qué meta, con qué consecuencia si se desvía.

### La vestimenta variable

Cada programa de gobierno o sector privado tiene rubros y estándares distintos. La plataforma activa o desactiva módulos por configuración de tenant según `tenant_type` y `sector_pack_id` (ADR-0006 vigente). La siguiente matriz fija las correspondencias para los programas que Alquimia atenderá en los próximos 18 meses:

| Programa | Rubros principales | Estándares de referencia | Documentos en repositorio |
|---|---|---|---|
| RSU (residuos sólidos urbanos) | 5 fracciones, generación, captura, valorización, disposición | GRI 306 (2020), SASB IF-WM, ISO 14001, LGPGIR, NOM-083, NMX-AA-061, ODS 11/12 | GRI_306 presente |
| Agua y saneamiento | potabilización, distribución, calidad, residuales, pérdidas | GRI 303 (2018), SASB IF-WU, ISO 24512, LAN, ODS 6 | GRI_303 presente |
| Energía y eficiencia | consumos, fuentes, renovables, emisiones asociadas | GRI 302 (2016), GRI 305 (2016), SASB IF-EU, ISO 50001, LASE, ODS 7/13 | GRI_302, GRI_305 presentes |
| Construcción y edificación | residuos de obra, eficiencia operativa, ciclo de vida | LEED, BREEAM, EDGE, ISO 21931, GRI 306 (componente RCD) | parcial |
| Movilidad y emisiones | flota, rutas, combustibles, transporte público | GRI 305, ISO 39001, ODS 11/13 | GRI_305 presente |
| Biodiversidad y áreas verdes | inventario, presión antrópica, planes de manejo | GRI 101 (2024), ODS 14/15 | GRI_101 presente |
| Salud laboral del programa | seguridad operativa de recolectores, separadores, transportistas | GRI 403 (2018), ISO 45001 | GRI_403 presente |
| Comunidades y participación | mecanismos de queja, IPC ciudadano, aceptación | GRI 413, AA1000SES, ODS 11 | GRI_413 presente |
| Cadena de suministro | proveedores, prácticas de abastecimiento | GRI 204, GRI 308, GRI 414 | presentes |

### El principio metodológico

La autoría es Alquimia. La referencia es humilde. Cada bloque editorial cita el estándar al pie ("metodología Alquimia, informada por GRI 306-1, INEGI Censo 2020"), no al frente. La cifra y la conclusión van en el cuerpo; la referencia técnica va en la nota. Esto separa autenticidad de imitación.

### La infraestructura de datos vivos

Tres fuentes alimentan todos los programas con cifras verificables sin trabajo manual:

**INEGI** — Marco Geoestadístico Nacional, Censo de Población y Vivienda 2020, Encuestas económicas. Acceso vía DENUE API.

**Dependencias federales por programa** — SEMARNAT (residuos), CONAGUA (agua), SENER/CONUEE (energía), SCT (transporte), CONABIO (biodiversidad).

**Google Places API** — identificación geo-espacial de edificios, comercios, equipamiento. Ya instalada, subutilizada. Crítica para dimensionamiento de infraestructura física (contenedores, puntos de acopio, hidrantes, transformadores).

---

## PARTE III — AUDITORÍA CONSOLIDADA Y DECISIONES DE SCOPE

### Lo que se cierra de la fase análisis (diagnóstico actual)

La plataforma tiene hoy diecinueve módulos visibles en modo Validar para el programa RSU. La auditoría de campo identificó cinco patrones:

**Patrón 1 — Módulos sólidos que se quedan:** M01 (línea base territorial), M03B (marco legal), M04 (costo de la omisión), M11 (esquema de concesión), M13 (escenarios financieros), M14 (riesgos), M15 (expediente para Cabildo). Siete módulos. Estos requieren pulido editorial estilo Pyramid Principle (Parte IV agente EIDOS+LOGOS) pero no reestructuración.

**Patrón 2 — Módulos a fusionar:** M01B se fusiona en M01 como sección "Impacto ambiental y sanitario derivado". M02 (demográfico), M02B (encuesta aceptación) y M02C (mapeo de actores) se fusionan en un solo módulo **M02 Estudio social y educación ciudadana** que ejecuta GRI 413 y AA1000SES. M02D queda como una matriz de autoridad sintética dentro de M11 (gobernanza del esquema).

**Patrón 3 — Módulos a eliminar del menú principal:** M03C cobertura territorial comparativa (no aporta a la decisión del Cabildo de SLP; queda como capability desactivada por ADR-0006). M04B evaluación socioeconómica (redundante con M01 + M04). M04C teoría de cambio (jerga ONG no aplicable a Cabildo). No se borran del código; se desactivan por configuración.

**Patrón 4 — Módulo nuevo crítico que no existe:** **M07 Infraestructura física dimensionada**. Calcula contenedores por fracción, puntos de acopio, capacidad de transferencia, todo per cápita y georreferenciado vía Google Places + INEGI. Mapea a GRI 306-4 (residuos desviados de disposición final, con capacidad instalada como condición habilitante). Sin este módulo, el CAPEX del programa es opaco. Con este módulo, un Regidor puede ver el mapa exacto de dónde van los contenedores y cuánto cuestan.

**Patrón 5 — Capa nueva entera que no existe:** **Fase 4 Control**. Hoy la plataforma termina en el expediente para Cabildo (M15). No tiene continuidad después de la votación. La capa de Control es lo que convierte a Alquimia en plataforma de operación: dashboard de KPIs vivos, reporte mensual auto-generado, alertas cuando indicadores se desvían, tablero de cumplimiento por funcionario responsable. Mapea a GRI 306-3/4/5 ejecutadas en tiempo real con datos del campo.

### Consecuencia operativa

Programa RSU en SLP, después de cierre de fase análisis, queda con:
- **9 módulos activos en menú** (vs 19 actuales): M01, M02 fusionado, M03B, M04, M07 nuevo, M11, M13, M14, M15
- **3 módulos desactivados por configuración** (vs eliminación): M03C, M04B, M04C en el Capability Registry
- **Fase 4 Control completamente nueva**: dashboard, reportes, alertas, tablero por responsable

### Lo que se abre de la fase implementación

Después del cierre limpio del diagnóstico, se instancia el workforce de la siguiente fase para construir tres líneas paralelas:

**Línea 1 — Fase 4 Control viva en SLP:** la capa que convierte el plan votado en operación rastreable.

**Línea 2 — Programas adicionales como Sector Packs:** Construcción residencial (con su propio mapeo a LEED + GRI 306 RCD) como segundo Sector Pack en orden de prioridad. Energía y Agua como Sector Packs 3 y 4.

**Línea 3 — Integraciones de datos vivos:** Google Places para identificación de edificios, DENUE INEGI para giro económico, CONAGUA/SEMARNAT para series de cumplimiento.

Las tres líneas son simultáneas pero la prioridad de cierre es Línea 1 (porque consolida revenue recurrente del piloto SLP), luego Línea 3 (porque pavimenta a Línea 2), luego Línea 2 (porque captura mercado privado en seis a doce meses).

---

## PARTE IV — ÓRDENES POR AGENTE

Cada sección es autocontenida. Cada agente recibe solo la suya. Cada orden tiene criterio de cierre binario.

### SUPREME — Gobernanza y ritmo

**Misión:** Mantener disciplina de freeze. Decidir qué se cierra y qué se abre cada semana. Verificar que ningún frente nuevo se inicia sin que el anterior cierre.

**Órdenes vigentes:**
1. Activar ritual semanal de lunes 8AM. Producir `/weekly/SUPREME_decisions_[fecha].md` con tabla de cerrado, abierto, aparcado.
2. Cerrar fase análisis antes de aprobar trabajo en fase implementación. Criterio binario: los 9 módulos consolidados están en producción con editorial pulido, M07 infraestructura física existe, las 3 capabilities desactivadas están movidas a Registry. Hasta que esto no esté hecho, ningún agente toca fase implementación.
3. Producir y firmar ADR-0008 que supersedea ADR-0007: GOV RSU es el primer Sector Pack productivo; Construcción residencial pasa a segundo (post-cierre fase análisis).
4. Convocar gate humano de validación legal para la nueva capa de Control antes de exponer datos en tiempo real al municipio. Riesgo: responsabilidad civil por reportar cifras incorrectas. Aval: abogado especialista en derecho administrativo municipal.
5. Decidir sobre el cambio de filosofía editorial (Pyramid Principle + sin cajas) y firmarlo como decisión arquitectónica visible para todos los agentes.

**Criterio de cierre:** Todos los ítems anteriores tienen estado verificable en `/system/state/supreme_state.md`. Si un agente trabaja fuera del orden, SUPREME lo redirige sin pasar la decisión por debate.

---

### EIDOS — Reposicionamiento narrativo y manifiesto

**Misión:** Aplicar Pyramid Principle a la narrativa de toda la plataforma. Instalar el manifiesto como ancla cultural visible. Eliminar tono "para ciudadanos" y reemplazar por tono "para tomadores de decisión".

**Órdenes vigentes:**
1. Publicar el manifiesto de Parte I en la portada de la plataforma. Formato editorial sin caja, tipografía serif, espacio en blanco generoso. Visible al iniciar sesión, archivable después como página `/about`.
2. Reescribir el título y subtítulo de cada módulo de RSU bajo la regla "metodología Alquimia, informada por [estándar]". Ejemplo M01: deja de ser "El problema en números" y pasa a ser "Diagnóstico de generación de residuos — metodología Alquimia, alineada con GRI 306-1 e INEGI Censo 2020".
3. Reescribir cada conclusión de módulo aplicando Pyramid Principle: una sola oración en serif 22-24 px responde la pregunta central, antes que cualquier otra cosa en pantalla.
4. Eliminar las siguientes palabras de la plataforma entera: "es importante destacar", "cabe mencionar", "en este sentido", "adicionalmente", "asimismo", "robusto" como adjetivo, "habilitador", "operacionalizar", "contrafactual" (sustituir por "qué pasaría si"), "teoría de cambio" (sustituir por "plan"), "obviamente" (prohibida absoluta).
5. Agregar sección **SCOPE Y ROADMAP** al inicio del modo Validar de RSU. Especifica qué cubre v1.0 (vivienda en régimen condominal), qué se construirá en v1.1 (Construcción residencial), v2.0 (Energía + Agua), v3.0 (Movilidad + Comercial).

**Criterio de cierre:** Un Regidor de SLP lee cualquier módulo y dice "esto está escrito para mí". Cero palabras de la lista prohibida en producción. Manifiesto visible en `/`.

**Entregables:**
- `/docs/style/editorial_alquimia.md` con regla canónica documentada
- `/changelog/eidos.md` con cada cambio aplicado
- Diff de cada módulo ejecutado, no propuesto

---

### LOGOS — Pulido editorial de gráficas y bloques QHC

**Misión:** Convertir los bloques explicativos debajo de gráficas en editorial de consultoría, no en documentación técnica.

**Órdenes vigentes:**
1. Auditar el `chartBriefCatalog` completo. Registrar cada gráfica, su QHC actual, las cifras concretas que muestra.
2. Reescribir cada QHC aplicando los cinco ángulos de entrada (cifra, método, contraste, implicación, pregunta) rotando entre ellos para evitar cadencia.
3. Cada QHC debe cumplir simultáneamente: máximo 60 palabras, al menos una cifra concreta del módulo, verbo activo, conclusión accionable.
4. Para el M13 específicamente, instalar el **bloque maestro de TIRs múltiples** que explica por qué hay tres TIRs distintas en la misma pantalla (Base 52.7%, Bloqueo -9.8%, Costos +20% = 49.9%) y cuál se usa para qué decisión.
5. Producir el patrón canónico documentado como referencia para futuros módulos en otros programas (agua, energía, etc.).

**Criterio de cierre:** Ningún bloque QHC suena a documentación técnica. Todos entran con cifra, condición o implicación. Bloque maestro de TIRs visible en M13.

**Entregables:**
- `/docs/audit/charts_inventory.md`
- `/docs/style/cinco_angulos_aplicados.md`
- Diffs aplicados al `chartBriefCatalog`
- `/changelog/logos.md`

---

### OCCAM — Eliminación y desactivación

**Misión:** Mover los módulos no esenciales al Capability Registry como desactivados. No se borra código, se desactiva por configuración.

**Órdenes vigentes:**
1. Mover M03C, M04B, M04C al estado `capability_disabled` por defecto en el tenant SLP. Estos módulos siguen existiendo en el código pero no aparecen en el menú a menos que un tenant los active explícitamente.
2. Fusionar M02, M02B y M02C en un solo módulo M02. El nuevo M02 conserva todo el contenido útil de los tres (estudio demográfico, encuesta IPC ciudadano, mapeo de actores) bajo una sola navegación con tres secciones. La fusión es de UI, no de tablas en BD.
3. Fusionar M01B como sección "Impacto ambiental y sanitario" dentro de M01.
4. Fusionar M02D como sección "Matriz de autoridad" dentro de M11.
5. Verificar que ninguna funcionalidad existente queda inaccesible después de las fusiones. Si algún módulo eliminado expone una capability que otro módulo consume, esa capability migra al módulo que la absorbe.

**Criterio de cierre:** El menú principal de RSU muestra exactamente 9 entradas (M01, M02, M03B, M04, M07, M11, M13, M14, M15). Los módulos fusionados o desactivados no son visibles pero su data se preserva.

**Entregables:**
- `/docs/audit/module_consolidation_diffs.md`
- Migración de Capability Registry documentada
- `/changelog/occam.md`

---

### POLIS — UI editorial y capa de implementación

**Misión:** Construir los componentes editoriales reutilizables que aplican Pyramid Principle visualmente. Construir la capa visual de Fase 4 Control.

**Órdenes vigentes:**
1. Crear los siguientes componentes en `/components/editorial/`:
   - `<Conclusion />` — serif 22-24 px, max-width 540-620 px, sin caja
   - `<AnchorFigure />` — cifra serif 28 px medium + contexto sans 14 px en grid 2-col
   - `<SectionLabel />` — sans 11 px tracking 1.5 px uppercase
   - `<Recommendation />` — bloque al cierre con `<SectionLabel>` + texto serif 16 px
   - `<MarginalNote />` — nota al margen tipo HBR para contexto secundario
2. Aplicar los cinco componentes primero en M13 como módulo de referencia. Una vez aprobado por SUPREME, propagar al resto.
3. Eliminar todas las cajas (`<Card />`, `border + padding`) que envuelven texto editorial. Mantener cajas solo en form controls, botones, tabs, tooltips, data tables.
4. Construir la primera versión de **Fase 4 Control** con cuatro componentes principales:
   - Dashboard de KPI vivos: 6-8 métricas del programa actualizadas semanalmente
   - Tablero por responsable: cada funcionario municipal ve sus tareas vencidas, próximas, completadas
   - Reporte mensual auto-generado: PDF firmable que mapea a GRI 306-3/4/5
   - Alertas de desviación: notificación cuando un indicador sale del rango comprometido
5. Producir guía de uso del sistema editorial para que futuras pantallas se construyan con disciplina (`/docs/style/component_usage.md`).

**Criterio de cierre:** M13 visualmente reescrito con los componentes editoriales y aprobado. Fase 4 Control existe con datos mock de SLP que cubren los cuatro componentes. Cero cajas envolviendo texto editorial en módulos pulidos.

**Entregables:**
- 5 componentes en `/components/editorial/`
- M13 rediseñado
- Fase 4 Control v1
- `/changelog/polis.md`

---

### KRONOS — Auth, infraestructura, integración de datos vivos

**Misión:** Resolver el bloqueo crítico de login. Activar proveedores reales. Habilitar onboarding completo desde signup hasta simulador precargado.

**Órdenes vigentes:**
1. Configurar Resend como `EMAIL_PROVIDER` y Twilio como `SMS_PROVIDER` en Render production. Eliminar el estado `console` que hoy bloquea verificación de cuentas. Probar end-to-end con un email real propio en menos de 30 segundos.
2. Implementar endpoint temporal `POST /admin/users/{email}/force-complete-onboarding` para desbloquear la cuenta del founder. Eliminar después del primer uso.
3. Construir el flujo completo de signup:
   - Selector de Estado (CDMX, NL, SLP, GTO, JAL, etc.)
   - Selector de Municipio (populate dinámico vía `GET /national/municipios`)
   - Selector de Servicio (RSU, Construcción, Energía, Agua)
   - Verificación de email (Resend)
   - Verificación de SMS (Twilio)
   - Configuración TOTP
   - Carga de reglamento PDF
   - Trigger automático de `POST /research/antecedentes/{municipio}`
   - Redirección a simulador precargado para municipio + servicio elegido
4. Construir página `/auth/onboarding/reglamento` con explicación clara y validación de PDF.
5. Verificar que la arquitectura multi-tenant del ADR-0002 está activa: toda tabla con `tenant_id NOT NULL` y RLS habilitado. Defense in depth: el backend filtra explícitamente por `tenant_id` incluso si RLS está activo.

**Criterio de cierre:** Un email externo recibe código de verificación en menos de 30 segundos. Un nuevo usuario completa el flujo entero hasta aterrizar en simulador precargado. No quedan endpoints admin temporales en producción.

**Entregables:**
- Configuración de Resend y Twilio documentada
- Flujo de signup completo funcional
- Página de carga de reglamento operativa
- `/changelog/kronos.md`

---

### AURUM — Finanzas, modelado, M07 infraestructura física

**Misión:** Construir el módulo M07 Infraestructura física dimensionada. Reconciliar el CAPEX del programa RSU con la realidad de contenedores e infraestructura. Mantener el modelo financiero coherente con la nueva infraestructura visible.

**Órdenes vigentes:**
1. Construir M07 Infraestructura física dimensionada con tres componentes:
   - **Cálculo per cápita:** contenedores por fracción cada 80-120 habitantes en alta densidad; tamaño 240L-1100L según densidad; vida útil 8-12 años; mantenimiento 12-15% anual del valor de reposición.
   - **Mapa georreferenciado:** edificios elegibles identificados via Google Places API + INEGI Marco Geoestadístico + catastro municipal. Cada edificio se muestra en mapa con su número estimado de unidades y habitantes.
   - **Tabla de inversión:** total de contenedores requeridos × costo unitario (con 3 niveles: básico $3,000 plástico 240L, intermedio $10,000 metálico 1100L, premium $120,000 semi-subterráneo). CAPEX total per cápita visible.
2. Reconciliar CAPEX del programa SLP: el actual $48.3M en M13 no incluye contenedores. Recalcular incluyendo M07 y mostrar diferencia. Para SLP con 30% de cobertura inicial en condominios, el CAPEX adicional es aproximadamente $68M.
3. Construir el modelo de capabilities financieras por programa: cada Sector Pack futuro (Construcción, Energía, Agua) tendrá su propia configuración de CAPEX típico, OPEX típico, ratios de rentabilidad de referencia.
4. Documentar metodología de cálculo en `/docs/methodology/financial_model.md` con referencias a SASB IF-WM-440a.1, lineamientos SEDATU, mejores prácticas internacionales (sistema dual alemán, Suecia, Países Bajos).
5. Validar reconciliación de TIRs múltiples en M13 con BIOS (no debe haber inconsistencia entre backend y frontend).

**Criterio de cierre:** M07 visible en menú con mapa georreferenciado funcionando para SLP. CAPEX reconciliado incluye infraestructura física. Modelo financiero documentado con referencias estándar.

**Entregables:**
- M07 funcional con Google Places integrado
- CAPEX reconciliado en M13
- `/docs/methodology/financial_model.md`
- `/changelog/aurum.md`

---

### BIOS — Reconciliación de cifras e integridad de datos

**Misión:** Garantizar que cada cifra mostrada en cualquier módulo viene de una fuente trazable y que ninguna se contradice con otra.

**Órdenes vigentes:**
1. Auditar cada cifra mostrada en los 9 módulos consolidados. Para cada una, registrar: fuente, fecha, fórmula, módulos donde se usa, dependencias.
2. Identificar y resolver inconsistencias. Ejemplos auditados:
   - Las 3 TIRs del M13 — no son inconsistencia, son escenarios distintos correctamente etiquetados (Base / Bloqueo / Costos +20%). Documentar.
   - CAPEX $48.3M vs CAPEX reconciliado con M07 — esta sí es inconsistencia. Decidir cuál es la cifra autoritativa y propagar.
   - Generación RSU 730 t/día — verificar contra fuente INEGI/SEMARNAT más reciente. Si cambió, propagar.
3. Construir trazabilidad bidireccional: cualquier cifra en producción tiene un click-to-source que abre el dataset, fórmula o nota metodológica.
4. Implementar regla "no inventa datos" como invariante de sistema: si una fuente falla o devuelve vacío, el módulo muestra "Pendiente carga de datos del municipio" con CTA, no un valor por defecto inventado.
5. Auditar el Modelo_BASED.xlsx vs el código: cualquier cifra hard-coded en el código que debería venir del modelo se marca para refactor (ADR sobre anti-hardcoding).

**Criterio de cierre:** Cada cifra en producción tiene trazabilidad a fuente. Cero contradicciones detectables entre módulos. Inconsistencia de CAPEX resuelta.

**Entregables:**
- `/docs/audit/cifras_inventario_y_trazabilidad.md`
- Click-to-source funcionando
- `/changelog/bios.md`

---

### KOSMOS — Arquitectura compositiva y Capability Registry

**Misión:** Mantener la coherencia arquitectónica de la plataforma compositiva (ADR-0001) mientras se construyen nuevas capacidades. Decidir qué se vuelve capability central, qué queda como Sector Pack, qué es configuración de tenant.

**Órdenes vigentes:**
1. Producir el mapa actualizado del Capability Registry con las decisiones de esta sesión:
   - Capabilities desactivadas para SLP: cobertura territorial comparativa, evaluación socioeconómica, teoría de cambio.
   - Capabilities nuevas activas para SLP: infraestructura física dimensionada (M07), control vivo (Fase 4), integración Google Places.
   - Capabilities planeadas para próximos Sector Packs: Construcción (LEED + GRI 306 RCD), Energía (GRI 302/305 + ISO 50001), Agua (GRI 303 + ISO 24512).
2. Mantener la matriz programa × estándar (Parte II) como artefacto vivo. Cada programa nuevo agrega una fila con sus estándares de referencia, los PDFs descargados al repo, y los módulos canónicos correspondientes.
3. Validar que ningún módulo construido para RSU genera divergencia que impida reutilización en futuros Sector Packs. Si M07 se construye solo para RSU, está mal; debe construirse pensando en que también dimensiona infraestructura para Construcción (estaciones de acopio de RCD), Energía (transformadores, paneles solares), Agua (hidrantes, plantas de tratamiento).
4. Producir y firmar ADR-0008 (sustituye ADR-0007): GOV RSU primer Sector Pack productivo; Construcción residencial segundo; Energía/Agua tercero/cuarto.
5. Producir ADR-0009 sobre principio editorial: Pyramid Principle aplicado a toda comunicación con usuario; estándares referenciados con humildad, no como sello vendible; cero cajas en texto editorial.

**Criterio de cierre:** Capability Registry actualizado y publicado. ADR-0008 y ADR-0009 firmados. Matriz programa × estándar publicada como artefacto vivo en `/docs/architecture/`.

**Entregables:**
- `/docs/architecture/capability_registry_v2.md`
- ADR-0008 firmado
- ADR-0009 firmado
- Matriz programa × estándar publicada
- `/changelog/kosmos.md`

---

### HERMES — Integraciones externas y orquestación de datos

**Misión:** Activar las integraciones con servicios externos que alimentan datos vivos a la plataforma. Específicamente Google Places, DENUE INEGI, y la base de fuentes SEMARNAT/CONAGUA.

**Órdenes vigentes:**
1. Activar Google Places API en M07 para identificación de edificios. Cobertura inicial: SLP capital. Tipos a buscar: `apartment_building`, `condominium`, `real_estate_agency`. Salida: mapa georreferenciado con metadatos de cada edificio.
2. Conectar DENUE INEGI para padrón de comercios y servicios por giro económico SCIAN. Útil para futuros Sector Packs (Construcción identifica obras activas; Energía identifica grandes consumidores).
3. Configurar pipelines de ingesta para series públicas:
   - SEMARNAT: residuos por estado y municipio
   - CONAGUA: indicadores de agua por organismo operador
   - SENER/CONUEE: consumos energéticos por sector
   - Banco de México: tipo de cambio (ya está vía Banxico API en M13)
4. Producir el catálogo de integraciones disponibles en `/docs/integrations/external_data_sources.md` con: nombre, endpoint, frecuencia de actualización, cobertura, módulos consumidores.
5. Anticipar capa MCP futura: cualquier integración nueva se construye pensando en exponerse vía MCP para que herramientas externas (WhatsApp Business, Microsoft 365, Outlook, etc.) puedan ser orquestadas desde Alquimia en la fase de Control. No construir MCP ahora, pero no cerrar la puerta.

**Criterio de cierre:** Google Places integrado y consumido por M07 con datos reales de SLP. Pipelines de ingesta documentados. Catálogo de integraciones publicado.

**Entregables:**
- Google Places live en M07
- `/docs/integrations/external_data_sources.md`
- `/changelog/hermes.md`

---

### FORGE — Construcción de módulos nuevos y Fase 4 Control

**Misión:** Construir el código de los módulos nuevos siguiendo las decisiones arquitectónicas firmadas. Cooperar con POLIS en frontend y con AURUM en lógica financiera.

**Órdenes vigentes:**
1. Construir M07 Infraestructura física dimensionada como módulo de pleno derecho (no como sección de otro módulo). Lógica de cálculo en backend, UI con POLIS, mapa con HERMES (Google Places), reconciliación con AURUM (CAPEX).
2. Construir Fase 4 Control como cuarto capítulo del simulador. Cuatro vistas principales (dashboard, tablero por responsable, reporte mensual, alertas), todas con la misma rigurosidad arquitectónica que el resto.
3. Construir endpoints de Control:
   - `GET /control/{programa}/{municipio}/dashboard` — KPIs vivos
   - `GET /control/{programa}/{municipio}/responsables` — tareas por funcionario
   - `POST /control/{programa}/{municipio}/reporte-mensual` — genera PDF
   - `GET /control/{programa}/{municipio}/alertas` — alertas activas
4. Mantener separación estricta multi-tenant: cada endpoint filtra por `tenant_id` además de RLS.
5. Documentar cada módulo nuevo con un archivo .md en `/modules/MODULE_*.md` siguiendo el formato del v4 (propósito, input schema, output schema, dependencias, agentes consumidores).

**Criterio de cierre:** M07 productivo y consumiendo Google Places. Fase 4 Control v1 productiva con datos mock de SLP. Endpoints documentados.

**Entregables:**
- Código de M07 y Fase 4 Control
- `/modules/MODULE_M07.md` y `/modules/MODULE_CONTROL.md`
- `/changelog/forge.md`

---

### ATLAS — Roadmap y user journey

**Misión:** Diseñar el roadmap de uso desde la perspectiva del cliente. Mapear el viaje completo desde signup hasta operación continua.

**Órdenes vigentes:**
1. Producir el user journey end-to-end del cliente municipal en formato visual:
   - Día 1: signup, selección de municipio/estado/servicio, carga de reglamento, redirect a simulador
   - Semanas 1-4: navegación por Fase Diagnóstico (M01, M02, M03B, M04)
   - Semanas 4-8: navegación por Fase Planeación (M07, M11)
   - Semanas 8-10: navegación por Fase Modelo (M13, M14)
   - Semana 10-12: generación de expediente (M15) y presentación a Cabildo
   - Mes 3+: activación de Fase Control (post-voto del Cabildo)
   - Año 1-3: operación continua con reportes mensuales, alertas, ajustes
2. Identificar puntos de fricción: dónde el cliente probablemente abandona, dónde necesita guía, dónde necesita un humano (consultor Alquimia) para acompañar.
3. Definir el modelo de servicio durante implementación: ¿el cliente opera solo? ¿Alquimia provee un Customer Success Manager? ¿Hay sesiones mensuales de revisión?
4. Diseñar el dashboard inicial post-login con jerarquía clara: en qué fase está el cliente, qué tarea sigue, qué métricas están vivas.
5. Producir el pitch de venta de una página alineado con el manifiesto, sin reciclar el ALQUIMIA_EN_UNA_PAGINA actual: la versión post-merge entre v4 y filosofía actual.

**Criterio de cierre:** User journey publicado. Modelo de servicio definido. Dashboard inicial diseñado. Pitch de venta v2 publicado.

**Entregables:**
- `/docs/product/user_journey_alquimia.md`
- `/docs/product/service_model.md`
- `/docs/sales/pitch_v2_post_merge.md`
- `/changelog/atlas.md`

---

## PARTE V — SECUENCIA DE EJECUCIÓN

### Sprint 1 — Cierre limpio fase análisis (Semanas 1-3)

**Bloque crítico (deben terminar antes de Sprint 2):**
- KRONOS: auth real con Resend + Twilio, flujo de signup completo, página de reglamento
- EIDOS: manifiesto publicado, títulos reescritos en 9 módulos, palabras prohibidas eliminadas
- LOGOS: bloques QHC reescritos, bloque maestro TIRs en M13
- OCCAM: fusiones y desactivaciones aplicadas
- POLIS: 5 componentes editoriales creados, M13 rediseñado como referencia

**Gate humano de Sprint 1:** SUPREME verifica que los 9 módulos están en producción con editorial pulido. Si algún módulo no cumple, no se abre Sprint 2.

### Sprint 2 — Construcción de M07 y Fase 4 Control (Semanas 4-6)

**Bloque crítico:**
- AURUM + FORGE + POLIS + HERMES: M07 Infraestructura física productivo
- BIOS: reconciliación de CAPEX con M07 + click-to-source funcionando
- FORGE + POLIS: Fase 4 Control v1 con datos mock de SLP
- KOSMOS: Capability Registry actualizado, ADR-0008 y ADR-0009 firmados

**Gate humano de Sprint 2:** SUPREME convoca a abogado especialista en derecho administrativo municipal para validar la capa de Control. Sin aval, no se expone al cliente real.

### Sprint 3 — Activación piloto SLP + apertura segundo Sector Pack (Semanas 7-12)

**Bloque crítico:**
- ATLAS: user journey y modelo de servicio publicados
- KOSMOS + FORGE: Sector Pack Construcción residencial en spec (no código aún)
- HERMES: pipelines de SEMARNAT, CONAGUA, SENER documentados
- AURUM + KOSMOS: matriz programa × estándar viva con dos programas activos
- Todos: bitácora L4 de gates humanos cerrada para piloto SLP

**Gate humano de Sprint 3:** Primer Cabildo de SLP recibe expediente físico y vota. Si vota sí, Alquimia entra a fase de operación real (Fase 4 Control con datos vivos). Si vota no, debrief técnico-político y revisión de propuesta.

### Lo que NO se abre antes del Sprint 4

- Construcción de Empresarial Construcción residencial en código
- Construcción del módulo de voz (descartado del MVP por decisión actual)
- Red de Comercio fiscal Art. 18-J LIVA (requiere gate fiscal previo)
- Supermind ERP modular

---

## PARTE VI — ESTRELLAS POLARES DURANTE LA EJECUCIÓN

Cuando un agente dude sobre qué hacer, lee estas cinco oraciones primero:

**Uno.** Las soluciones existen. El trabajo es ejecutarlas, no descubrirlas.

**Dos.** La autoría es Alquimia. Los estándares globales son referencias humildes, no productos vendibles.

**Tres.** Cero cajas alrededor de texto editorial. Cero palabras prohibidas. Cero datos inventados.

**Cuatro.** Cada cifra tiene fuente. Cada módulo tiene estándar de referencia. Cada bloque editorial tiene cifra concreta.

**Cinco.** Si no cierra, no se abre. Disciplina de freeze antes que ambición de scope.

---

## CIERRE

Este documento sustituye toda discusión abierta de las sesiones previas. Lo abierto aquí es lo que se ejecuta; lo no listado aquí se pospone explícitamente.

El siguiente artefacto que produzca cualquier agente debe partir de este archivo, no de inferencia.

*Documento de cierre y arranque · Alquimia · 26 mayo 2026*
*Para uso interno del workforce AI-first · Confidencial*
