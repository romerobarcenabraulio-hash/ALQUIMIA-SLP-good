# CLIENT-FACING AGENT VISIBILITY AUDIT

**Decision:** PASS con correcciones aplicadas.

**Regla aplicada:** nombres internos de sistemas/agentes no deben aparecer como marcas, autoridades o entidades visibles para cliente, cabildo, demos, emails, SOW, piloto, reportes externos o UI publica. Se permiten en arquitectura interna, handoffs, backend, logs internos, admin interno y governance tecnica.

| Termino encontrado | Archivo/ubicacion | Clasificacion | Accion aplicada | Reemplazo usado | Riesgo residual |
|---|---|---|---|---|---|
| NOUS | `docs/founder/*`, `docs/methodology/*` | Cliente-facing prohibida | Reemplazado en documentos comerciales/metodologicos. | capa de aprendizaje supervisado / recomendacion asistida / sistema interno. | Nombres pueden permanecer en handoffs internos. |
| HERMES | `docs/founder/*`, `docs/methodology/*` | Cliente-facing prohibida | Reemplazado. | pipeline de inferencia publica / fuente publica trazable. | Backend interno conserva nombres. |
| AGORA / ÁGORA | `docs/founder/*`, `docs/methodology/*`, UI simulador/hub | Cliente-facing prohibida | Reemplazado en textos visibles. | plataforma / flujo asistido / paquete documental. | Identificadores internos de constantes pueden conservarse si no renderizan texto. |
| KRONOS/KOSMOS/MARCOS/POLIS/EIDOS/BIOS/AURUM/FORGE/AUDITOR/SUPREME | `docs/founder/*`, `docs/methodology/*` | Cliente-facing prohibida | Reemplazado por funciones institucionales. | control operativo, validacion de arquitectura, revision de estandares, guardrail editorial, integridad operativa, etc. | Handoffs internos los conservan. |
| agentes/agente | docs comerciales y UI visible | Cliente-facing prohibida | Reemplazado donde era visible. | sistemas internos / flujo asistido / plataforma. | Algunas referencias tecnicas internas permanecen en comentarios o tipos. |
| NOUS | `frontend/src/app/admin/page.tsx` | Interna permitida | Sin cambio. | No aplica. | Admin interno; no cliente municipal. |
| AGORA_EXPORT_COVER_DISCLAIMER | imports/constantes frontend | Interna permitida | Sin cambio de identificador; contenido visible ya no usa marca interna. | No aplica. | Solo riesgo si el nombre de variable se expone, no ocurre en UI. |
| Comentarios con nombres internos | `frontend/src/*` comentarios/tests | Interna permitida | Sin cambio cuando no renderiza texto. | No aplica. | Revisar si se genera documentacion publica desde codigo. |

## Verificacion

Se ejecuto `rg` sobre `frontend/src`, `docs/founder` y `docs/methodology`. Las apariciones restantes se clasifican como internas permitidas: admin interno, nombres de constantes/imports, tests, comentarios tecnicos o handoffs.
