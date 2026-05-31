# MVP V2 Export Compliance QA

Fecha: 2026-05-30

| Criterio | Estado | Evidencia |
| --- | --- | --- |
| GRI, ISO, PMI, CSRD, NMX y SDG no se declaran como cumplimiento completo por default | PASS | `/api/tenants/[id]/export-zip` escribe "referencias metodológicas" |
| Cumplimiento completo queda bloqueado si faltan campos obligatorios | PASS | `standardsSection` declara que si faltan campos el claim se mantiene parcial o se remueve |
| Cada métrica exportada incluye fuente, fecha, método, confianza y alcance | PASS | `metricLine()` en export ZIP |
| Cada cifra tiene cita o queda marcada como `sin cita` / brecha | PASS | `citationForMetric` y `metricCitationLabel` |
| Bibliografía mínima aparece al final del índice y documentos | PASS | `buildBibliography(data.metrics)` |
| Benchmark no se convierte en estudio local | PASS | Reglas de paquete y métricas con `critical_gap` mantienen estudio local faltante |
| Documento recibido no se valida automáticamente | PASS | Sección de documentos recibidos dice "pendiente de validación humana" |

## Resultado

El export MVP 5R permite referencias metodológicas y cumplimiento parcial, pero no declara cumplimiento completo de estándares sin evidencia obligatoria.
