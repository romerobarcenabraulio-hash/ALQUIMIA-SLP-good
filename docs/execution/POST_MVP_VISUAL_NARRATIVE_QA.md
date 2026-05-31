# Post-MVP Sprint 1 · QA de narrativa visual

Fecha: 2026-05-31

## Resultado

| Ruta / módulo | Verificación | Evidencia | Estado |
| --- | --- | --- | --- |
| `/v?tenant=partial-city&module=city_baseline` | Panel con brecha crítica y sin nombres internos cliente-facing | `/private/tmp/alquimia-sprint1-2Fv3Ftenant3Dpartial-city26module3Dcity_baseline.png` | PASS |
| `/v?tenant=gap-city&module=riesgos_modelo` | Brechas visibles; no hay errores de consola | `/private/tmp/alquimia-sprint1-2Fv3Ftenant3Dgap-city26module3Driesgos_modelo.png` | PASS |
| `/e?tenant=partial-city&module=risk_dashboard` | M21 muestra diagrama de gates y dependencias | `/private/tmp/alquimia-sprint1-2Fe3Ftenant3Dpartial-city26module3Drisk_dashboard.png` | PASS |

## Diagramas implementados

| Módulo | Componente | Estado |
| --- | --- | --- |
| M01 · Diagnóstico de residuos sólidos | Flujo RSU preliminar | PASS |
| M04 · Costo de no actuar | Actuar vs no actuar | PASS |
| M13 · Escenarios financieros | Escenarios condicionados | PASS |
| M14 · Riesgos | Matriz de riesgo | PASS |
| M21 · Tablero de riesgos y gates | Gates y dependencias | PASS |

## Correcciones aplicadas

- Se agregó `frontend/src/components/ModuleDiagram.tsx`.
- Se integraron diagramas al panel pilar.
- Se agregó soporte explícito para `risk_dashboard` como M21.

## Riesgos residuales

- Los diagramas son estáticos parametrizables; no son Sankey/D3 dinámico todavía.
- La exportación ZIP incluye texto metodológico y citas; no renderiza figuras como imagen embebida en PDF final porque el MVP exporta Markdown dentro del ZIP.
