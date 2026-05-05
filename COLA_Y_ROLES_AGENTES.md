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
| **Última sincronización** | 2026-05-05 (post entrega Ejecutor CI + 23.0 remediación) |
| **Rama / PR activo** | _(opcional)_ |
| **Navigator** | **ACTIVO** — **re-PASS 23.0 emitido** en bitácora **2026-05-05** (`Navigator — re-PASS Fase 23.0…`): ítem **5 PASS**; **6–7 FAIL** documentados (`catalog_debt.py`, epoch simbólico). **23.1** sin autorización Navigator por FAIL **6–7** hasta migración CVE/MGN **o** orden CSA de riesgo. |
| **Nota operativa** | **§6.3:** métricas Lighthouse/axe+LCP **PENDIENTES** (humano o job Node+Chrome; sin inventar scores). **CI:** `.github/workflows/ci.yml` (rg + pytest + tsc) **HECHO** en repo — validar que Actions pase en remoto. **Release serio** (**2026-05-05**): checklist **CSA — Tarea operativa · Release serio** en `planeacion_ejecucion/BITACORA_AUDITORIA_PLANEACION.md` (R1–R7: Vercel/API/auth/E2E/logs/Lighthouse/DNS). Humano en Vercel + Ejecutor backend/E2E. **Q-003 17.1** siguiente PR priorizada con ese paquete. **23.1** geo **no** iniciada. |

**Bloqueantes globales** _(vacío = ninguno)_

- …

---

## 2. Cola priorizada

_Orden sugerido: de arriba hacia abajo. Un ítem = una PR o un paquete coherente._

| ID | Ítem | Rol propietario | Estado | Definición de HECHO |
|----|------|-----------------|--------|---------------------|
| Q-001 | Firma Auditor Fase 22 vs blueprints `22_0`–`22_6` | Auditor | **HECHO** 2026-05-05 | Mandado al Auditor; respuesta recibida |
| Q-002 | (Opcional) 22.6 server-side `audience` si Auditor exige | Ejecutor → Auditor | PENDIENTE | Solo si Auditor lo requirió en Q-001 |
| Q-003 | 17.1 publicación + landing + auth + backend deploy | Ejecutor → Auditor | **SIGUIENTE** | Backend en host público + NEXT_PUBLIC_API_URL + CORS + auth rutas sensibles; `Failed to fetch` en prod resuelto |
| Q-004 | **23.0** remediación FAIL 5–7 (**Ejecutor HECHO**) + **Navigator re-PASS HECHO** (2026-05-05) → **23.1** solo con CSA nuevo | Navigator → Ejecutor | **EN CURSO** (gate 23.1 cerrado Navigator) | re-PASS en bitácora: ítem 5 PASS; 6–7 FAIL persistentes · **sin 23.1** hasta CSA nueva orden o cierre CVE/MGN · **2026-05-05** salvaguardas Navigator (disclaimers simulación, Municipio↔ZM copy, gate verificación legal doc, banner hub `DOCS_ESTATICOS`, §6.3 bitácora + job Lighthouse opcional) |
| Q-004b | CI GitHub Actions (`ci.yml`) rg + pytest + tsc | Ejecutor | **HECHO** | Workflow en `.github/workflows/ci.yml`; verificar run verde en GitHub |
| Q-005 | 24 release gate E2E + observabilidad | Ejecutor → Auditor | PENDIENTE | E2E reproducible o protocolo firmado |
| Q-006 | 25 tokens / design-as-code | Aesthete → Ejecutor | PENDIENTE | Tabla tokens versionada + README enlazado |
| Q-007 | **26** Reglamentos fuente primaria (modal/popup) + docs descargables completos SLP | Ejecutor → Auditor | PENDIENTE | Ver `26_reglamentos_fuente_primaria_y_documentacion.md`; puede correr en paralelo con Q-003 |
| Q-008 | **PM Consultor Senior** — evaluar proyecto, charter, stakeholders, cronograma, riesgos, modelo de negocio | Agente PM | PENDIENTE | Ver `AGENTE_PM_DIRECTOR_PROYECTOS.md`; abrir chat nuevo con prompt sistema |
| Q-009 | **27** Selector Estado → Municipio + generación universal escenarios + botón Home ALQUIMIA | Ejecutor → Navigator → Auditor | PENDIENTE | Ver `27_selector_estado_municipio_y_generacion_universal.md`; Navigator valida CVE INEGI |
| Q-010 | **Agente Jurídico Legal** — revisar disclaimers, normas citadas, privacidad, responsabilidad, términos de uso | Agente Jurídico | PENDIENTE (**ANTES de release público**) | Ver `AGENTE_JURIDICO_LEGAL.md`; activar antes de R1 con usuarios reales |
| Q-011 | **PRES-1** Pulido presentación institucional — landing (PR A) · simulador ciudadano (PR B) · aprende (PR C) | Aesthete → Ejecutor | PENDIENTE | Ver `PRES-1_pulido_presentacion_institucional.md`; riesgo bajo · solo copy/UI · sin tocar API ni motor de cálculo · iniciar después de Q-003-UX |

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
