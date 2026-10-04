# PLAN SPRINT 1 · EJECUTABLE Y VERIFICABLE
**Período:** 14 junio - 28 junio 2026 (14 días)  
**Objetivo:** De status baseline → MVP defendible ante perito/banca  
**Responsable ejecución:** Codex / Claude Code  
**Responsable validación:** Claude Master  
**Modelo:** Entregas diarias validadas, no "todo al final"  

---

## VISIÓN DE SPRINT 1

Salimos con:
- ✅ Status real verificado (qué existe, qué falta)
- ✅ Aislamiento de tenants auditado (bloqueador de seguridad cerrado)
- ✅ FOD IPCC implementado (bloqueador de credibilidad técnica cerrado)
- ✅ Modo B MVP (Nueva León listo para validar)
- ✅ PDF formal en pipeline (reemplazar HTML casero)

---

## SEMANA 1 · VERIFIACIÓN + ARQUITECTURA (14-20 junio)

### LUNES 14 JUNIO · DÍA 1

**Entregables:**
- [ ] **HO-001:** Codex inicia STATUS_BASELINE_VERIFICACION
  - Git log, deployment visual, stack tech, features inventory, schema, auth, gaps summary
  - 7 archivos de salida documentados

**Validaciones Claude Master:**
- [ ] Revisar 7 archivos de salida
- [ ] Confirmar gaps reales vs especulación
- [ ] Identificar "sorpresas" (features que existen pero no documentadas, o viceversa)

**Bloques esperados:** Ninguno si Codex tiene acceso al repo

**Bitácora:**
- HO-001 [EMITIDA] → espera output de Codex

---

### MARTES 15 JUNIO · DÍA 2

**Entregables:**
- [ ] **HO-001 CIERRE:** Codex entrega 7 archivos verificados
- [ ] **Claude Master:** Analiza gaps, genera PLAN_SPRINT_1_ANÁLISIS_GAPS (documento interno)
- [ ] **Claude Master:** Genera ADR-0011 (DataPoint 7 categorías)

**Validaciones:**
- [ ] Los 7 archivos de status son honestos (no especulativos)
- [ ] Gaps están claramente categorizados (documentado/no build, implementado/no doc, etc.)

**Bloques esperados:** Análisis gap completo disponible

**Bitácora:**
- HO-001 [MERGED] ✅
- HO-002 [EMITIDA] — Claude Master emite plan de qué construir basado en gaps reales

---

### MIÉRCOLES 16 JUNIO · DÍA 3

**Entregables:**
- [ ] **HO-002:** Codex inicia refactor de DataPoint schema
  - Cambiar `interface DataPoint` en TypeScript a 7 categorías
  - Identificar todas las queries/componentes que usan DataPoint
  - PR contra rama `feature/datapoint-7cat-refactor`

**Validaciones Claude Master:**
- [ ] Código compila sin errores
- [ ] Linter pasa 100%
- [ ] No hay type errors

**Bloques esperados:** Posible que DataPoint sea usado en muchos lugares → refactor puede ser mayor de lo esperado

**Bitácora:**
- HO-002 [EN_EJECUCION]

---

### JUEVES 17 JUNIO · DÍA 4

**Entregables:**
- [ ] **HO-002 CIERRE:** PR merged a `main` con DataPoint refactored
- [ ] **HO-003:** Codex inicia aislamiento de tenants
  - Auditoría de queries: identifica TODAS las queries que podrían mostrar datos cross-tenant
  - Agrega filtros `WHERE tenant_id = current_tenant` a cada una
  - Escribe test: "Loggin as TenantA, query DataPoint de TenantB → retorna []"
  - PR contra rama `feature/tenant-isolation-audit`

**Validaciones Claude Master:**
- [ ] Cada query tiene comentario explicando su filtro
- [ ] Test pasa: cross-tenant query retorna vacío
- [ ] Sin performance regression (explain plan antes/después)

**Bloques esperados:** Posible que haya 20+ queries → días 4-5 pueden ser "largos" en ejecución

**Bitácora:**
- HO-002 [MERGED] ✅
- HO-003 [EN_EJECUCION]

---

### VIERNES 18 JUNIO · DÍA 5

**Entregables:**
- [ ] **HO-003 CIERRE:** PR merged con auditoría de aislamiento + tests pasan
- [ ] **HO-004:** Claude Master emite especificación FOD IPCC
  - Documento técnico: fórmulas IPCC 2019, parámetros por región, cómo obtenerlos
  - Pseudocódigo Python/TypeScript para calcular emisiones a 20 años
  - Test case: municipio SLP con composición conocida → output de curva CO2e

**Validaciones:**
- [ ] Especificación cita a IPCC 2019 Vol 5 Cap 3 correctamente
- [ ] Pseudocódigo es ejecutable (no deja dudas)
- [ ] Test case tiene números reales o benchmarks

**Bloques esperados:** Necesita acceso a parámetros IPCC (probablemente tabla con k, DOC, etc.)

**Bitácora:**
- HO-003 [MERGED] ✅
- HO-004 [EMITIDA]

---

### SÁBADO-DOMINGO 19-20 JUNIO · DESCANSO OBLIGATORIO

**Acción:** Codex y Braulio descansan. Claude Master consolida aprendizajes de semana 1, prepara briefing para semana 2.

---

## SEMANA 2 · CONSTRUCCIÓN + VALIDACIÓN (21-27 junio)

### LUNES 21 JUNIO · DÍA 6

**Entregables:**
- [ ] **HO-004 CIERRE:** Codex implementa FOD IPCC
  - Código en `/lib/emissions_fod.py` (o `.ts`)
  - Función: `calculate_emissions_curve(composition, region, years=20)` → array de emisiones anuales
  - Unit tests: 3 casos (composición común, extrema, mínima)
  - PR contra rama `feature/fod-ipcc`

**Validaciones Claude Master:**
- [ ] Tests pasan 100%
- [ ] Output de emisiones es razonable (benchmarks contra municipios reales)
- [ ] Código tiene comentarios citando IPCC

**Bloques esperados:** Posible que falten parámetros IPCC específicos por región → puede bloquear

**Bitácora:**
- HO-004 [EN_EJECUCION]

---

### MARTES 22 JUNIO · DÍA 7

**Entregables:**
- [ ] **HO-004 CIERRE:** FOD implementado y merged
- [ ] **HO-005:** Codex inicia Modo B MVP (Nueva León)
  - Especificación clara: qué documentos genera (Anexo Uno, Anexo Dos, Plan)
  - Qué datos necesita (fecha, generador ID, composición)
  - Qué campos rellenan automáticamente
  - Mock de outputs esperados
  - PR rama `feature/modo-b-nl-mv`

**Validaciones Claude Master:**
- [ ] Documentos de salida son válidos según NAE-SMA-012-2026 (si tienes norma a mano)
- [ ] No hay campos requeridos vacíos
- [ ] Formato es compatible con Excel/PDF

**Bloques esperados:** Necesita acceso al documento NAE-SMA-012-2026 publicado

**Bitácora:**
- HO-004 [MERGED] ✅
- HO-005 [EN_EJECUCION]

---

### MIÉRCOLES 23 JUNIO · DÍA 8

**Entregables:**
- [ ] **HO-005 CONTINUACIÓN:** Codex genera primeras versiones de plantillas
  - Anexo Uno (logbook): template con campos dinámicos
  - Anexo Dos (delivery manifests): template con campos dinámicos
  - Plan de Manejo: borrador con secciones identificadas
  - Todo en DOCX + PDF output

**Validaciones Claude Master:**
- [ ] Templates usan placeholders `{{variable}}` no hardcoding
- [ ] PDF output se ve profesional
- [ ] Campos dinámicos se rellenan correctamente

**Bloques esperados:** Ninguno si templates están claros

**Bitácora:**
- HO-005 [EN_EJECUCION]

---

### JUEVES 24 JUNIO · DÍA 9

**Entregables:**
- [ ] **HO-005 CIERRE:** PR merged con Modo B MVP
- [ ] **HO-006:** Claude Master emite especificación Monte Carlo financieros
  - Documento: 3-4 variables a variar (precio materiales, tasa captura, CAPEX, costo oportunidad)
  - Distribuciones: normal, triangular, etc.
  - 10,000 iteraciones → output P10/P50/P90
  - Pseudocódigo + test case

**Validaciones:**
- [ ] Especificación es clara y auditable
- [ ] Test case tiene números reales
- [ ] Output esperado muestra rangos (no punto único)

**Bloques esperados:** Necesita definición clara de variables y rangos

**Bitácora:**
- HO-005 [MERGED] ✅
- HO-006 [EMITIDA]

---

### VIERNES 25 JUNIO · DÍA 10

**Entregables:**
- [ ] **HO-006 CIERRE:** Codex implementa Monte Carlo
  - Función: `monte_carlo_financials(base_tir, base_vpn, variables_ranges)` → P10/P50/P90
  - Unit tests: casos extremos
  - PR rama `feature/monte-carlo-sensibilidad`

**Validaciones Claude Master:**
- [ ] Tests pasan
- [ ] P10/P50/P90 son razonables
- [ ] Outputs descargables (CSV de las 10k iteraciones)

**Bloques esperados:** Ninguno si especificación fue clara

**Bitácora:**
- HO-006 [EN_EJECUCION]

---

### SÁBADO-DOMINGO 26-27 JUNIO · PREPARACIÓN CIERRE

**HO-006 CIERRE:** Merged
**Preparación:** Claude Master consolida estado de Sprint 1, prepara documento de cierre

---

## VIERNES 28 JUNIO · DÍA 14 · CIERRE DE SPRINT 1

**Entregables:**
- [ ] **SPRINT_1_CLOSURE.md** — Resumen de qué se completó, aprendizajes, qué bloqueadores permanecen
- [ ] **HANDOFF_SPRINT_2.md** — Plan para Sprint 2 basado en aprendizajes
- [ ] **Validación visual:** Todas las features nuevas testeadas en incognito browser

**Bitácora Final:**
- Todos los HO-00X están [MERGED] o [BLOCKED] con justificación clara

---

## CRITERIOS DE ACEPTACIÓN GLOBALES SPRINT 1

### Código
- ✅ Todos los merges a `main` tienen PR con descripción clara
- ✅ Zero warnings en linter/type-check
- ✅ Tests pasan 100% (no test skip)
- ✅ Sin performance regression mensurables

### Documentación
- ✅ Cada feature implementada tiene ADR o especificación
- ✅ Bitácora actualizada en cada hito
- ✅ Gaps no resueltos están documentados con "por qué" claro

### Validación
- ✅ Claude Master valida cada entregable
- ✅ Verificación visual en https://alquimiaplatform.com
- ✅ Status de "listo" para siguiente sprint claro

---

## POSIBLES BLOQUEADORES IDENTIFICADOS HOY

Estos pueden ralentizar Sprint 1:

| Bloqueador | Impacto | Mitigación |
|---|---|---|
| Acceso a parámetros IPCC específicos por región | Bloquea HO-004 día 6 | Codex busca tabla en literatura + benchmarks públicos |
| NAE-SMA-012-2026 no disponible completo | Bloquea HO-005 | Braulio proporciona PDF + secciones clave |
| Performance regression en DataPoint refactor | Bloquea HO-002 día 3 | Pre-validación con explain plan antes de mergear |
| Dependencias circular en Schema DataPoint | Bloquea HO-002 | Refactor incremental: una entity a la vez |

---

## HANDOFF A CODEX (VER SIGUIENTE DOCUMENTO)

El documento **HANDOFF_CODEX_SPRINT_1.md** contiene exactamente lo que Codex necesita leer para empezar día 1.

---

*PLAN SPRINT 1 · Alquimia SLP · 14 junio 2026*
