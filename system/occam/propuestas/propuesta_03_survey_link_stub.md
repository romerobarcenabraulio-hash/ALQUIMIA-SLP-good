# Propuesta 03 · generate_digital_link_stub en survey

**Aprobación requerida:** Ejecutor

## Qué eliminar o implementar

| Archivo | Símbolo |
|---------|---------|
| `backend/app/agents/survey_pdf.py` | `generate_digital_link_stub()` |
| `backend/app/survey/router.py` | Uso del stub en endpoint de link digital |

## Qué se pierde

- URLs ficticias `https://alquimia.mx/encuesta/{id}` sin formulario real.

## Qué se gana

- Contrato honesto: o link real (Google Forms/Typeform) o endpoint retorna 501 Not Implemented.
- Tests (`test_wave1_integration.py`) actualizados a comportamiento real.

## Acción concreta

1. Si no hay integración Forms en 30 días: eliminar endpoint y función; PDF-only.
2. Si sí: reemplazar stub por builder con template ID configurable en env.

**Prioridad:** MEDIA
