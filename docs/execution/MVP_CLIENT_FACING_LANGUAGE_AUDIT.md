# MVP CLIENT-FACING LANGUAGE AUDIT

Fecha: 2026-05-29.

Decisión de lenguaje cliente-facing: PARTIAL/PASS condicionado. Las rutas públicas revisadas no muestran nombres internos de agentes. Se corrigieron apariciones visibles en onboarding/backend. Permanecen nombres internos en admin, rutas internas, comentarios, handoffs y código técnico, clasificados como permitidos.

## Términos revisados

Busqueda aplicada:

- `NOUS`
- `AGORA`
- `HERMES`
- `KRONOS`
- `POLIS`
- `AUDITOR`
- `agente`
- `agentes`
- `agent`
- `AI agent`

## Hallazgos y acciones

| Término | Archivo / ubicación | Clasificación | Acción aplicada | Reemplazo | Riesgo residual |
|---|---|---|---|---|---|
| `los la plataforma` | `frontend/src/app/onboarding/reglamento/page.tsx` | Cliente-facing prohibida por error de copy | Corregido | `la plataforma inicia` | Ninguno |
| `Los agentes iniciarán` | `backend/app/routers/auth.py` respuesta upload reglamento | Cliente-facing prohibida | Corregido | `La plataforma iniciará` | Ninguno |
| `Datos reales del municipio` | `frontend/src/app/page.tsx` | Claim demasiado fuerte | Corregido | `Datos validados o inferidos con fuente` | Ninguno |
| `AGORA_EXPORT_COVER_DISCLAIMER` | Constante frontend interna | Interna permitida si el texto renderizado no usa marca interna | Sin cambio de identificador | No aplica | Riesgo bajo si nombre de constante se expone accidentalmente |
| `NOUS` | `frontend/src/app/admin/page.tsx` | Interna permitida | Sin cambio | No aplica | Admin debe seguir no cliente-facing |
| `KRONOS`, `AUDITOR` en nombres de constantes/comentarios | Componentes/libs internas | Interna permitida | Sin cambio | No aplica | No debe aparecer en UI pública |

## Rutas revisadas visualmente

- `/`
- `/sign-in`
- `/sign-up`
- `/simulator`
- `/v`
- `/p`
- `/e`
- `/admin` como interno

## Decisión

No quedan nombres internos visibles en las superficies públicas revisadas. La auditoría queda PASS condicionado porque reportes/export completos no se recorrieron de punta a punta en navegador.
