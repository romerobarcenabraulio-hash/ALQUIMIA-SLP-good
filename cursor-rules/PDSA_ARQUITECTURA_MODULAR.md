# ALQUIMIA — Análisis Arquitectónico PDSA

**Filosofía de los 4 capítulos, rubros y 36 módulos + modelo de extensión para toda la consultoría**

Norma de referencia · Mayo 2026  
Fuentes de verdad en código: `frontend/src/lib/chapterConfig.ts`, `frontend/docs/CONSTITUCION_ALQUIMIA_CAPITULOS_MODULOS.md`

---

## I. El principio rector

ALQUIMIA no es software — es un **argumento consultivo serializado**. Cada pantalla es un paso lógico de un razonamiento que lleva a un municipio desde "no sé qué tengo" hasta "esto es lo que presento en Cabildo para que se autorice". La plataforma sustituye el PowerPoint de McKinsey por un simulador vivo que el cliente recorre como un libro.

La filosofía se condensa en una frase:

> **"Rigor sin fricción, persuasión sin manipulación, prestigio sin opacidad."**

*(Chief Strategic Architect / PD&SA — `cursor-rules/planner.rtf`, `cursor-rules/PD&SA.md`)*

---

## II. La filosofía de los 4 capítulos

Los capítulos no son categorías temáticas arbitrarias. Son las **4 preguntas que cualquier decisor municipal necesita responder en secuencia** antes de autorizar un programa público. Este marco es **sector-agnóstico** — aplica igual a RSU que a Salud o Transporte.

| Cap. | Pregunta guía | Filosofía | Color | Lo que produce |
|------|---------------|-----------|-------|----------------|
| **1 — Diagnóstico** | *¿Cuál es el punto de partida real?* | No puedes planear lo que no has medido. Antes de cualquier inversión, el municipio necesita una foto honesta: ambiental, social, institucional, normativa y financiera. El capítulo cierra con una **teoría de cambio** que conecta causas con efectos. | Verde `#3B6D11` | Línea base auditable + diagnóstico jurídico + costo de no actuar |
| **2 — Planificación** | *¿Qué necesitamos construir?* | La foto se traduce en plan: qué infraestructura, cuánta gente, qué logística, en qué oleadas territoriales y cuánto cuesta operarlo. Es el paso de "entender" a "diseñar". | Azul `#1A5FA8` | Plan maestro + ruta crítica + dimensionamiento + costos |
| **3 — Modelo** | *¿Quién paga, quién opera y es viable?* | El plan bonito no basta — hay que cerrarlo financieramente. Quién es el concesionario, cómo se fondea, qué TIR da bajo 3 escenarios, qué riesgos quedan. Cierra con el **expediente para Cabildo**: el documento que el alcalde lleva a sesión. | Ámbar `#D4881E` | Esquema de concesión + escenarios financieros + expediente Cabildo |
| **4 — Control** | *¿Cómo arrancamos y cómo medimos?* | Después de autorizar, hay que operar, inspeccionar, monitorear y reportar. Este capítulo es la interfaz con la realidad post-autorización: enforcement, KPIs reales vs. proyectados, ESG y trazabilidad completa. | Púrpura `#4A1C7A` | Inspección + monitoreo + ESG + EVM + gestión de riesgos |

**Regla de diseño:** un capítulo solo se desbloquea conceptualmente cuando el anterior tiene datos suficientes. No hay "saltar al modelo financiero" sin diagnóstico. Esto es intencional — la secuencia **es** el argumento consultivo.

---

## III. La filosofía de los rubros

Dentro de cada capítulo, los **rubros** son ejes temáticos que agrupan módulos por disciplina. Un rubro no es una pestaña de UI — es una **competencia profesional** que un equipo consultor distinto dominaría en una firma tradicional.

### Capítulo 1 — Diagnóstico (6 rubros, 13 módulos)

| Rubro | Competencia | Módulos | Lógica interna |
|-------|-------------|---------|----------------|
| **Ambiental** | Ingeniería ambiental | M01 Línea base + M01B Impacto | Cuántos residuos hay y qué daño causan |
| **Social** | Sociología / trabajo social | M02 Demográfico + M02B Encuesta + M02C Actores | Quién vive ahí, qué opina, quién tiene poder |
| **Gobernanza operativa** | Administración pública | M02D Organigrama diagnóstico | Cómo está organizado hoy el gobierno para este tema |
| **Institucional-normativo** | Derecho administrativo | M03 Capacidad + M03B Legal + M03C Cobertura + M03D Dictamen | Qué puede hacer legalmente el municipio y qué le falta |
| **Financiero-económico** | Economía pública | M04 Costo omisión + M04B Evaluación socioeconómica | Cuánto cuesta no hacer nada vs. cuánto beneficio genera actuar |
| **Teoría de cambio** | Cierre del diagnóstico | M04C | Cómo se conecta todo: causas → intervención → resultado |

### Capítulo 2 — Planificación (3 rubros, 9 módulos)

| Rubro | Competencia | Módulos | Lógica interna |
|-------|-------------|---------|----------------|
| **Estratégico** | Planeación estratégica | M05 Plan maestro + M05B Ruta crítica + M05C Oleadas | Qué vamos a hacer, en qué orden y en qué territorio primero |
| **Operativo** | Ingeniería operativa | M06 Infraestructura + M07 Organigrama + M08 Logística + M08B Educativo | Con qué, con quién, cómo movemos las cosas y cómo educamos |
| **Económico** | Finanzas de operación | M09 Costos programa + M10 Mercado materiales | Cuánto cuesta y a quién le vendemos |

### Capítulo 3 — Modelo (3 rubros, 5 módulos)

| Rubro | Competencia | Módulos | Lógica interna |
|-------|-------------|---------|----------------|
| **Institucional** | Derecho concesional | M11 Esquema concesión | Quién opera: gobierno directo, mixto o concesión pura |
| **Financiero** | Banca de inversión municipal | M12 Árbol financiamiento + M13 Escenarios + M14 Riesgos | De dónde sale el dinero, qué retorno da y qué puede salir mal |
| **Gobernanza** | Gobernanza legislativa | M15 Expediente Cabildo | El paquete completo para sesión de Cabildo |

### Capítulo 4 — Control (5 rubros, 8 módulos)

| Rubro | Competencia | Módulos | Lógica interna |
|-------|-------------|---------|----------------|
| **Cumplimiento** | Inspección municipal | M16 Inspección | Enforcement: verificar que se cumple lo autorizado |
| **Monitoreo** | Gestión de operaciones | M17 Monitoreo operativo | Proyectado vs. real en tiempo cercano al real |
| **Reporteo** | Sustentabilidad / auditoría | M18 Doble materialidad + M19 Trazabilidad | ESG + bibliografía completa de todo el argumento |
| **Control presupuestal** | PMO / control de gestión | M20 EVM + M20B Conciliación | Valor ganado: vamos en tiempo y costo, o no |
| **Gestión de riesgos** | Risk management | M21 Risk dashboard + M21B Gate status | Riesgos abiertos + estado de los 5 gates del programa |

**Totales RSU:** 17 rubros · 35 módulos funcionario + M00 guía = **36 módulos**

---

## IV. La filosofía de los módulos

Cada módulo es una **unidad atómica de decisión**. Tiene:

1. **Un `module_id` canónico** (ej. `costo_omision`) — inmutable una vez publicado
2. **Un número visible** (ej. M04) — para navegación y referencia en PDF
3. **Un componente React (Stack)** — la pantalla que el funcionario ve
4. **Un entregable documental** — sección de alguno de los 12 documentos del paquete

**Regla de módulo:** cada módulo debe poder responder: *"¿Qué decide el funcionario aquí que no podía decidir antes?"* Si la respuesta es "nada", el módulo sobra o está mal dimensionado.

---

## V. Inventario completo — Servicio sectorial RSU

Fuente: `frontend/src/lib/chapterConfig.ts` · Render: `frontend/src/app/simulator/renderDecisionModule.tsx`

### Capítulo 1 — Diagnóstico

| Nº | `module_id` | Label | Stack |
|----|-------------|-------|-------|
| 01 | `city_baseline` | Línea base territorial y RSU | `CityBaselineStack` |
| 01B | `impacto_ambiental` | Impacto ambiental y sanitario | `ImpactoAmbientalStack` |
| 02 | `social_diagnostico` | Diagnóstico demográfico y vulnerabilidad | `SocialDemographicContextPanel` |
| 02B | `social_encuesta` | Encuesta de aceptación ciudadana | `SocialDemographicContextPanel` (vista encuesta) |
| 02C | `mapeo_actores` | Mapeo de actores y voluntad política | `ProyectoVivoPortal` (bridge) |
| 02D | `organigrama_diagnostico` | Organigrama actual | `OrganigramaDiagnosticoStack` |
| 03 | `capacidad_institucional` | Capacidad institucional del municipio | `CapacidadInstitucionalStack` |
| 03B | `marco_legal` | Marco legal y brechas reglamentarias | `MunicipalContextStack` |
| 03C | `cobertura_territorial` | Cobertura territorial y comparativa ZM | `MunicipalContextStack` (vista cobertura) |
| 03D | `dictamen_tecnico` | Dictamen técnico de la reforma | `DictamenTecnicoStack` |
| 04 | `costo_omision` | Costo de la omisión — contrafactual 10 años | `CostoOmisionStack` |
| 04B | `evaluacion_socioeconomica` | Evaluación socioeconómica | `EvaluacionSocioeconomicaStack` |
| 04C | `teoria_cambio` | Teoría de cambio | `TeoriaCambioStack` |

### Capítulo 2 — Planificación

| Nº | `module_id` | Label | Stack |
|----|-------------|-------|-------|
| 05 | `plan_maestro` | Plan maestro y metas de captura | `FutureGoalsModule` (page 1) |
| 05B | `ruta_critica` | Ruta crítica PERT-RACI | `FutureGoalsModule` (page 2) |
| 05C | `oleadas_territoriales` | Oleadas territoriales de despliegue | `FutureGoalsModule` (page 3) |
| 06 | `infraestructura` | Infraestructura — dimensionamiento CAs | `InfrastructureOperationsStack` |
| 07 | `organigrama` | Organigrama y estructura de personal | `OrganigramaStack` |
| 08 | `logistica` | Logística, rutas y diseño de piloto | `LogisticaOperativaStack` |
| 08B | `plan_educativo` | Plan educativo y comunicación social | `PlanEducativoStack` |
| 09 | `costos_programa` | Costos del programa — CAPEX y OPEX | `CostosProgramaStack` |
| 10 | `mercado_materiales` | Mercado de materiales y compradores | `MarketTraceabilityStack` (page 2) |

### Capítulo 3 — Modelo

| Nº | `module_id` | Label | Stack |
|----|-------------|-------|-------|
| 11 | `esquema_concesion` | Esquema de concesión y operador | `EsquemaConcesionStack` |
| 12 | `arbol_financiamiento` | Árbol de financiamiento — 6 caminos | `ArbolFinanciamientoStack` |
| 13 | `escenarios_financieros` | Escenarios financieros — TIR/VPN/Monte Carlo | `ScenariosExportStack` |
| 14 | `riesgos_modelo` | Riesgos y sensibilidad del modelo | `MarketTraceabilityStack` (page 1) |
| 15 | `expediente_cabildo` | Expediente completo para Cabildo | `ExpedienteCabildoStack` |

### Capítulo 4 — Control

| Nº | `module_id` | Label | Stack |
|----|-------------|-------|-------|
| 16 | `inspeccion` | Inspección y estrategia de enforcement | `InspeccionStack` |
| 17 | `monitoreo_operativo` | Monitoreo — proyectado vs. real | `MonitoreoRealStack` |
| 18 | `doble_materialidad` | Doble materialidad y reporte ESG | `DobleMaterialidadStack` |
| 19 | `trazabilidad` | Trazabilidad de fuentes y bibliografía | `ReferenciasCalculos` + `CierreSimulador` |
| 20 | `evm_dashboard` | EVM — Control presupuestal | `KronosEvmDashboardStack` |
| 20B | `conciliacion_mensual` | Conciliación mensual | `KronosConciliacionStack` |
| 21 | `risk_dashboard` | Registro de riesgos KRONOS | `KronosRiskDashboardStack` |
| 21B | `gate_status` | Estado de gates G1–G5 | `KronosGateStatusStack` |

### M00 — Entrada narrativa

| Nº | `module_id` | Label | Stack |
|----|-------------|-------|-------|
| 00 | `guia_circularidad` | Guía de circularidad | `GuiaCircularidadStack` |

**Estado RSU (mayo 2026):** los 36 módulos tienen componente UI implementado. El trabajo pendiente es **profundidad**: parametrización multi-ciudad, calidad de datos por módulo y madurez del backend — no estructura.

---

## VI. Audiencias y visibilidad

Definido en `frontend/src/lib/audienceModules.ts`:

| Audiencia | Módulos | Propósito |
|-----------|---------|-----------|
| **Ciudadano** (`citizen`) | 4 — `city_baseline`, `marco_legal`, `citizen_inputs`, `impact_finance` | Divulgación y educación |
| **Funcionario** (`functionary`) | M00 + 35 módulos (`FUNCTIONARY_MODULE_ORDER`) | Recorrido consultivo completo |
| **Empresa** (`entrepreneur`) | 4 — `organization_profile`, `containers_provider`, `market_traceability`, `organization_report` | Portal empresarial |

---

## VII. El patrón replicable — De RSU a cualquier sector

El framework de 4 capítulos + rubros + módulos es **sector-agnóstico**. Cada nuevo sector (Salud, Transporte, Educación, Desarrollo Urbano) debe instanciar la misma estructura:

```
Sector: [nombre]
├── Capítulo 1 — Diagnóstico: "¿Cuál es el punto de partida real?"
│   ├── Rubro ambiental/físico → módulos de línea base del sector
│   ├── Rubro social → módulos demográficos relevantes al sector
│   ├── Rubro gobernanza → organigrama actual para ese servicio
│   ├── Rubro normativo → marco legal del sector + brechas
│   ├── Rubro financiero → costo de omisión sectorial
│   └── Rubro cierre → teoría de cambio del sector
│
├── Capítulo 2 — Planificación: "¿Qué necesitamos construir?"
│   ├── Rubro estratégico → plan maestro + ruta crítica
│   ├── Rubro operativo → infraestructura + personal + logística
│   └── Rubro económico → costos + mercado/demanda
│
├── Capítulo 3 — Modelo: "¿Quién paga, quién opera y es viable?"
│   ├── Rubro institucional → esquema de operación
│   ├── Rubro financiero → escenarios + riesgos
│   └── Rubro gobernanza → expediente para Cabildo
│
└── Capítulo 4 — Control: "¿Cómo arrancamos y cómo medimos?"
    ├── Rubro cumplimiento → inspección sectorial
    ├── Rubro monitoreo → KPIs reales vs. proyectados
    ├── Rubro reporteo → ESG + trazabilidad
    ├── Rubro control presupuestal → EVM
    └── Rubro gestión de riesgos → risk register + gates
```

**La diferencia entre sectores no es la estructura — es el contenido de cada módulo.** Los módulos de Diagnóstico de Salud miden epidemiología y cobertura de unidades médicas, no toneladas de residuos. Pero la pregunta guía y la mecánica (línea base → gap analysis → costo de omisión → teoría de cambio) son idénticas.

### Schema técnico para nuevos sectores

```typescript
// frontend/src/lib/chapterConfig.ts — patrón existente
export interface RubroDef {
  id: string
  label: string
  modulos: string[]
}

export interface ChapterDef {
  num: 1 | 2 | 3 | 4
  label: string
  question: string
  color: string
  bgColor: string
  borderColor: string
  rubros: RubroDef[]
  firstModuleId: string
}
```

Cada sector nuevo requiere:

1. `chapterConfig.[sector].ts` — capítulos, rubros, `module_id[]`
2. Stacks en `frontend/src/components/simulator/stacks/[sector]/`
3. Entrada en catálogo `/gobierno` (`frontend/src/app/gobierno/page.tsx`)
4. Blueprints PDF en `backend/app/export/document_blueprints.py`
5. Copy sectorial validado por EIDOS antes de publicar scope en landing

---

## VIII. Inventario sectorial para seguimiento

| Sector | ID catálogo | Capítulos | Rubros est. | Módulos est. | Estado |
|--------|-------------|-----------|-------------|--------------|--------|
| **RSU** | `rsu` | 4 | 17 | 36 (M00–M21B) | **Activo — 100% superficie UI** |
| **Salud pública** | `salud` | 4 | ~15 | ~28 | En diseño — copy en `/gobierno` |
| **Transporte** | `transporte` | 4 | ~14 | ~26 | En diseño — copy en `/gobierno` |
| **Educación** | `educacion` | 4 | ~14 | ~26 | En diseño — copy en `/gobierno` |
| **Desarrollo urbano** | `urbano` | 4 | ~16 | ~30 | En diseño — copy en `/gobierno` |

Scope previsto por sector (primer contrato de lenguaje con el mercado) está en `frontend/src/app/gobierno/page.tsx`.

---

## IX. Gates y contratos entre capítulos

| Gate | Transición | Evidencia mínima | Agente responsable |
|------|-----------|------------------|--------------------|
| **G1** | Diagnóstico completado → Planificación | Línea base + PDF legal + teoría de cambio | KRONOS verifica · EIDOS valida copy |
| **G2** | Plan listo → Modelo | Plan maestro + costos + dimensionamiento | KRONOS + HERMES (logística validada) |
| **G3** | Modelo cerrado → Expediente Cabildo | TIR/VPN bajo 3 escenarios + riesgos mitigados | KRONOS (finanzas) |
| **G4** | Cabildo autoriza → Control | Acta de Cabildo (evento humano, no algorítmico) | SUPREME arbitra |
| **G5** | Operación en campo → Monitoreo | Primer mes de datos reales | HERMES (trazabilidad) + KRONOS (EVM) |

**Regla irrompible:** sin PDF del reglamento municipal → sin análisis jurídico → sin módulos ÁGORA (`POST /legal/{municipio}/upload-pdf`).

---

## X. Paquete documental por sector

Cada sector produce **12 documentos** (diseñados para RSU; replicar por sector):

| Doc | ID canónico | Título | Marco | Audiencia | Capítulo origen |
|-----|-------------|--------|-------|-----------|-----------------|
| 00 | `00_indice_maestro_paquete` | Índice maestro | Action | PMO · Auditor | Portada del paquete |
| 01 | `01_resumen_ejecutivo_municipal` | Resumen ejecutivo | SCQA | Cabildo · Alcalde | Cap 1 cierre → Cap 3 |
| 02 | `02_modelo_tecnico_financiero` | Modelo técnico-financiero | Action | Tesorería | Cap 3 |
| 03 | `03_diagnostico_reforma_*` | Diagnóstico jurídico | Legal | Jurídico · Sindicatura | Cap 1 normativo |
| 04 | `04_coordinacion_metropolitana` | Coordinación ZM | SCQA | Presidentes ZM | Cap 1 cobertura |
| 05 | `05_manual_operativo_90_dias` | Manual 90 días | Operational | Operaciones | Cap 2 + Cap 4 |
| 06 | `06_guia_ciudadana_separacion` | Guía ciudadana | Citizen | Hogares · Comercio | Cap 2 educativo |
| 07 | `07_fuentes_trazabilidad` | Fuentes y trazabilidad | Audit | Auditor · PMO | Cap 4 trazabilidad |
| 08 | `08_plan_rutas_recoleccion` | Plan de rutas | Operational | Recolección | Cap 2 operativo |
| 09 | `09_dimensionamiento_flota` | Dimensionamiento flota | Action | Adquisiciones | Cap 2 operativo |
| 10 | `10_segmentacion_territorial` | Segmentación territorial | Action | Presidencia | Cap 2 estratégico |
| 11 | `11_cadena_suministro_comercializacion` | Cadena suministro | Action | Tesorería · CA | Cap 2 económico |
| 12 | `12_expediente_inspeccion` | Acta inspección predial | Legal | Inspector · Jurídico | Cap 4 cumplimiento |

**Estándar documental:** Times New Roman · SCQA/Action · exhibits numerados · página de decisión obligatoria en doc 01.  
Referencias: `cursor-rules/INDICE_MAESTRO_ENTREGABLES.md`, `backend/app/export/document_blueprints.py`.

---

## XI. Agentes y jurisdicción por capa

| Agente | Jurisdicción | Capítulos / módulos |
|--------|--------------|---------------------|
| **KRONOS** | Finanzas, EVM, gates G1–G5, riesgos R01–R06 | Cap 3 (modelo) · Cap 4 (EVM, conciliación, gates) |
| **HERMES** | Logística, rutas, recicladoras por ciudad, cadena de custodia | Cap 2 (infra, logística, mercado) · Cap 4 (monitoreo operativo) |
| **EIDOS** | Coherencia textual, glosario, dos registros (ejecutivo vs técnico) | Transversal — landing, gobierno, simulador, PDF |
| **SUPREME** | Arquitectura documental, consistencia código↔docs↔modelo | Transversal — blueprints, ÁGORA, índice maestro |
| **Navigator** | Cartografía, SRID, jurisdicción municipal vs ZM | Cap 1 (cobertura) · Cap 2 (oleadas, segmentación) |

Todos comparten **Regla Cero:** reconocimiento completo de plataforma antes de cualquier acción.

---

## XII. Verdades irrompibles (producto)

1. **Sin datos verificables, no hay proyección.** Ningún agente inventa cifras.
2. **Sin PDF, sin análisis jurídico.** Gate de entrada obligatorio para clientes.
3. **Sin gate cruzado, no hay siguiente fase.** Restricciones duras para cada municipio.
4. **El municipio es la autoridad.** ALQUIMIA genera evidencia — nunca reemplaza el acto de autoridad.
5. **KRONOS** cuida que el modelo financiero de cada municipio sea auditable.
6. **HERMES** cuida que la trazabilidad logística no tenga huecos.
7. **EIDOS** cuida que el cliente no perciba desorden interno de lenguaje.

---

## XIII. Conclusión PDSA

| Fase | Hallazgo |
|------|----------|
| **Plan** | La estructura 4 capítulos → rubros → módulos está filosóficamente sólida y probada en RSU con 36 módulos en UI. |
| **Do** | RSU completó la superficie. Cada módulo necesita profundidad: parametrización multi-ciudad, datos reales, backend robusto. |
| **Study** | El patrón es replicable. Los 4 sectores nuevos instancian el mismo framework cambiando contenido, no estructura. |
| **Act** | Diseñar el `chapterConfig` del segundo sector (candidato: Salud — datos INEGI/IMSS accesibles), registrarlo en `/gobierno`, construir primeros stacks de diagnóstico. |

**La filosofía aguanta. La arquitectura escala. Lo que falta es profundidad, no estructura.**

---

## XIV. Referencias cruzadas

| Pregunta | Archivo |
|----------|---------|
| Capítulos y rubros en código | `frontend/src/lib/chapterConfig.ts` |
| Constitución completa | `frontend/docs/CONSTITUCION_ALQUIMIA_CAPITULOS_MODULOS.md` |
| Briefing estratégico agentes | `cursor-rules/BRIEFING_PLATAFORMA_2026-05.md` |
| Catálogo entregables | `cursor-rules/CATALOGO_ENTREGABLES_CONSULTORIA.md` |
| Índice maestro PDF | `cursor-rules/INDICE_MAESTRO_ENTREGABLES.md` |
| Catálogo gobierno (5 sectores) | `frontend/src/app/gobierno/page.tsx` |
| Render módulos | `frontend/src/app/simulator/renderDecisionModule.tsx` |
| Store simulador | `frontend/src/store/simulatorStore.ts` |
| Aliases legacy API | `LEGACY_MODULE_ALIASES` en `chapterConfig.ts` |

---

*Documento generado mayo 2026 · Actualizar cuando se agregue un sector, un `module_id` o cambie la matriz de gates.*
