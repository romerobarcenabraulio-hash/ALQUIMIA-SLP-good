# 24 · Release gate: E2E, observabilidad y presupuestos de rendimiento

**Propósito:** cerrar la brecha entre “tests unitarios + export estático” y **confianza operativa** antes de producción. Complementa `21_pulido_final_release.md` (en `archivos_ejecutados/`) y **`17_1_publicacion_y_control_de_acceso.md`** sin duplicar Auth/DNS.

---

## 1. Sub-bloques

### 24.A · E2E con backend vivo

| Ítem | Definición de HECHO |
|------|---------------------|
| Flujo crítico ciudadano | `/simulator`: gateway audiencia → flujo mínimo hasta resultado visible sin error de red |
| Flujo crítico export/hub | Según producto: hub o export sin 500 en API relevante |
| Evidencia | Script reproducible (Playwright/Cypress) o documentación de corrida manual fechada en bitácora |

**Nota:** la bitácora histórica registró que ciertas auditorías no incluyeron E2E navegador con backend vivo; esta subfase lo convierte en **obligatorio antes de release público**.

### 24.B · Observabilidad mínima

| Ítem | Definición de HECHO |
|------|---------------------|
| Errores frontend | Estrategia acordada (p. ej. captura en servicio o logs estructurados en hosting) |
| Errores backend | Request ID / correlación en logs FastAPI |
| Salud API | Endpoint `/health` o equivalente ya existente documentado para uptime |

### 24.C · Presupuestos de rendimiento (producto)

| Área | Objetivo orientativo |
|------|----------------------|
| Simulador primera pintura | Documentar LCP o tiempo hasta interactividad en hardware referencia |
| Export estático | Tamaño máximo aviso si `audit_visual_maqueta` crece por encima de umbral acordado |
| Mapas | Delegar detalle a Fase **23** (tiles); aquí solo verificar que no bloqueen el gate E2E |

---

## 2. Roles

- **Ejecutor:** pipelines E2E, wiring de logs, umbrales en CI opcional.
- **Auditor:** aceptación de “evidencia suficiente” y exclusión explícita de mocks prohibidos en rutas críticas.
- **Navigator:** solo si E2E cruza **mapas** (entonces coordinar con 23).

---

## 3. Criterios de aceptación globales

- Al menos **un** escenario E2E automatizado o **protocolo manual firmado** en bitácora con capturas y versión de commit.
- Lista de endpoints críticos monitoreados o alertables acordada con CSA.
- Sin regresión en `pytest` y `tsc` del pipeline principal.
