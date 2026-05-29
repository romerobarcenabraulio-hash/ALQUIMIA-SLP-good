# Embedded Agents Client-Facing Audit

Fecha: 2026-05-29

Decision: **PARTIAL despues de correcciones**.

## Regla

Los nombres internos de agentes no deben aparecer como marcas, autoridades o entidades visibles en entregables cliente-facing. Si el texto sale a municipio, cabildo, concesionario, empresa, piloto, SOW, demo, reporte o export, debe usar lenguaje de plataforma.

## Correcciones Aplicadas

| Termino / patron | Ubicacion | Clasificacion | Accion aplicada | Reemplazo |
| --- | --- | --- | --- | --- |
| `ÁGORA GOV` | `backend/app/export/*`, schemas, package renderer | CLIENTE-FACING PROHIBIDA | Reemplazado | `paquete documental`, `la plataforma` |
| `Documento ÁGORA` | `backend/app/export/document_renderer.py` | CLIENTE-FACING PROHIBIDA | Reemplazado | `Documento ALQUIMIA` |
| `Semáforo de gate ÁGORA` | `backend/app/agents/document_specs.py` | CLIENTE-FACING PROHIBIDA | Reemplazado | `Semáforo de revisión documental` |
| `Contenido generado por ÁGORA` | `backend/app/export/consulting_pdf_builder.py` | CLIENTE-FACING PROHIBIDA | Reemplazado | `Contenido generado por la plataforma` |
| `HERMES` en reportes ambientales/financieros | `data/environmental/*`, `data/financial/reports/*` | CLIENTE-FACING PROHIBIDA si se comparten | Reemplazado | `feed operativo`, `báscula operativa`, `logística operativa` |
| `KRONOS + equipo PMO municipal` | `data/financial/reports/templates/plantilla_pmo.json` | CLIENTE-FACING PROHIBIDA | Reemplazado | `Equipo PMO municipal` |
| `agente BIOS` / `BIOS` | `data/environmental/lca_factors.json` | CLIENTE-FACING PROHIBIDA si se comparte | Reemplazado | `sistema interno`, `fuente_operativa` |
| `adendos agentes` | `backend/data/municipal_legal_disclaimers_2026-05-07.json` | CLIENTE-FACING PROHIBIDA | Reemplazado | `adendos técnicos` |

## Apariciones Internas Permitidas

Quedan nombres internos en:

- `docs/architecture/*`: documentacion tecnica/roadmap interno.
- `backend/app/agora`, `backend/app/agents`, rutas admin y nombres de constantes internas.
- `frontend/src/app/admin/page.tsx`: backoffice interno A11.
- tests y comentarios tecnicos.

## Riesgo Residual

Se corrigieron strings detectados en superficies externas obvias, pero no se regeneraron paquetes PDF/DOCX/ZIP ni se inspeccionaron bytes finales de exports para tres ciudades. Por tanto, el resultado es **PARTIAL**, no PASS.
