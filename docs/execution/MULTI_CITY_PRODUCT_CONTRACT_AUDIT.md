# Multi-City Product Contract Audit

Fecha: 2026-05-29

Decision: **FAIL para cierre final multi-ciudad completo**.

ALQUIMIA tiene contrato documental comun y pruebas unitarias/focalizadas de no contaminacion entre municipios, pero no hay evidencia end-to-end suficiente de que tres ciudades soportadas puedan completar el mismo paquete con datos reales y exports bajo el mismo indice.

## Evidencia Ejecutada

| Evidencia | Resultado |
| --- | --- |
| `PYTHONPATH=backend backend/.venv/bin/python -c "from app.export.document_blueprints import list_package_blueprints; ..."` | PASS: devuelve 12 documentos canonicos para SLP, Monterrey y municipio rural simulado. |
| `PYTHONPATH=backend backend/.venv/bin/pytest backend/tests/test_agora_director.py backend/tests/test_executive_pdf_export.py backend/tests/test_phase12_document_automation.py backend/tests/test_phase14_data_moat.py backend/tests/test_phase19_field_studies_kpis.py -q` | PASS: 55 passed. |
| `backend/.venv/bin/pytest backend/tests -q` | FAIL ambiental/producto: 12 failures por PostgreSQL local `Connection refused`. |

## Verificacion de 15 Controles

| Control | Estado | Evidencia | Brecha |
| --- | --- | --- | --- |
| 1. Todas las ciudades soportadas generan mismo numero de documentos | PARTIAL | `list_package_blueprints()` = 12 | No prueba tres tenants reales con paquete persistido. |
| 2. Todas usan mismo indice documental | PASS | `backend/app/export/document_blueprints.py:list_package_blueprints` | Ninguna en blueprint. |
| 3. Todas usan misma estructura de paquete | PARTIAL | `package_renderer.py` usa documentos persistidos y blueprints | Falta fixture multi-ciudad de render completo. |
| 4. Cada documento conserva mismo lugar en indice | PASS | Orden canonico 01-12. | No. |
| 5. Contenido cambia por investigacion/cotejo/diagnostico | PARTIAL | `municipal_context.py` compone contexto por municipio y evita reutilizar SLP | Falta prueba con fuentes reales para ciudad parcial y rural. |
| 6. Ninguna ciudad depende de copy hardcodeado tipo SLP | PARTIAL | Tests `test_agora_director.py` cubren QRO vs SLP; `municipal_context.py` prohibe reutilizacion narrativa | `simulatorStore` conserva default SLP; no prueba flujo completo no SLP. |
| 7. SLP puede ser fixture, no plantilla privilegiada | PARTIAL | QRO/Monterrey aparecen en pruebas y datos legales | SLP sigue siendo default operacional en store. |
| 8. Ciudad sin dato local muestra brecha critica | PASS | Field study tests y docs; `field_studies.py` | No. |
| 9. Benchmark no se presenta como estudio local | PASS | Tests phase19 y metodologia | No. |
| 10. Inferencia incluye fuente, fecha, metodo y confianza | PARTIAL | Automation/inference schemas | Falta smoke E2E con fuente publica real para tres ciudades. |
| 11. Municipio, ZM, estado y nacional separados | PARTIAL | Tests director y store routing | Falta E2E UI por municipio. |
| 12. Modulos activos/bloqueados por madurez/evidencia | PARTIAL | capability registry + field studies | Falta prueba visual/modular completa. |
| 13. Reportes/export mantienen mismo indice aunque haya brechas | PARTIAL | Blueprint comun 01-12 | Falta export real con ciudad con brechas. |
| 14. Brechas se muestran, no se eliminan silenciosamente | PARTIAL | Field study method + tests | Falta captura visual/export. |
| 15. No aparecen nombres internos en entregables cliente-facing | PARTIAL | Se corrigieron reportes/templates detectados | Requiere regenerar paquetes y revisar bytes/export real. |

## Perfiles Probados

| Perfil | Evidencia | Estado |
| --- | --- | --- |
| Ciudad con datos relativamente completos | SLP/QRO en tests director y legal; blueprint comun | PARTIAL |
| Ciudad con datos parciales | Monterrey/QRO en datos legales y municipal context | PARTIAL |
| Ciudad con brechas criticas | Field studies y municipio rural simulado en conteo blueprint | PARTIAL |
| SLP como ciudad mas | Tests comparan SLP vs QRO y evitan mezcla juridica | PARTIAL |

## Bloqueo

No existe evidencia de paquete documental completo, persistido y exportado para tres ciudades reales con el mismo indice y mismo numero de documentos.
