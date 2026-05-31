# MVP V2 Prompt 5R QA

Fecha: 2026-05-30

## Perfiles probados

| Perfil | Tenant | Resultado |
| --- | --- | --- |
| Datos suficientes | `complete-city` | Mismo índice de 6 documentos; export con bibliografía y brecha documental puntual |
| Datos parciales | `partial-city` | Mismo índice de 6 documentos; brechas documentales y métricas inferidas visibles |
| Brechas críticas | `gap-city` | Mismo índice de 6 documentos; brechas críticas visibles, sin eliminar documentos |

## Verificación funcional

| Criterio | Estado | Evidencia |
| --- | --- | --- |
| `/v` carga municipio correcto | PASS | `PlatformPage` usa `tenantData.data.municipality` |
| Módulos pilar usan tenant data | PASS | `PillarModulePanel` recibe `tenantData` y filtra métricas/gaps por módulo |
| Mismo índice/número de documentos | PASS | `STANDARD_CITY_DOCUMENT_INDEX` con 6 documentos para los tres perfiles |
| ZIP exporta paquete | PASS | `/api/tenants/[id]/export-zip` genera ZIP con `JSZip` |
| Bibliografía aparece | PASS | `00_INDICE.md` y cada documento incluyen `Bibliografía mínima` |
| Marca de agua aparece en preliminary | PASS | Export usa watermark cuando `status !== official` |
| Brechas documentales aparecen | PASS | Sección `Brechas documentales y documentos pendientes` |
| Documentos recibidos no se validan automáticamente | PASS | Export y UI los marcan como pendientes de validación humana |
| Cumplimiento completo no se declara sin evidencia | PASS | `MVP_V2_EXPORT_COMPLIANCE_QA.md` |
| Cliente-facing sin nombres internos | PASS | Lenguaje usa plataforma/sistema/diagnóstico; no usa nombres internos en componentes tocados |
| Mobile/desktop usable | PASS | Se conserva layout responsive de Prompt 4B y CTA sobrio |
| Cross-tenant bloqueado en data/export cuando hay header de tenant | PASS | `x-tenant-id: other-city` contra `partial-city` devuelve HTTP 403 |

## Riesgo residual

La validación de sesión real sigue siendo MVP/local: los endpoints bloquean cross-tenant cuando reciben `x-tenant-id`, pero la integración con proveedor de auth productivo queda fuera de este prompt.
