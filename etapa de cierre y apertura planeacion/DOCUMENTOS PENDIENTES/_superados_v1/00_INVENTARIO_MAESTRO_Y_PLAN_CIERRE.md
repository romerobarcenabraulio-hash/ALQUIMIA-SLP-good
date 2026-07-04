# INVENTARIO MAESTRO · DOCUMENTOS PENDIENTES Y PLAN DE CIERRE
**Responsable CTO:** Claude (Master)  
**Fecha:** 14 junio 2026  
**Propósito:** Listar cada documento que falta construir, aclarar exactamente qué necesita para estar "listo", y cuándo transferir a completados  

---

## CÓMO LEER ESTE DOCUMENTO

Este es **mi plan de trabajo**, no es para Codex. Aquí digo:
1. ¿Qué documentos técnicos/operativos faltan?
2. Para cada uno: ¿qué hace que esté "listo"? (criterios de aceptación)
3. Cuándo lo marcamos como "completado" y pasamos a archivo

Conforme cerramos cada documento, lo muevo a `/documentos-completados/` para mantener limpieza.

---

## BLOQUE 1 · DOCUMENTOS DE VERIFICACIÓN (Semana 1)

| # | Documento | Qué falta | Criterio de "Listo" | Asignado a | ETA | Estado |
|---|---|---|---|---|---|---|
| 1 | **STATUS_BASELINE** | Verificar qué existe realmente | Todos los 7 archivos de salida completados + gaps claros listados | Codex | 2 junio | ⏳ PENDIENTE |
| 2 | **PLAN_SPRINT_1** | Roadmap ejecutable basado en status real | Sprints claros con hitos diarios, blockers identificados, criterios de aceptación | Claude Master | 14 junio | ⏳ PENDIENTE |
| 3 | **HANDOFF_CODEX_SPRINT_1** | Briefing ejecutivo para Codex con instrucciones de primer sprint | Archivo claro, sin ambigüedades, con exactamente qué archivos tocar | Claude Master | 14 junio | ⏳ PENDIENTE |

---

## BLOQUE 2 · DOCUMENTOS ARQUITECTÓNICOS QUE FALTAN (Semana 1-2)

| # | Documento | Descripción | Por qué falta | Criterio de "Listo" | ETA |
|---|---|---|---|---|---|
| 4 | **ADR-0011_DATAPOINT_SCHEMA_7CATEGORIAS** | Decisión arquitectónica sobre las 7 categorías de datos + pendiente | Documentado en Brief V2 pero sin ADR formal | ADR en formato estándar, con "Context/Decision/Consequences", referencias a ISO/GRI, versionado | 16 junio |
| 5 | **ADR-0012_MOTOR_DIGESTION_EVIDENCIA** | 8-step pipeline de Evidence Registry | Conceptualizado en LEARNING_AND_FEEDBACK_LAYER.md pero sin especificación ejecutable | Pseudocódigo claro, diagrama de flujo, estados del claim, endpoints API necesarios | 18 junio |
| 6 | **ADR-0013_MODO_A_VS_MODO_B** | Dual-mode del sistema (diagnóstico vs adaptación a iniciativa) | Mencionado en Brief V3 pero sin decisión arquitectónica formalizada | Decisión clara, matriz de diferencias, casos de uso ejemplificados | 18 junio |

---

## BLOQUE 3 · DOCUMENTOS OPERACIONALES PARA SPRINT 1-2 (Semana 1-3)

| # | Documento | Qué construir | Criterio de "Listo" | Asignado | ETA |
|---|---|---|---|---|---|
| 7 | **02_REFACTOR_DATAPOINT_SCHEMA** | Especificación exacta: cambiar TypeScript DataPoint a 7 categorías | Decisión clara sobre qué cambios en `interface DataPoint`, qué endpoints se ven afectados, test plan | Claude Master + Codex | 18 junio |
| 8 | **03_AISLAMIENTO_TENANTS_AUDIT** | Plan para garantizar aislamiento de datos a nivel query + auditoría | Qué queries cambiar, test de "muéstrale a otro tenant", auditoría qué registra | Claude Master + Codex | 19 junio |
| 9 | **04_FOD_IPCC_IMPLEMENTACION** | Especificación técnica del First Order Decay para emisiones | Fórmulas IPCC exactas, parámetros (k, DOC, DOCf, MCF) por región, cómo obtenerlos, pseudocódigo | Claude Master | 19 junio |
| 10 | **05_MONTE_CARLO_FINANCIEROS** | Especificación de sensibilidad en TIR/VPN | 3-4 variables a variar, rango de variación, distribuciones (normal, triangular, etc.), output P10/P50/P90 | Claude Master | 19 junio |
| 11 | **06_VRP_OR_TOOLS_INTEGRACION** | Plan de integración de OR-Tools para optimización de rutas | Cómo instalar, pseudocódigo de llamada, qué datos alimentar, qué output esperar | Claude Master | 20 junio |

---

## BLOQUE 4 · DOCUMENTOS DE PLANTILLAS INSTITUCIONALES (Semana 2-3)

| # | Documento | Qué falta | Criterio de "Listo" | Asignado | ETA |
|---|---|---|---|---|---|
| 12 | **PLANTILLAS_DOCX_ACTUALIZADAS** | Los 7 templates (portada, expediente Cabildo, Plan Maestro, reporte ESG, etc.) sincronizados con versión actual del sistema | Templates con placeholders dinámicos, no con datos de SLP hardcoded, prueba de generación con datos reales | Codex + Claude Master | 21 junio |
| 13 | **GENERACION_PDF_SPEC** | Especificación: migrar de HTML casero a WeasyPrint + docxtpl | Decisión sobre cuál template genera cuál PDF, pipeline claro HTML→PDF vs DOCX→PDF | Claude Master | 20 junio |

---

## BLOQUE 5 · DOCUMENTOS DE NUEVO LEÓN / MODO B (Semana 2-4)

| # | Documento | Descripción | Por qué importa | Criterio de "Listo" | ETA |
|---|---|---|---|---|---|
| 14 | **MODO_B_NAE_SMA_012_2026_MVP** | MVP para Nuevo León: automatización de Anexo Uno + Anexo Dos + Plan de Manejo | Ventana comercial post-consulta (20 días hábiles terminan ~6 julio). Fecha límite: 27 junio tener MVP validable | Especificación clara de qué documentos genera, qué datos necesita, qué campos rellenar | 24 junio |
| 15 | **MUNICIPALOBJECTION_SCHEMA_NUEVO_LEON** | Schema Pydantic/TypeScript para obligaciones municipales según NAE-SMA-012-2026 | Sin esto, no puedes mapear la norma al sistema | Schema completo con todos los campos de la norma, mapeo a módulos del sistema, validación de cumplimiento | 22 junio |

---

## BLOQUE 6 · DOCUMENTOS DE SEGURIDAD Y COMPLIANCE (Semana 3-4)

| # | Documento | Qué falta | Criterio de "Listo" | ETA |
|---|---|---|---|
| 16 | **RATE_LIMITING_ENDPOINTS_PUBLICOS** | Rate limiting en `/propuesta/public/{nombre}` y otros endpoints expuestos | Código implementado, test de DOS mitigado, límites claros (X req/min por IP) | 24 junio |
| 17 | **LGPDPPSO_AVISO_PRIVACIDAD_TERMINOS** | Aviso legal de privacidad + términos de servicio + política de cookies | Documentos publicados en `/privacy`, `/terms`, `/cookies`, en español, aceptación trackable | 25 junio |

---

## BLOQUE 7 · DOCUMENTOS DE INFRAESTRUCTURA (Semana 2-4)

| # | Documento | Qué falta | Criterio de "Listo" | ETA |
|---|---|---|---|
| 18 | **CELERY_REDIS_COLA_ASINCRONA_SPEC** | Especificación de queue asíncrona para OCR y procesamiento de documentos | Cuándo usarla, qué tareas van a queue, cómo monitorear, retry policy | 20 junio |
| 19 | **PGVECTOR_BUSQUEDA_SEMANTICA_SPEC** | Especificación de vector search con pgvector en Neon | Qué queries usar, cuándo indexar, cómo evaluar relevancia, ejemplo real | 21 junio |

---

## BLOQUE 8 · DOCUMENTOS DE CIERRE Y HANDOFF (Semana 4)

| # | Documento | Qué falta | Criterio de "Listo" | ETA |
|---|---|---|---|
| 20 | **SPRINT_1_CLOSURE** | Resumen de qué se construyó, qué se validó, qué learnings para Sprint 2 | Documento de cierre honesto, no glorificado, con lecciones reales | 28 junio |
| 21 | **HANDOFF_SPRINT_2_Y_MAS_ALLA** | Briefing para próxima fase: qué se activó, qué bloques quedan, roadmap actualizado | Claro, honesto, con prioridades nuevas basadas en aprendizajes de Sprint 1 | 28 junio |

---

## PLAN DE TRANSFERENCIA A "COMPLETADOS"

### Cuándo un documento se mueve a `/documentos-completados/`:

1. ✅ **Ha sido usado por Codex** y está merged a `main`
2. ✅ **Se ha validado** (verificación visual, tests pasan, sin warnings)
3. ✅ **Está documentado en la bitácora** (referencia a HO-XXX donde se usó)
4. ✅ **Ya no hay cambios esperados** en este documento para esta fase

### Ejemplo:
- `STATUS_BASELINE_VERIFICACION.md` → Una vez Codex entrega reportes + los valido + están en bitácora HO-001 → Lo muevo a completados
- `PLAN_SPRINT_1.md` → Una vez Sprint 1 termina + resumen está en bitácora → Lo muevo a completados

### Acción operativa:
```bash
mv documentos-pendientes/01_STATUS_BASELINE_VERIFICACION.md documentos-completados/01_STATUS_BASELINE_VERIFICACION.md
```

---

## RESUMEN EJECUTIVO DE MI TRABAJO HOY (14 junio)

**Documentos que estoy creando HOY en este chat:**

1. ✅ **BITACORA_MAESTRA.md** — Registro de handoffs
2. ✅ **01_STATUS_BASELINE_VERIFICACION.md** — Instrucciones a Codex para verificar estado
3. ✅ **ESTE DOCUMENTO** — Inventario maestro
4. 🔄 **PLAN_SPRINT_1_DETALLADO.md** — (Generando ahora)
5. 🔄 **HANDOFF_CODEX_SPRINT_1.md** — (Generando ahora)

**Lo que espero del founder:**
- Cierre su sesión con Codex actual
- Traiga el status report de Codex
- Valide que el plan de hoy tiene sentido
- Empiece a ejecutar o indique qué bloque priorizar

---

*INVENTARIO MAESTRO · Documentos Pendientes y Plan de Cierre · Alquimia SLP · 14 junio 2026*
