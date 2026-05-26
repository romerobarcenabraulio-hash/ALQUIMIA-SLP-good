# Inventario editorial — Modo Validar (19 módulos)

**Alcance:** `VALIDAR_MODULE_IDS` = Cap. 1 Diagnóstico + Cap. 3 Modelo de negocio.  
**Fuente:** `moduleEditorialBriefs.ts` + stacks en `renderDecisionModule.tsx`.  
**Patrón canónico:** `docs/style/editorial_pattern_canonico.md`

---

## M00B · antecedentes_municipales — Antecedentes municipales RSU

| Campo | Texto |
|-------|-------|
| Subtítulo (catchy) | Cronología documentada antes de abrir la línea base numérica. |
| Pregunta central | ¿Qué legado RSU deja la administración previa — operadores, concesiones y programas? |
| Siguiente módulo | Abrir M01 — Línea base territorial y RSU |
| Stack | `AntecedentesMunicipalesStack.tsx` — síntesis, timeline, lecciones, vacíos |
| Avisos | No acto de autoridad · verificar T3 en archivo municipal |

**Hallazgos auditados:** P4 «hito» → «evento documentado» (corregido en brief).

---

## M01 · city_baseline — Línea base territorial y RSU

| Campo | Texto |
|-------|-------|
| Subtítulo | ¿Cuántos kilos genera este municipio y qué valor deja de capturarse hoy? |
| Pregunta central | ¿Cuánto RSU genera el municipio y cuánto valor se pierde hoy? |
| Siguiente módulo | Ajustar supuestos y matriz de fuentes |
| Gráficas + QHC | 4 chart_briefs (volumen, trayectoria, composición, impactos) |
| Stack | `CityBaselineStack.tsx` — sliders, `ImpactScenariosPanel`, `ResearchCompletenessBar` |

**Hallazgos:** P2 leve — grid KPI sin `NarrativeBridge` único (briefs por gráfica cubren metodología).

---

## M01B · impacto_ambiental — Impacto ambiental y sanitario

| Campo | Texto |
|-------|-------|
| Subtítulo | CO₂e, salud pública y vida útil del relleno — sin mezclar con ingresos de mercado |
| Pregunta central | ¿Qué externalidades evita el programa y con qué supuestos? |
| Siguiente módulo | Revisar factores de emisión antes de informe ESG |
| Stack | 8 KPIs + contrafactual + `ProvenanceBadge` |

**Hallazgos:** P2 fuerte — 8 KPIs sin cierre → **añadido `NarrativeBridge` dinámico**. P4 «material» → «fracción valorizable» en brief.

---

## M02 · social_diagnostico — Diagnóstico demográfico y vulnerabilidad

| Campo | Texto |
|-------|-------|
| Subtítulo | Quiénes son las personas que deben separar — sin inventar cifras municipales |
| Pregunta central | ¿Quiénes son las personas que deben participar y qué barreras enfrentan? |
| Siguiente módulo | Matriz de riesgos + bitácora de supuestos |
| Stack | `SocialDemographicContextPanel` (view=diagnostico) |
| Banner | `MunicipioDataAwaitingBanner` + supuestos IPC/fuente/alcance |

**Hallazgos:** P1 encabezado erróneo «M06» → **M02**. PASO 3 — banner, supuestos visibles, CTA `/hub`, tag nav.

---

## M02B · social_encuesta — Encuesta de aceptación ciudadana

| Campo | Texto |
|-------|-------|
| Subtítulo | IPC y barreras reales — con o sin datos de campo del municipio |
| Pregunta central | ¿La ciudadanía está lista para separar y en qué colonias no? |
| Siguiente módulo | Cargar resultados de campo o documentar benchmark n≥30 |
| Stack | Mismo panel, view=encuesta |

**Hallazgos:** P4 «trazabilidad» → «cadena de custodia de supuestos» en brief.

---

## M02C · mapeo_actores — Mapa de actores y legitimidad política

| Campo | Texto |
|-------|-------|
| Subtítulo | Pepenadores, concesionario, Cabildo y sociedad civil — mapa previo al arranque |
| Pregunta central | ¿Quién debe estar en la mesa antes de comprometer el programa? |
| Siguiente módulo | Completar fichas y primer encuentro facilitado |
| Stack | `MapeoActoresBridge` → Proyecto Vivo + banner supuestos IPC |

**Hallazgos:** P1 shell delgado → banner + supuestos visibles para M14.

---

## M02D · organigrama_diagnostico — Organigrama actual

| Campo | Texto |
|-------|-------|
| Subtítulo | Municipio y concesionario sin suposiciones — checklist persistido |
| Pregunta central | ¿Quién decide hoy desde la queja ciudadana hasta Cabildo? |
| Siguiente módulo | Marcar eslabones confirmados (corregido: nodos → eslabones) |
| Stack | `OrganigramaDiagnosticoStack.tsx` |

---

## M03 · capacidad_institucional — Capacidad institucional

| Campo | Texto |
|-------|-------|
| Subtítulo | Madurez institucional, diagnóstico jurídico y bloqueos antes de planear |
| Pregunta central | ¿El municipio puede ejecutar y generar plan hoy? |
| Siguiente módulo | Completar diagnóstico jurídico |
| Stack | `CapacidadInstitucionalStack` — ÁGORA, reglamento |

---

## M03B · marco_legal — Marco legal y brechas

| Campo | Texto |
|-------|-------|
| Subtítulo | El marco legal que lo frena o lo habilita todo |
| Pregunta central | ¿El reglamento actual permite operar o necesita reforma? |
| Siguiente módulo | Priorizar adendos |
| Gráficas | diagnostico-juridico, cobertura-normativa |

**Hallazgos:** P1 `criterio_decision` mezclaba sociodemografía → **alineado a reglamento**.

---

## M03C · cobertura_territorial — Cobertura territorial ZM

| Campo | Texto |
|-------|-------|
| Pregunta central | ¿Qué obligaciones aplican al municipio vs vecinos ZM? |
| Stack | `MunicipalContextStack` view=cobertura |

---

## M03D · dictamen_tecnico — Dictamen técnico de la reforma

| Campo | Texto |
|-------|-------|
| Pregunta central | ¿La reforma propuesta es técnicamente defendible? |
| Gráficas | dictamen-captura-5v3, dictamen-benchmarks |
| Stack | `DictamenTecnicoStack.tsx` |

---

## M04 · costo_omision — Costo de la omisión

| Campo | Texto |
|-------|-------|
| Subtítulo | La omisión tiene precio — y crece con la inflación |
| Pregunta central | ¿Cuánto cuesta al municipio cada año sin programa? |
| Stack | Hero + 4 KPIs + gráfica waterfall |

**Hallazgos:** P4 etiqueta waterfall → «valorización de fracciones».

---

## M04B · evaluacion_socioeconomica — Evaluación socioeconómica

| Campo | Texto |
|-------|-------|
| Pregunta central | ¿Qué retorno fiscal-social proyecta el programa? |
| Stack | `EvaluacionSocioeconomicaStack.tsx` |

---

## M04C · teoria_cambio — Teoría de cambio

| Campo | Texto |
|-------|-------|
| Pregunta central | ¿Cómo se conectan inputs, actividades y outcomes? |
| Stack | `TheoryOfChangePanel` vía `TeoriaCambioStack` |

---

## M11 · esquema_concesion — Esquema de concesión

| Campo | Texto |
|-------|-------|
| Subtítulo | Cuatro esquemas — quién pone capital y quién opera |
| Pregunta central | ¿Qué esquema de operación es viable política y financieramente? |
| Stack | `EsquemaConcesionStack` |

---

## M12 · arbol_financiamiento — Árbol de financiamiento

| Campo | Texto |
|-------|-------|
| Subtítulo | «No tenemos presupuesto» inicia el árbol, no lo cierra |
| Pregunta central | ¿Cómo financiamos sin CAPEX municipal disponible? |
| Stack | `ArbolFinanciamientoStack` |

---

## M13 · escenarios_financieros — Escenarios financieros

| Campo | Texto |
|-------|-------|
| Subtítulo | Expediente listo para Cabildo — números, supuestos y sensibilidad |
| Pregunta central | ¿Qué escenario financiero es viable para sesión de Cabildo? |
| Stack | `ScenariosExportStack` → `ImpactoFinanciero` |
| Patrón canónico | Rejilla stress + `NarrativeBridge` L381–391 |

**Hallazgos:** P2 — 4 KPIs financieros → **añadido `NarrativeBridge` post-grid**. P4 matriz de trazabilidad → matriz de fuentes.

---

## M14 · riesgos_modelo — Riesgos y sensibilidad

| Campo | Texto |
|-------|-------|
| Subtítulo | Los riesgos que pueden hundir el programa |
| Pregunta central | ¿Qué puede salir mal y cómo se mitiga? |
| Stack | `MarketTraceabilityStack` pageOnly=1 — 6 chips + matrices |

**Hallazgos:** P2 — 6 KPIs → **añadido `NarrativeBridge`**. P4 fracción/centro de acopio en subs de chips.

---

## M15 · expediente_cabildo — Expediente Cabildo

| Campo | Texto |
|-------|-------|
| Subtítulo | Del simulador al salón de sesiones |
| Pregunta central | ¿El expediente tiene todo lo que Cabildo necesita? |
| Siguiente módulo | Exportar ZIP y sesión previa con tesorería |

**Hallazgos:** P1 «${MODULE_COUNT} módulos» falso en validar → **Cap. 1 + Cap. 3**. P4 cadena de custodia de evidencia.

---

## Resumen transversal

| Problema | Módulos afectados | Estado |
|----------|-------------------|--------|
| P1 Genérico / drift | M03B, M02 header, M15 | Corregido |
| P2 KPIs sin cierre | M01B, M13, M14 | Corregido (NarrativeBridge) |
| P3 Frases prohibidas | — | Sin hallazgos en repo |
| P4 Terminología | Varios briefs + M14 chips | Parcialmente corregido |
| PASO 3 Shell datos | M02, M02B, M02C | Banner + nav tag + hub CTA |
