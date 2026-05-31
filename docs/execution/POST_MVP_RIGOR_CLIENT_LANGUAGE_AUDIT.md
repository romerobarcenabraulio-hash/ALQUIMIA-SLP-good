# Post-MVP Sprint 1 · Auditoría de lenguaje cliente-facing

Fecha: 2026-05-31

## Resultado

| Superficie | Búsqueda | Resultado | Estado |
| --- | --- | --- | --- |
| `/v` | `NOUS`, `AGORA`, `HERMES`, `KRONOS`, `POLIS`, `ARCHIVO`, `AI agent` | Sin apariciones cliente-facing | PASS |
| `/e` M21 | Términos internos de agentes | Sin apariciones cliente-facing | PASS |
| Export ZIP | Texto de estándares y evidencias | Usa “plataforma”, “revisión humana”, “metodología”; no usa nombres internos como autoridad | PASS |

## Nota de auditoría

La palabra común “auditoría” puede aparecer en contexto institucional. No se clasifica como exposición del agente interno `AUDITOR` cuando no aparece como entidad, marca, aprobador o autoridad automatizada.

## Reemplazos obligatorios preservados

- “revisión humana”
- “fuente revisable”
- “cumplimiento parcial”
- “referencia metodológica”
- “claim bloqueado”

## Riesgo residual

- Documentación técnica interna y handoffs sí pueden contener nombres internos; esta auditoría cubre superficie cliente-facing tocada en Sprint 1.
