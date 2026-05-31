# MVP Rigor Minimum DoD

Fecha: 2026-05-30

Este DoD define el minimo de rigor institucional exigible al MVP. No equivale a A12 compliance completo ni a auditoria externa.

| Requisito | Evidencia minima | Condicion de bloqueo |
| --- | --- | --- |
| Cada cifra tiene fuente o brecha | Campo `source` o estado `critical_gap` | Bloquear export si la cifra aparece sin fuente ni brecha |
| Cada fuente tiene fecha | `source_date` o fecha de consulta | Bloquear claim si falta fecha |
| Cada inferencia tiene metodo | `method` visible en UI/export | Bloquear inferencia si no explica metodo |
| Cada benchmark se etiqueta como benchmark | Confidence/metodo indican benchmark o fuente secundaria | Bloquear si se presenta como estudio local |
| Cada estudio local ausente se marca como brecha critica | Estado `critical_gap` o gap documental | Bloquear conclusion municipal cerrada |
| Cada export tiene bibliografia minima | Seccion `Bibliografia` o lista de fuentes usadas | Bloquear export formal si hay cifras sin bibliografia |
| Cada documento preliminar tiene marca de agua | Watermark visible o marcador metodologico | Bloquear export preliminar sin marcador |
| Cada claim de estandar es completo, parcial o removido | Campo/nota de cumplimiento | Bloquear "cumplimiento completo" con campos faltantes |
| Nada estimado aparece como oficial | Etiqueta `inferido`, `pendiente` o `brecha critica` | Bloquear texto que diga oficial sin fuente primaria |
| Municipio/ZM separados | `territorial_scope` visible | Bloquear comparacion que mezcle ambitos |
| Documento subido no valida automaticamente | Estado `documento recibido · pendiente de validacion` | Bloquear claim automatico derivado del upload |

## Decision

El MVP queda defendible solo si pasa este DoD antes de demo o export. Si un requisito no puede cumplirse, el resultado debe mostrarse como brecha critica, cumplimiento parcial o claim bloqueado.
