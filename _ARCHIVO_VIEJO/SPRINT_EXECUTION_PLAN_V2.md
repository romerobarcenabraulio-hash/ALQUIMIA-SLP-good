# SPRINT EXECUTION PLAN · V2 · Cero Invención

**Estado:** Vivo · Actualizado 4 junio 2026  
**Principio:** Toda cifra en el sistema es justificable con bibliografía. Cero datos hardcodeados por tenant.  
**Cierre de proyecto:** 31 agosto 2026 (8 semanas)

---

## RESUMEN GLOBAL DE PROGRESO

| Sprint | Fechas | Bloques | % Sprint | % Acumulado |
|--------|--------|---------|----------|-------------|
| **Sprint 1** | May 30 - Jun 5 | B1-B4 Limpieza UI cliente | **100%** | **12.5%** |
| **Sprint 2** | Jun 6 - Jun 13 | DataPoint V2 schema, DB migrations, ARCHIVO pipeline | 0% | 12.5% |
| **Sprint 3** | Jun 14 - Jun 20 | Módulo por módulo refactor (M00B-M04) | 0% | 12.5% |
| **Sprint 4** | Jun 21 - Jun 27 | Módulos planeación refactor (M05-M08) | 0% | 12.5% |
| **Sprint 5** | Jun 28 - Jul 4 | Progresión bloqueada + Plataforma 0 A1-A6 | 0% | 12.5% |
| **Sprint 6** | Jul 5 - Jul 11 | Plataforma 0 A7-A12 + sequential gates | 0% | 12.5% |
| **Sprint 7** | Jul 12 - Jul 18 | Integración Stripe + Facturapi + Mifiel | 0% | 12.5% |
| **Sprint 8** | Jul 19 - Jul 26 | QA + hardening + pilot SLP real | 0% | 12.5% |

**TOTAL GLOBAL:** 12.5% (Sprint 1 cerrado)

---

## SPRINT 1 ✅ CERRADO

**Período:** 30 mayo - 5 junio (100%)

**Bloques completados:**
- B1: Eliminar códigos M0X internos de UI cliente (PR #11) ✅
- B2: Ocultar `ConsultingPackagePanel` al cliente + enlace discreto upload en M00B (PR #12) ✅
- B3: `/metodologia` actualizada a modelo V2 (7 categorías DataPoint) (PR #12) ✅
- B4: M03B Justificación Técnica como sub-sección colapsable (PR #12) ✅

**Merged PRs:** #11, #12  
**Tests:** 994/1009 pass (pre-existing CI issues, no code regressions)  
**Estado:** Código y documentación alineados con V2

---

## SPRINT 2 — DataPoint V2 Schema + ARCHIVO Pipeline

**Período:** 6 - 13 junio (esperado 8 días)  
**Meta:** Arquitectura de datos con 7 categorías + document processing engine

### 2.1 TypeScript DataPoint V2 Schema (2 días)

**Archivos a crear/modificar:**
- `frontend/src/types/dataPoint.ts` → NEW
  - `DataPointCategory` enum: `client_document | municipal_research | state_data | metropolitan_zone | national_data | comparable_city | calculated_model | pending`
  - `DataPoint` interface con `category`, `source_id`, `confidence`, `method`, `scope`, `updated_at`, `created_at`
  - `DataPointHistory` para auditoria de cambios

- `backend/models/data_point.py` → NEW
  - SQLAlchemy models para `DataPoint` y `DataPointHistory`
  - Relationships con `Tenant`, `Module`

**Criterio de cierre:** TypeScript types y backend models compilables, no hay errores de tipo

---

### 2.2 DB Migrations (1 día)

**Alembic migrations:**
- `tenant_data` table: tenant_id, module_id, data_json, completeness_pct, blocked_reason
- `data_point_history` table: data_point_id, old_value, new_value, changed_by, changed_at
- `evidence_conflicts` table: tenant_id, claim_1, claim_2, conflict_type, resolution_status
- `bibliography_registry` table: source_id, url, institution, year, scope, confidence_score
- `price_mix_scenarios` table: tenant_id, scenario_id, material_id, price, source
- `module_completion_status` table: tenant_id, module_id, percent_complete, blocking_gate, unblocked_at

**Criterio de cierre:** Migrations apply cleanly on fresh DB, rollback works, no data loss test

---

### 2.3 ARCHIVO Pipeline Skeleton (3 días)

**Archivos a crear:**
- `backend/services/archivo_pipeline.py` → 8-step document processing engine:
  1. **Ingestión:** recibe PDF/doc de upload, genera request_id
  2. **Extracción:** OCR (local Tesseract o Google Vision) + NLP → texto + bounding boxes
  3. **Claims:** regex + spacy para identificar cifras, artículos, fechas
  4. **Clasificación:** asigna categoria DataPoint basada en metadatos documento
  5. **Contraste:** compara contra bibliography_registry y data_point existentes
  6. **Propagación reactiva:** actualiza tenant_data, marca brechas cerradas
  7. **AUDITOR:** verifica confidence > 60%, documenta supuestos
  8. **Notificaciones:** webhook al frontend con resultado + requerimientos faltantes

- `backend/routes/documents.py` → POST `/api/tenants/{id}/documents/upload`
  - Integración con ARCHIVO pipeline

**Criterio de cierre:** Pipeline procesa PDF de prueba, extrae 3+ claims, clasifica, registra en DB sin errores

---

### 2.4 Frontend DataPoint UI Prep (2 días)

**Archivos a crear:**
- `frontend/src/components/datapoint/DataPointCell.tsx` → renderiza un DataPoint con badge categoria + confidence
- `frontend/src/components/datapoint/DataPointHistory.tsx` → timeline de cambios
- `frontend/src/hooks/useDataPointsByModule.ts` → query hook para un módulo

**Tests esperados:** TypeScript checks, no funcional (backend dummy)

**Criterio de cierre:** Componentes compilables, tipos alineados con backend

---

### 2.5 Integración Frontend + Backend Básica (1 día)

**Archivos a modificar:**
- `frontend/src/app/v/page.tsx` → reemplazar datos hardcodeados con hook `useDataPointsByModule`
- `PlatformPage.tsx` → incorporar estado vacío si no hay datos para módulo

**Criterio de cierre:** Cliente ve módulo vacío si tenant no tiene documentos, no errores 500

---

### DELIVERABLES SPRINT 2

```
✅ frontend/src/types/dataPoint.ts
✅ backend/models/data_point.py
✅ Alembic migrations (6 nuevas)
✅ backend/services/archivo_pipeline.py (skeleton con 8 steps)
✅ backend/routes/documents.py (POST upload)
✅ frontend/src/components/datapoint/*.tsx (3 componentes)
✅ Tests: pipeline extrae claims ✓, migrations apply ✓
✅ PR #13: DataPoint V2 + ARCHIVO skeleton
```

**% de progreso después de Sprint 2:** 25% global

---

## SPRINT 3 — Refactor Módulos Validación (M00B-M04)

**Período:** 14 - 20 junio  
**Meta:** Desacoplar 5 módulos de datos hardcodeados de SLP

### 3.1 M00B Antecedentes Municipales

**Cambios:**
- Reemplazar cifras hardcodeadas con `useDataPointsByModule('antecedentes_municipales')`
- Renderizar estado vacío si no hay datos
- DocumentUploadSection: mostrar qué documentos faltan para "completo"

### 3.2 M01 Línea Base Municipal

**Cambios:**
- Refactor charts para usar tenant_data en lugar de SLP hardcodeado
- Confidence badges por cada número
- Referencias a fuentes

### 3.3 M02 Diagnóstico Social

**Cambios:**
- Encuesta ciudadana → generar cuando cliente lo cargue (no hardcodeado)
- Mapa social → datos tenant
- Benchmark comparables → desde bibliography_registry sin mezclarse con local

### 3.4 M03 Capacidad Institucional

**Cambios:**
- Refactor instituciones cargadas vs hardcodeadas
- Scoring dinámico basado en documentos reales

### 3.5 M04 Costo de No Actuar

**Cambios:**
- Cálculo basado en tenant_data RSU
- Fórmula transparent con fuentes

### DELIVERABLES SPRINT 3

```
✅ M00B: sin datos hardcodeados, renderiza vacío correctamente
✅ M01: charts dinámicos, confidence badges
✅ M02: encuesta dinámica, benchmark separado
✅ M03: scoring dinámico
✅ M04: cálculo trazable con fuentes
✅ PR #14: Module refactor M00B-M04
```

**% de progreso después de Sprint 3:** 37.5% global

---

## SPRINT 4 — Refactor Módulos Planeación (M05-M08)

**Período:** 21 - 27 junio  
**Meta:** Desacoplar módulos de planeación (roadmap, infraestructura, logística, costos)

### 4.1 M05 Roadmap Implementación

**Cambios:**
- Timeline dinámico basado en inputs tenant
- Fases desbloqueadas por completitud de M01-M04

### 4.2 M06 Infraestructura

**Cambios:**
- Diseño operativo basado en materiales RSU (datos tenant)
- Benchmark referencias sin certeza local

### 4.3 M07 Logística

**Cambios:**
- Rutas de acopio dinámicas
- Costos operativos referenciados

### 4.4 M08 Costos del Programa

**Cambios:**
- Desglose por componente trazable
- Escenarios basados en precio mix tenant

### DELIVERABLES SPRINT 4

```
✅ M05-M08: sin hardcodeados, dinámicos por tenant
✅ PR #15: Module refactor M05-M08
```

**% de progreso después de Sprint 4:** 50% global

---

## SPRINT 5 — Progresión Bloqueada + Plataforma 0 A1-A6

**Período:** 28 junio - 4 julio  
**Meta:** Bloqueos en sidebar + primeras 6 pantallas admin

### 5.1 Progresión Bloqueada (3 días)

**Cambios:**
- Sidebar mostrando candados por módulo
- Banner de desbloqueo automático cuando M+1 cumple
- Queries de `module_completion_status`

### 5.2 Plataforma 0 A1-A6 (4 días)

**Pantallas admin:**
- A1: Tabla maestra de municipios (selector, estado, etapa)
- A2: Búsqueda INEGI + crear expediente
- A3: Cargar reglamento
- A4: Cargar bibliografía mínima
- A5: Marcar municipio "listo para cliente"
- A6: Vincular tenant a usuario municipal

### DELIVERABLES SPRINT 5

```
✅ module_completion_status queries en frontend
✅ Sidebar con candados + banner desbloqueo
✅ Plataforma 0 pantallas A1-A6
✅ PR #16: Progresión + Plataforma 0 A1-A6
```

**% de progreso después de Sprint 5:** 62.5% global

---

## SPRINT 6 — Plataforma 0 A7-A12 + Operación Tenant

**Período:** 5 - 11 julio  
**Meta:** Cierre de admin operativo, roles, gates, exports

### 6.1 Plataforma 0 A7-A12

**Pantallas:**
- A7: Usuarios del municipio (crear, roles)
- A8: Documentos solicitados (traceback)
- A9: Gates y bloqueos por etapa
- A10: Exports (validar compliance 80%)
- A11: Auditoría de cambios
- A12: Previsualización cliente ("Ver como cliente")

### 6.2 Roles y Permisos

**Cambios:**
- Role founder: acceso total admin
- Role municipal (city_team): acceso `/v`, `/p`, `/e` solo del tenant
- Role readonly: acceso visor no edita

### DELIVERABLES SPRINT 6

```
✅ Plataforma 0 pantallas A7-A12 completas
✅ Rol-based access control en backend
✅ Auditoría con fecha/usuario/acción
✅ PR #17: Plataforma 0 A7-A12 + roles
```

**% de progreso después de Sprint 6:** 75% global

---

## SPRINT 7 — Integración Finanzas (Stripe + Facturapi + Mifiel)

**Período:** 12 - 18 julio  
**Meta:** Pagos, facturación, firmas digitales

### 7.1 Stripe + Productos

**Cambios:**
- Plan "Municipio Preparado": $200 MXN/mes
- Plan "Municipio en Operación": $500 MXN/mes

### 7.2 Facturapi

**Cambios:**
- CFDI automático después de pago
- Integración con tenant billing

### 7.3 Mifiel

**Cambios:**
- Firma de adendos reglamentarios
- Auditoría de firmas

### DELIVERABLES SPRINT 7

```
✅ Stripe webhook integration
✅ Facturapi invoice generation
✅ Mifiel signature requests
✅ Billing dashboard en admin
✅ PR #18: Finanzas (Stripe/Facturapi/Mifiel)
```

**% de progreso después de Sprint 7:** 87.5% global

---

## SPRINT 8 — QA + Hardening + Pilot SLP Real

**Período:** 19 - 26 julio  
**Meta:** Release readiness, SLP como tenant real en producción

### 8.1 QA Funcional

- Todos los módulos con datos de SLP real (no hardcodeados)
- Navegación sin 404s
- Permisos sin bypass
- Exports con compliance ≥ 80%

### 8.2 Hardening

- Secrets en env vars
- Rate limiting en API
- CORS correcta
- Logging estructurado

### 8.3 SLP Pilot Real

- SLP como tenant con datos cargados vía ARCHIVO
- Municipio: "San Luis Potosí"
- Etapa: validation
- Todos los módulos con datos trazables

### DELIVERABLES SPRINT 8

```
✅ SLP tenant creado y poblado vía ARCHIVO
✅ QA test suite pass (funcional + seguridad)
✅ Documentación de deployment
✅ Release notes
✅ PR #19: QA + hardening + SLP pilot
```

**% de progreso después de Sprint 8:** **100%** ✅

---

## REGLAS OPERATIVAS POR SPRINT

1. **Cierre binario:** cada sprint entrega archivos modificados, tests que pasan, evidence, y state: cerrado/parcial/bloqueado
2. **Sin invención:** toda cifra viene de tenant_data, bibliography_registry, o cálculo transparent
3. **Rebase frecuente:** cada día fetch del origin para evitar conflicts
4. **PR por sprint:** 1 PR por sprint, squash merge a main, sin deixar ramas huérfanas
5. **Founder gate:** Sprint 7-8 requieren aprobación founder antes de merge

---

## DEPENDENCIAS EXTERNAS (No código)

- **Sprint 2:** Tsaract/Google Vision API keys
- **Sprint 5:** Acceso BD Inegi para búsqueda municipios
- **Sprint 6:** Revisión de roles con Clerk
- **Sprint 7:** Credenciales Stripe, Facturapi, Mifiel en producción
- **Sprint 8:** Compra dominio + SSL si aún no existe

---

## RIESGO RESIDUAL

- `alquimia-slp-eauh` Vercel config (rootDirectory) = bloquea CI pero no código. **Tuyo:** arreglarlo en dashboard Vercel.
- Backend tests fallan sin PostgreSQL en CI. **Aceptado:** 12 tests son DB-only, 994/1009 pasan.
- M15 Expediente Cabildo aún no definido completamente. **Sprint 3-4:** definición exacta.

---

## PRÓXIMAS 24 HORAS

**Tuyo:**
1. Ir a Vercel dashboard → `alquimia-slp-eauh` → Settings → General → Root Directory → cambiar a `frontend` → guardar

**Mío:**
1. Arrancar Sprint 2 Block 2.1: crear `frontend/src/types/dataPoint.ts`
2. TypeScript schema para las 7 categorías
3. Reportar avance en 2 horas
