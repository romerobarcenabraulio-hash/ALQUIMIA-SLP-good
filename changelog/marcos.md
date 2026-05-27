# Changelog · MARCOS · Estándares internacionales

## 2026-05-27 — Respaldo institucional por módulo

### Publicado

| Artefacto | Ruta |
|-----------|------|
| Mapa canónico (37 módulos activos) | `docs/architecture/standards_map.json` v1.0.0 |
| Espejo consumido por frontend | `frontend/src/data/standards_map.json` (sincronizado 1:1) |
| Componente UI | `frontend/src/components/ui/standards-footer.tsx` |
| Resolver / lookup | `frontend/src/lib/standardsMap.ts` |
| Rationale metodológico | `docs/methodology/standards_rationale.md` |
| Tests | `frontend/src/lib/standardsMap.test.ts` (6 tests green) |

### Integración

- `<StandardsFooter moduleId={…} />` integrado en `DecisionModuleShell.tsx` — cubre los **37 módulos activos** del journey funcionario (M00 + M00B–M21B, post-eliminación M01B) sin hardcodear estándares en cada stack.
- Opacidad reducida en **modo Carga inicial** (`isCircularityBaselineReadyForUi === false`); opacidad completa en **modo Operación**.
- Click en pill → panel lateral con nombre completo, relevancia y enlace a fuente oficial.
- Módulos sin entrada en mapa → «Estándar en revisión» (nunca vacío).

### Módulos pilar verificados (lookup + tests)

| M-code | module_id | Estándares clave |
|--------|-----------|------------------|
| M01 | `city_baseline` | GRI 306-1, GRI 306-2, SASB IF-WM-150a.1 |
| M04 | `costo_omision` | GRI 201-2, TCFD Recommendations (2017), CSRD ESRS E5 |
| M06 | `infraestructura` | ISO 14001:2015 §8.1, SASB IF-WM-000.A |
| M13 | `escenarios_financieros` | GRI 201-2, CSRD ESRS E1-E5 |
| M14 | `riesgos_modelo` | ISO 31000:2018, GRI 3:2021 §3-3 |
| M18 | `doble_materialidad` | GRI 3:2021 (Doble materialidad), CSRD ESRS 1:2023 |
| M21 | `risk_dashboard` | ISO 31000:2018, IRM Risk Register Guidance |
| M21B | `gate_status` | Stage-Gate® Cooper, PMI PMBOK® Phase-Gate |

### Capturas en producción / dev local

> **Nota:** El simulador en dev local requiere onboarding (estado + municipio + PDF) y backend activo para acceder a los módulos. La verificación visual en M01, M18 y M21 queda pendiente de captura en entorno con onboarding completado (preview Vercel o staging con datos SLP).
>
> Verificación automatizada: tests de cobertura del mapa + sync docs↔frontend + integración en shell.

### Correcciones de citación genérica

| Archivo | Antes | Después |
|---------|-------|---------|
| `ExpedienteCabildoStack.tsx` | GRI 306, SASB EM-WM | GRI 306:2020 (306-1/306-2), SASB IF-WM-150a |
| `ProyectoVivoPortal.tsx` | GRI 306, SASB EM-WM | GRI 306:2020, SASB IF-WM-150a |
| `clientModuleRegistry.ts` (M18) | GRI 306 / ESRS E5 | GRI 306-1 / CSRD ESRS E5 |

### Módulos que requirieron decisión del founder

| Módulo | Situación |
|--------|-----------|
| **M00** | Guía de navegación — sin estándar internacional aplicable |
| **M05C** | ISO 55000:2014 solo como referencia de despliegue por fases (no certificación) |
| **M11** | Pendiente construcción — sin estándar hasta definir alcance del esquema de concesión |
| **M12** | Pendiente construcción — GRI 201-1 como referencia preliminar |

### Sincronización docs → frontend

Tras editar la fuente canónica:

```bash
cp docs/architecture/standards_map.json frontend/src/data/standards_map.json
```

El test `frontend/data está sincronizado con docs/architecture` falla si los archivos divergen.
