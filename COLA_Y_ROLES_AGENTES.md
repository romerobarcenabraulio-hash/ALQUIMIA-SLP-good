# COLA y roles de agentes · ALQUIMIA

**Para qué sirve este archivo:** una sola fuente de verdad que el chat “CSA / orquestador” (`@COLA_Y_ROLES_AGENTES.md`) lee al iniciar sesión: **en qué fase vamos**, **qué está bloqueado**, **qué sigue**, y **cuándo conviene abrir** chats separados de **Aesthete-1** o **Navigator** (además de Ejecutor / Auditor).

**Reglas de uso**

1. Al **empezar el día** (o una nueva sesión larga): actualiza **§1 Estado** y la **§2 Cola** en 2–5 minutos.
2. Al **cerrar** un ítem: márcalo `HECHO`, pon fecha y enlace a PR/commit si aplica.
3. No borres historial útil: mueve ítems cerrados a **§6 Histórico corto** cuando la tabla crezca.

---

## 1. Estado actual (editar siempre aquí primero)

| Campo | Valor |
|-------|--------|
| **Fase rectora** | **23.0 ABIERTA** (CSA 2026-05-05) — intake jurisdiccional lógico · **22.x** cerrada en código salvo deuda §6.3/Lighthouse · **17.1** / **23.1** siguen en cola |
| **Última sincronización** | 2026-05-06 (CSA — Q-020/Q-021 cola + REQUEST Ejecutor R3→Q-007) |
| **Rama / PR activo** | _(opcional)_ |
| **Navigator** | **ACTIVO** — **re-PASS 23.0 emitido** en bitácora **2026-05-05** (`Navigator — re-PASS Fase 23.0…`): ítem **5 PASS**; **6–7 FAIL** documentados (`catalog_debt.py`, epoch simbólico). **23.1** sin autorización Navigator por FAIL **6–7** hasta migración CVE/MGN **o** orden CSA de riesgo. |
| **Nota operativa** | **§6.3:** métricas Lighthouse/axe+LCP **PENDIENTES** (humano o job Node+Chrome; sin inventar scores). **CI:** `.github/workflows/ci.yml` (rg + pytest + tsc) **HECHO** en repo — validar que Actions pase en remoto. **Release serio** (**2026-05-05**): checklist **CSA — Tarea operativa · Release serio** en `planeacion_ejecucion/BITACORA_AUDITORIA_PLANEACION.md` (R1–R7: Vercel/API/auth/E2E/logs/Lighthouse/DNS). Humano en Vercel + Ejecutor backend/E2E. **Q-003 17.1** siguiente PR priorizada con ese paquete. **23.1** geo **no** iniciada. |

**Bloqueantes globales** _(vacío = ninguno)_

- **R3 · Auth rutas sensibles** (`/simulator`, `/hub`, `/ca-studio`): **BLOQUEANTE** antes de compartir URL pública amplia — ver REQUEST CSA → Ejecutor (prioridad 1).

---

## 2. Cola priorizada

_Orden sugerido: de arriba hacia abajo. Un ítem = una PR o un paquete coherente._

| ID | Ítem | Rol propietario | Estado | Definición de HECHO |
|----|------|-----------------|--------|---------------------|
| Q-001 | Firma Auditor Fase 22 vs blueprints `22_0`–`22_6` | Auditor | **HECHO** 2026-05-05 | Mandado al Auditor; respuesta recibida |
| Q-002 | (Opcional) 22.6 server-side `audience` si Auditor exige | Ejecutor → Auditor | PENDIENTE | Solo si Auditor lo requirió en Q-001 |
| Q-003 | 17.1 publicación + landing + auth + backend deploy | Ejecutor → Auditor | **HECHO** 2026-05-05 | `https://alquimia-slp.onrender.com/health` OK · CORS · `NEXT_PUBLIC_API_URL` en Vercel · `Failed to fetch` resuelto · pendiente menor: auth stub + Auditor firma |
| Q-004 | **23.0** remediación FAIL 5–7 (**Ejecutor HECHO**) + **Navigator re-PASS HECHO** (2026-05-05) → **23.1** solo con CSA nuevo | Navigator → Ejecutor | **EN CURSO** (gate 23.1 cerrado Navigator) | re-PASS en bitácora: ítem 5 PASS; 6–7 FAIL persistentes · **sin 23.1** hasta CSA nueva orden o cierre CVE/MGN · **2026-05-05** salvaguardas Navigator (disclaimers simulación, Municipio↔ZM copy, gate verificación legal doc, banner hub `DOCS_ESTATICOS`, §6.3 bitácora + job Lighthouse opcional) |
| Q-004b | CI GitHub Actions (`ci.yml`) rg + pytest + tsc | Ejecutor | **HECHO** | Workflow en `.github/workflows/ci.yml`; verificar run verde en GitHub |
| Q-005 | 24 release gate E2E + observabilidad | Ejecutor → Auditor | PENDIENTE | E2E reproducible o protocolo firmado |
| Q-006 | 25 tokens / design-as-code | Aesthete → Ejecutor | PENDIENTE | Tabla tokens versionada + README enlazado |
| Q-007 | **26** Reglamentos fuente primaria (modal/popup) + docs descargables completos SLP | Ejecutor → Auditor | PENDIENTE | Ver `26_reglamentos_fuente_primaria_y_documentacion.md`; puede correr en paralelo con Q-003 |
| Q-008 | **PM Consultor Senior** — evaluar proyecto, charter, stakeholders, cronograma, riesgos, modelo de negocio | Agente PM | PENDIENTE | Ver `AGENTE_PM_DIRECTOR_PROYECTOS.md`; abrir chat nuevo con prompt sistema |
| Q-009 | **27** Selector Estado → Municipio + generación universal escenarios + botón Home ALQUIMIA | Ejecutor → Navigator → Auditor | PENDIENTE | Ver `27_selector_estado_municipio_y_generacion_universal.md`; Navigator valida CVE INEGI |
| Q-010 | **Agente Jurídico Legal** — revisar disclaimers, normas citadas, privacidad, responsabilidad, términos de uso | Agente Jurídico | **EN CURSO** (correcciones ejecutadas 2026-05-06) | Auditor pendiente de firma final |
| Q-011 | **PRES-1** Pulido presentación institucional — landing (PR A) · simulador ciudadano (PR B) · aprende (PR C) | Aesthete → Ejecutor | PENDIENTE | Ver `PRES-1_pulido_presentacion_institucional.md`; riesgo bajo · solo copy/UI · sin tocar API ni motor de cálculo · iniciar después de Q-003-UX |
| Q-012 | **VIZ-CA** Diagramas `CentrosAcopio.tsx` — PR-VIZ-A (brecha+timeline+bars) · PR-VIZ-B (fases spark/heat) · PR-VIZ-C (SVG mini CTA studio) | Ejecutor (Aesthete review) | PENDIENTE | ACCEPT CSA 2026-05-05 · ver `AESTHETE_PROPOSICION_DIAGRAMAS_CA_VISUAL.md` · NarrativeBridge obligatorio · sin geo tiles |
| Q-013 | **Adendos reglamentarios** — Sprint 1 (contenido PDFs) · Sprint 2 (AdendoViewer UI) · Sprint 3 (escala multi-ciudad) | CLC + Ejecutor + Auditor + Aesthete | **DESBLOQUEADO** 2026-05-05 | PDFs cargados por humano ✓ · Brief respondido · ADR-001 requerido antes de `legal_gate.py` · puede arrancar Sprint 1 |
| Q-014 | **Agente Economista** — CONAPO proyección poblacional + BIE mercado RSU + DENUE compradores + EFIPEM presupuesto municipal + modelos predictivos | Agente Economista → Ejecutor → Navigator | PENDIENTE (**depende de Q-009**) | Sin selector Estado→Municipio no hay sentido; activar después de Q-009 mergeado · ver especificación pendiente de crear |
| Q-015 | **Actualización INEGI live** — reemplazar `constants.ts` estático (Censo 2020) por CONAPO 2026 proyectado + BIE via `GET /data/municipio/{id}/proyeccion` | Ejecutor → Navigator | PENDIENTE (**puede iniciar antes de Q-009**) | CONAPO API pública disponible; Navigator valida CVE antes del merge |
| Q-018 | **NarrativaIntro dinámica** — texto introductorio ciudadano personalizado (ciudad, kg/persona, toneladas ZM, gentilicio, LGPGIR) para todos los módulos del simulador | Ejecutor + Aesthete | PENDIENTE (**OLA 2, alta prioridad**) | Datos del store (municipio activo, población, generación per cápita) · tono ciudadano conversacional · sin tecnicismos · blueprint OBS-1 |
| Q-019 | **Resumen Ejecutivo Integrado** — empleos generados, derrama económica, pronósticos de crecimiento; conectar Macrogeneradores + ImpactoFinanciero + estimados formación empleo informal→formal | Ejecutor + Aesthete | PENDIENTE (**OLA 2**) | Depende de Q-017 (declaraciones empresa) para completar cuadro de empleos · OBS-5 |
| Q-020 | **Timeline Slider Espacio-Tiempo** (catálogo de hitos + PERT) | Ejecutor | PENDIENTE | Spec PD&SA chat día · lineamiento OBS-8 · base existente `ImplementacionEspacioTiempo.tsx` si aplica |
| Q-021 | **Sankey Flujo Residuos** + Slider Temporal 0→5 años | Ejecutor → Auditor → Aesthete | PENDIENTE | Spec completa PD&SA chat día · disclaimers simulación · revisión legal copies métricas |
| Q-022 | **Módulo Esquemas de Concesión** — rutas modelo (privado / concesionario / renegociación) + matriz decisión según perfil político y presupuesto | PD&SA spec → Ejecutor → CLC | PENDIENTE | Depende de Q-009 selector municipio |
| Q-023 | **ÁGORA Pipeline** — botón "Genera mi plan" → 7 docs LLM (Claude) → ZIP descarga directa en navegador · sin Google Drive · misma cuenta Anthropic | Ejecutor → CLC (Q-010) → Auditor | PENDIENTE (**PRIORIDAD MÁXIMA**) | Backend `/api/v1/generate-plan` · ZIP in-memory · frontend fetch + `URL.createObjectURL` · base: templates SLP |
| Q-024 | **BUG CRÍTICO Selector Municipio** — municipio individual sigue mostrando datos ZM completa en todos los módulos | Ejecutor | **HECHO** | Motor `calcular` + `resolveSimulationGeography` + `recalcular` al variar `municipiosActivos`; tests `frontend/src/lib/zmPopulationScale.test.ts`; aviso UI ancla cuando hay varios municipios en módulos con API single-id |
| Q-025 | **Mapa de Calor Circularidad** (Mapbox) — colonia x colonia, % circularidad actual vs proyectado | Navigator → Ejecutor → Aesthete | PENDIENTE (**OLA 2**) | Navigator valida fuente INEGI/AGEB · SRID 4326 · Mapbox GL JS |
| Q-026 | **Módulo RCD** — renta contenedores volquete, trazabilidad RCD → CA, modelo ingresos concesionario | PD&SA spec → Ejecutor → CLC | BACKLOG | Fase 2 |
| Q-016 | **Predios sin permiso / expediente sancionatorio** — catastro predial, detección cagaderos, cálculo multa, PDF expediente técnico para inspector municipal | CLC + Navigator + Ejecutor + Auditor | PENDIENTE (**OLA 3+**) | Navigator: polígonos predios requieren fuente catastro oficial (no INEGI solo) · CLC: expediente ≠ acto de autoridad · depende Q-009 |
| Q-017 | **Declaración de Generación Empresarial RSU** — wizard por giro SCIAN, estimación por material, perfil descargable, integración a Macrogeneradores | CLC + Ejecutor + Auditor | PENDIENTE (**OLA 2-3**) | CLC: nombre NO puede ser "COA" ni simular obligación federal · integra con `Macrogeneradores.tsx` existente · puede iniciar antes de Q-009 |

**Leyenda estado:** `PENDIENTE` | `EN CURSO` | `REVISIÓN` (Auditor o PR abierta) | `HECHO` | `BLOQUEADO`

---

## 3. Cuándo “echar a jalar” al Aesthete-1

**Archivo de reglas:** `cursor-rules/AESTHETE-1.md`

Ábrelo en un **chat nuevo** cuando cualquiera de estos sea verdadero:

| Disparador | Qué pides |
|------------|-----------|
| **UI nueva o refactor grande** (simulador, hub, landing) | Revisión de jerarquía tipográfica, densidad por audiencia (citizen vs official vs entrepreneur), WCAG 2.2 AA. |
| **Gráficas / dashboards** | Data-ink, leyendas, que ningún número quede “solo”; coherencia con `NarrativeBridge` (spec en AESTHETE §3.2). |
| **Tokens / paleta / espaciado** | Definición o auditoría de tokens “élite editorial”; prohibición de gray/indigo plano en piezas críticas (alineado Fase 22). |
| **Después de Auditor legal** (opcional pero útil) | Pulido de copies y estados vacíos sin contradecir veto legal. |

**No uses Aesthete para:** lógica de negocio, contratos API, reemplazar al Auditor en legal/geo.

**Prompt corto para pegar en el chat Aesthete:**

```text
Operas solo como AESTHETE-1 según cursor-rules/AESTHETE-1.md. No escribes código de producción salvo que te pida tokens/CSS acotado.
Contexto: [pantalla o PR].
Entrega: checklist de hallazgos priorizados (Blocker / High / Medium) + sugerencias concretas de jerarquía, color, copy micro y a11y.
```

---

## 4. Cuándo “echar a jalar” al Navigator

**Archivo de reglas:** `cursor-rules/NAVIGATOR.md`  
**Blueprint de fase:** `AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/23_integridad_geoespacial_y_capas.md` — Navigator **no** se usa para cerrar 22.x; se usa para esta línea de trabajo geo.

Ábrelo en un **chat nuevo** cuando cualquiera de estos sea verdadero:

| Disparador | Qué pides |
|------------|-----------|
| **Mapas, tiles, centroides, polígonos** (Mapbox, GeoJSON, capas) | SRID canónico (4326 almacén, 3857 solo vista), fuente INEGI/MGN, metadatos ISO 19115. |
| **Consultas espaciales que mezclan municipio y ZM** | Validación de `jurisdiction_scope`, `municipio_id`, equivalencias CVE; reglas §5 NAVIGATOR. |
| **Nueva capa o ingestión geoespacial** | Checklist pre-publicación (§5.3 NAVIGATOR), provenance, performance tiles. |
| **Privacidad de ubicación** (k-anonimato, puntos sensibles) | Revisión antes de exponer datos agregados o puntos. |

**No uses Navigator para:** paleta visual sola (eso es Aesthete), HTML/React sin implicación geo, decisiones legales no espaciales.

**Prompt corto para pegar en el chat Navigator:**

```text
Operas solo como NAVIGATOR según cursor-rules/NAVIGATOR.md. No decides negocio/legal fuera de integridad geoespacial y jurisdicción.
Contexto: [ruta de código, formato de capa, o decisión espacial].
Entrega: checklist PASS/FAIL contra §5–6, SRID declarado, fuentes citadas, y riesgos Municipio↔ZM si aplican.
```

---

## 5. Orden típico de handoff (para no corretearte)

```text
Ejecutor (implementa) → Auditor (blockers legales/técnicos del protocolo) → Aesthete (prestigio + a11y + narrativa visual)
Navigator entra en paralelo solo si hay trabajo geo; si hay mapa en la misma PR, Navigator puede revisar antes del merge.
```

Si un cambio **toca mapa + UI**: Ejecutor integra → **Navigator** (geo) y **Aesthete** (presentación del mapa: leyenda, contraste) pueden revisar **el mismo diff** en chats distintos.

---

## 6. Histórico corto (opcional)

| Fecha | ID | Nota |
|-------|-----|------|
| … | … | … |

---

## 7. Referencias rápidas en repo

| Rol | Spec |
|-----|------|
| Ejecutor | `cursor-rules/EJECUTOR.md` |
| Auditor | `cursor-rules/AUDITOR.md` |
| Aesthete-1 | `cursor-rules/AESTHETE-1.md` |
| Navigator | `cursor-rules/NAVIGATOR.md` |
| Protocolo | `cursor-rules/01_PROTOCOLO_PIS_ALQUIMIA.md` |
| Fase 23 (geo) | `AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/23_integridad_geoespacial_y_capas.md` |
| Fase 24 (release gate) | `AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/24_release_gate_e2e_observabilidad.md` |
| Fase 25 (tokens) | `AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/25_tokens_y_design_as_code.md` |
| Prompts COLA + agente planeación/logística | `AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/planeacion_ejecucion/PROMPTS_TAREAS_PENDIENTES_Y_AGENTE_PLANEACION_LOGISTICA.md` |
| Fase 26 (reglamentos + docs descargables) | `AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/26_reglamentos_fuente_primaria_y_documentacion.md` |
| Agente PM / Director de proyectos | `AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/AGENTE_PM_DIRECTOR_PROYECTOS.md` |
| Fase 27 (selector Estado→Municipio + universal) | `AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/27_selector_estado_municipio_y_generacion_universal.md` |
| Agente Jurídico Legal | `AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/AGENTE_JURIDICO_LEGAL.md` |
| Fase PRES-1 (pulido institucional) | `AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/PRES-1_pulido_presentacion_institucional.md` |
| Q-012 VIZ-CA (diagramas centros acopio) | `cursor-rules/AESTHETE_PROPOSICION_DIAGRAMAS_CA_VISUAL.md` |
| Fase 28 (predios sin permiso / expediente sancionatorio) | `AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/28_predios_sin_permiso_expediente_sancionatorio.md` |
| Fase 29 (declaración generación empresarial RSU) | `AJUSTES.ALQUIMIA/reestructura_maestra_2026-04-30/29_declaracion_generacion_empresarial_rsu.md` |
