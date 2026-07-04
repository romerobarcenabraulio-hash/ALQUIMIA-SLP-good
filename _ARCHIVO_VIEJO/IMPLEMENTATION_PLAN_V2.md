# ALQUIMIA · PLAN V2 — Gap Analysis + Perks del Founder

**Fecha:** 10 junio 2026
**Base:** ALQUIMIA_CRITICAL_GAP_ANALYSIS.md + requisitos directos del founder.
**Estado verificado contra el código real** (no suposiciones).

---

## 0 · Lo que YA existe (verificado, no reconstruir)

| Requisito | Estado | Dónde vive |
|---|---|---|
| Selector INEGI estado → municipio al crear cuenta | ✅ existe | `frontend/src/app/onboarding/perfil/page.tsx` (estados → `getMunicipiosMx(estadoId)` → `clave_inegi`) |
| Scrapers DOF/SEMARNAT/COFEMER/INEGI/ASF en background | ✅ existe | `backend/app/scheduler.py` → `web_scraper.scheduler.process_due_jobs` |
| Encuesta ciudadana (bolsas/semana, separación) | ✅ existe | `backend/app/agents/survey_builder.py` + `/encuesta/[municipio_id]` |
| Pipeline ARCHIVO para PDFs que alimenta el founder | ✅ existe | `backend/app/services/archivo_pipeline.py` |
| Post-login con rol (admin → /v, cliente → /hub) | ✅ recién desplegado | `frontend/src/app/post-login/page.tsx` |
| Clerk → JWT bridge | ✅ desplegado | `POST /auth/clerk-exchange` + `useAlquimiaToken()` |

---

## 1 · 🔴 Investigación disparada al crear tenant (el "trigger" que pides)

**Hueco:** el scheduler corre por tiempo, NO por evento. Crear el tenant de
San Luis Potosí hoy NO encola scraping dirigido a SLP. La "personalización
instantánea" no existe todavía como evento.

**Solución — `on_tenant_created` kickoff:**
1. En `create_tenant` (`backend/app/routers/admin.py:2793`), tras persistir:
   encolar `ResearchKickoffJob(tenant_id, estado_mx, municipio_id, clave_inegi)`.
2. El job dispara los scrapers ya existentes con filtros del municipio:
   - INEGI: población, marco geoestadístico, DENUE (unidades económicas = las empresas a encuestar)
   - Periódico oficial del estado + DOF: reglamentos de residuos del municipio
   - SEMARNAT/COFEMER: NOMs y trámites aplicables
3. Resultado: el día que el founder entra a `/v` por primera vez, el ARCHIVO
   ya tiene lo scrapeable; los huecos quedan marcados como "pendiente de
   alimentación humana (PDF)" — degradación honesta (gap D3).
4. Panel en `/v`: "Investigación automática: 14/22 fuentes obtenidas · 8
   requieren documento humano" — el founder ve exactamente qué PDFs faltan.

**Por qué primero:** es el contrato de la filosofía ("abrir la app dispara
toda la bloody investigación"). Sin esto, el resto es manual.

---

## 2 · 🔴 Encuesta empresarial de generación (per-company, no ciudadana)

**Hueco:** la encuesta existente es de hogares. No hay instrumento para que
cada empresa estime razonablemente cuánto genera.

**Solución — `CompanySurvey`:**
1. Nuevo template en `survey_builder.py` con banco de preguntas por giro
   (DENUE da el giro): restaurante ≠ ferretería ≠ hotel.
   - Empleados, días de operación, contenedores actuales, frecuencia de llenado,
     fracciones que separa hoy, prestador de recolección, manifiestos existentes.
2. Motor de estimación determinístico: respuestas → rango de generación
   (kg/día P10–P90, citando benchmarks SEMARNAT/GIZ por giro). Cero invención:
   la cifra siempre lleva su fuente y su banda, nunca punto único (gap A2 en miniatura).
3. La respuesta crea/actualiza el `GeneradorEntity` del registro Phase D
   con `data_origin="survey"` y provenance (gap D1).
4. Envío: link público con rate-limit (gap E2, slowapi) + token por empresa.

---

## 3 · 🔴 Doctrinas por empresa (obligaciones normativas por giro)

**Hueco:** no existe el checklist de "todo lo que cada bloody empresa debe tener".

**Solución — `ObligationMatrix`:**
1. Tabla `company_obligations`: giro/fracción × jurisdicción → obligación
   (plan de manejo, manifiesto, registro como generador, bitácora, contrato con
   prestador autorizado, etc.), cada una con cita legal (LGPGIR art. X, NOM-161,
   reglamento municipal scrapeado).
2. Al completar la encuesta (§2), el sistema cruza giro + volumen estimado →
   clasifica (pequeño/gran generador) → emite su checklist personalizado con
   semáforo de cumplimiento.
3. Esto ES el gap D4 (matching normativo → tenant/empresa afectada): cuando un
   scraper trae una norma nueva, el matcher la cruza contra la matriz y alerta.

---

## 4 · 🟡 Inventario de contenedores categorizados

**Hueco:** no existe ningún modelo de contenedor en el código.

**Solución — `ContainerInventory`:**
1. Modelo: `Container(id, tenant_id, ubicacion_geo, tipo[orgánico/reciclable/sanitario/mixto], capacidad_L, estado, fuente_dato, last_verified)`.
2. Captura: (a) pregunta en encuesta empresarial, (b) carga masiva CSV por el
   founder, (c) registro en campo desde `/residue-recording`.
3. KPI en hub y en `/v`: "contenedores categorizados vs. mixtos por colonia" —
   alimenta el mapa de calor Leaflet (gap B2) y el dimensionamiento (gap A4).

---

## 5 · 🔴 El motor "te digo qué te falta" (insight proactivo)

**Hueco:** el sistema reporta lo que tiene; no señala lo que falta.

**Solución — `GapDetector`:**
1. Por tenant, lista canónica de lo que un expediente completo necesita
   (datos, documentos, encuestas, contenedores, obligaciones cubiertas).
2. Cada noche (scheduler existente) compara estado real vs. canon y emite
   `MissingItem`s rankeados por impacto: "Sin composición de residuos medida
   — el FOD de carbono queda ilustrativo", "0 de 340 empresas DENUE encuestadas",
   "Contenedores sin categorizar en 12 colonias".
3. Se muestra como panel "Lo que falta" en `/v` (admin) y versión filtrada en `/hub`.

---

## 6 · Endurecimiento previo al lanzamiento (del gap analysis, intacto)

Orden de la semana, tomado del documento:
1. **E1** aislamiento de tenants a nivel query (middleware ORM + test cross-tenant)
2. **E2** rate limiting (slowapi) en `/propuesta/public/*` y encuesta pública
3. **D1+D2** provenance de cálculos + versionado de metodología
4. **C3** cola asíncrona de documentos (Celery + Redis ya disponible vía API_REDIS)

Semana 2-3 (venden): **B1** Sankey (Plotly), **A1** FOD IPCC, **A2** Monte Carlo
(numpy), **D4** ya cubierto por §3.

---

## Orden de ejecución

| # | Bloque | Por qué este orden |
|---|---|---|
| 1 | §1 Research kickoff on tenant create | Sin esto no hay "personalización instantánea" |
| 2 | §6.1-6.2 (E1, E2) | No negociable antes de exponer encuesta pública |
| 3 | §2 Encuesta empresarial + estimación | Alimenta generadores, obligaciones y contenedores |
| 4 | §3 Matriz de obligaciones | Depende del giro que da §2 |
| 5 | §4 Contenedores | Depende de encuesta + carga founder |
| 6 | §5 GapDetector | Necesita los modelos anteriores para tener qué comparar |
| 7 | §6 resto (D1/D2, C3, Sankey, FOD, Monte Carlo) | Profundidad defendible |

**Principio rector (del gap analysis):** profundidad sobre amplitud. Cada
cifra con fuente, banda y provenance. Lo que la máquina no pudo obtener se
declara abiertamente y espera el PDF del founder — nunca se finge frescura.
